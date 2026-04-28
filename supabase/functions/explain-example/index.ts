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
          generationConfig: { temperature: 0.6, maxOutputTokens: 3000 },
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
  // Race several fast models in parallel — first non-null wins
  const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];
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

    const prompt = `Você é um(a) professor(a) especialista em ${tema || contexto || "o tema em questão"}, com domínio profundo do conteúdo e experiência didática comprovada.

Sua tarefa: produzir uma EXPLICAÇÃO APROFUNDADA E COMPLETA do exemplo prático abaixo, indo MUITO além da superfície. O aluno quer realmente ENTENDER, não só decorar.

${nivelInstrucao}

CONTEXTO DO ASSUNTO: ${sanitize(contexto || "")}
TEMA GERAL: ${sanitize(tema || "")}

EXEMPLO PRÁTICO A EXPLICAR:
${sanitize(exemplo)}

ESTRUTURA OBRIGATÓRIA da sua resposta (use estes títulos em negrito com **). Cada seção deve ser SUBSTANCIAL — parágrafos densos, não frases soltas:

**🎯 O que está acontecendo aqui**
Em 3-4 frases ricas: o que o exemplo mostra, qual conceito central ilustra, qual problema ele resolve no mundo real, e por que vale a pena entender isso.

**🧠 Conceito por trás (a teoria completa)**
APROFUNDE MUITO. Defina TODOS os termos técnicos com precisão. Apresente a regra/lei/fórmula/princípio que governa o exemplo, explicando sua origem e fundamentação. Se houver fórmula, explique cada símbolo, sua unidade, e o significado físico/conceitual. Mencione condições de validade, hipóteses assumidas e limites de aplicação. Cite o(s) cientista(s)/pensador(es) ou escola que desenvolveu o conceito, com data aproximada e contexto histórico breve. Se for área de humanas, traga o debate teórico, autores divergentes e as principais correntes. Vá fundo: 2-3 parágrafos densos no mínimo.

**🔍 Passo a passo MICRO-detalhado**
Quebre o exemplo em etapas numeradas pequenas. Para CADA etapa explique:
- O QUE está sendo feito (a ação)
- POR QUE está sendo feito (a justificativa lógica/matemática/conceitual)
- COMO chegamos ao resultado (mostre a operação, a transformação, o raciocínio)
- Que princípio teórico da seção anterior está sendo aplicado ali
NÃO pule passos triviais — assuma que o aluno está vendo isso pela primeira vez. Se houver cálculo, mostre a aritmética intermediária. Se for argumento, mostre a inferência.

**💡 Intuição profunda e analogia**
Construa uma analogia rica e fiel do dia a dia que faça o conceito "clicar". Depois explique POR QUE a analogia funciona (em que aspectos ela é correta) e ONDE ela falha (limites). Acrescente uma segunda forma de visualizar (geométrica, gráfica, narrativa).

**🧩 Variações e casos extremos**
Mostre o que aconteceria se mudássemos um parâmetro do exemplo: e se o valor fosse zero? negativo? muito grande? E se uma hipótese falhasse? Isso fixa o entendimento real.

**⚠️ Armadilhas e erros comuns**
Liste 3-4 erros frequentes que estudantes cometem com esse tipo de exemplo, com explicação clara de POR QUE são erros e como evitá-los. Inclua confusões conceituais clássicas.

**🔗 Conexões, aplicações e aprofundamento**
Mostre como esse conceito se conecta com OUTROS tópicos da mesma matéria, com OUTRAS disciplinas (interdisciplinaridade real), e com aplicações práticas (tecnologia, ciência, vida cotidiana, mercado de trabalho). Se for nível médio/superior, explique COMO esse conteúdo cai em ENEM/vestibular/concursos — cite tipos de questão e pegadinhas comuns. Por fim, sugira 2-3 fontes GRATUITAS e confiáveis, escolhidas conforme o tema (ex.: Khan Academy, Brasil Escola, Mundo Educação, Stoodi, SciELO, Wikipedia em português, OpenStax, MIT OpenCourseWare, canais como Me Salva!, Curso em Vídeo, Física Total, Equaciona, Débora Aladim, Professor Ferretto), com indicação do que buscar em cada uma.

REGRAS CRÍTICAS:
- Responda INTEIRAMENTE no idioma: ${langName}.
- Use Markdown: **negrito** para destaques, listas com - quando útil, quebras de linha entre seções.
- NÃO use blocos de código (\`\`\`) nem código de programação a menos que o tema seja explicitamente programação.
- Seja MUITO GENEROSO em profundidade — o aluno PEDIU explicação MUITO mais aprofundada. NÃO ECONOMIZE em conteúdo. Cada seção deve ter substância real.
- Mas seja CLARO — profundidade sem clareza não ensina nada. Use frases bem construídas, não enrole.
- Use números concretos, datas, nomes, exemplos reais sempre que possível.
- Mire em uma resposta longa e densa (use o espaço disponível).

Comece sua resposta DIRETAMENTE com a primeira seção (não escreva introduções como "Claro!" ou "Vamos lá").`;

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
