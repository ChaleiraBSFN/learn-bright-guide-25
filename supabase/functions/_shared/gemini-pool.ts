// Shared Gemini free-tier throughput pool.
// Strategy: for each model (fastest first), try every API key in round-robin order,
// skipping key+model pairs that were rate-limited recently (per-isolate cooldown).
// This multiplies the effective RPM by the number of configured keys.

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
  ].filter(Boolean) as string[];
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

  for (const model of models) {
    // Two passes: first only "fresh" keys, then any key (cooldown may be stale).
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < keys.length; i++) {
        const key = keys[(start + i) % keys.length];
        if (pass === 0 && isCooling(key, model)) continue;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body,
              signal: controller.signal,
            },
          );
          clearTimeout(timeoutId);
          lastStatus = response.status;

          if (response.ok) {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              console.log(`[${label}] Success with ${model}`);
              return { text, lastStatus: 200 };
            }
            continue;
          }

          if (response.status === 429 || response.status === 403) {
            markCooling(key, model);
            continue;
          }
          if (response.status >= 500) continue;
          // 400-class problem with the request itself: other keys won't help.
          console.error(`[${label}] ${model} error ${response.status}`);
          break;
        } catch (e: any) {
          clearTimeout(timeoutId);
          console.error(`[${label}] ${model}:`, e?.message);
          continue;
        }
      }
      if (pass === 0) {
        // If no key was cooling, the second pass would be a pure duplicate.
        const anyCooling = keys.some((k) => isCooling(k, model));
        if (!anyCooling) break;
      }
    }
  }

  return { text: null, lastStatus };
}
