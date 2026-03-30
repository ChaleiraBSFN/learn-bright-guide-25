import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function generateImageViaGateway(prompt: string, lovableKey: string): Promise<string | null> {
  const models = ["google/gemini-3.1-flash-image-preview", "google/gemini-3-pro-image-preview"];
  
  for (const model of models) {
    try {
      console.log(`[Image Gateway] Trying ${model}...`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.status === 429) {
        console.log(`[Image Gateway] ${model} rate limited`);
        continue;
      }
      if (response.status === 402) {
        console.log(`[Image Gateway] Payment required`);
        return null;
      }
      if (!response.ok) {
        console.log(`[Image Gateway] ${model} HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();
      const images = data.choices?.[0]?.message?.images;
      if (images && images.length > 0) {
        const imageUrl = images[0]?.image_url?.url;
        if (imageUrl) {
          console.log(`[Image Gateway] Success with ${model}`);
          return imageUrl;
        }
      }
    } catch (e: any) {
      if (e.name === "AbortError") console.log(`[Image Gateway] ${model} timed out`);
      else console.error(`[Image Gateway] ${model}:`, e.message);
    }
  }
  return null;
}

async function generateImageGeminiFallback(prompt: string, apiKey: string, modelIndex = 0): Promise<string | null> {
  const imageModels = ["gemini-3.1-flash-image-preview", "gemini-3-pro-image-preview"];
  
  for (let i = 0; i < imageModels.length; i++) {
    const model = imageModels[(modelIndex + i) % imageModels.length];
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

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

      if (response.status === 429) { console.log(`[Fallback] ${model} rate limited`); continue; }
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
    } catch (e: any) {
      if (e.name === "AbortError") console.log(`[Fallback] ${model} timed out`);
      else console.error(`[Fallback] ${model}:`, e.message);
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

    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GEMINI_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    
    if (!LOVABLE_KEY && !GEMINI_KEY) throw new Error("No API keys configured");

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

    console.log(`Generating ${prompts.length} images for: ${sanitizedTema}`);

    // Use Lovable AI Gateway first, fallback to direct Gemini
    const generateImage = async (prompt: string, index: number): Promise<string | null> => {
      if (LOVABLE_KEY) {
        const result = await generateImageViaGateway(prompt, LOVABLE_KEY);
        if (result) return result;
      }
      if (GEMINI_KEY) {
        return await generateImageGeminiFallback(prompt, GEMINI_KEY, index % 2);
      }
      return null;
    };

    // Generate images sequentially with small delay to avoid rate limits
    const aiImages: any[] = [];
    for (let i = 0; i < prompts.length; i++) {
      const p = prompts[i];
      try {
        const result = await generateImage(p.prompt, i);
        if (result) {
          const isStep = p.label.startsWith("step-");
          aiImages.push({
            tipo: "ai",
            label: p.label,
            url: result,
            descricao: isStep
              ? `Ilustração: ${(Array.isArray(passos) && passos[parseInt(p.label.split("-")[1])]?.titulo) || sanitizedTema}`
              : p.label === "summary" ? `Infográfico: ${sanitizedTema}`
              : p.label === "mindmap-center" ? `Mapa mental: ${sanitizedTema}`
              : `Diagrama: ${sanitizedTema}`,
          });
        }
      } catch (e: any) {
        console.error(`Error generating image ${p.label}:`, e.message);
      }
      // Small delay between requests
      if (i < prompts.length - 1) await new Promise(r => setTimeout(r, 500));
    }

    console.log(`Generated ${aiImages.length} AI images`);

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
