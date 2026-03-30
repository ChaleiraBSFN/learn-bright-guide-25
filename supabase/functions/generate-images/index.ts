import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function generateSvgViaGateway(prompt: string, key: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!response.ok) {
      console.log(`[Gateway] HTTP ${response.status}`);
      return null;
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e: any) {
    console.log(`[Gateway] ${e.message}`);
    return null;
  }
}

async function generateSvgViaGemini(prompt: string, apiKey: string): Promise<string | null> {
  const models = ["gemini-2.5-flash-lite", "gemini-2.0-flash"];
  for (const model of models) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timer);
      if (response.status === 429) { console.log(`[Gemini] ${model} rate limited`); continue; }
      if (!response.ok) { console.log(`[Gemini] ${model} HTTP ${response.status}`); continue; }
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (e: any) {
      console.log(`[Gemini] ${model}: ${e.message}`);
    }
  }
  return null;
}

function extractSvgToDataUrl(text: string): string | null {
  if (!text) return null;
  const cleaned = text.replace(/```(?:xml|svg|html)?\s*/g, "").replace(/```\s*/g, "");
  const match = cleaned.match(/<svg[\s\S]*?<\/svg>/i);
  if (!match) return null;
  try {
    const base64 = btoa(unescape(encodeURIComponent(match[0])));
    return `data:image/svg+xml;base64,${base64}`;
  } catch {
    return null;
  }
}

async function generateSvg(prompt: string, lovableKey: string | undefined, geminiKey: string | undefined): Promise<string | null> {
  const fullPrompt = `${prompt}

Return ONLY valid SVG code with viewBox="0 0 800 600". Use vibrant flat colors, shapes, icons, and text labels (font-family="Arial"). No markdown, no explanation, only <svg>...</svg>`;

  if (lovableKey) {
    const result = await generateSvgViaGateway(fullPrompt, lovableKey);
    const url = extractSvgToDataUrl(result || "");
    if (url) return url;
  }
  if (geminiKey) {
    const result = await generateSvgViaGemini(fullPrompt, geminiKey);
    const url = extractSvgToDataUrl(result || "");
    if (url) return url;
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tema, nivel, passos } = await req.json();
    if (!tema || typeof tema !== "string" || tema.length < 2) {
      return new Response(JSON.stringify({ error: "Tema é obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GEMINI_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!LOVABLE_KEY && !GEMINI_KEY) throw new Error("No API keys");

    const t = tema.replace(/[<>]/g, "").replace(/```/g, "").trim().slice(0, 200);
    const n = (nivel || "medio").replace(/[<>]/g, "").trim().slice(0, 50);
    const nMap: Record<string, string> = { fundamental1: "crianças", fundamental2: "adolescentes", medio: "universitários", superior: "pós-graduação" };
    const aud = nMap[n] || "estudantes";

    const prompts: { label: string; prompt: string }[] = [
      { label: "summary", prompt: `Infográfico educacional sobre "${t}" para ${aud}. Conceitos principais com ícones, setas e cores vibrantes.` },
      { label: "mindmap-center", prompt: `Mapa mental sobre "${t}" para ${aud}. Tópico central com 4-5 ramos coloridos.` },
    ];

    if (Array.isArray(passos) && passos.length > 0) {
      const titulo = typeof passos[0] === "string" ? passos[0] : passos[0]?.titulo || "Passo 1";
      prompts.push({ label: "step-0", prompt: `Ilustração de "${String(titulo).slice(0, 100)}" sobre "${t}" para ${aud}.` });
    } else {
      prompts.push({ label: "diagram", prompt: `Diagrama de relações entre conceitos de "${t}" para ${aud}. Caixas, setas e cores.` });
    }

    console.log(`[IMG] Generating ${prompts.length} SVGs for: ${t}`);

    const results = await Promise.allSettled(
      prompts.map(p => generateSvg(p.prompt, LOVABLE_KEY, GEMINI_KEY))
    );

    const aiImages: any[] = [];
    for (let i = 0; i < prompts.length; i++) {
      const r = results[i];
      if (r.status === "fulfilled" && r.value) {
        const p = prompts[i];
        aiImages.push({
          tipo: "ai", label: p.label, url: r.value,
          descricao: p.label === "summary" ? `Infográfico: ${t}`
            : p.label === "mindmap-center" ? `Mapa mental: ${t}`
            : p.label.startsWith("step-") ? `Ilustração: ${(Array.isArray(passos) && passos[0]?.titulo) || t}`
            : `Diagrama: ${t}`,
        });
      }
    }

    console.log(`[IMG] Done: ${aiImages.length}/${prompts.length}`);
    return new Response(JSON.stringify({ aiImages, webImages: [], tema: t }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("[IMG] Error:", error);
    return new Response(JSON.stringify({ error: "Erro ao gerar imagens." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
