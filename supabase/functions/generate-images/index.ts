import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function generateImageGemini(prompt: string, apiKey: string, modelIndex = 0): Promise<string | null> {
  const models = ["gemini-2.0-flash-exp", "gemini-2.0-flash", "gemini-1.5-flash"];
  // Use text-to-image via Imagen through Gemini, or use generateContent with image response
  const imageModels = ["gemini-3.1-flash-image-preview", "gemini-3-pro-image-preview"];
  
  // Try image models first, starting from the assigned index to distribute load
  for (let i = 0; i < imageModels.length; i++) {
    const model = imageModels[(modelIndex + i) % imageModels.length];
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9000);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      if (response.status === 429) {
        console.log(`[Image] ${model} rate limited`);
        continue;
      }
      if (!response.ok) continue;

      const data = await response.json();
      const parts = data.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData) {
            const mimeType = part.inlineData.mimeType || "image/png";
            return `data:${mimeType};base64,${part.inlineData.data}`;
          }
        }
      }
    } catch (e) {
      if (e.name === "AbortError") console.log(`[Image] ${model} timed out`);
      else console.error(`[Image] ${model}:`, e.message);
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
    const shortPrompt = (desc: string) => `${desc} about "${sanitizedTema}" for ${audience}. White background, flat design, vibrant colors, no text.`;

    // 3 base images + up to 5 step images = 6-8 total
    const prompts: { label: string; prompt: string }[] = [
      { label: "summary", prompt: shortPrompt("Clean colorful educational infographic with icons and arrows") },
      { label: "mindmap-center", prompt: shortPrompt("Mind map with central topic and 4-5 colorful branches with icons") },
      { label: "diagram", prompt: shortPrompt("Educational diagram showing relationships between key concepts with boxes and arrows") },
    ];

    if (Array.isArray(passos) && passos.length > 0) {
      const maxSteps = Math.min(passos.length, 5);
      for (let i = 0; i < maxSteps; i++) {
        const step = passos[i];
        const titulo = typeof step === "string" ? step : step?.titulo || step?.conceito || `Step ${i + 1}`;
        const sanitizedStep = String(titulo).replace(/[<>]/g, "").trim().slice(0, 100);
        prompts.push({
          label: `step-${i}`,
          prompt: shortPrompt(`Simple illustration of "${sanitizedStep}"`)
        });
      }
    }

    console.log(`Generating ${prompts.length} images in parallel for: ${sanitizedTema}`);

    // Fire ALL requests in parallel - distribute across models to reduce rate limiting
    const results = await Promise.allSettled(
      prompts.map((p, i) => generateImageGemini(p.prompt, GEMINI_KEY, i % 2))
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

    console.log(`Generated ${aiImages.length} AI images`);

    return new Response(
      JSON.stringify({ aiImages, webImages: [], tema: sanitizedTema }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-images:", error);
    const status = error.message?.includes("429") ? 429 : 500;
    return new Response(
      JSON.stringify({ error: status === 429 ? "Muitas requisições. Tente novamente em breve." : "Erro ao gerar imagens." }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
