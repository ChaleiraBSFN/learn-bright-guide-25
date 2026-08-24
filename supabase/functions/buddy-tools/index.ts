import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { callGeminiPool, getGeminiKeys } from "../_shared/gemini-pool.ts";

type Tool = "flashcards" | "summary" | "quiz";

const MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-flash",
];

const PROMPTS: Record<Tool, (topic: string, lang: string) => string> = {
  flashcards: (topic, lang) =>
    `Crie 10 flashcards de estudo sobre "${topic}". Responda SOMENTE em ${lang}.
Retorne JSON: {"cards":[{"front":"pergunta curta","back":"resposta clara e completa em no máximo 3 frases"}]}
Nunca inclua código, markdown ou jargão desnecessário.`,
  summary: (topic, lang) =>
    `Crie um resumo de estudo objetivo, organizado em tópicos, sobre "${topic}". Responda SOMENTE em ${lang}.
Retorne JSON: {"title":"🎯 título com 1 emoji","bullets":["📌 tópico curto: explicação de 1-2 frases"],"keyTerms":[{"term":"📖 termo","definition":"definição curta"}],"conclusion":"✅ parágrafo final curto"}
Regras: cada bullet DEVE começar com um emoji relevante e variado (📌 🧠 ⚡ 🔍 💡 📊 🕰️ 🌍 ➗ 🧪), 6 a 10 bullets, linguagem simples, sem código e sem markdown.`,
  quiz: (topic, lang) =>
    `Crie um quiz de 8 perguntas de múltipla escolha sobre "${topic}". Responda SOMENTE em ${lang}.
Retorne JSON: {"questions":[{"question":"❓ enunciado","options":["a","b","c","d"],"correctIndex":0,"explanation":"💡 por que está correta, em tópicos curtos separados por • "}]}
Regras: cada pergunta começa com um emoji relevante, a explicação usa 2 ou 3 tópicos curtos iniciados por "• " e pode ter emojis. Sem código, sem markdown.`,

};

const extractJson = (raw: string) => {
  const start = raw.search(/[[{]/);
  if (start === -1) return null;
  const open = raw[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(raw.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
    if (!jwt) return json({ error: "Not authenticated" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    const user = userData?.user;
    if (userErr || !user) return json({ error: "Invalid session" }, 401);

    const body = await req.json().catch(() => ({}));
    const tool = String(body?.tool ?? "") as Tool;
    const topic = String(body?.topic ?? "").trim().slice(0, 200);
    const lang = String(body?.language ?? "português do Brasil").slice(0, 60);

    if (!PROMPTS[tool]) return json({ error: "invalid_tool" }, 400);
    if (topic.length < 2) return json({ error: "invalid_topic" }, 400);

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: isBuddy } = await admin.rpc("is_buddy", { _user_id: user.id });
    if (!isBuddy) return json({ error: "buddy_required" }, 403);

    const allowed = await admin.rpc("check_rate_limit", {
      _user_id: user.id,
      _endpoint: `buddy-tools:${tool}`,
      _max_requests: 60,
      _window_minutes: 60,
    });
    if (allowed.data === false) return json({ error: "rate_limited" }, 429);

    const result = await callGeminiPool({
      models: MODELS,
      keys: getGeminiKeys(),
      prompt: PROMPTS[tool](topic, lang),
      maxTokens: 4096,
      temperature: 0.5,
      jsonMode: true,
      timeoutMs: 90_000,
      label: `buddy-${tool}`,
      race: 3,
    });

    if (!result.text) {
      return json({ error: "ai_unavailable", status: result.lastStatus }, 503);
    }

    const parsed = extractJson(result.text);
    if (!parsed) return json({ error: "parse_failed" }, 502);

    return json({ tool, topic, data: parsed });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[buddy-tools] error", message);
    return json({ error: message }, 500);
  }
});
