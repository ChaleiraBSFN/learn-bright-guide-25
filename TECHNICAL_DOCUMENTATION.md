# Learn Buddy - Documentação Técnica Completa

## 📋 Visão Geral

**Learn Buddy** é uma plataforma de geração de conteúdo de estudo personalizado usando Inteligência Artificial. O sistema gera materiais educacionais completos incluindo resumos, exercícios, mapas mentais, planos de estudo, vídeos recomendados e imagens ilustrativas.

### Tecnologias Utilizadas

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Estilização | Tailwind CSS + shadcn/ui |
| Backend | Supabase (Edge Functions + PostgreSQL) |
| Autenticação | Supabase Auth |
| Pagamentos | Stripe + PIX (manual) |
| E-mails | Resend |
| IA | OpenRouter (Gemini 2.5 Flash/Flash Lite) |
| Internacionalização | i18next (PT-BR, EN, ES) |

---

## 🚀 Instalação Local

### Pré-requisitos

- Node.js 18+ 
- npm ou bun
- Conta Supabase
- Conta Stripe
- Conta Resend
- Conta OpenRouter

### Passos

```bash
# 1. Clone o repositório
git clone <URL_DO_REPOSITORIO>
cd learn-buddy

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente (ver seção abaixo)

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

---

## 🔐 Configuração de Secrets

### Variáveis de Ambiente Frontend (.env)

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=seu-projeto-id
```

### Secrets do Supabase (Edge Functions)

Configure estas secrets no painel do Supabase em **Settings > Edge Functions > Secrets**:

| Secret Name | Descrição | Como Obter |
|-------------|-----------|------------|
| `STRIPE_SECRET_KEY` | Chave secreta do Stripe | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) → Secret key |
| `RESEND_API_KEY` | API Key do Resend | [Resend Dashboard](https://resend.com/api-keys) → Create API Key |
| `LOVABLE_API_KEY` | Chave da Lovable AI | Fornecida automaticamente pelo Lovable |
| `SUPABASE_URL` | URL do projeto Supabase | Settings > API > Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Settings > API > service_role (secret) |

---

## 💳 Configuração do Stripe

### 1. Criar Produtos e Preços

No [Stripe Dashboard](https://dashboard.stripe.com/products), crie:

#### Assinatura Premium (2 meses)
| Moeda | Valor | Price ID |
|-------|-------|----------|
| BRL | R$ 10,00 | `price_1QoqpeFbwqVoaIc9R5QwO1a4` |
| USD | $2.50 | `price_1Qoqr3FbwqVoaIc9V6GiFMN9` |
| EUR | €1.29 | `price_1QoqskFbwqVoaIc9gJyuQfvd` |

#### Compras Avulsas (por funcionalidade)
| Funcionalidade | BRL | USD | EUR |
|----------------|-----|-----|-----|
| Vídeos Recomendados | R$ 1,99 | $0.79 | €0.29 |
| Imagens IA | R$ 1,99 | $0.79 | €0.29 |
| Plano de Estudo | R$ 1,99 | $0.79 | €0.29 |

**Atualize os Price IDs** nos arquivos:
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/create-feature-checkout/index.ts`

### 2. Configurar Webhooks (Opcional)

Se quiser usar webhooks ao invés de verificação manual:
1. Vá em Developers > Webhooks
2. Adicione endpoint: `https://seu-projeto.supabase.co/functions/v1/stripe-webhook`
3. Selecione eventos: `checkout.session.completed`

---

## 📧 Configuração do Resend

### 1. Verificar Domínio

1. Acesse [Resend Domains](https://resend.com/domains)
2. Adicione seu domínio (ex: `seudominio.com.br`)
3. Configure os registros DNS conforme instruído
4. Aguarde verificação

### 2. E-mails Configurados

O sistema envia e-mails para:
- **Admin** (`learnbuddyco@proton.me`): Notificações de novos comprovantes PIX
- **Usuários**: Confirmação de upload de comprovante

Atualize o e-mail do admin em:
- `supabase/functions/notify-pix-upload/index.ts`
- `supabase/functions/notify-support-request/index.ts`

---

## 🤖 Configuração da IA (OpenRouter)

### Modelos Utilizados

| Usuário | Modelo | Custo |
|---------|--------|-------|
| Gratuito | `google/gemini-2.5-flash-lite` | Mais barato |
| Premium | `google/gemini-2.5-flash` | Melhor qualidade |

### Obter API Key

1. Acesse [OpenRouter](https://openrouter.ai/keys)
2. Crie uma nova API key
3. Adicione créditos à conta
4. Configure como secret `LOVABLE_API_KEY` no Supabase

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

```sql
-- Perfis de usuários
profiles (id, user_id, email, display_name, avatar_url, created_at, updated_at)

-- Assinaturas
subscriptions (id, user_id, plan_type, status, starts_at, expires_at, pix_payment_proof)

-- Compras avulsas
feature_purchases (id, user_id, feature_type, study_topic, status, stripe_payment_id)

-- Controle de acesso
user_roles (id, user_id, role) -- role: 'admin' | 'user'

-- Analytics
site_visits (id, session_id, user_id, user_email, started_at, ended_at, duration_seconds, page_views, search_queries)

-- Rate limiting
rate_limits (id, user_id, endpoint, request_count, window_start)

-- Suporte
support_messages (id, user_id, admin_id, message, is_admin_reply, created_at)
```

### Funções RPC

- `create_pending_subscription()` - Cria assinatura pendente
- `approve_subscription(_subscription_id)` - Admin aprova assinatura
- `approve_feature_purchase(_purchase_id)` - Admin aprova compra avulsa
- `has_feature_access(_user_id, _feature_type, _study_topic)` - Verifica acesso
- `track_site_visit(_session_id, _user_agent, _search_query)` - Rastreia visitas
- `get_site_analytics()` - Retorna analytics (admin)
- `has_role(_user_id, _role)` - Verifica papel do usuário

---

## 📁 Estrutura de Arquivos

```
learn-buddy/
├── src/
│   ├── assets/              # Imagens e logos
│   ├── components/
│   │   ├── ui/              # Componentes shadcn/ui
│   │   ├── sections/        # Seções do resultado de estudo
│   │   ├── StudyForm.tsx    # Formulário principal
│   │   ├── StudyResult.tsx  # Exibição dos resultados
│   │   ├── SupportChat.tsx  # Chat de suporte
│   │   └── ...
│   ├── hooks/
│   │   ├── useAuth.tsx      # Autenticação
│   │   ├── useSubscription.tsx  # Status de assinatura
│   │   ├── useAdmin.ts      # Verificação de admin
│   │   └── ...
│   ├── i18n/
│   │   ├── index.ts         # Configuração i18next
│   │   └── locales/         # Arquivos de tradução (pt-BR, en, es)
│   ├── integrations/
│   │   └── supabase/        # Cliente e tipos Supabase
│   ├── pages/
│   │   ├── Index.tsx        # Página principal
│   │   ├── Auth.tsx         # Login/Cadastro
│   │   ├── Subscribe.tsx    # Página de assinatura
│   │   ├── Admin.tsx        # Painel admin
│   │   └── ...
│   └── types/
│       └── study.ts         # Tipos do conteúdo de estudo
├── supabase/
│   ├── functions/           # Edge Functions
│   │   ├── generate-study-content/  # Geração de conteúdo IA
│   │   ├── create-checkout/         # Checkout Stripe
│   │   ├── verify-stripe-payment/   # Verificação de pagamento
│   │   └── ...
│   └── config.toml          # Configuração Supabase
└── ...
```

---

## 🚢 Deploy

### Deploy Frontend (Lovable)

1. No Lovable, clique em **Share > Publish**
2. Configure domínio personalizado em **Settings > Domains**

### Deploy Frontend (Self-Hosted)

```bash
# Build de produção
npm run build

# O output estará em dist/
# Deploy para Vercel, Netlify, ou qualquer servidor estático
```

### Deploy Edge Functions

As Edge Functions são deployadas automaticamente pelo Lovable/Supabase.

Para deploy manual:
```bash
supabase functions deploy generate-study-content
supabase functions deploy create-checkout
# ... outras funções
```

---

## 👤 Configurar Primeiro Admin

1. Crie uma conta no sistema
2. No Supabase SQL Editor, execute:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('UUID_DO_USUARIO', 'admin');
```

---

## 🔧 Manutenção

### Limpar Rate Limits Antigos

```sql
SELECT cleanup_old_rate_limits();
```

### Verificar Assinaturas Expiradas

```sql
UPDATE subscriptions 
SET status = 'expired' 
WHERE status = 'active' AND expires_at < now();
```

---

## 📞 Suporte

- **E-mail Admin**: learnbuddyco@proton.me
- **Domínio de E-mails**: studdybuddy.com.br

---

## 📄 Licença

Código proprietário - Todos os direitos reservados.

---

## 💰 Monetização

### Modelo Freemium

| Recurso | Gratuito | Premium |
|---------|----------|---------|
| Objetivo | ✅ | ✅ |
| Resumo | ✅ | ✅ |
| Passo a Passo | ✅ | ✅ |
| Exercícios | ✅ | ✅ |
| Erros Comuns | ✅ | ✅ |
| Mapa Mental | ✅ | ✅ |
| Fontes | ✅ | ✅ |
| Vídeos Recomendados | ❌ | ✅ |
| Imagens IA | ❌ | ✅ |
| Plano de Estudo | ❌ | ✅ |

### Rate Limits

| Tipo | Limite |
|------|--------|
| Anônimo | 1 pesquisa/hora |
| Logado Gratuito | 3 pesquisas/hora |
| Premium | 15 pesquisas/hora |

---

*Documentação gerada em Janeiro 2026*
