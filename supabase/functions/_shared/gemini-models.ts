// Google retires Gemini model names over time (e.g. gemini-2.0-flash → 404).
// This resolver asks the API which models exist (cached per isolate) and maps any
// requested name to an available one, so functions keep working after retirements.

let available: Set<string> | null = null;
let fetchedAt = 0;
let pending: Promise<Set<string>> | null = null;
const TTL = 30 * 60_000;

async function loadModels(key: string): Promise<Set<string>> {
  if (available && Date.now() - fetchedAt < TTL) return available;
  if (pending) return pending;
  pending = (async () => {
    try {
      const names = new Set<string>();
      let pageToken = "";
      for (let i = 0; i < 5; i++) {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000&key=${key}${pageToken ? `&pageToken=${pageToken}` : ""}`,
          { signal: AbortSignal.timeout(5000) },
        );
        if (!r.ok) break;
        const d = await r.json();
        for (const m of d.models ?? []) {
          if ((m.supportedGenerationMethods ?? []).includes("generateContent")) {
            names.add(String(m.name).replace(/^models\//, ""));
          }
        }
        if (!d.nextPageToken) break;
        pageToken = d.nextPageToken;
      }
      if (names.size > 0) { available = names; fetchedAt = Date.now(); }
      return available ?? new Set<string>();
    } catch {
      return available ?? new Set<string>();
    } finally {
      pending = null;
    }
  })();
  return pending;
}

function version(name: string) {
  const m = name.match(/gemini-(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

function pickBest(names: Set<string>, wantLite: boolean): string | null {
  const candidates = [...names].filter((n) =>
    /^gemini-[\d.]+-flash(-lite)?(-latest)?$/.test(n) && (wantLite ? true : !n.includes("lite"))
  );
  if (candidates.length === 0) {
    const any = [...names].filter((n) => /^gemini-.*flash/.test(n) && !/(image|tts|audio|live|thinking|exp)/.test(n));
    candidates.push(...any);
  }
  candidates.sort((a, b) => {
    const la = a.includes("lite") === wantLite ? 0 : 1;
    const lb = b.includes("lite") === wantLite ? 0 : 1;
    return la - lb || version(b) - version(a);
  });
  return candidates[0] ?? null;
}

export async function resolveGeminiModel(model: string, key: string): Promise<string> {
  const names = await loadModels(key);
  if (names.size === 0 || names.has(model)) return model;
  if (/image/.test(model)) {
    const img = [...names].filter((n) => n.includes("image")).sort((a, b) => version(b) - version(a))[0];
    if (img) return img;
  }
  return pickBest(names, model.includes("lite")) ?? pickBest(names, !model.includes("lite")) ?? model;
}
