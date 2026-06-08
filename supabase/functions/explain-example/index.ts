import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const requestSchema = z.object({
  exemplo: z.string().min(1).max(5000),
  contexto: z.string().nullable().optional().transform(v => v || ""),
  idioma: z.string().nullable().optional().transform(v => v || "pt-BR"),
  tema: z.string().nullable().optional().transform(v => v || ""),
  nivel: z.string().nullable().optional().transform(v => v || ""),
});

const sanitize = (str: string): string => str.replace(/[<>]/g, '').trim();

// === Sanitização matemática: corrige notações erradas vindas da IA ===
// ^2, ^3 → ², ³ ; remove $...$ do LaTeX; normaliza \(...\) e \[...\]
const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', 'n': 'ⁿ', 'i': 'ⁱ',
};
const SUBSCRIPT_MAP: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
};
function toSuperscript(s: string): string {
  return s.split('').map(c => SUPERSCRIPT_MAP[c] ?? c).join('');
}
function toSubscript(s: string): string {
  return s.split('').map(c => SUBSCRIPT_MAP[c] ?? c).join('');
}
function fixMathNotation(text: string): string {
  if (!text) return text;
  let out = text;
  // Remove blocos LaTeX: $$...$$ e $...$ (mantém o conteúdo)
  out = out.replace(/\$\$([\s\S]+?)\$\$/g, '$1');
  out = out.replace(/\$([^\$\n]+?)\$/g, '$1');
  // \(...\) e \[...\] → mantém conteúdo
  out = out.replace(/\\\(([\s\S]+?)\\\)/g, '($1)');
  out = out.replace(/\\\[([\s\S]+?)\\\]/g, '($1)');
  // \cdot \times \div \pm
  out = out.replace(/\\cdot/g, '·').replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\\pm/g, '±');
  // \sqrt{x} → √(x)
  out = out.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');
  // \frac{a}{b} → (a)/(b)
  out = out.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');
  // x^{abc} ou x^{2}
  out = out.replace(/\^\{([^{}]+)\}/g, (_m, g1) => toSuperscript(g1));
  // x^2, x^23, x^-1, x^(2)
  out = out.replace(/\^\(([^()]+)\)/g, (_m, g1) => toSuperscript(g1));
  out = out.replace(/\^([0-9+\-n]+)/g, (_m, g1) => toSuperscript(g1));
  // Subscritos x_{12}, x_2
  out = out.replace(/_\{([0-9]+)\}/g, (_m, g1) => toSubscript(g1));
  out = out.replace(/_([0-9])/g, (_m, g1) => toSubscript(g1));
  // Restos: remover backslashes órfãos antes de letras (\alpha continua, mas $ já foi removido)
  return out;
}

async function tryModel(model: string, prompt: string, apiKey: string, signal: AbortSignal): Promise<{ text: string | null; status: number }> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
        }),
        signal,
      }
    );
    if (!response.ok) {
      console.log(`[Gemini] ${model} HTTP ${response.status}`);
      return { text: null, status: response.status };
    }
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const finishReason = data.candidates?.[0]?.finishReason;
    if (text) {
      console.log(`[Gemini] ${model} responded (finish=${finishReason}, len=${text.length})`);
      return { text, status: 200 };
    }
    return { text: null, status: 502 };
  } catch (e: any) {
    if (e.name !== 'AbortError') console.error(`[Gemini] ${model}:`, e.message);
    return { text: null, status: 0 };
  }
}

async function callGeminiCascade(prompt: string, apiKey: string): Promise<{ text: string | null; lastStatus: number }> {
  const models = ["gemini-2.5-flash-lite", "gemini-2.0-flash-lite", "gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-flash", "gemini-1.5-pro"];
  let lastStatus = 0;
  for (const model of models) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    try {
      const { text, status } = await tryModel(model, prompt, apiKey, controller.signal);
      if (text) return { text, lastStatus: 200 };
      lastStatus = status;
      // Only keep going on 429/5xx; for other errors break early
      if (status !== 429 && status < 500) break;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  return { text: null, lastStatus };
}


const toAnonUuid = async (input: string): Promise<string> => {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Rate limit per IP / user
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
        _user_id: rateLimitId, _endpoint: 'explain-example', _max_requests: userId ? 300 : 900, _window_minutes: 1
      });
      if (isAllowed === false) {
        return new Response(JSON.stringify({ error: 'Muitas requisições ao mesmo tempo. Tente novamente em alguns segundos.' }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "2" } });
      }
    } catch (e) { console.error('[explain-example] rate-limit error', e); }


    const rawBody = await req.json();
    const validationResult = requestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: 'Dados inválidos.' }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { exemplo, contexto, idioma, tema, nivel } = validationResult.data;
    
    const langMap: Record<string, string> = {
      'pt-BR': 'português brasileiro', 'en': 'English', 'es': 'español',
      'fr': 'français', 'de': 'Deutsch', 'it': 'italiano',
      'zh': '中文', 'ja': '日本語', 'ru': 'русский',
    };
    const langName = langMap[idioma || 'pt-BR'] || 'português brasileiro';

    // Adaptação por nível de ensino — com foco especial em Ensino Médio
    const nivelNorm = (nivel || "").toLowerCase();
    let nivelInstrucao = "";
    if (nivelNorm.includes("fundamental") && (nivelNorm.includes("1") || nivelNorm.includes("inicial") || nivelNorm.includes("anos iniciais"))) {
      nivelInstrucao = `NÍVEL: Ensino Fundamental I (crianças 6-10 anos).
- Use linguagem MUITO simples, frases curtas, vocabulário cotidiano.
- Use analogias com brinquedos, animais, comida, escola.
- Evite jargões. Se usar uma palavra técnica, explique com "isso é como quando...".
- Tom: amigável, encorajador, divertido.`;
    } else if (nivelNorm.includes("fundamental")) {
      nivelInstrucao = `NÍVEL: Ensino Fundamental II (11-14 anos).
- Linguagem clara e acessível, mas pode introduzir termos técnicos com definição.
- Use comparações com situações do dia a dia do adolescente (jogos, redes sociais, esportes).
- Mostre o "porquê" das coisas, conecte com curiosidades.`;
    } else if (nivelNorm.includes("superior") || nivelNorm.includes("graduacao") || nivelNorm.includes("graduação") || nivelNorm.includes("universit")) {
      nivelInstrucao = `NÍVEL: Ensino Superior / Graduação.
- Use rigor técnico e vocabulário acadêmico apropriado.
- Aprofunde em fundamentação teórica, demonstre formalmente quando aplicável.
- Cite autores, escolas de pensamento, equações, modelos formais.
- Discuta nuances, exceções e debates atuais da área.`;
    } else if (nivelNorm.includes("pos") || nivelNorm.includes("pós") || nivelNorm.includes("mestrado") || nivelNorm.includes("doutorado")) {
      nivelInstrucao = `NÍVEL: Pós-graduação.
- Profundidade máxima: pressupostos, derivações, controvérsias, fronteira da pesquisa.
- Cite literatura clássica e recente, mencione metodologias e limitações.`;
    } else {
      // Padrão e foco principal: ENSINO MÉDIO
      nivelInstrucao = `NÍVEL: Ensino Médio (15-18 anos) — FOCO PRINCIPAL.
- Profundidade ALTA, mas com linguagem clara e organizada.
- Explique TODO conceito técnico ao introduzi-lo (definição + intuição + exemplo).
- Conecte com vestibular/ENEM quando relevante: cite como o tema costuma ser cobrado.
- Use analogias inteligentes (não infantis) e mostre as relações com outras disciplinas (interdisciplinaridade).
- Apresente o raciocínio passo a passo, mostrando POR QUE cada etapa funciona, não só O QUE fazer.
- Inclua: contexto histórico breve quando útil, fórmula/regra geral, exemplo aplicado, armadilhas comuns, e dica de memorização.`;
    }

    const prompt = `Você é professor(a) especialista em ${tema || contexto || "o tema"}. Explique o exemplo de forma clara e útil.

${nivelInstrucao}

CONTEXTO: ${sanitize(contexto || "")}
TEMA: ${sanitize(tema || "")}
EXEMPLO: ${sanitize(exemplo)}

Responda em ${langName} usando EXATAMENTE estas 5 seções com Markdown leve. CADA seção tem um TÍTULO em negrito (**) seguido de BULLETS curtos (cada um começando com "- "). NUNCA escreva parágrafos longos — sempre quebre em bullets de no máximo 2 linhas cada.

**🎯 O que está acontecendo**
- 1 bullet com a ideia geral em 1 frase.
- 1 bullet apontando o conceito central.

**🧠 Conceito-chave**
- Definição do termo principal em 1 frase.
- A fórmula ou regra (se houver), isolada em sua própria linha.
- Por que ela funciona (1 frase).

**🔍 Passo a passo**
- Etapa 1: ação + cálculo curto.
- Etapa 2: ação + cálculo curto.
- Etapa 3: ação + cálculo curto.
- (acrescente até 5 etapas se necessário, sempre 1 linha cada)

**💡 Exemplo numérico rápido**
- Substituição dos valores em 1 linha.
- Resultado final destacado em 1 linha.

**⚠️ Dica final**
- 1 armadilha comum em 1 frase.
- 1 conexão prática (ENEM/dia a dia) em 1 frase.

REGRAS DE FORMATAÇÃO (OBRIGATÓRIO):
- SEMPRE use "- " no início de cada bullet (jamais frases sem bullet dentro de uma seção).
- NUNCA use parágrafos corridos — tudo em bullets curtos.
- Deixe UMA linha em branco entre o título da seção e o primeiro bullet, e entre seções.
- Mantenha cada bullet com no máximo 2 linhas / ~20 palavras.

REGRAS DE NOTAÇÃO MATEMÁTICA (OBRIGATÓRIO):
- NUNCA use LaTeX. NUNCA escreva "$", "$$", "\\(", "\\)", "\\[", "\\]".
- Para potências use Unicode direto: x², x³, x⁴, x⁵, xⁿ (NUNCA "x^2", "x**2", "x^{2}").
- Para subscritos use Unicode: x₁, x₂, H₂O.
- Raiz quadrada: √(x). Fração: (a)/(b) ou a/b. Multiplicação: × ou ·. Divisão: ÷.
- Use parênteses normais ( e ), nunca "$" como delimitador.
- Símbolos: π, θ, α, β, Δ, ≤, ≥, ≠, ≈, ∞.

OUTRAS REGRAS: idioma ${langName}; sem blocos \`\`\`; comece direto pela primeira seção.`;

    const geminiKeys = [
      Deno.env.get("GOOGLE_GEMINI_API_KEY"),
      Deno.env.get("GOOGLE_GEMINI_API_KEY_2"),
      Deno.env.get("GOOGLE_GEMINI_API_KEY_3"),
      Deno.env.get("GOOGLE_GEMINI_API_KEY_4"),
      Deno.env.get("GOOGLE_GEMINI_API_KEY_5"),
    ].filter(Boolean) as string[];
    geminiKeys.sort(() => Math.random() - 0.5);
    let content: string | null = null;
    let lastStatus = 0;

    for (const key of geminiKeys) {
      const result = await callGeminiCascade(prompt, key);
      content = result.text;
      lastStatus = result.lastStatus;
      if (content) break;
      console.log(`[Explain] Key failed (status ${lastStatus}), rotating...`);
    }

    if (!content) {
      const isRate = lastStatus === 429;
      return new Response(
        JSON.stringify({ error: isRate ? "Limite de requisições excedido. Aguarde alguns instantes." : "Serviço indisponível." }),
        { status: isRate ? 429 : 503, headers: { ...corsHeaders, "Content-Type": "application/json", ...(isRate ? { "Retry-After": "2" } : {}) } }
      );
    }

    const cleaned = fixMathNotation(content.trim());
    return new Response(JSON.stringify({ explicacao: cleaned }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Erro ao gerar explicação." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
