import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
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

async function callGeminiDirect(prompt: string, apiKey: string): Promise<string | null> {
  const models = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`[Gemini] Trying ${model} (attempt ${attempt + 1})...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            console.log(`[Gemini] Success with ${model}`);
            return text;
          } else {
             console.log(`[Gemini] ${model} empty response. Details:`, data);
          }
        } else {
           const errorBody = await response.text();
           console.log(`[Gemini] ${model} HTTP ${response.status}:`, errorBody);
        }
        
        if (response.status === 429) { console.log(`[Gemini] ${model} rate limited, next...`); break; }
        if (response.status >= 500) { console.log(`[Gemini] ${model} server error, retrying...`); continue; }
        break;
      } catch (e: any) {
        console.error(`[Gemini] ${model}:`, e.message);
        if (e.name === 'AbortError' && attempt === 0) continue;
        break;
      }
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
    const prompt = `Gere um parágrafo de exatamente 5 linhas (cerca de 4 a 5 frases) explicando o seguinte exemplo prático de forma clara, didática e aprofundada. Não passe de 5 linhas de texto. Fale em português. \n\nContexto do assunto: ${sanitize(contexto || "")}\n\nExemplo Prático: ${sanitize(exemplo)}\n\nSua explicação:`;

    const geminiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    let content: string | null = null;

    if (geminiKey) {
      content = await callGeminiDirect(prompt, geminiKey);
    }

    if (!content) {
      return new Response(JSON.stringify({ error: "Serviço indisponível." }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ explicacao: content.trim() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Erro ao gerar explicação." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
