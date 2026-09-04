# Estudo em chat, barra inferior Liquid Glass e nova aba de conta

Reformulação da experiência de estudo (site e salas de aula) com layouts separados para celular e computador, inspirada nas telas enviadas.

## 1. Barra de progresso da geração

- Nova barra Liquid Glass com profundidade (vidro fosco, brilho interno, sombra) que preenche de 0% a 100% durante a geração, com etapas nomeadas ("Entendendo o tema", "Montando tópicos", "Criando exemplos", "Finalizando").
- Substitui a animação atual pesada; progresso realista baseado nas etapas reais da geração, sem travar em 99%.

## 2. Estudo com chat de continuação

- O conteúdo gerado continua aparecendo como hoje, e abaixo dele entra um campo de conversa: o aluno pode perguntar sobre aquele estudo.
- Sugestões prontas de pergunta (ex.: "Quero tentar um exercício", "Não entendi essa parte", "Me dá outro exemplo"), como nas imagens.
- Cada resposta mantém o contexto do estudo gerado. Mesmo recurso dentro das salas de aula.

## 3. Formatação do conteúdo (sem jargão, em tópicos)

- Blocos em cards com título curto + ícone (Definição, Exemplo Prático, Atenção, Resumo), no estilo das imagens.
- Fim das linhas coloridas na borda no celular: cards com fundo suave e respiro maior, texto não fica espremido.
- Correção das fórmulas quebradas (ex.: "EcE_cEc"): renderização matemática correta e sem duplicação do nome da variável.
- Prompt reescrito: proibido parágrafo denso e jargão; obrigatório tópicos curtos, exemplo passo a passo e pergunta final.

## 4. Página inicial mais clara

- Cada botão/aba ganha rótulo + uma linha explicando o que faz.
- No formulário de criação: escolha da matéria em destaque e perguntas de intenção ("O que você quer com esse assunto?": entender do zero, revisar para prova, resolver exercícios, tirar dúvida pontual), que ajustam o conteúdo gerado.

## 5. Barra inferior Liquid Glass (celular) e novo layout de desktop

- Celular: some com a coluna de botões da direita; entra uma barra inferior flutuante em vidro (Perguntar / Estudos / Provas / Conta), com gesto para expandir (mostra todos os atalhos: trilha, mercadinho, comunidade, grupos, salas, instalar) e recolher.
- Computador: layout próprio, com barra lateral/superior em vidro, mesma navegação e conteúdo, aproveitando a largura.

## 6. Nova aba "Conta"

Reúne, em uma tela só:
- Currículo e estatísticas (matérias estudadas, tempo, precisão, gráficos).
- Trilha de progresso e ranking (movidos para cá).
- Criar prova: tela dedicada com especificações (matéria, assunto, nº de questões, dificuldade, tipo objetiva/discursiva, tempo), no estilo da foto enviada.

## 7. Traduções e verificação final

- Todo texto novo entra nos 9 idiomas.
- Depois de construir: varredura de erros de build/console, teste de cliques em todos os botões e abas, geração de conteúdo real, geração dentro da sala de aula, checagem de texto vazando para fora, botões fora do lugar e desempenho de carregamento, em celular e desktop.

## Detalhes técnicos

- `GeneratingOverlay.tsx` → nova barra com etapas; tokens de vidro em `index.css` (`--glass-*`, blur, inset shadow).
- Novo `StudyChat.tsx` + edge function de follow-up reutilizando o pool Gemini, recebendo o estudo como contexto; mesma peça em `ClassroomMaterialView.tsx`.
- `FormattedExplanation.tsx` e `src/components/sections/*`: remoção das bordas coloridas no mobile, cards com ícone, correção do render de fórmulas.
- `FloatingActions.tsx` dividido: `MobileDock.tsx` (barra inferior expansível, framer-motion) e `DesktopRail.tsx`.
- Nova rota/aba `Conta` agregando `StatsPanel`, `ProgressTrail`, `RankingDialog` e um novo `ExamBuilder.tsx` sobre `src/lib/examMode.ts`.
- Prompts ajustados em `generate-study-content` (e equivalente das salas) para tópicos, exemplos e pergunta final.
