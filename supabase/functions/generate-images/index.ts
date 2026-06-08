import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const toAnonUuid = async (input: string): Promise<string> => {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

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
    // Up to 2 attempts per model with backoff on 429 (rate limit)
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 11000);

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
          // Backoff 1.5–3s before next attempt to clear per-second quota
          await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1500));
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
    try {
      const serviceClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
      let userId: string | null = null;
      const authHeader = req.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const ac = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } });
        const { data } = await ac.auth.getUser();
        if (data?.user) userId = data.user.id;
      }
      const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('cf-connecting-ip')
        || req.headers.get('x-real-ip')
        || req.headers.get('user-agent')
        || 'unknown';
      const rateLimitId = userId || await toAnonUuid(`anon_${clientIp}`);
      const { data: isAllowed } = await serviceClient.rpc('check_rate_limit', {
        _user_id: rateLimitId, _endpoint: 'generate-images', _max_requests: userId ? 180 : 600, _window_minutes: 1
      });
      if (isAllowed === false) {
        return new Response(JSON.stringify({ error: 'Muitas requisições ao mesmo tempo. Tente novamente em alguns segundos.' }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "2" } });
      }
    } catch (e) { console.error('[generate-images] rate-limit error', e); }


    const { tema, nivel, passos } = await req.json();

    if (!tema || typeof tema !== "string" || tema.length < 2) {
      return new Response(
        JSON.stringify({ error: "Tema é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiKeys = [
      Deno.env.get("GOOGLE_GEMINI_API_KEY"),
      Deno.env.get("GOOGLE_GEMINI_API_KEY_2"),
      Deno.env.get("GOOGLE_GEMINI_API_KEY_3"),
      Deno.env.get("GOOGLE_GEMINI_API_KEY_4"),
      Deno.env.get("GOOGLE_GEMINI_API_KEY_5"),
    ].filter(Boolean) as string[];
    if (geminiKeys.length === 0) throw new Error("GOOGLE_GEMINI_API_KEY is not configured");

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
      // Limit to 1 step illustration to keep it fast (4 images total).
      const step = passos[0];
      const titulo = typeof step === "string" ? step : step?.titulo || step?.conceito || `Step 1`;
      const sanitizedStep = String(titulo).replace(/[<>]/g, "").trim().slice(0, 100);
      prompts.push({
        label: `step-0`,
        prompt: `A simple educational illustration of "${sanitizedStep}" (related to "${sanitizedTema}") for ${audience}.`,
      });
    }

    console.log(`Generating ${prompts.length} SVGs in parallel for: ${sanitizedTema} (rotating across ${geminiKeys.length} keys)`);

    // Helper: try each key until success
    const tryAllKeys = async (prompt: string): Promise<string | null> => {
      const shuffled = [...geminiKeys].sort(() => Math.random() - 0.5);
      for (const key of shuffled) {
        const result = await generateSvg(prompt, key);
        if (result) return result;
      }
      return null;
    };

    // Stagger requests by 250ms to spread per-second quota; distribute prompts across keys
    const results = await Promise.allSettled(
      prompts.map((p, i) =>
        new Promise<string | null>((resolve) =>
          setTimeout(() => resolve(tryAllKeys(p.prompt) as any), i * 250)
        ).then((v) => v)
      )
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
