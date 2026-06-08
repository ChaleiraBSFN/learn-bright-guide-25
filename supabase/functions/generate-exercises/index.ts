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
  primeBoost: z.boolean().optional().default(false),
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
  const models = ["gemini-2.5-flash-lite", "gemini-2.0-flash-lite", "gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-flash", "gemini-1.5-pro"];
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
      } catch (e: any) {
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

  try { return JSON.parse(cleaned); } catch (_) {}

  const start = cleaned.indexOf("{");
  if (start === -1) throw new Error("No JSON object found");
  cleaned = cleaned.slice(start);

  try { return JSON.parse(cleaned); } catch (_) {}

  // Repair truncated JSON: track string state + brace/bracket depth,
  // truncate to last complete top-level element, then close open structures.
  let inString = false;
  let escape = false;
  const stack: string[] = [];
  let lastSafeInArray = -1;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escape) { escape = false; continue; }
    if (inString) {
      if (ch === "\\") { escape = true; continue; }
      if (ch === '"') { inString = false; }
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === "{" || ch === "[") {
      stack.push(ch === "{" ? "}" : "]");
    } else if (ch === "}" || ch === "]") {
      if (stack.length && stack[stack.length - 1] === ch) stack.pop();
      // Safe truncation: just closed an item while still inside an outer array
      if (stack.length >= 1 && stack[stack.length - 1] === "]") {
        lastSafeInArray = i + 1;
      }
    }
  }

  let repaired = cleaned;
  if (lastSafeInArray > 0) {
    repaired = cleaned.slice(0, lastSafeInArray);
    // Recompute stack for truncated string
    const s: string[] = [];
    let inStr = false, esc = false;
    for (let i = 0; i < repaired.length; i++) {
      const ch = repaired[i];
      if (esc) { esc = false; continue; }
      if (inStr) {
        if (ch === "\\") { esc = true; continue; }
        if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') { inStr = true; continue; }
      if (ch === "{" || ch === "[") s.push(ch === "{" ? "}" : "]");
      else if ((ch === "}" || ch === "]") && s.length && s[s.length - 1] === ch) s.pop();
    }
    repaired = repaired.replace(/,\s*$/, "");
    while (s.length) repaired += s.pop();
  } else {
    if (inString) repaired += '"';
    repaired = repaired.replace(/,\s*$/, "");
    while (stack.length) repaired += stack.pop();
  }

  return JSON.parse(repaired);
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

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('cf-connecting-ip')
      || req.headers.get('x-real-ip')
      || req.headers.get('user-agent')
      || 'unknown';
    const rateLimitId = userId || await toAnonUuid(`anon_${clientIp}`);
    const maxRequests = userId ? 180 : 900;
    const { data: isAllowed } = await serviceClient.rpc('check_rate_limit', {
      _user_id: rateLimitId, _endpoint: 'generate-exercises', _max_requests: maxRequests, _window_minutes: 1,
    });

    if (isAllowed === false) {
      return new Response(JSON.stringify({ error: 'Muitas requisições ao mesmo tempo. Tente novamente em alguns segundos.' }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "2" } });
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

    const { tema, nivel, quantidade, dificuldade, idioma, imagemBase64, primeBoost } = validationResult.data;
    const lang = languageMap[idioma] || "Português (Brasil)";
    const seed = Math.floor(Math.random() * 1000000);

    // Map internal level codes to explicit academic calibration. The internal
    // value "medio" actually represents Graduação (undergraduate) and "superior"
    // represents Pós-Graduação — without this mapping the AI confuses them.
    const levelCalibration: Record<string, string> = {
      fundamental1: "ELEMENTARY SCHOOL (ages 6-10). Simple language, basic arithmetic, intuitive examples.",
      fundamental2: "MIDDLE/HIGH SCHOOL (ages 11-17). ENEM-style questions, algebra, basic geometry, reading comprehension.",
      medio: "UNDERGRADUATE / GRADUAÇÃO (university level — ENADE, vestibulares IME/ITA/Fuvest exatas, OAB 1ª fase, engineering/medicine/law/economics undergraduate courses). Use REAL exam-style questions: rigorous calculus, linear algebra, statistics, formal definitions, multi-step derivations, case analysis. NEVER trivial or high-school level. Cite theorems, laws, articles when relevant.",
      superior: "GRADUATE / PÓS-GRADUAÇÃO (Mestrado/Doutorado, MBA, residência médica, OAB 2ª fase, concursos federais de alto nível como AFRFB/Magistratura/MPF, ANPAD, GRE/GMAT advanced, PhD qualifying exams). EXTREMELY rigorous: formal proofs, research-paper critique, advanced abstraction, open-ended argumentation, synthesis across multiple sources. Must match published comprehensive exams.",
      auto: "Infer the appropriate academic level from the topic and context."
    };
    // Prime boost downshifts the academic tier by one level so questions feel ~60% easier.
    const primeDownshift: Record<string, string> = {
      fundamental2: "fundamental1",
      medio: "fundamental2",
      superior: "medio",
      fundamental1: "fundamental1",
      auto: "fundamental2",
    };
    const effectiveNivel = primeBoost ? (primeDownshift[nivel] || nivel) : nivel;
    const nivelInstrucao = levelCalibration[effectiveNivel] || `Custom level: ${sanitize(nivel)}`;
    const effectiveDificuldade = primeBoost ? "muito fácil (modo Prime)" : dificuldade;

    const imageInstructions = imagemBase64
      ? `\nCRITICAL IMAGE TASK: An image with exercises/questions was attached. You MUST:
1. Carefully read EVERY exercise/question visible in the image (use OCR).
2. Use each ORIGINAL question text from the image as the "enunciado" (do not invent new questions; reproduce them faithfully, translated to ${lang} if needed).
3. SOLVE every exercise step-by-step. Fill "respostaCompleta" with the FULL solution path: setup, formulas, substitutions, calculations, intermediate steps, and final answer.
4. Fill "explicacao" with WHY each step works (concept-level reasoning, not just the steps).
5. For "objetiva", pick the correct alternative letter in "resposta" and explain why the others are wrong inside "respostaCompleta".
6. For "dissertativa", "respostaEsperada" must be a complete model answer with reasoning + calculations.
7. Generate exactly as many items as there are exercises in the image (ignore the requested quantidade if the image has more/fewer). If the image has no exercises, then generate ${quantidade} new ones about "${sanitize(tema)}".
8. Show all math/calculations in plain text (e.g. "2x + 3 = 7  =>  2x = 4  =>  x = 2"). NEVER skip steps.\n`
      : "";

    const prompt = `${primeBoost ? `⚡⚡⚡ PRIME BOOST MODE — HIGHEST PRIORITY OVERRIDE (NON-NEGOTIABLE) ⚡⚡⚡
The user activated a temporary "Prime" power-up. Every exercise MUST be DRASTICALLY EASIER — target roughly 60% reduction in cognitive load vs the normal calibration. This rule overrides any later instruction. Concretely:
- Statements: short (1-2 sentences max), direct, one concept per question.
- Numbers: use ONLY whole integers. NEVER use decimals/floats. If a natural calculation would yield a float (e.g. 7.5, 3.333, 2.71), ROUND to the nearest integer and adjust the question so the math still works cleanly. Prefer numbers between 1 and 20.
- Operations: at most 1-2 steps. No nested formulas, no multi-concept fusion, no edge cases, no tricky wording.
- Multiple choice: the correct answer should be the most obviously reasonable one; distractors plausible but clearly weaker.
- Use the EASIER end of the calibration band (already downshifted one tier by Prime).
- All intermediate results in "respostaCompleta" must also be integers (round if needed) — never display a number like 2.5 or 3.33.
Keep the same TOPIC, but lower difficulty substantially.

` : ''}Generate ${quantidade} exercises about "${sanitize(tema)}". Respond ONLY in ${lang}. ONLY valid JSON.

ACADEMIC LEVEL CALIBRATION (CRITICAL — DO NOT IGNORE):
Internal level code received: "${sanitize(nivel)}"${primeBoost ? ` (downshifted to "${effectiveNivel}" by Prime boost)` : ''}
What it means: ${nivelInstrucao}
Difficulty MUST strictly match this calibration.${primeBoost ? ' Because Prime is active, stay near the EASY end of this band.' : ' For graduação/pós-graduação use questions inspired by REAL exams (ENADE, OAB, concursos, qualifying exams, residências). NEVER produce school-level content for university levels.'}
${imageInstructions}
~60% multiple choice (tipo "objetiva"), ~40% open-ended (tipo "dissertativa"). Seed: ${seed}. User difficulty modifier: ${effectiveDificuldade}.

JSON format:
{"titulo":"string","descricao":"1 sentence","exercicios":[
  {"tipo":"objetiva","numero":1,"nivel":"string","enunciado":"question","alternativas":["a) opt","b) opt","c) opt","d) opt"],"resposta":"a","respostaCompleta":"FULL step-by-step solution with calculations","explicacao":"why it works","dicaExtra":"tip"},
  {"tipo":"dissertativa","numero":2,"nivel":"string","enunciado":"question","respostaEsperada":"complete model answer with reasoning + calculations","explicacao":"why it works","criterios":["c1","c2"]}
],"resumoTema":"2 sentences"}

JSON format:
{"titulo":"string","descricao":"1 sentence","exercicios":[
  {"tipo":"objetiva","numero":1,"nivel":"string","enunciado":"question","alternativas":["a) opt","b) opt","c) opt","d) opt"],"resposta":"a","respostaCompleta":"FULL step-by-step solution with calculations","explicacao":"why it works","dicaExtra":"tip"},
  {"tipo":"dissertativa","numero":2,"nivel":"string","enunciado":"question","respostaEsperada":"complete model answer with reasoning + calculations","explicacao":"why it works","criterios":["c1","c2"]}
],"resumoTema":"2 sentences"}

OUTPUT FORMATTING (MANDATORY — clean readable text, no garbage symbols):
- Keep JSON keys in Portuguese.
- NEVER use LaTeX delimiters ($, $$, \\(, \\), \\[, \\]).
- NEVER use HTML/XML tags or pseudo-tags like <>, <<>>, <><>, <eq>, <math>, <br>, <p>, </p>.
- NEVER use markdown code fences (\`\`\`) or backticks for math.
- Use Unicode directly: x², x³, xⁿ, √(x), π, θ, α, β, Δ, ≤, ≥, ≠, ≈, ∞, ∑, ∫. Subscripts: x₁, x₂, H₂O. Fractions inline: (a)/(b). Multiplication: × or ·. Division: ÷.
- Plain readable text only. Output must NEVER contain sequences like "<><>", "<<<>>>", ">>>" or other unbalanced bracket runs.

Rules: Vary difficulty within the calibration. ONLY JSON output.`;

    const geminiKeys = [
      Deno.env.get("GOOGLE_GEMINI_API_KEY"),
      Deno.env.get("GOOGLE_GEMINI_API_KEY_2"),
      Deno.env.get("GOOGLE_GEMINI_API_KEY_3"),
      Deno.env.get("GOOGLE_GEMINI_API_KEY_4"),
      Deno.env.get("GOOGLE_GEMINI_API_KEY_5"),
    ].filter(Boolean) as string[];
    geminiKeys.sort(() => Math.random() - 0.5);
    let content: string | null = null;

    // Scale output tokens with quantity (~700 tokens per exercise, +1500 overhead, capped at 32k)
    const dynamicMaxTokens = Math.min(32000, 1500 + quantidade * 700);

    for (const key of geminiKeys) {
      content = await callGeminiDirect(prompt, key, dynamicMaxTokens, imagemBase64);
      if (content) break;
      console.log(`[Exercises] Key failed, rotating...`);
    }

    if (!content) {
      return new Response(JSON.stringify({ error: "Serviço indisponível." }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let exercises;
    try {
      exercises = parseAIJson(content);
    } catch (e) {
      console.error("[parseAIJson] failed:", (e as Error).message, "len:", content.length, "tail:", content.slice(-200));
      return new Response(JSON.stringify({ error: "Erro ao processar resposta." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Guard: ensure at least one valid exercise survived truncation repair
    if (!exercises?.exercicios || !Array.isArray(exercises.exercicios) || exercises.exercicios.length === 0) {
      return new Response(JSON.stringify({ error: "Resposta vazia. Tente reduzir a quantidade." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify(exercises), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Erro ao gerar exercícios." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
