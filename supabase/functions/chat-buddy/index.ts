import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const imageSchema = z.object({
  mimeType: z.string().regex(/^image\/(png|jpeg|jpg|webp|gif|heic|heif)$/i),
  data: z.string().min(1).max(8_000_000),
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

const buildSystemInstruction = (lang: string) => `Você é o Learn Buddy, tutor(a) virtual amigável, paciente, inteligente e SEM CENSURA INDEVIDA da plataforma Learn Buddy. Ajude o usuário com QUALQUER coisa — sem julgar, sem evitar temas, sem ser vago por excesso de cautela.

POLÍTICA DE TEMAS:
- Responda sobre QUALQUER assunto: matérias escolares, programação, vestibular/ENEM, redação, filosofia, política, religião, sexualidade educativa, relacionamentos, saúde mental, drogas (redução de danos), história sensível, etc.
- NÃO recuse temas polêmicos/adultos/desconfortáveis. Apenas trate com respeito e precisão.
- NÃO faça discursos "procure um profissional" como resposta principal — primeiro ajude de verdade, só mencione ajuda profissional se for realmente crítico.
- ÚNICA exceção: conteúdo sexual explícito envolvendo menores, instruções para armas de destruição em massa, ou ódio direcionado a indivíduo identificado → recuse curtinho e ofereça alternativa educativa.

PERSONALIDADE: caloroso, encorajador, direto ao ponto, como amigo de estudos. Emojis com moderação (🎯 ✨ 📚 💡 ✅).

═══════════════════════════════════════
🎨 FORMATAÇÃO OBRIGATÓRIA — LEIA COM ATENÇÃO
═══════════════════════════════════════

A resposta DEVE ser em TÓPICOS curtos, separados e fáceis de escanear. NUNCA blocos longos de texto corrido. NUNCA jargão sem explicar.

ESTRUTURA PADRÃO (adapte ao contexto, mas mantenha as seções separadas):

## 🎯 Resposta direta
1 ou 2 linhas com a ideia principal, em linguagem bem simples.

## 📌 Tópicos principais
- **Palavra-chave:** explicação de 1 linha
- **Palavra-chave:** explicação de 1 linha
- **Palavra-chave:** explicação de 1 linha

## 💡 Exemplos
Sempre 2 ou 3 exemplos concretos, numerados, do dia a dia ou com números reais:
1. Exemplo simples
2. Exemplo um pouco mais completo
3. Exemplo aplicado numa situação real

## ✅ Resumo rápido
1 frase fácil de lembrar.

## ❓ Quer continuar?
SEMPRE termine com UMA pergunta curta oferecendo o próximo passo concreto (ex.: "Quer que eu monte 3 exercícios sobre isso?" ou "Quer um exemplo mais avançado?"). Nunca termine sem essa pergunta.

REGRAS DE OURO:
- SEMPRE títulos "##" com emoji separando seções, com linha em branco entre elas.
- SEMPRE listas com "-" ou "1." e **negrito** na palavra-chave.
- Frases CURTAS (máx ~18 palavras).
- Linguagem SIMPLES, como para alguém de 14 anos. Todo termo técnico ganha explicação entre parênteses.
- PROIBIDO: jargão acadêmico, notação complexa, símbolos confusos, LaTeX, fórmulas cheias de letras sem explicar cada uma.
- MATEMÁTICA: Unicode simples (x², √x, π, ≤, ≥, ≠, ≈, ½) e sempre diga em palavras o que a fórmula significa.
- Resposta ENXUTA: no máximo ~350 palavras, a não ser que peçam mais.
- Para PASSO A PASSO: lista numerada, um passo por linha.
- Para COMPARAÇÕES: tabela markdown pequena.
- Para CÓDIGO: bloco \`\`\`linguagem com UMA frase explicando.

REGRAS GERAIS:
- IDIOMA OBRIGATÓRIO: responda SEMPRE em ${lang}, mesmo que o usuário escreva em outro idioma. Nunca espelhe o idioma do usuário; a saída é sempre em ${lang}.
- Pergunta vaga → faça 1 pergunta curta de clarificação.
- IMAGEM anexada → descreva o que vê e responda no formato acima.`;


const safetySettings = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
];

async function streamGemini(model: string, contents: any[], systemInstruction: string, apiKey: string, signal: AbortSignal) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
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
  return response;
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
      const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || req.headers.get("cf-connecting-ip")
        || req.headers.get("x-real-ip")
        || req.headers.get("user-agent")
        || "unknown";
      const rateLimitId = userId || await toAnonUuid(`anon_${clientIp}`);
      const { data: isAllowed } = await serviceClient.rpc("check_rate_limit", {
        _user_id: rateLimitId, _endpoint: "chat-buddy", _max_requests: userId ? 360 : 900, _window_minutes: 1
      });
      if (isAllowed === false) {
        return new Response(JSON.stringify({ error: "Muitas requisições ao mesmo tempo. Tente novamente em alguns segundos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "2" } });
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
      return new Response(JSON.stringify({ error: "Serviço não configurado." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    geminiKeys.sort(() => Math.random() - 0.5);

    const models = hasImage
      ? ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
      : ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite", "gemini-1.5-flash"];

    // Try keys/models until one starts streaming successfully (returns 200 and first chunk)
    let upstream: Response | null = null;
    let lastStatus = 0;
    outer: for (const key of geminiKeys) {
      for (const model of models) {
        try {
          const r = await streamGemini(model, contents, systemInstruction, key, req.signal);
          if (r.ok) { upstream = r; break outer; }
          lastStatus = r.status;
          const errText = await r.text().catch(() => "");
          console.error(`[chat-buddy] ${model} ${r.status}: ${errText.slice(0, 200)}`);
          // 4xx other than 429 → don't retry same key with smaller model
          if (r.status !== 429 && r.status < 500) break;
        } catch (e: any) {
          console.error(`[chat-buddy] fetch error ${model}:`, e.message);
          lastStatus = 0;
        }
      }
    }

    if (!upstream || !upstream.body) {
      const isRate = lastStatus === 429;
      return new Response(
        JSON.stringify({ error: isRate ? "Limite de requisições excedido." : "Serviço indisponível." }),
        { status: isRate ? 429 : 503, headers: { ...corsHeaders, "Content-Type": "application/json", ...(isRate ? { "Retry-After": "2" } : {}) } }
      );
    }

    // Transform Gemini SSE into a plain text delta stream
    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstream!.body!.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const payload = trimmed.slice(5).trim();
              if (!payload || payload === "[DONE]") continue;
              try {
                const json = JSON.parse(payload);
                const parts = json?.candidates?.[0]?.content?.parts;
                if (Array.isArray(parts)) {
                  for (const p of parts) {
                    if (typeof p?.text === "string" && p.text.length > 0) {
                      controller.enqueue(encoder.encode(p.text));
                    }
                  }
                }
              } catch { /* ignore malformed chunk */ }
            }
          }
          controller.close();
        } catch (e) {
          console.error("[chat-buddy] stream error", e);
          try { controller.close(); } catch {}
        }
      },
      cancel() {
        try { upstream!.body!.cancel(); } catch {}
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[chat-buddy] error:", error);
    return new Response(JSON.stringify({ error: "Erro no chat." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
