import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const requestSchema = z.object({
  tema: z.string().min(1).max(200),
  nivel: z.string().min(1).max(50),
  prazo: z.number().int().min(1).max(365),
  duvidas: z.string().max(1000).optional().nullable(),
  idioma: z.enum(["pt-BR", "en", "es", "fr", "de", "it", "ja", "zh", "ru"]).optional().default("pt-BR"),
  imagemBase64: z.string().optional().nullable(),
});

const sanitize = (str: string): string => str.replace(/[<>]/g, '').replace(/```/g, '').trim();

// === Sanitização matemática: corrige notações erradas vindas da IA ===
const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', 'n': 'ⁿ', 'i': 'ⁱ',
};
const SUBSCRIPT_MAP: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
};
const toSuperscript = (s: string) => s.split('').map(c => SUPERSCRIPT_MAP[c] ?? c).join('');
const toSubscript = (s: string) => s.split('').map(c => SUBSCRIPT_MAP[c] ?? c).join('');
function fixMathNotation(text: string): string {
  if (!text || typeof text !== 'string') return text;
  let out = text;
  out = out.replace(/\$\$([\s\S]+?)\$\$/g, '$1');
  out = out.replace(/\$([^\$\n]+?)\$/g, '$1');
  out = out.replace(/\\\(([\s\S]+?)\\\)/g, '($1)');
  out = out.replace(/\\\[([\s\S]+?)\\\]/g, '($1)');
  out = out.replace(/\\cdot/g, '·').replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\\pm/g, '±');
  out = out.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');
  out = out.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');
  out = out.replace(/\^\{([^{}]+)\}/g, (_m, g1) => toSuperscript(g1));
  out = out.replace(/\^\(([^()]+)\)/g, (_m, g1) => toSuperscript(g1));
  out = out.replace(/\^([0-9+\-n]+)/g, (_m, g1) => toSuperscript(g1));
  out = out.replace(/_\{([0-9]+)\}/g, (_m, g1) => toSubscript(g1));
  out = out.replace(/_([0-9])/g, (_m, g1) => toSubscript(g1));
  return out;
}
function deepFixMath(value: any): any {
  if (typeof value === 'string') return fixMathNotation(value);
  if (Array.isArray(value)) return value.map(deepFixMath);
  if (value && typeof value === 'object') {
    const out: any = {};
    for (const k of Object.keys(value)) out[k] = deepFixMath(value[k]);
    return out;
  }
  return value;
}

const toAnonUuid = async (input: string): Promise<string> => {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

// === SUBJECT-SPECIFIC AI STYLES ===
// Simulates different AI personalities using specialized prompts per subject area
function getSubjectStyle(tema: string): { style: string; temperature: number } {
  const temaLower = tema.toLowerCase();
  
  // 🧮 Exatas - Copilot style (clear, logical, step-by-step)
  if (/matem[aá]tica|c[aá]lculo|estat[ií]stica|aritm[eé]tica|trigonometria|f[ií]sica|mec[aâ]nica|termodin|eletricidade|[oó]ptica|ondas|cin[eé]tica/.test(temaLower)) {
    return {
      style: `You are an extremely precise and logical tutor. Use step-by-step structured reasoning. Break complex problems into small, numbered sub-steps. Always show the mathematical reasoning chain. Use analogies with real-world engineering and technology. Be systematic and methodical like a senior engineer explaining to a junior.`,
      temperature: 0.3,
    };
  }
  
  // Álgebra - ChatGPT style (symbolic manipulation, abstract explanations)
  if (/[aá]lgebra|equa[cç][oõ]es|polin[oô]mio|matrizes|vetores|sistemas lineares/.test(temaLower)) {
    return {
      style: `You are an articulate and creative math tutor who excels at explaining abstract concepts. Use clear symbolic notation and walk through transformations step by step. Connect abstract algebra to practical patterns. Use multiple approaches to solve the same problem, showing the beauty of mathematical thinking.`,
      temperature: 0.4,
    };
  }
  
  // Geometria - Claude style (visual, spatial descriptions)
  if (/geometria|[aá]rea|per[ií]metro|volume|tri[aâ]ngulo|c[ií]rculo|esfera|prisma|pir[aâ]mide|plano cartesiano/.test(temaLower)) {
    return {
      style: `You are a visual-spatial expert who excels at describing geometric concepts through vivid mental imagery. Use rich spatial descriptions, relating shapes to everyday objects. Describe transformations as movements you can visualize. Be analytical yet descriptive, helping the student "see" the geometry in their mind.`,
      temperature: 0.35,
    };
  }
  
  // 🔬 Biologia - Gemini style (scientific synthesis, natural analogies)
  if (/biologia|c[eé]lula|gen[eé]tica|evolu[cç][aã]o|ecologia|bot[aâ]nica|zoologia|anatomia|fisiologia|microbiologia|bioqu[ií]mica|fotoss[ií]ntese|dna|rna/.test(temaLower)) {
    return {
      style: `You are a passionate biology educator who connects scientific concepts to the wonder of nature. Use vivid analogies comparing biological processes to familiar systems (e.g., cells as cities, DNA as blueprints). Synthesize complex information into clear narratives. Show how different biological systems interconnect.`,
      temperature: 0.4,
    };
  }
  
  // Química - Perplexity style (formulas, equations, quick references)
  if (/qu[ií]mica|[aá]tomo|mol[eé]cula|rea[cç][aã]o|tabela peri[oó]dica|liga[cç][oõ]es|[aá]cido|base|solu[cç][aã]o|estequiometria|orgânica|inorgânica/.test(temaLower)) {
    return {
      style: `You are a precise chemistry tutor focused on clarity with formulas and equations. Present chemical equations clearly formatted. Use quick-reference style explanations. Be direct and factual, providing practical examples of chemical reactions in daily life. Always balance equations and explain the "why" behind reactions.`,
      temperature: 0.3,
    };
  }
  
  // 📚 Literatura - ChatGPT style (creative, interpretive, metaphorical)
  if (/literatura|livro|poesia|romance|conto|autor|obra|leitura|narrativa|texto liter[aá]rio|machado|shakespeare|camões/.test(temaLower)) {
    return {
      style: `You are a literary scholar and creative thinker. Analyze texts with sensitivity to metaphor, symbolism, and narrative structure. Use evocative language to discuss literary works. Draw connections between literature and the human condition. Encourage critical thinking and personal interpretation. Be passionate about storytelling.`,
      temperature: 0.5,
    };
  }
  
  // História - Gemini style (chronological narratives, event connections)
  if (/hist[oó]ria|guerra|revolu[cç][aã]o|imp[eé]rio|civiliza[cç][aã]o|idade m[eé]dia|renascimento|coloniza|independ[eê]ncia|antiguidade/.test(temaLower)) {
    return {
      style: `You are a master historian who weaves engaging chronological narratives. Connect historical events to their causes and consequences, showing how one event leads to another. Use vivid descriptions of historical periods. Draw parallels between past and present. Organize information in clear timelines and cause-effect chains.`,
      temperature: 0.4,
    };
  }
  
  // Sociologia - Claude style (analytical, critical, reflective)
  if (/sociologia|sociedade|cultura|desigualdade|classe social|movimentos sociais|identidade|g[eê]nero|ra[cç]a|capitalismo|marx|durkheim|weber/.test(temaLower)) {
    return {
      style: `You are a thoughtful sociological analyst. Approach topics with critical thinking and reflexivity. Present multiple perspectives on social phenomena. Use data and real-world examples to support arguments. Encourage the student to question assumptions and think about power structures, social constructs, and systemic patterns.`,
      temperature: 0.45,
    };
  }
  
  // Filosofia - ChatGPT style (argumentative, abstract concepts)
  if (/filosofia|[eé]tica|moral|metaf[ií]sica|epistemologia|l[oó]gica|plat[aã]o|arist[oó]teles|kant|nietzsche|descartes|exist[eê]ncia/.test(temaLower)) {
    return {
      style: `You are a philosophical guide who explores abstract concepts with rigor and wonder. Present arguments and counter-arguments clearly. Use Socratic questioning to provoke thought. Break down complex philosophical ideas into accessible language while maintaining intellectual depth. Show how philosophy connects to everyday decisions.`,
      temperature: 0.5,
    };
  }
  
  // Geografia - Gemini style (descriptive, spatial, data-rich)
  if (/geografia|clima|relevo|popula[cç][aã]o|urbaniza[cç][aã]o|bioma|continente|pa[ií]s|regi[aã]o|cart|migra|globaliza/.test(temaLower)) {
    return {
      style: `You are a geography expert with a talent for spatial descriptions and regional comparisons. Use vivid descriptions of landscapes, climates, and human settlements. Present data clearly with comparisons. Connect physical geography to human activities. Show how natural resources shape economies and societies.`,
      temperature: 0.4,
    };
  }
  
  // Default - balanced approach
  return {
    style: `You are an expert educator who adapts to the subject matter. Be clear, engaging, and thorough. Use examples and analogies appropriate to the topic.`,
    temperature: 0.4,
  };
}

// === AI PROVIDERS ===
// Aggressive cascade across every Gemini free-tier model.
// Each has its own RPM bucket, so trying them in sequence multiplies effective throughput.
async function callGeminiDirect(prompt: string, apiKey: string, maxTokens: number, temperature: number = 0.4, imagemBase64?: string | null): Promise<{ text: string | null; lastStatus: number }> {
  const models = [
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
  ];
  let lastStatus = 0;
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`[Gemini] Trying ${model} (attempt ${attempt + 1})...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000);
        const parts: any[] = [{ text: prompt }];

        if (imagemBase64) {
          // Extrair config base64 pura e mimeType se houver data:image/png;base64,
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
              generationConfig: { temperature, maxOutputTokens: maxTokens, responseMimeType: "application/json" },
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);
        lastStatus = response.status;
        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) { console.log(`[Gemini] Success with ${model}`); return { text, lastStatus: 200 }; }
        }
        if (response.status === 429) { console.log(`[Gemini] ${model} rate limited, next...`); break; }
        if (response.status >= 500) { console.log(`[Gemini] ${model} server error, retrying...`); continue; }
        console.error(`[Gemini] ${model} error: ${response.status}`);
        break;
      } catch (e: any) {
        console.error(`[Gemini] ${model}:`, e.message);
        if (e.name === 'AbortError' && attempt === 0) continue;
        break;
      }
    }
  }
  return { text: null, lastStatus };
}

function parseAIJson(content: string): any {
  let cleaned = content.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  const start = cleaned.indexOf("{");
  if (start === -1) throw new Error("No JSON object found");
  cleaned = cleaned.slice(start);

  // Try direct parse first
  try { return JSON.parse(cleaned); } catch (_) { /* fall through to repair */ }

  // Depth-tracking repair: walk chars, track stack, handle truncation
  const stack: string[] = []; // '{', '[', '"'
  let escape = false;
  let lastSafe = -1; // index after last completed value at depth>=1
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    const top = stack[stack.length - 1];
    if (top === '"') {
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === '"') { stack.pop(); lastSafe = i + 1; }
      continue;
    }
    if (ch === '"') { stack.push('"'); continue; }
    if (ch === "{") { stack.push("{"); continue; }
    if (ch === "[") { stack.push("["); continue; }
    if (ch === "}" || ch === "]") { stack.pop(); lastSafe = i + 1; continue; }
    if (ch === "," || ch === ":") continue;
    if (/\s/.test(ch)) continue;
    // primitive (number/bool/null) — include in safe boundary
    lastSafe = i + 1;
  }

  // Truncate to last safe boundary, drop trailing comma
  let repaired = lastSafe > 0 ? cleaned.slice(0, lastSafe) : cleaned;
  repaired = repaired.replace(/,\s*$/, "");

  // If we were inside a string when it cut off, close it
  // (rebuild stack from repaired text)
  const stack2: string[] = [];
  let esc2 = false;
  for (let i = 0; i < repaired.length; i++) {
    const ch = repaired[i];
    const top = stack2[stack2.length - 1];
    if (top === '"') {
      if (esc2) { esc2 = false; continue; }
      if (ch === "\\") { esc2 = true; continue; }
      if (ch === '"') stack2.pop();
      continue;
    }
    if (ch === '"') stack2.push('"');
    else if (ch === "{") stack2.push("{");
    else if (ch === "[") stack2.push("[");
    else if (ch === "}" || ch === "]") stack2.pop();
  }
  while (stack2.length) {
    const top = stack2.pop();
    if (top === '"') repaired += '"';
    else if (top === "{") { repaired = repaired.replace(/,\s*$/, "") + "}"; }
    else if (top === "[") { repaired = repaired.replace(/,\s*$/, "") + "]"; }
  }

  return JSON.parse(repaired);
}

// === SUBSCRIPTION CHECK ===
async function verifyPremiumStatus(supabaseClient: any, userId: string): Promise<boolean> {
  try {
    const { data: sub } = await supabaseClient
      .from('subscriptions').select('status, expires_at').eq('user_id', userId).maybeSingle();
    if (!sub) return false;
    return sub.status === 'active' && sub.expires_at && new Date(sub.expires_at) > new Date();
  } catch { return false; }
}

const languageMap: Record<string, string> = {
  "pt-BR": "Português (Brasil)", en: "English", es: "Español", fr: "Français",
  de: "Deutsch", it: "Italiano", ja: "日本語", zh: "中文", ru: "Русский",
};

function buildPrompt(tema: string, nivel: string, prazo: number, duvidas: string | null, idioma: string, isPremium: boolean): string {
  const lang = languageMap[idioma] || "Português (Brasil)";
  const { style } = getSubjectStyle(tema);
  
  const maxDays = Math.min(prazo, 30);
  const dayWordMap: Record<string, string> = {
    "pt-BR": "Dia", en: "Day", es: "Día", fr: "Jour",
    de: "Tag", it: "Giorno", ja: "日目", zh: "第天", ru: "День",
  };
  const dayWord = dayWordMap[idioma] || "Dia";
  const dailyPlanInstruction = `Generate "planoEstudo" with exactly ${maxDays} blocks, one per day. The "periodo" field MUST be in ${lang}: "${dayWord} 1", "${dayWord} 2", ... "${dayWord} ${maxDays}". Each day must have: specific study tasks for that day and 1-2 practice exercises.`;

  return `${style}

Respond ONLY in valid JSON, in ${lang}. Keep JSON keys in Portuguese exactly as shown.

Topic: ${tema}
Level: ${nivel}
Deadline: ${prazo} days
${duvidas ? `Specific questions: ${duvidas}` : ""}

Return this JSON structure:
{
  "objetivo": {"titulo": "string", "conteudo": "2 sentences"},
  "resumo": {"titulo": "string", "conteudo": "4-5 sentences covering key points"},
  "demonstracoes": {"titulo": "string", "passos": [{"numero": 1, "titulo": "string", "conceito": "DEEP explanation: minimum 7 lines / 7-9 full sentences. Define key terms, explain the underlying principle/rule/formula with reasoning, mention historical or contextual background when useful, why it matters, and how it connects to the bigger picture. Substantial paragraph, not a summary.", "exemplo": "string"}]},
  "exercicios": {"titulo": "string", "lista": [{"nivel": "string", "pergunta": "string", "resposta": "string", "explicacao": "1 sentence"}]},
  "errosComuns": {"titulo": "string", "lista": [{"erro": "string", "comoEvitar": "string"}]},
  "mapaVisual": {"titulo": "string", "temaCentral": "string", "ramos": [{"nome": "string", "icone": "emoji", "cor": "string", "subitens": ["string"]}]},
  "planoEstudo": {"titulo": "string", "blocos": [{"numero": 1, "periodo": "${dayWord} 1", "objetivo": "string", "tarefas": ["task1", "task2", "exercise: question?"], "evidencia": "string"}]},
  "fontes": {"titulo": "string", "consultas": ["string"], "sites": [{"nome": "string", "termoBusca": "string", "descricao": "string"}]}
  ${isPremium ? `,"videosRecomendados": {"titulo": "string", "lista": [{"titulo": "string", "canal": "string", "descricao": "string", "termoBusca": "string"}]},
  "imagensIlustrativas": {"titulo": "string", "lista": [{"descricao": "string"}]}` : ""}
}

Rules:
- ${isPremium ? "5 steps, 6 exercises, 4 errors, 6 branches" : "3 steps, 3 exercises, 2 errors, 4 branches"}
- ${dailyPlanInstruction}
- Each day's tasks MUST include at least 1 exercise/question to practice
- Be CONCISE in most fields, BUT the "conceito" field MUST be deep and detailed: at least 7 lines / 7-9 sentences each. Never short.
- Respond ONLY in ${lang}, even if the topic is in another language.
- CRITICAL EXCEPTION: If the user is asking to learn words/vocabulary/phrases in a FOREIGN language (e.g., "aprender palavras em russo", "learn Japanese words"), then:
  * Write ALL explanations, concepts, titles, and descriptions in ${lang}
  * BUT keep the foreign language words, examples, and vocabulary items in their ORIGINAL foreign language script (e.g., Russian in Cyrillic, Japanese in Kanji/Hiragana, Chinese in Hanzi, etc.)
  * The "exemplo" and "pergunta"/"resposta" fields should contain the foreign language words being studied
- MATH NOTATION (MANDATORY): NEVER use LaTeX. NEVER use "$", "$$", "\\(", "\\)", "\\[", "\\]". For powers use Unicode superscripts directly: x², x³, x⁴, xⁿ (NEVER "x^2" nor "x**2"). For subscripts use x₁, x₂, H₂O. Square root: √(x). Fractions: (a)/(b). Multiplication: × or ·. Division: ÷. Use normal parentheses ( and ), NEVER "$" as a delimiter. Symbols: π θ α β Δ ≤ ≥ ≠ ≈ ∞.
- ONLY output JSON, no extra text.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    let isPremium = false;

    const serviceClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    if (authHeader?.startsWith('Bearer ')) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser();
      if (!authError && authUser) {
        userId = authUser.id;
        isPremium = await verifyPremiumStatus(supabaseClient, userId);
      }
    }

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimitId = userId || await toAnonUuid(`anon_${clientIp}`);
    const maxRequests = isPremium ? 50 : (userId ? 15 : 10);
    const { data: isAllowed } = await serviceClient.rpc('check_rate_limit', {
      _user_id: rateLimitId, _endpoint: 'generate-study-content', _max_requests: maxRequests, _window_minutes: 60,
    });

    if (isAllowed === false) {
      return new Response(JSON.stringify({ error: 'Limite de requisições excedido.' }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let rawBody;
    try { rawBody = await req.json(); } catch {
      return new Response(JSON.stringify({ error: 'Dados inválidos.' }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (typeof rawBody.prazo === 'string') rawBody.prazo = parseInt(rawBody.prazo, 10);

    const validationResult = requestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: 'Dados inválidos.' }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { tema, nivel, prazo, duvidas, idioma, imagemBase64 } = validationResult.data;
    const imageAnalysisInstruction = imagemBase64
      ? `\n\nIMPORTANT: An image was provided. ${tema === 'Análise da imagem enviada' || nivel === 'auto' ? 'The user did NOT provide a topic, level or deadline — INFER the topic and appropriate education level FROM the image content itself, then build the entire study material around what you see in the image.' : ''} Analyze the image carefully. If it contains exercises or questions, SOLVE each one step by step. Include in the JSON an additional field "analiseImagem" with this structure:
"analiseImagem": {
  "titulo": "Análise da Imagem",
  "descricao": "Brief description of what the image contains",
  "exerciciosIdentificados": [{"numero": 1, "enunciado": "original question from image", "resolucao": "step by step solution", "explicacao": "why this is the answer"}],
  "conceitosExtraidos": ["concept1", "concept2"],
  "observacoes": "any additional notes about the image content"
}
If the image contains exercises, the "exerciciosIdentificados" array MUST have the solved exercises. If no exercises, omit that field but still include "conceitosExtraidos" with concepts visible in the image. Your text must still follow the JSON format strictly.`
      : "";

    const prompt = buildPrompt(sanitize(tema), sanitize(nivel), prazo, duvidas ? sanitize(duvidas) : null, idioma, isPremium) + imageAnalysisInstruction;
    const { temperature } = getSubjectStyle(tema);
    
    const maxDays = Math.min(prazo, 30);
    const baseTokens = isPremium ? 8000 : 5000;
    const dayTokens = maxDays * 250;
    const maxTokens = Math.min(baseTokens + dayTokens, 16000);

    const geminiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    let content: string | null = null;
    let lastStatus = 0;

    // === CACHE LOOKUP (24h) — só quando não houve imagem ===
    let cacheKey: string | null = null;
    if (!imagemBase64) {
      const keyInput = JSON.stringify({ tema, nivel, prazo, duvidas, idioma, isPremium });
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(keyInput));
      cacheKey = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");

      const { data: cached } = await serviceClient
        .from('ai_response_cache')
        .select('response')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (cached?.response) {
        console.log('[Cache] HIT', cacheKey.slice(0, 12));
        // increment hits (fire-and-forget)
        serviceClient.rpc('cleanup_expired_ai_cache').then(() => {}, () => {});
        return new Response(JSON.stringify(cached.response), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      console.log('[Cache] MISS', cacheKey.slice(0, 12));
    }

    if (geminiKey) {
      const result = await callGeminiDirect(prompt, geminiKey, maxTokens, temperature, imagemBase64);
      content = result.text;
      lastStatus = result.lastStatus;
    }

    if (!content) {
      if (lastStatus === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" } });
      }
      return new Response(JSON.stringify({ error: "Serviço indisponível. Tente novamente." }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let studyContent;
    try { studyContent = parseAIJson(content); } catch {
      console.error("JSON parse error:", content.slice(-200));
      return new Response(JSON.stringify({ error: "Erro ao processar resposta." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    studyContent = deepFixMath(studyContent);

    // === CACHE SAVE (24h) ===
    if (cacheKey) {
      serviceClient
        .from('ai_response_cache')
        .upsert({
          cache_key: cacheKey,
          endpoint: 'generate-study-content',
          response: studyContent,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: 'cache_key' })
        .then(() => console.log('[Cache] SAVED', cacheKey!.slice(0, 12)))
        .catch((e: any) => console.error('[Cache] save failed:', e?.message));
    }

    return new Response(JSON.stringify(studyContent), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Erro ao gerar conteúdo." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
