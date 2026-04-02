import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const requestSchema = z.object({
  tema: z.string().min(3).max(200),
  nivel: z.string().min(1).max(50),
  quantidade: z.number().int().min(1).max(20).default(5),
  dificuldade: z.string().optional().default("variado"),
  idioma: z.enum(["pt-BR", "en", "es", "fr", "de", "it", "ja", "zh", "ru"]).optional().default("pt-BR"),
  imagemBase64: z.string().optional().nullable(),
});

const sanitize = (str: string): string => str.replace(/[<>]/g, '').replace(/```/g, '').trim();

const toAnonUuid = async (input: string): Promise<string> => {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

const languageMap: Record<string, string> = {
  "pt-BR": "Português (Brasil)", en: "English", es: "Español", fr: "Français",
  de: "Deutsch", it: "Italiano", ja: "日本語", zh: "中文", ru: "Русский",
};

async function callGeminiDirect(prompt: string, apiKey: string, maxTokens: number, imagemBase64?: string | null): Promise<string | null> {
  const models = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`[Gemini] Trying ${model} (attempt ${attempt + 1})...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000);
        const parts: any[] = [{ text: prompt }];

        if (imagemBase64) {
          let mimeType = "image/jpeg";
          let data = imagemBase64;
          
          if (imagemBase64.startsWith("data:")) {
            const matches = imagemBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              mimeType = matches[1];
              data = matches[2];
            }
          }
          
          parts.push({
            inlineData: {
              mimeType,
              data: data,
            }
          });
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts }],
              generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens, responseMimeType: "application/json" },
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);
        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) { console.log(`[Gemini] Success with ${model}`); return text; }
        }
        if (response.status === 429) { console.log(`[Gemini] ${model} rate limited, next...`); break; }
        if (response.status >= 500) { console.log(`[Gemini] ${model} server error, retrying...`); continue; }
        break;
      } catch (e) {
        console.error(`[Gemini] ${model}:`, e.message);
        if (e.name === 'AbortError' && attempt === 0) continue;
        break;
      }
    }
  }
  return null;
}

// No Lovable AI fallback - only free Gemini models

function parseAIJson(content: string): any {
  let cleaned = content.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) cleaned = jsonMatch[0];
  return JSON.parse(cleaned);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    const serviceClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    if (authHeader?.startsWith('Bearer ')) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser();
      if (!authError && authUser) userId = authUser.id;
    }

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimitId = userId || await toAnonUuid(`anon_${clientIp}`);
    const maxRequests = userId ? 15 : 10;
    const { data: isAllowed } = await serviceClient.rpc('check_rate_limit', {
      _user_id: rateLimitId, _endpoint: 'generate-exercises', _max_requests: maxRequests, _window_minutes: 60,
    });

    if (isAllowed === false) {
      return new Response(JSON.stringify({ error: 'Limite de requisições excedido.' }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let rawBody;
    try { rawBody = await req.json(); } catch {
      return new Response(JSON.stringify({ error: 'Dados inválidos.' }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (typeof rawBody.quantidade === 'string') rawBody.quantidade = parseInt(rawBody.quantidade, 10);

    const validationResult = requestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: 'Dados inválidos.' }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { tema, nivel, quantidade, dificuldade, idioma, imagemBase64 } = validationResult.data;
    const lang = languageMap[idioma] || "Português (Brasil)";
    const seed = Math.floor(Math.random() * 1000000);

    const prompt = `Generate ${quantidade} exercises about "${sanitize(tema)}" at level "${sanitize(nivel)}". Respond ONLY in ${lang}. ONLY valid JSON.
${imagemBase64 ? "\nSe uma imagem foi fornecida como contexto visual na requisição, crie os exercícios baseados no conteúdo, elementos ou raciocínio presentes na imagem.\n" : ""}

~60% multiple choice (tipo "objetiva"), ~40% open-ended (tipo "dissertativa"). Seed: ${seed}. Timestamp: ${Date.now()}. Difficulty: ${dificuldade}. Make sure the questions uniquely differ from previous generations.

JSON format:
{"titulo":"string","descricao":"1 sentence","exercicios":[
  {"tipo":"objetiva","numero":1,"nivel":"string","enunciado":"question","alternativas":["a) opt","b) opt","c) opt","d) opt"],"resposta":"a","respostaCompleta":"full answer","explicacao":"1 sentence","dicaExtra":"tip"},
  {"tipo":"dissertativa","numero":2,"nivel":"string","enunciado":"question","respostaEsperada":"ideal answer","explicacao":"1 sentence","criterios":["c1","c2"]}
],"resumoTema":"2 sentences"}

Rules: Keep JSON keys in Portuguese. Be concise. Vary difficulty. ONLY JSON output.`;

    const geminiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    let content: string | null = null;

    if (geminiKey) content = await callGeminiDirect(prompt, geminiKey, 4096, imagemBase64);

    if (!content) {
      return new Response(JSON.stringify({ error: "Serviço indisponível." }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let exercises;
    try { exercises = parseAIJson(content); } catch {
      return new Response(JSON.stringify({ error: "Erro ao processar resposta." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify(exercises), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Erro ao gerar exercícios." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
