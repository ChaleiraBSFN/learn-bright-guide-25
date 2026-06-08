import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const requestSchema = z.object({
  tema: z.string().min(1).max(200),
  nivel: z.string().min(1).max(50),
  dias: z.number().int().min(1).max(30),
  duvidas: z.string().max(1000).optional().nullable(),
  idioma: z.enum(["pt-BR", "en", "es", "fr", "de", "it", "ja", "zh", "ru"]).optional().default("pt-BR"),
});

const sanitize = (s: string) => s.replace(/[<>]/g, '').replace(/```/g, '').trim();

const toAnonUuid = async (input: string): Promise<string> => {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(input));
  const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
};

const languageMap: Record<string, string> = {
  "pt-BR": "Português (Brasil)", en: "English", es: "Español", fr: "Français",
  de: "Deutsch", it: "Italiano", ja: "日本語", zh: "中文", ru: "Русский",
};
const dayWordMap: Record<string, string> = {
  "pt-BR": "Dia", en: "Day", es: "Día", fr: "Jour",
  de: "Tag", it: "Giorno", ja: "日目", zh: "第天", ru: "День",
};

function buildPrompt(tema: string, nivel: string, dias: number, duvidas: string | null, idioma: string): string {
  const lang = languageMap[idioma] || "Português (Brasil)";
  const dayWord = dayWordMap[idioma] || "Dia";
  const levelMap: Record<string, string> = {
    fundamental1: "ELEMENTARY SCHOOL", fundamental2: "MIDDLE/HIGH SCHOOL",
    medio: "UNDERGRADUATE", superior: "GRADUATE",
  };
  return `You are a study coach. Generate a detailed day-by-day study plan in ${lang}.
Respond ONLY in valid JSON. JSON keys must stay in Portuguese exactly as shown.

Topic: ${tema}
Academic level: ${levelMap[nivel] || nivel}
Total days: ${dias}
${duvidas ? `Student's specific questions/focus: ${duvidas}` : ""}

Return:
{
  "planoEstudo": {
    "titulo": "string (e.g. 'Roteiro de ${dias} ${dayWord}s')",
    "blocos": [
      {"numero": 1, "periodo": "${dayWord} 1", "objetivo": "what will be learned today (1 sentence)", "tarefas": ["task 1", "task 2", "practice: question?"], "evidencia": "how the student proves they learned"}
    ]
  }
}

Rules:
- Exactly ${dias} blocks, one per day, numbered 1 to ${dias}.
- "periodo" MUST be "${dayWord} 1", "${dayWord} 2", ..., "${dayWord} ${dias}".
- Each day must have 3-5 tasks and AT LEAST 1 practice exercise/question.
- Progressive difficulty across days. Address the student's specific focus when provided.
- Write everything in ${lang}.
- NO markdown, NO LaTeX, NO HTML tags. Plain text only.
- ONLY JSON, nothing else.`;
}

async function callGemini(prompt: string, key: string, maxTokens: number) {
  const models = ["gemini-2.5-flash-lite", "gemini-2.0-flash-lite", "gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-flash"];
  let lastStatus = 0;

  for (const model of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: maxTokens, responseMimeType: "application/json" },
        }),
      });
      lastStatus = res.status;
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { text, lastStatus: 200 };
      }
      if (res.status !== 429 && res.status < 500) break;
    } catch {
      lastStatus = 0;
    }
  }

  return { text: null, lastStatus };
}

function parseJson(raw: string): any {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/g, "").trim();
  return JSON.parse(cleaned);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    const serviceClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    if (authHeader?.startsWith("Bearer ")) {
      const sc = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authHeader } } });
      const { data: { user: authUser } } = await sc.auth.getUser();
      if (authUser) userId = authUser.id;
    }

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || req.headers.get("x-real-ip")
      || req.headers.get("user-agent")
      || "unknown";
    const rateLimitId = userId || await toAnonUuid(`anon_${clientIp}`);
    const { data: isAllowed } = await serviceClient.rpc("check_rate_limit", {
      _user_id: rateLimitId, _endpoint: "generate-study-plan", _max_requests: userId ? 180 : 900, _window_minutes: 1,
    });
    if (isAllowed === false) {
      return new Response(JSON.stringify({ error: "Muitas requisições ao mesmo tempo. Tente novamente em alguns segundos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "2" } });
    }

    let rawBody;
    try { rawBody = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Dados inválidos." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (typeof rawBody.dias === "string") rawBody.dias = parseInt(rawBody.dias, 10);

    const parsed = requestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Dados inválidos." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { tema, nivel, dias, duvidas, idioma } = parsed.data;

    const prompt = buildPrompt(sanitize(tema), sanitize(nivel), dias, duvidas ? sanitize(duvidas) : null, idioma);
    const maxTokens = Math.min(2000 + dias * 250, 12000);

    const keys = [
      Deno.env.get("GOOGLE_GEMINI_API_KEY"),
      Deno.env.get("GOOGLE_GEMINI_API_KEY_2"),
      Deno.env.get("GOOGLE_GEMINI_API_KEY_3"),
      Deno.env.get("GOOGLE_GEMINI_API_KEY_4"),
      Deno.env.get("GOOGLE_GEMINI_API_KEY_5"),
    ].filter(Boolean) as string[];
    keys.sort(() => Math.random() - 0.5);

    let content: string | null = null;
    let lastStatus = 0;
    for (const k of keys) {
      const r = await callGemini(prompt, k, maxTokens);
      content = r.text;
      lastStatus = r.lastStatus;
      if (content) break;
    }

    if (!content) {
      const status = lastStatus === 429 ? 429 : 503;
      return new Response(JSON.stringify({ error: status === 429 ? "Gemini está no limite agora. Tente novamente em alguns segundos." : "Serviço indisponível." }), { status, headers: { ...corsHeaders, "Content-Type": "application/json", ...(status === 429 ? { "Retry-After": "2" } : {}) } });
    }

    let result;
    try { result = parseJson(content); } catch {
      return new Response(JSON.stringify({ error: "Erro ao processar resposta." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!result?.planoEstudo?.blocos?.length) {
      return new Response(JSON.stringify({ error: "Plano gerado está incompleto." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("study-plan error:", e);
    return new Response(JSON.stringify({ error: "Erro ao gerar plano." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
