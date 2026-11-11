import { resolveGeminiModel } from "./gemini-models.ts";
// Shared Gemini free-tier throughput pool.
// Strategy: for each model (fastest first), try every API key in round-robin order,
// skipping key+model pairs that were rate-limited recently (per-isolate cooldown).
// Keys in the same Google project share quotas; rotating keys does not multiply them.

const cooldowns = new Map<string, number>();
let cursor = 0;

const COOLDOWN_MS = 45_000;

export function getGeminiKeys(): string[] {
  return [
    Deno.env.get("GOOGLE_GEMINI_API_KEY"),
    Deno.env.get("GOOGLE_GEMINI_API_KEY_2"),
    Deno.env.get("GOOGLE_GEMINI_API_KEY_3"),
    Deno.env.get("GOOGLE_GEMINI_API_KEY_4"),
    Deno.env.get("GOOGLE_GEMINI_API_KEY_5"),
  ].filter((key): key is string => Boolean(key)).filter((key, index, all) => all.indexOf(key) === index);
}

function pairId(key: string, model: string) {
  return `${key.slice(-6)}:${model}`;
}

function isCooling(key: string, model: string) {
  const until = cooldowns.get(pairId(key, model));
  return !!until && until > Date.now();
}

function markCooling(key: string, model: string) {
  cooldowns.set(pairId(key, model), Date.now() + COOLDOWN_MS);
}

export interface GeminiCallOptions {
  models: string[];
  keys: string[];
  prompt: string;
  maxTokens: number;
  temperature?: number;
  imagemBase64?: string | null;
  jsonMode?: boolean;
  timeoutMs?: number;
  label?: string;
  /**
   * Premium priority: number of key/model pairs to call in parallel.
   * The first successful answer wins, cutting perceived latency a lot.
   */
  race?: number;
}

export interface GeminiCallResult {
  text: string | null;
  lastStatus: number;
}

function buildParts(prompt: string, imagemBase64?: string | null) {
  const parts: any[] = [{ text: prompt }];
  if (imagemBase64) {
    let mimeType = "image/jpeg";
    let data = imagemBase64;
    if (imagemBase64.startsWith("data:")) {
      const m = imagemBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (m && m.length === 3) {
        mimeType = m[1];
        data = m[2];
      }
    }
    parts.push({ inlineData: { mimeType, data } });
  }
  return parts;
}

/**
 * Calls Gemini rotating across all keys for each model.
 * Returns as soon as one key/model pair answers.
 */
export async function callGeminiPool(opts: GeminiCallOptions): Promise<GeminiCallResult> {
  const {
    models,
    keys,
    prompt,
    maxTokens,
    temperature = 0.4,
    imagemBase64,
    jsonMode = true,
    timeoutMs = 90_000,
    label = "Gemini",
    race = 1,
  } = opts;

  if (keys.length === 0) return { text: null, lastStatus: 0 };

  let lastStatus = 0;
  const parts = buildParts(prompt, imagemBase64);
  const body = JSON.stringify({
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      ...(jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  });

  // Rotate the starting key so concurrent invocations don't all hammer key #1.
  const start = cursor++ % keys.length;
  const attempted = new Set<string>();
  const active = new Set<AbortController>();

  const single = async (key: string, model: string): Promise<GeminiCallResult> => {
    const resolvedModel = await resolveGeminiModel(model, key);
    const id = pairId(key, resolvedModel);
    if (attempted.has(id) || isCooling(key, resolvedModel)) return { text: null, lastStatus: 429 };
    attempted.add(id);
    const controller = new AbortController();
    active.add(controller);
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${key}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body, signal: controller.signal },
      );
      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { text, lastStatus: 200 };
        return { text: null, lastStatus: 200 };
      }
      if (response.status === 429) markCooling(key, resolvedModel);
      return { text: null, lastStatus: response.status };
    } catch (e: any) {
      if (!controller.signal.aborted) console.error(`[${label}] request failed`);
      return { text: null, lastStatus: 0 };
    } finally {
      clearTimeout(timeoutId);
      active.delete(controller);
    }
  };

  // Priority mode: fire several fast key/model pairs at once and return the FIRST
  // successful answer without waiting for the slower ones to settle.
  if (race > 1 && keys.length > 0) {
    const pairs: Array<{ key: string; model: string }> = [];
    const fastModels = models.slice(0, 3);
    for (let i = 0; i < race; i++) {
      const model = fastModels[i % fastModels.length];
      const key = keys[(start + i) % keys.length];
      if (!isCooling(key, model)) pairs.push({ key, model });
    }
    if (pairs.length > 0) {
      const started = Date.now();
      const winner = await new Promise<GeminiCallResult | null>((resolve) => {
        let pending = pairs.length;
        let settled = false;
        for (const p of pairs) {
          single(p.key, p.model)
            .then((r) => {
              if (r.text && !settled) {
                settled = true;
                for (const controller of active) controller.abort();
                resolve(r);
                return;
              }
              if (r.lastStatus) lastStatus = r.lastStatus;
              if (--pending === 0 && !settled) {
                settled = true;
                resolve(null);
              }
            })
            .catch(() => {
              if (--pending === 0 && !settled) {
                settled = true;
                resolve(null);
              }
            });
        }
      });
      if (winner) {
        console.log(`[${label}] priority race hit in ${Date.now() - started}ms (${pairs.length} parallel)`);
        return winner;
      }
    }
  }

  for (const model of models) {
      for (let i = 0; i < keys.length; i++) {
        const key = keys[(start + i) % keys.length];
        const result = await single(key, model);
        if (result.text) return result;
        if (result.lastStatus) lastStatus = result.lastStatus;
        if (lastStatus && lastStatus !== 429 && lastStatus < 500) return result;
      }
  }

  return { text: null, lastStatus };
}
