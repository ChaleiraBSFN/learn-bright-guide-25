import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const requestSchema = z.object({
  exemplo: z.string().min(1).max(5000),
  contexto: z.string().nullable().optional().transform((value) => value || ""),
});

const sanitize = (str: string): string => str.replace(/[<>]/g, '').trim();

async function callGemini(prompt: string, apiKey: string): Promise<string | null> {
  const models = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"];

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 700 },
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }

      if (response.status === 429) continue;
      if (response.status >= 500) continue;
      break;
    } catch (error: any) {
      console.error(`[Gemini explain] ${model}:`, error.message);
    }
  }

  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const rawBody = await req.json();
    const validationResult = requestSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: 'Dados inválidos.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { exemplo, contexto } = validationResult.data;
    const prompt = `Explique o exemplo a seguir em português do Brasil, de forma clara, didática e objetiva, em 1 parágrafo curto de 5 a 6 linhas.\n\nContexto: ${sanitize(contexto)}\n\nExemplo prático: ${sanitize(exemplo)}\n\nExplicação:`;

    const geminiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    const content = geminiKey ? await callGemini(prompt, geminiKey) : null;

    if (!content) {
      return new Response(JSON.stringify({ error: 'Serviço indisponível. Tente novamente em alguns segundos.' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ explicacao: content.trim() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Erro ao gerar explicação.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});