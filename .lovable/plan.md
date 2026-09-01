# Learn Buddy no estilo Astra AI

Objetivo: trazer o que funciona bem na Astra AI (onboarding guiado, foco em prova, estatísticas, resumo simples) para dentro da identidade Learn Buddy, com mais movimento, profundidade e Liquid Glass — sem jargão e com tradução completa nos 9 idiomas.

## 1. Onboarding do estudo (antes de gerar)

Hoje o formulário pede tema, nível e dúvidas de uma vez só. Vira um fluxo curto em 3 passos, com animação de transição entre eles:

```text
Passo 1  ->  Passo 2            ->  Passo 3
Matéria      Objetivo               Detalhes
(chips)      "Só entender" |        tema, nível,
             "Prova em X dias" |    dúvidas, imagem
             "Revisar rápido"
```

- Matérias em chips com ícone: Matemática, Física, Química, Biologia, História, Geografia, Português, Inglês, Redação, Programação, Outra.
- Objetivo "Prova": pede a data da prova e a nota que quer tirar; isso alimenta o plano de estudos e o Modo Prova.
- Tudo continua opcional — dá para pular direto para gerar, como é hoje.

## 2. Modo Prova

- Cartão fixo no topo da Home com contagem regressiva ("Faltam 12 dias"), matéria e meta de nota.
- O plano de estudos gerado passa a respeitar a data real da prova, dividindo os dias até lá.
- Botão "Treinar agora" que gera exercícios da matéria escolhida.

## 3. Resumo em tópicos, sem jargão

- Novo botão de alternância no resultado: "Completo" / "Resumo rápido".
- O resumo rápido é gerado em bullets curtos, linguagem de aluno de 14 anos, com emoji por tópico e zero termo técnico sem explicação.
- Vale para conteúdo de estudo e para os materiais das salas de aula.

## 4. Estatísticas

Painel novo (aba "Progresso") usando o histórico que já é salvo hoje:

- Estudos gerados, exercícios feitos e dias seguidos (streak).
- Matérias mais estudadas, em barras.
- Evolução da semana e tempo estimado de estudo.
- Estados vazios simpáticos quando ainda não há dados.

## 5. Liquid Glass, movimento e profundidade

- Botões: camada de brilho interno, borda de vidro, sombra em duas alturas, leve afundamento ao clicar e brilho que segue o cursor.
- Cards e abas: elevação por camadas, entrada escalonada e transição suave ao trocar de aba.
- Chips e seletores do onboarding com resposta tátil (escala e brilho).
- Tudo respeitando "reduzir movimento" do sistema.

## 6. Qualidade — verificação obrigatória

- Tradução completa dos textos novos nos 9 idiomas (pt-BR, en, es, fr, de, it, ja, zh, ru).
- Conferência de cliques e navegação das telas alteradas no navegador.
- Sem quebra de carregamento e sem aumento do pacote inicial (componentes pesados entram por carregamento sob demanda).
- Validação das entradas novas (data da prova, meta de nota) no cliente e no servidor.
- Revisão de segurança: nenhuma nova tabela sem política de acesso; estatísticas só leem o histórico do próprio usuário.
- Revisão de linguagem: nenhum jargão nas telas e nas respostas da IA.

## Detalhes técnicos

- `src/components/StudyForm.tsx`: refatorado em passos com `framer-motion`, mantendo o autofoco atual e o envio direto.
- `src/types/study.ts` e `StudyFormData`: novos campos `materia`, `objetivo`, `dataProva`, `notaAlvo`, `modoResumo`.
- `supabase/functions/generate-study-content`: aceita os novos campos; prompt de resumo simples e plano ancorado na data da prova. Mantém o pool de chaves Gemini e o modo rápido.
- Estatísticas: novo `src/components/StatsPanel.tsx` + `src/hooks/useStudyStats.ts`, agregando `user_history` no cliente (sem tabela nova).
- Estilo: utilitários novos em `src/index.css` (`liquid-btn`, `depth-card`, brilho de cursor) e variantes novas em `button.tsx` — sem cor fixa, só tokens.
- i18n: chaves novas adicionadas nos 9 arquivos de `src/i18n/locales/`.
