import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const requestSchema = z.object({
  pergunta: z.string().min(3).max(2000),
  respostaUsuario: z.string().min(1).max(5000),
  respostaEsperada: z.string().min(1).max(5000),
  criterios: z.array(z.string()).optional().default([]),
  idioma: z.enum(["pt-BR", "en", "es", "fr", "de", "it", "ja", "zh", "ru"]).optional().default("pt-BR"),
});

// === AI PROVIDER ABSTRACTION ===
async function callGeminiDirect(prompt: string, apiKey: string): Promise<string | null> {
  const models = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  for (const model of models) {
    try {
      console.log(`[Gemini] Trying ${model}...`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 3000, responseMimeType: "application/json" },
          }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) { console.log(`[Gemini] Success with ${model}`); return text; }
      }
      if (response.status === 429) { console.log(`[Gemini] ${model} rate limited, next...`); continue; }
      console.error(`[Gemini] ${model} error: ${response.status}`);
    } catch (e: any) { console.error(`[Gemini] ${model}:`, e.message); }
  }
  return null;
}

// No Lovable AI fallback - only free Gemini models

function parseAIJson(content: string): any {
  let cleaned = content.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) cleaned = jsonMatch[0];
  return JSON.parse(cleaned);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (authHeader?.startsWith('Bearer ')) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser();
      if (!authError && authUser) userId = authUser.id;
    }

    const rateLimitId = userId || `anon_${req.headers.get('x-forwarded-for') || 'unknown'}`;
    const { data: isAllowed } = await serviceClient.rpc('check_rate_limit', {
      _user_id: rateLimitId, _endpoint: 'correct-exercise', _max_requests: userId ? 30 : 10, _window_minutes: 60
    });

    if (isAllowed === false) {
      return new Response(JSON.stringify({ error: 'Limite de requisições excedido.' }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let rawBody;
    try { rawBody = await req.json(); } catch {
      return new Response(JSON.stringify({ error: 'Dados inválidos.' }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const validationResult = requestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: 'Dados inválidos.' }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { pergunta, respostaUsuario, respostaEsperada, criterios, idioma } = validationResult.data;
    const languageMap: Record<string, string> = {
      "pt-BR": "Português (Brasil)",
      en: "English",
      es: "Español",
      fr: "Français",
      de: "Deutsch",
      it: "Italiano",
      ja: "日本語",
      zh: "中文",
      ru: "Русский",
    };
    const languageLabel = languageMap[idioma] || "Português (Brasil)";

    const fullPrompt = `Você é um professor avaliador. Corrija a resposta do aluno de forma educativa.

Responda em JSON válido:
{
  "correto": true/false,
  "nota": 0-10,
  "feedback": "Feedback detalhado",
  "correcao": "Resposta correta se errado",
  "pontosPositivos": ["pontos acertados"],
  "pontosAMelhorar": ["pontos a melhorar"]
}

Regras:
- APENAS JSON
- PARCIALMENTE CORRETO (nota 4-6): resposta incompleta mas parcialmente certa
- CORRETO (nota >= 7): resposta completa ou quase
- INCORRETO (nota < 4): errado ou sem compreensão
- Idioma obrigatório de saída: ${languageLabel}
- Mesmo que a pergunta/resposta esteja em outro idioma, devolva feedback SOMENTE em ${languageLabel}

Pergunta: ${pergunta}
Resposta esperada: ${respostaEsperada}
${criterios.length > 0 ? `Critérios:\n${criterios.map((c, i) => `${i + 1}. ${c}`).join('\n')}` : ''}
Resposta do aluno: ${respostaUsuario}`;

    const geminiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    let content: string | null = null;
    if (geminiKey) content = await callGeminiDirect(fullPrompt, geminiKey);

    if (!content) {
      return new Response(JSON.stringify({ error: "Serviço indisponível. Tente novamente." }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let correction;
    try { correction = parseAIJson(content); } catch {
      return new Response(JSON.stringify({ error: "Erro ao processar correção. Tente novamente." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify(correction), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in correct-exercise:", error);
    return new Response(JSON.stringify({ error: "Erro ao corrigir exercício. Tente novamente." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
