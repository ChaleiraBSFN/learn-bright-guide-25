import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getGeminiKeys, callGeminiPool } from "../_shared/gemini-pool.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const requestSchema = z.object({
  tema: z.string().min(1).max(400),
  contexto: z.string().max(8000).optional().default(""),
  idioma: z.string().nullable().optional().transform((v) => v || "pt-BR"),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        text: z.string().min(1).max(4000),
      })
    )
    .min(1)
    .max(12),
});

const langMap: Record<string, string> = {
  "pt-BR": "português brasileiro",
  en: "English",
  es: "español",
  fr: "français",
  de: "Deutsch",
  it: "italiano",
  zh: "中文",
  ja: "日本語",
  ru: "русский",
};

const toAnonUuid = async (input: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Rate limit (mesma política do chat principal)
    try {
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      let userId: string | null = null;
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const ac = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
          global: { headers: { Authorization: authHeader } },
        });
        const { data } = await ac.auth.getUser();
        if (data?.user) userId = data.user.id;
      }
      const clientIp =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-real-ip") ||
        "unknown";
      const rateLimitId = userId || (await toAnonUuid(`anon_${clientIp}`));
      const { data: isAllowed } = await serviceClient.rpc("check_rate_limit", {
        _user_id: rateLimitId,
        _endpoint: "study-chat",
        _max_requests: userId ? 120 : 60,
        _window_minutes: 1,
      });
      if (isAllowed === false) {
        return new Response(
          JSON.stringify({ error: "Muitas perguntas seguidas. Espere alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "3" } }
        );
      }
    } catch (e) {
      console.error("[study-chat] rate-limit error", e);
    }

    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Dados inválidos." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { tema, contexto, idioma, messages } = parsed.data;
    const lang = langMap[idioma] || "português brasileiro";

    const keys = getGeminiKeys();
    if (keys.length === 0) {
      return new Response(JSON.stringify({ error: "Serviço não configurado." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const history = messages
      .map((m) => `${m.role === "user" ? "ALUNO" : "BUDDY"}: ${m.text}`)
      .join("\n");

    const prompt = `Você é o Learn Buddy, tutor(a) amigável. O aluno acabou de estudar o tema "${tema}" e agora está tirando dúvidas sobre ESSE material.

MATERIAL JÁ ESTUDADO (use como contexto, não repita tudo):
"""
${contexto}
"""

CONVERSA ATÉ AGORA:
${history}

Responda a ÚLTIMA mensagem do aluno seguindo EXATAMENTE este formato:

**Resposta direta**
1 ou 2 linhas com a ideia principal, em linguagem simples.

**Tópicos**
- 🌿 **Palavra-chave:** explicação de 1 a 2 linhas.
- 🌿 **Palavra-chave:** explicação de 1 a 2 linhas.

**Exemplo**
Um exemplo concreto e curto, passo a passo quando fizer sentido.

**Resumo**
1 frase fácil de lembrar.

Termine SEMPRE com uma pergunta curta oferecendo o próximo passo.

REGRAS:
- Idioma obrigatório: ${lang}.
- Nada de jargão acadêmico, LaTeX, código ou símbolos confusos. Matemática em Unicode simples (x², √x, π, ≤, ≈).
- Frases curtas (até ~15 palavras), como explicando para alguém de 14 anos.
- Máximo ~250 palavras.
- Responda apenas com o texto formatado, sem JSON.`;

    const { text, lastStatus } = await callGeminiPool({
      models: ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"],
      keys,
      prompt,
      maxTokens: 1400,
      temperature: 0.6,
      jsonMode: false,
      timeoutMs: 60_000,
      label: "study-chat",
      race: 2,
    });

    if (!text) {
      const status = lastStatus === 429 ? 429 : 502;
      return new Response(JSON.stringify({ error: "Não consegui responder agora." }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ resposta: text.trim() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[study-chat] error", e);
    return new Response(JSON.stringify({ error: "Erro inesperado." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
