import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const requestSchema = z.object({
  exemplo: z.string().min(1).max(5000),
  contexto: z.string().nullable().optional().transform(v => v || ""),
});

const sanitize = (str: string): string => str.replace(/[<>]/g, '').trim();

async function callLovableAI(prompt: string, apiKey: string): Promise<string | null> {
  try {
    console.log("[LovableAI] Calling gateway...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Você é um tutor educacional brasileiro. Gere explicações claras, didáticas e detalhadas em português." },
          { role: "user", content: prompt },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.status === 429) {
      console.log("[LovableAI] Rate limited");
      return null;
    }
    if (response.status === 402) {
      console.log("[LovableAI] Payment required");
      return null;
    }
    if (!response.ok) {
      const errText = await response.text();
      console.log(`[LovableAI] HTTP ${response.status}:`, errText);
      return null;
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (text) {
      console.log("[LovableAI] Success");
      return text;
    }
    return null;
  } catch (e: any) {
    console.error("[LovableAI] Error:", e.message);
    return null;
  }
}

async function callGeminiFallback(prompt: string, apiKey: string): Promise<string | null> {
  const models = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"];
  for (const model of models) {
    try {
      console.log(`[Gemini Fallback] Trying ${model}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
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
      break;
    } catch (e: any) {
      console.error(`[Gemini Fallback] ${model}:`, e.message);
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const rawBody = await req.json();
    const validationResult = requestSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: 'Dados inválidos.' }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { exemplo, contexto } = validationResult.data;
    const prompt = `Gere um parágrafo de exatamente 5 a 6 linhas explicando o seguinte exemplo prático de forma clara, didática e aprofundada. Fale em português.\n\nContexto: ${sanitize(contexto)}\n\nExemplo Prático: ${sanitize(exemplo)}\n\nSua explicação:`;

    // Try Lovable AI first
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    let content: string | null = null;

    if (lovableKey) {
      content = await callLovableAI(prompt, lovableKey);
    }

    // Fallback to direct Gemini
    if (!content) {
      const geminiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
      if (geminiKey) {
        content = await callGeminiFallback(prompt, geminiKey);
      }
    }

    if (!content) {
      return new Response(JSON.stringify({ error: "Serviço indisponível. Tente novamente em alguns segundos." }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ explicacao: content.trim() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Erro ao gerar explicação." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
