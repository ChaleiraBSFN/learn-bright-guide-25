# Plano: Anúncios recompensados + Admin toggle de seções

## Parte 1 — Sistema de anúncios (Google AdSense)

### Fluxo do usuário
1. Novo ícone flutuante "mercadinho" (`ShoppingBag`) abaixo da trilha de progresso, ao lado dos outros FABs.
2. Clique abre modal **RewardShopModal** com card "Ganhe 25 créditos assistindo um anúncio" mostrando contador diário (X/3 usados).
3. Ao clicar "Assistir anúncio":
   - Carrega slot AdSense (display/video) num container do modal.
   - Timer de 20s obrigatório (barra de progresso, botão bloqueado).
   - Ao completar, chama edge function `claim-ad-reward` → valida limite diário → adiciona 25 créditos.
4. Toast "+25 créditos!" e modal fecha.

### Backend
**Nova tabela `ad_rewards`** (registra cada anúncio assistido, usado como limite diário):
```
id, user_id, watched_at (timestamptz default now()), credits_granted int default 25
```
+ RLS: usuário vê os seus; service_role tudo. GRANTs padrão.

**Edge function `claim-ad-reward`**:
- Valida JWT (auth do usuário).
- Conta linhas em `ad_rewards` do user nas últimas 24h.
- Se `>= 3` → 429 "Limite diário atingido".
- Insere linha + chama `add_credits(_user_id, 25)`.
- Retorna `{ credits_remaining, used_today, limit: 3 }`.
- Rate limit anti-abuso: exige mínimo de 18s desde a última chamada do mesmo user.

### AdSense
- Adicionar `<script async src="pagead2.googlesyndication.com/...client=ca-pub-XXX">` no `index.html`.
- Componente `<AdSenseSlot slotId="..." />` que faz `(adsbygoogle=window.adsbygoogle||[]).push({})`.
- **Pedirei o Publisher ID (`ca-pub-...`) e o Ad Slot ID** no chat depois de aprovar o plano — são valores públicos que vão direto no código.
- Enquanto o AdSense não aprovar a conta, o slot mostra placeholder mas o timer/recompensa já funcionam (permite testar).

## Parte 2 — Admin toggle de seções ("Em desenvolvimento")

### Nova tabela `section_flags`
```
id, section_key text unique, enabled bool default true,
title text, message text, cta_label text, cta_url text,
updated_at, updated_by uuid
```
+ RLS: `SELECT` público (authenticated + anon), `UPDATE/INSERT` só admin. GRANTs.

Seed inicial com todas as seções principais:
`ranking`, `trail`, `study_groups`, `community`, `history`, `shop`, `carousel`, `promo_banners`, `engine_status`, `subscription`, `pix`, `password_recovery`, `demo_examples`, `exercises`, `study_plan`, `image_ocr`.

### Componente `<SectionGate sectionKey="ranking">{children}</SectionGate>`
- Assina realtime na tabela.
- Se `enabled=true` → renderiza children.
- Se `false` → renderiza card "Em desenvolvimento" com `title`, `message` e botão que abre `cta_url` (interno via router ou externo).
- Fallback default se a linha não existir: `enabled=true` (não quebra nada).

### Painel admin — nova aba "Seções"
- Tabela editável (uma linha por section_key).
- Toggle enabled + inputs title/message/cta_label/cta_url.
- Botão "Salvar" faz update via `supabase.from('section_flags').update(...)`.
- Preview em tempo real da mensagem "em desenvolvimento".

### Aplicação nas telas
Envolver componentes/rotas existentes com `<SectionGate>`:
- `RankingPage`, `TrailPage`, `StudyGroupsPage`, `CommunityPage`, `HistoryPage`, `FeatureCarousel`, banners, etc.
- Uso mínimo-invasivo: um wrapper por seção principal.

## Parte 3 — i18n
Todas as strings novas (modal do mercadinho, tela "em desenvolvimento", painel admin de seções) traduzidas nos 9 idiomas conforme a regra do projeto.

## Ordem de execução
1. Migração: `ad_rewards` + `section_flags` + seed.
2. Edge function `claim-ad-reward`.
3. `SectionGate` + wrapper das seções.
4. Aba admin "Seções".
5. FAB "mercadinho" + `RewardShopModal` + `AdSenseSlot`.
6. Script AdSense no `index.html` (após você me passar o publisher ID).
7. Traduções.

## Detalhes técnicos
- AdSense **não paga rewarded video oficialmente**; usaremos display ads dentro do modal com timer de 20s. É a estratégia usual em sites web para monetizar sem violar políticas. Alternativas (Adsterra rewarded, AdMob via Capacitor) podem ser plugadas depois trocando só o componente `<AdSenseSlot>`.
- Limite 3/dia é enforced no server (edge function), não confia no client.
- `SectionGate` usa realtime channel, então quando você desativa no admin todos os usuários veem a mudança em ~1s sem reload.

Confirma que posso seguir? Se sim, já me passa (ou depois) o **Publisher ID do AdSense** (`ca-pub-...`) — sem ele deixo o placeholder ativo.