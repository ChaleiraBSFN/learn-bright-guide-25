import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Generate an SVG illustration via Google Gemini text models (direct API).
async function generateSvg(prompt: string, apiKey: string): Promise<string | null> {
  // Two fastest Gemini text models — speed > variety.
  const models = [
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
  ];

  const body = JSON.stringify({
    contents: [{
      role: "user",
      parts: [{
        text: `Output ONLY a single self-contained inline SVG (no markdown, no code fences, no commentary) illustrating: ${prompt}
Requirements:
- Root: <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
- Vibrant flat-design colors, clean shapes, icons, arrows, helpful <text> labels
- Light background <rect>
- No external images, no scripts
Output ONLY the <svg>...</svg> markup.`,
      }],
    }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
  });

  for (const model of models) {
    // Up to 2 attempts per model with small jittered backoff for 429
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);

        if (response.status === 429) {
          console.log(`[SVG] ${model} rate limited (attempt ${attempt + 1})`);
          await new Promise((r) => setTimeout(r, 400 + Math.random() * 600));
          continue;
        }
        if (!response.ok) {
          console.log(`[SVG] ${model} status ${response.status}`);
          break; // try next model
        }

        const data = await response.json();
        const text: string | undefined = data.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text)
          .filter(Boolean)
          .join("\n");
        if (!text) {
          console.log(`[SVG] ${model} empty response`);
          break;
        }

        const match = text.match(/<svg[\s\S]*?<\/svg>/i);
        if (!match) {
          console.log(`[SVG] ${model} no svg tag`);
          break;
        }
        const svg = match[0];
        const base64 = btoa(unescape(encodeURIComponent(svg)));
        return `data:image/svg+xml;base64,${base64}`;
      } catch (e: any) {
        if (e.name === "AbortError") console.log(`[SVG] ${model} timed out`);
        else console.error(`[SVG] ${model}:`, e.message);
        break;
      }
    }
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
      return new Response(
        JSON.stringify({ error: "Tema é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GEMINI_KEY) throw new Error("GOOGLE_GEMINI_API_KEY is not configured");

    const sanitizedTema = tema.replace(/[<>]/g, "").replace(/```/g, "").trim().slice(0, 200);
    const sanitizedNivel = (nivel || "medio").replace(/[<>]/g, "").trim().slice(0, 50);

    const nivelLabel: Record<string, string> = {
      fundamental1: "elementary school children",
      fundamental2: "high school students",
      medio: "college students",
      superior: "graduate students",
    };
    const audience = nivelLabel[sanitizedNivel] || "students";

    const prompts: { label: string; prompt: string }[] = [
      { label: "summary", prompt: `A clean colorful educational infographic about "${sanitizedTema}" for ${audience}, with icons and arrows.` },
      { label: "mindmap-center", prompt: `A mind map about "${sanitizedTema}" for ${audience}: central topic with 4-5 colorful branches and small icons.` },
      { label: "diagram", prompt: `An educational diagram about "${sanitizedTema}" for ${audience}: boxes connected by arrows, key concepts labeled.` },
    ];

    if (Array.isArray(passos) && passos.length > 0) {
      const maxSteps = Math.min(passos.length, 5);
      for (let i = 0; i < maxSteps; i++) {
        const step = passos[i];
        const titulo = typeof step === "string" ? step : step?.titulo || step?.conceito || `Step ${i + 1}`;
        const sanitizedStep = String(titulo).replace(/[<>]/g, "").trim().slice(0, 100);
        prompts.push({
          label: `step-${i}`,
          prompt: `A simple educational illustration of "${sanitizedStep}" (related to "${sanitizedTema}") for ${audience}.`,
        });
      }
    }

    console.log(`Generating ${prompts.length} SVGs in parallel for: ${sanitizedTema}`);

    const results = await Promise.allSettled(
      prompts.map((p) => generateSvg(p.prompt, GEMINI_KEY))
    );

    const descMap: Record<string, string> = {
      summary: `Infográfico: ${sanitizedTema}`,
      "mindmap-center": `Mapa mental: ${sanitizedTema}`,
      diagram: `Diagrama: ${sanitizedTema}`,
    };

    const aiImages = results
      .map((r, i) => {
        if (r.status === "fulfilled" && r.value) {
          const label = prompts[i].label;
          const isStep = label.startsWith("step-");
          return {
            tipo: "ai" as const,
            label,
            url: r.value,
            descricao: isStep
              ? `Ilustração: ${(Array.isArray(passos) && passos[parseInt(label.split("-")[1])]?.titulo) || sanitizedTema}`
              : descMap[label] || sanitizedTema,
          };
        }
        return null;
      })
      .filter(Boolean);

    console.log(`Generated ${aiImages.length}/${prompts.length} SVG images`);

    return new Response(
      JSON.stringify({ aiImages, webImages: [], tema: sanitizedTema }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in generate-images:", error);
    const status = error.message?.includes("429") ? 429 : 500;
    return new Response(
      JSON.stringify({ error: status === 429 ? "Muitas requisições. Tente novamente em breve." : "Erro ao gerar imagens." }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
