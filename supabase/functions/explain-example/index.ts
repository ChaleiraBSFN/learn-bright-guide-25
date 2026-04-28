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

async function tryModel(model: string, prompt: string, apiKey: string, signal: AbortSignal): Promise<string | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 1800 },
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
  // Race: o mais rápido (lite) primeiro, e flash como backup paralelo
  const models = ["gemini-2.5-flash-lite", "gemini-2.0-flash"];
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const promises = models.map(m => tryModel(m, prompt, apiKey, controller.signal));
    // Promise.any resolves on first fulfilled with truthy value
    const result = await new Promise<string | null>((resolve) => {
      let pending = promises.length;
      promises.forEach(p => {
        p.then(r => {
          if (r) {
            controller.abort(); // cancel the others
            resolve(r);
          } else {
            pending--;
            if (pending === 0) resolve(null);
          }
        }).catch(() => {
          pending--;
          if (pending === 0) resolve(null);
        });
      });
    });
    return result;
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

    const prompt = `Você é professor(a) especialista em ${tema || contexto || "o tema"}. Explique APROFUNDADAMENTE o exemplo abaixo.

${nivelInstrucao}

CONTEXTO: ${sanitize(contexto || "")}
TEMA: ${sanitize(tema || "")}
EXEMPLO: ${sanitize(exemplo)}

Responda em ${langName} usando EXATAMENTE estas 7 seções com Markdown (** para títulos), cada uma densa e substancial:

**🎯 O que está acontecendo**
3-4 frases ricas: o que mostra, conceito central, problema que resolve, por que importa.

**🧠 Teoria por trás**
Defina termos técnicos. Apresente regra/lei/fórmula com origem e fundamentação. Se houver fórmula, explique cada símbolo e unidade. Mencione condições de validade. Cite cientista/pensador com data/contexto histórico breve. Mínimo 2 parágrafos densos.

**🔍 Passo a passo**
Etapas numeradas. Para cada uma: O QUE + POR QUE + COMO + qual princípio aplica. Mostre cálculos intermediários ou inferências.

**💡 Intuição e analogia**
Analogia rica do dia a dia. Explique por que funciona e onde falha. Adicione uma segunda forma de visualizar.

**🧩 Variações e casos extremos**
E se o valor fosse zero, negativo, muito grande? E se uma hipótese falhasse?

**⚠️ Armadilhas comuns**
3-4 erros frequentes com explicação do PORQUÊ são erros e como evitar.

**🔗 Conexões e fontes**
Conexões com outros tópicos e disciplinas. Aplicações práticas. Como cai em ENEM/vestibular (se aplicável). 2-3 fontes GRATUITAS confiáveis (Khan Academy, Brasil Escola, Mundo Educação, Stoodi, SciELO, Wikipedia, Me Salva!, Curso em Vídeo, Física Total, Equaciona, Professor Ferretto etc.) com o que buscar em cada.

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
