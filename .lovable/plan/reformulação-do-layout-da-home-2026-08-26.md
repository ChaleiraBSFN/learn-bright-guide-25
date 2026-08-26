# Reformulação do layout da home

Objetivo: transformar a home em uma página com narrativa de conversão, mantendo o input de geração como protagonista e sem perder nada do que já funciona (abas, resultados, créditos, anúncios, trilha).

## Nova ordem da página

```text
[ Header (créditos, idioma, menu) ]
[ Avisos (update / engine) ]
[ HERO
   - Promessa curta em 1 linha + subtítulo
   - Input de geração JÁ visível (aba Estudo aberta por padrão)
   - Chips de exemplos rápidos ("Fotossíntese", "Revolução Francesa"...)
]
[ Prova social: nº de estudos gerados, usuários ativos, idiomas ]
[ Abas: Estudo | Exercícios | Plano | Histórico ]
[ "Veja funcionando": 3 blocos interativos (Estudo, Exercícios, Plano) ]
[ Carrossel de recursos ]
[ Comparação Free x Buddy com CTA único ]
[ Slot AdSense + rodapé ]
```

## O que muda

- **Hero novo**: título com promessa clara, subtítulo, e o formulário de geração direto abaixo — sem precisar rolar. Autofocus mantido.
- **Chips de temas sugeridos** abaixo do input: clicar preenche o campo e o usuário só aperta gerar.
- **Faixa de prova social**: números reais vindos do banco (estudos gerados, usuários) com fallback silencioso se a consulta falhar.
- **Seção "Veja funcionando"**: três cartões interativos que expandem mostrando um exemplo curto do resultado de cada modo — reforça valor antes de exigir cadastro.
- **Carrossel** desce para depois das abas (deixa de competir com o input).
- **Comparação de planos** ganha respiro visual e vira o fecho da página, antes do rodapé.
- **Quando há resultado gerado**: hero, prova social e demais seções somem (como já acontece hoje), foco total no conteúdo.

## O que NÃO muda

- Lógica de geração, créditos, Stripe, trilha, anúncios e gates de seção permanecem iguais.
- Nenhuma mudança de backend, exceto uma consulta somente-leitura para os números de prova social.

## Detalhes técnicos

- Novos componentes: `src/components/home/Hero.tsx`, `SocialProof.tsx`, `HowItWorks.tsx` (todos apresentacionais).
- `src/pages/Index.tsx`: reordenação das seções e uso dos novos componentes; `useDeferredMount` continua adiando prova social, carrossel e comparação para não pesar o primeiro paint.
- Estilos só com tokens semânticos existentes (`primary`, `secondary`, `accent`, `buddy`) — sem cores fixas.
- Todo texto novo entra nos 9 idiomas (pt-BR, en, es, fr, de, it, ja, zh, ru).
- Prova social: contagem agregada via consulta de leitura; se vier vazia, a faixa não é renderizada.
