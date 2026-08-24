# Plano Buddy (Premium) + limpeza de anúncios

## 1. Tema (rápido)
Remover o botão de alternar tema da cápsula flutuante (`FloatingActions`). O toggle continua disponível em Configurações. O item no menu do usuário também sai, para ficar em um só lugar.

## 2. Plano Buddy — assinatura via Stripe
Dois níveis: **Free** (padrão) e **Buddy**.

Buddy inclui:
- **Fila prioritária** na geração de conteúdo (processa antes do Free, sem espera atrás da fila comum).
- **+30 créditos por mês**, renovados automaticamente a cada ciclo pago.
- **Desafios exclusivos** na trilha de progresso, marcados com selo Buddy.
- **Personalização** de tema/layout (paletas extras e densidade de layout) nas páginas do usuário.
- **Sem anúncios** em todo o app.
- **Ferramentas de estudo premium** (todas funcionais):
  - Flashcards inteligentes gerados a partir do estudo, com revisão e virada de carta.
  - Resumo automático condensado de qualquer estudo.
  - Quiz builder por IA (monta simulado personalizado e corrige).
  - Analytics de estudo: temas mais estudados, acertos/erros, evolução semanal.

Free mantém: velocidade padrão, ferramentas básicas e limite de créditos atual.

### Ponto importante sobre o preço
R$ 2,00/mês fica **abaixo do mínimo de cobrança da Stripe em BRL (R$ 5,00)**, então uma assinatura mensal de R$ 2 não passa. Opções:
- **A**: R$ 5,90/mês (funciona já).
- **B**: manter a sensação de "R$ 2" com plano **anual de R$ 23,90** (≈ R$ 1,99/mês).
Vou aguardar sua escolha antes de criar o produto; enquanto isso o plano segue igual no resto.

Preços exibidos convertidos por idioma (USD, EUR, GBP/JPY/CNY/RUB conforme locale), com o valor cobrado na moeda configurada na Stripe.

## 3. Banners e comparação de planos
- Adicionar chamada curta de marketing do Buddy em todos os slides do carrossel (`FeatureCarousel`) e no banner principal (`PromoBanners`).
- Novo card de comparação **Free x Buddy** logo abaixo da área de geração de estudo, com lista de benefícios e botão "Virar Buddy".
- Nova página `/buddy` com detalhes do plano, checkout e status da assinatura.

## 4. Limpeza dos anúncios
- Remover a duplicação no rodapé: hoje existe um slot compacto após as abas e outro slot card antes do footer. Fica **apenas um**.
- Remover o componente de anúncio interno do Learn Buddy (vídeos promocionais que apareciam como fallback). Sem preenchimento do Google, o espaço simplesmente não aparece.
- Mercadinho de recompensas continua funcionando, mas sem o bloco de vídeo interno.
- Nenhum anúncio é renderizado para assinantes Buddy.

## 5. Tradução
Todo texto novo (Buddy, comparação, ferramentas premium, checkout) entra nos 9 idiomas.

## Detalhes técnicos
- Pagamentos: integração Stripe gerenciada pela Lovable (requer plano Pro na Lovable). Produto/preço recorrente criado via ferramenta Stripe; `price_id` fixo no código.
- Edge functions: `create-checkout` (modo `subscription`), `check-subscription` (consulta Stripe por e-mail e devolve tier + validade), `customer-portal` (gerenciar/cancelar).
- Banco: reaproveitar `public.subscriptions` (`plan_type`, `status`, `expires_at`), gravada pela `check-subscription` com service role; RLS de leitura só do próprio usuário; GRANTs para `authenticated` e `service_role`.
- Função `is_buddy(_user_id)` SECURITY DEFINER usada por RLS e pelas edge functions de geração para decidir prioridade.
- Hook `useSubscription` (checa no login, no load e a cada 60s) alimentando um gate `<BuddyGate>` para as áreas premium.
- Créditos mensais: RPC `grant_buddy_monthly_credits` idempotente por ciclo, chamada após confirmação da assinatura.
- Prioridade de geração: parâmetro de prioridade nas funções de geração usando o pool de chaves Gemini existente, servindo Buddy primeiro.
- Novos componentes: `PlanComparison`, `BuddyBadge`, `Flashcards`, `AutoSummary`, `QuizBuilder`, `StudyAnalytics`; nova página `Buddy.tsx`.
