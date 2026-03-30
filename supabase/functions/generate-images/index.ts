import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function generateImage(prompt: string, lovableKey: string, timeout = 12000): Promise<string | null> {
  const models = ["google/gemini-3.1-flash-image-preview", "google/gemini-3-pro-image-preview"];
  
  for (const model of models) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

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

      clearTimeout(timer);

      if (response.status === 429 || response.status === 402) continue;
      if (!response.ok) continue;

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (imageUrl) return imageUrl;
    } catch {
      continue;
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
    if (!LOVABLE_KEY) throw new Error("No API key configured");

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

    // Build max 3 prompts for speed
    const prompts: { label: string; prompt: string }[] = [
      { label: "summary", prompt: shortPrompt("Clean colorful educational infographic with icons and arrows") },
      { label: "mindmap-center", prompt: shortPrompt("Mind map with central topic and 4-5 colorful branches with icons") },
    ];

    if (Array.isArray(passos) && passos.length > 0) {
      const step = passos[0];
      const titulo = typeof step === "string" ? step : step?.titulo || step?.conceito || "Step 1";
      prompts.push({
        label: "step-0",
        prompt: shortPrompt(`Simple illustration of "${String(titulo).replace(/[<>]/g, "").trim().slice(0, 100)}"`)
      });
    } else {
      prompts.push({
        label: "diagram",
        prompt: shortPrompt("Educational diagram showing relationships between key concepts with boxes and arrows")
      });
    }

    console.log(`Generating ${prompts.length} images in PARALLEL for: ${sanitizedTema}`);

    // Generate ALL images in parallel for maximum speed
    const results = await Promise.allSettled(
      prompts.map(p => generateImage(p.prompt, LOVABLE_KEY, 12000))
    );

    const aiImages: any[] = [];
    for (let i = 0; i < prompts.length; i++) {
      const result = results[i];
      if (result.status === "fulfilled" && result.value) {
        const p = prompts[i];
        const isStep = p.label.startsWith("step-");
        aiImages.push({
          tipo: "ai",
          label: p.label,
          url: result.value,
          descricao: isStep
            ? `Ilustração: ${(Array.isArray(passos) && passos[0]?.titulo) || sanitizedTema}`
            : p.label === "summary" ? `Infográfico: ${sanitizedTema}`
            : p.label === "mindmap-center" ? `Mapa mental: ${sanitizedTema}`
            : `Diagrama: ${sanitizedTema}`,
        });
      }
    }

    console.log(`Generated ${aiImages.length}/${prompts.length} images`);

    return new Response(
      JSON.stringify({ aiImages, webImages: [], tema: sanitizedTema }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in generate-images:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao gerar imagens." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
