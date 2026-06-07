import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const imageSchema = z.object({
  mimeType: z.string().regex(/^image\/(png|jpeg|jpg|webp|gif|heic|heif)$/i),
  data: z.string().min(1).max(8_000_000), // base64, ~6MB binary max
});

const messageSchema = z.object({
  role: z.enum(["user", "model"]),
  text: z.string().max(8000).optional().default(""),
  images: z.array(imageSchema).max(4).optional(),
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

const buildSystemInstruction = (lang: string) => `Você é o Learn Buddy, um(a) tutor(a) virtual amigável, paciente, inteligente e SEM CENSURA INDEVIDA da plataforma Learn Buddy. Sua missão é ajudar o usuário com QUALQUER coisa que ele precisar — sem julgar, sem evitar temas, sem dar respostas vagas por excesso de cautela.

POLÍTICA DE TEMAS:
- Responda sobre QUALQUER assunto que o usuário pedir: matérias escolares, programação, vestibular, ENEM, redação, filosofia, política, religião, sexualidade educativa, relacionamentos, saúde mental, drogas (informação/redução de danos), história sensível, etc.
- NÃO recuse temas por serem polêmicos, adultos, controversos ou desconfortáveis. Apenas trate com respeito e precisão.
- NÃO faça discursos de "procure um profissional" como resposta principal — primeiro ajude de verdade, e só mencione ajuda profissional se for realmente crítico (ex.: ideação suicida iminente).
- ÚNICA exceção: se o pedido for conteúdo SEXUAL EXPLÍCITO envolvendo menores, instruções para criar armas reais de destruição em massa, ou conteúdo de ódio direcionado a perseguir indivíduo identificado — recuse de forma curta e ofereça alternativa educativa.
- Conteúdo adulto entre adultos, palavrões, humor pesado, temas tabu educacionais → ok responder normalmente e com naturalidade.

PERSONALIDADE:
- Caloroso, encorajador, divertido (emojis com moderação 🎯✨📚💡).
- Direto ao ponto, sem enrolação.
- Trate o usuário como amigo de estudos.

REGRAS DE RESPOSTA:
- Responda SEMPRE em ${lang}.
- Use Markdown: **negrito**, listas com "-", títulos "##", blocos \`\`\`linguagem para código.
- Para matemática NÃO use LaTeX. Use Unicode: x², √(x), π, ≤, ≥, ≠, ≈, ½, ⅓.
- Para exercícios: explique o raciocínio passo a passo.
- Para código: forneça código limpo, comentado, e explique brevemente.
- Se a pergunta for vaga, faça 1 pergunta curta de clarificação.
- Se houver IMAGEM anexada: descreva/analise o que vê e responda à pergunta sobre a imagem (resolver exercício, identificar erro de código, explicar diagrama, etc.).
- Respostas concisas por padrão; aprofunde se pedirem.`;

const safetySettings = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
];

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
          safetySettings,
          generationConfig: { temperature: 0.85, maxOutputTokens: 4096 },
        }),
        signal,
      }
    );
    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error(`[chat-buddy] ${model} ${response.status}: ${errText.slice(0, 300)}`);
      return { text: null, status: response.status };
    }
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join("\n");
    return text ? { text, status: 200 } : { text: null, status: 502 };
  } catch (e: any) {
    if (e.name !== "AbortError") console.error(`[chat-buddy] ${model}:`, e.message);
    return { text: null, status: 0 };
  }
}

async function callGemini(contents: any[], systemInstruction: string, apiKey: string, hasImage: boolean): Promise<{ text: string | null; lastStatus: number }> {
  const models = hasImage
    ? ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
    : ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite", "gemini-1.5-flash", "gemini-1.5-pro"];
  let lastStatus = 0;
  for (const model of models) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
      const { text, status } = await tryModel(model, contents, systemInstruction, apiKey, controller.signal);
      if (text) return { text, lastStatus: 200 };
      lastStatus = status;
      if (status !== 429 && status < 500 && status !== 0) break;
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
      console.error("[chat-buddy] invalid body", parsed.error.flatten());
      return new Response(JSON.stringify({ error: "Dados inválidos." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { messages, idioma } = parsed.data;
    const langName = langMap[idioma || "pt-BR"] || "português brasileiro";
    const systemInstruction = buildSystemInstruction(langName);

    let hasImage = false;
    const contents = messages.map(m => {
      const parts: any[] = [];
      if (m.images && m.images.length > 0) {
        hasImage = true;
        for (const img of m.images) parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
      }
      if (m.text && m.text.trim()) parts.push({ text: m.text });
      if (parts.length === 0) parts.push({ text: "" });
      return { role: m.role, parts };
    });

    const geminiKeys = [
      Deno.env.get("GOOGLE_GEMINI_API_KEY"),
      Deno.env.get("GOOGLE_GEMINI_API_KEY_2"),
      Deno.env.get("GOOGLE_GEMINI_API_KEY_3"),
      Deno.env.get("GOOGLE_GEMINI_API_KEY_4"),
      Deno.env.get("GOOGLE_GEMINI_API_KEY_5"),
    ].filter(Boolean) as string[];

    if (geminiKeys.length === 0) {
      console.error("[chat-buddy] No Gemini API keys configured");
      return new Response(JSON.stringify({ error: "Serviço não configurado." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    geminiKeys.sort(() => Math.random() - 0.5);

    let content: string | null = null;
    let lastStatus = 0;
    for (const key of geminiKeys) {
      const result = await callGemini(contents, systemInstruction, key, hasImage);
      content = result.text;
      lastStatus = result.lastStatus;
      if (content) break;
    }

    if (!content) {
      const isRate = lastStatus === 429;
      return new Response(
        JSON.stringify({ error: isRate ? "Limite de requisições excedido." : "Não consegui gerar resposta agora. Tente reformular." }),
        { status: isRate ? 429 : 503, headers: { ...corsHeaders, "Content-Type": "application/json", ...(isRate ? { "Retry-After": "60" } : {}) } }
      );
    }

    return new Response(JSON.stringify({ reply: content.trim() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[chat-buddy] error:", error);
    return new Response(JSON.stringify({ error: "Erro no chat." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
