import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function generateSvgImage(prompt: string, lovableKey: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    console.log("[SVG] Calling gateway...");
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{
          role: "user",
          content: `Generate a clean educational SVG illustration. ${prompt}

Return ONLY valid SVG code. The SVG must have viewBox="0 0 800 600". Use vibrant flat design colors, include relevant shapes and text labels with font-family="Arial". No markdown, no code blocks, only raw <svg>...</svg>`
        }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    console.log(`[SVG] Gateway response: ${response.status}`);
    
    if (!response.ok) {
      const body = await response.text();
      console.error(`[SVG] Error body: ${body.slice(0, 200)}`);
      return null;
    }

    const data = await response.json();
    let svgText = data.choices?.[0]?.message?.content || "";
    console.log(`[SVG] Got response length: ${svgText.length}`);
    
    // Extract SVG from response (handle code blocks too)
    svgText = svgText.replace(/```xml\s*/g, "").replace(/```svg\s*/g, "").replace(/```\s*/g, "");
    const svgMatch = svgText.match(/<svg[\s\S]*?<\/svg>/i);
    if (!svgMatch) {
      console.error("[SVG] No SVG found in response");
      return null;
    }
    
    const svg = svgMatch[0];
    const base64 = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${base64}`;
  } catch (e: any) {
    console.error(`[SVG] Exception: ${e.message}`);
    return null;
  }
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
      fundamental1: "crianças do ensino fundamental",
      fundamental2: "adolescentes do ensino médio",
      medio: "estudantes universitários",
      superior: "estudantes de pós-graduação",
    };
    const audience = nivelLabel[sanitizedNivel] || "estudantes";

    const prompts: { label: string; prompt: string }[] = [
      { label: "summary", prompt: `Infográfico educacional sobre "${sanitizedTema}" para ${audience}. Mostre os principais conceitos com ícones, setas e cores vibrantes.` },
      { label: "mindmap-center", prompt: `Mapa mental sobre "${sanitizedTema}" para ${audience}. Tópico central conectado a 4-5 ramos coloridos com ícones representativos.` },
    ];

    if (Array.isArray(passos) && passos.length > 0) {
      const titulo = typeof passos[0] === "string" ? passos[0] : passos[0]?.titulo || passos[0]?.conceito || "Passo 1";
      prompts.push({
        label: "step-0",
        prompt: `Ilustração educacional de "${String(titulo).replace(/[<>]/g, "").trim().slice(0, 100)}" no contexto de "${sanitizedTema}" para ${audience}.`
      });
    } else {
      prompts.push({
        label: "diagram",
        prompt: `Diagrama educacional mostrando relações entre conceitos-chave de "${sanitizedTema}" para ${audience}. Use caixas, setas e cores.`
      });
    }

    console.log(`Generating ${prompts.length} SVG images in PARALLEL for: ${sanitizedTema}`);

    const results = await Promise.allSettled(
      prompts.map(p => generateSvgImage(p.prompt, LOVABLE_KEY))
    );

    const aiImages: any[] = [];
    for (let i = 0; i < prompts.length; i++) {
      const result = results[i];
      if (result.status === "fulfilled" && result.value) {
        const p = prompts[i];
        aiImages.push({
          tipo: "ai",
          label: p.label,
          url: result.value,
          descricao: p.label === "summary" ? `Infográfico: ${sanitizedTema}`
            : p.label === "mindmap-center" ? `Mapa mental: ${sanitizedTema}`
            : p.label.startsWith("step-") ? `Ilustração: ${(Array.isArray(passos) && passos[0]?.titulo) || sanitizedTema}`
            : `Diagrama: ${sanitizedTema}`,
        });
      }
    }

    console.log(`Generated ${aiImages.length}/${prompts.length} SVG images`);

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
