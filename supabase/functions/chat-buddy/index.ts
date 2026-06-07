import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const messageSchema = z.object({
  role: z.enum(["user", "model"]),
  text: z.string().min(1).max(8000),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
  idioma: z.string().nullable().optional().transform(v => v || "pt-BR"),
});

const langMap: Record<string, string> = {
  "pt-BR": "português brasileiro", "en": "English", "es": "español",
  "fr": "français", "de": "Deutsch", "it": "italiano",
  "zh": "中文", "ja": "日本語", "ru": "русский",
};

const buildSystemInstruction = (lang: string) => `Você é o Learn Buddy, um(a) tutor(a) virtual amigável, paciente e inteligente da plataforma Learn Buddy. Sua missão é ajudar estudantes com QUALQUER coisa que precisem: explicar matéria, resolver exercícios, dar dicas de estudo, criar roteiros, ajudar com código de programação, revisar redações, sugerir materiais, motivar, tirar dúvidas pessoais sobre estudos, etc.

PERSONALIDADE:
- Caloroso, encorajador, divertido (use emojis com moderação 🎯✨📚💡).
- Direto ao ponto, sem enrolação — respostas focadas e úteis.
- Trate o usuário como amigo de estudos, não como aluno em sala formal.

REGRAS DE RESPOSTA:
- Responda SEMPRE em ${lang}.
- Use Markdown: **negrito**, listas com "-", títulos com ##, e blocos de código com \`\`\`linguagem para código.
- Para matemática NÃO use LaTeX. Use Unicode: x², √(x), π, ≤, ≥, ≠, ≈, ½, ⅓.
- Para exercícios: explique o raciocínio passo a passo, não só a resposta.
- Para código: forneça código limpo, comentado, e explique brevemente.
- Se a pergunta for vaga, faça 1 pergunta de clarificação curta.
- Mantenha respostas concisas por padrão; aprofunde se o estudante pedir.`;

async function tryModel(model: string, contents: any[], systemInstruction: string, apiKey: string, signal: AbortSignal): Promise<{ text: string | null; status: number }> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
        }),
        signal,
      }
    );
    if (!response.ok) return { text: null, status: response.status };
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? { text, status: 200 } : { text: null, status: 502 };
  } catch (e: any) {
    if (e.name !== "AbortError") console.error(`[chat-buddy] ${model}:`, e.message);
    return { text: null, status: 0 };
  }
}

async function callGemini(contents: any[], systemInstruction: string, apiKey: string): Promise<{ text: string | null; lastStatus: number }> {
  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite", "gemini-1.5-flash", "gemini-1.5-pro"];
  let lastStatus = 0;
  for (const model of models) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    try {
      const { text, status } = await tryModel(model, contents, systemInstruction, apiKey, controller.signal);
      if (text) return { text, lastStatus: 200 };
      lastStatus = status;
      if (status !== 429 && status < 500) break;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  return { text: null, lastStatus };
}

const toAnonUuid = async (input: string): Promise<string> => {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    try {
      const serviceClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
      let userId: string | null = null;
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const ac = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authHeader } } });
        const { data } = await ac.auth.getUser();
        if (data?.user) userId = data.user.id;
      }
      const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      const rateLimitId = userId || await toAnonUuid(`anon_${clientIp}`);
      const { data: isAllowed } = await serviceClient.rpc("check_rate_limit", {
        _user_id: rateLimitId, _endpoint: "chat-buddy", _max_requests: userId ? 200 : 30, _window_minutes: 60
      });
      if (isAllowed === false) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } catch (e) { console.error("[chat-buddy] rate-limit error", e); }

    const rawBody = await req.json();
    const parsed = requestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Dados inválidos." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { messages, idioma } = parsed.data;
    const langName = langMap[idioma || "pt-BR"] || "português brasileiro";
    const systemInstruction = buildSystemInstruction(langName);

    const contents = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));

    const geminiKeys = [
      Deno.env.get("GOOGLE_GEMINI_API_KEY"),
      Deno.env.get("GOOGLE_GEMINI_API_KEY_2"),
      Deno.env.get("GOOGLE_GEMINI_API_KEY_3"),
      Deno.env.get("GOOGLE_GEMINI_API_KEY_4"),
      Deno.env.get("GOOGLE_GEMINI_API_KEY_5"),
    ].filter(Boolean) as string[];
    geminiKeys.sort(() => Math.random() - 0.5);

    let content: string | null = null;
    let lastStatus = 0;
    for (const key of geminiKeys) {
      const result = await callGemini(contents, systemInstruction, key);
      content = result.text;
      lastStatus = result.lastStatus;
      if (content) break;
    }

    if (!content) {
      const isRate = lastStatus === 429;
      return new Response(
        JSON.stringify({ error: isRate ? "Limite de requisições excedido." : "Serviço indisponível." }),
        { status: isRate ? 429 : 503, headers: { ...corsHeaders, "Content-Type": "application/json", ...(isRate ? { "Retry-After": "60" } : {}) } }
      );
    }

    return new Response(JSON.stringify({ reply: content.trim() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[chat-buddy] error:", error);
    return new Response(JSON.stringify({ error: "Erro no chat." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
