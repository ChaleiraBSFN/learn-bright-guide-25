import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function generateSvgViaGemini(prompt: string, apiKey: string): Promise<string | null> {
  const models = ["gemini-2.5-flash-lite", "gemini-2.0-flash"];

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timer);

      if (response.status === 429) continue;
      if (!response.ok) continue;

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (error: any) {
      console.log(`[Gemini image] ${model}: ${error.message}`);
    }
  }

  return null;
}

function extractSvgToDataUrl(text: string): string | null {
  if (!text) return null;
  const cleaned = text.replace(/```(?:xml|svg|html)?\s*/g, '').replace(/```\s*/g, '');
  const match = cleaned.match(/<svg[\s\S]*?<\/svg>/i);
  if (!match) return null;

  try {
    const base64 = btoa(unescape(encodeURIComponent(match[0])));
    return `data:image/svg+xml;base64,${base64}`;
  } catch {
    return null;
  }
}

async function generateSvg(prompt: string, geminiKey: string | undefined): Promise<string | null> {
  if (!geminiKey) return null;

  const fullPrompt = `${prompt}\n\nReturn ONLY valid SVG code with viewBox="0 0 800 600". Use vibrant educational visuals, clear labels, simple icons and arrows. No markdown, no explanation, only <svg>...</svg>`;
  const result = await generateSvgViaGemini(fullPrompt, geminiKey);
  return extractSvgToDataUrl(result || '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tema, nivel, passos } = await req.json();
    if (!tema || typeof tema !== 'string' || tema.length < 2) {
      return new Response(JSON.stringify({ error: 'Tema é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!geminiKey) throw new Error('No Gemini key');

    const t = tema.replace(/[<>]/g, '').replace(/```/g, '').trim().slice(0, 200);
    const n = (nivel || 'medio').replace(/[<>]/g, '').trim().slice(0, 50);
    const nMap: Record<string, string> = {
      fundamental1: 'crianças',
      fundamental2: 'adolescentes',
      medio: 'universitários',
      superior: 'pós-graduação',
    };
    const audience = nMap[n] || 'estudantes';

    const prompts: { label: string; prompt: string }[] = [
      { label: 'summary', prompt: `Infográfico educacional sobre "${t}" para ${audience}. Conceitos principais com ícones, setas e cores vibrantes.` },
      { label: 'mindmap-center', prompt: `Mapa mental sobre "${t}" para ${audience}. Tópico central com 4 a 5 ramos coloridos.` },
    ];

    if (Array.isArray(passos) && passos.length > 0) {
      const titulo = typeof passos[0] === 'string' ? passos[0] : passos[0]?.titulo || 'Passo 1';
      prompts.push({ label: 'step-0', prompt: `Ilustração didática de "${String(titulo).slice(0, 100)}" sobre "${t}" para ${audience}.` });
    } else {
      prompts.push({ label: 'diagram', prompt: `Diagrama de relações entre conceitos de "${t}" para ${audience}. Caixas, setas e hierarquia visual.` });
    }

    const results = await Promise.allSettled(prompts.map((prompt) => generateSvg(prompt.prompt, geminiKey)));

    const aiImages = results.flatMap((result, index) => {
      if (result.status !== 'fulfilled' || !result.value) return [];
      const prompt = prompts[index];
      return [{
        tipo: 'ai',
        label: prompt.label,
        url: result.value,
        descricao:
          prompt.label === 'summary'
            ? `Infográfico: ${t}`
            : prompt.label === 'mindmap-center'
            ? `Mapa mental: ${t}`
            : prompt.label.startsWith('step-')
            ? `Ilustração: ${(Array.isArray(passos) && passos[0]?.titulo) || t}`
            : `Diagrama: ${t}`,
      }];
    });

    return new Response(JSON.stringify({ aiImages, webImages: [], tema: t }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[IMG] Error:', error);
    return new Response(JSON.stringify({ error: 'Erro ao gerar imagens.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});