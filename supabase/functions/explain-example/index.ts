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
  out = out.replace(/\\\(([\s\S]+?)\\\)/g, '$1');
  out = out.replace(/\\\[([\s\S]+?)\\\]/g, '$1');
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

async function tryModel(model: string, prompt: string, apiKey: string, signal: AbortSignal): Promise<string | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 1100 },
        }),
        signal,
      }
    );
    if (!response.ok) {
      console.log(`[Gemini] ${model} HTTP ${response.status}`);
      return null;
    }
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      console.log(`[Gemini] ${model} responded first`);
      return text;
    }
    return null;
  } catch (e: any) {
    if (e.name !== 'AbortError') console.error(`[Gemini] ${model}:`, e.message);
    return null;
  }
}

async function callGeminiRace(prompt: string, apiKey: string): Promise<string | null> {
  // Alvo: até ~3s. Modelo único mais rápido com timeout curto.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);
  try {
    return await tryModel("gemini-2.5-flash-lite", prompt, apiKey, controller.signal);
  } finally {
    clearTimeout(timeoutId);
  }
}


serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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

Responda em ${langName} usando EXATAMENTE estas 4 seções com Markdown (** para títulos), curtas e objetivas:

**🎯 O que está acontecendo**
2-3 frases: o que mostra e o conceito central.

**🧠 Ideia principal**
Defina o termo-chave, a fórmula/regra (se houver) e por que funciona. 3-4 frases.

**🔍 Passo a passo**
3-5 etapas curtas e numeradas, com cálculos quando houver.

**⚠️ Dica final**
1 armadilha comum + 1 conexão (ENEM/dia a dia).

REGRAS DE NOTAÇÃO MATEMÁTICA (OBRIGATÓRIO):
- NUNCA use LaTeX. NUNCA escreva "$", "$$", "\\(", "\\)", "\\[", "\\]".
- Para potências use Unicode direto: x², x³, x⁴, x⁵, xⁿ (NUNCA "x^2", "x**2", "x^{2}").
- Para subscritos use Unicode: x₁, x₂, H₂O.
- Raiz quadrada: √(x). Fração: (a)/(b) ou a/b. Multiplicação: × ou ·. Divisão: ÷.
- Use parênteses normais ( e ), nunca "$" como delimitador.
- Símbolos: π, θ, α, β, Δ, ≤, ≥, ≠, ≈, ∞.

OUTRAS REGRAS: idioma ${langName}; sem blocos \`\`\`; frases claras e diretas. Comece direto pela primeira seção.`;

REGRAS: idioma ${langName}; sem blocos \`\`\`; profundidade alta mas frases claras; números/datas/nomes concretos. Comece direto pela primeira seção.`;

    const geminiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    let content: string | null = null;

    if (geminiKey) {
      content = await callGeminiRace(prompt, geminiKey);
    }

    if (!content) {
      return new Response(JSON.stringify({ error: "Serviço indisponível." }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ explicacao: content.trim() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Erro ao gerar explicação." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
