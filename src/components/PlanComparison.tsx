import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { formatPlanPrice } from '@/lib/currency';

export const PlanComparison = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isBuddy } = useSubscription();

  const freeItems = [
    t('plans.free.item1', 'Geração de estudos, exercícios e planos'),
    t('plans.free.item2', 'Créditos diários e semanais básicos'),
    t('plans.free.item3', 'Trilha de progresso e ranking'),
    t('plans.free.item4', 'Velocidade de geração padrão'),
  ];

  const buddyItems = [
    t('plans.buddy.item1', 'Geração prioritária, bem mais rápida'),
    t('plans.buddy.item2', '30 créditos extras todo mês'),
    t('plans.buddy.item3', 'Desafios exclusivos na trilha'),
    t('plans.buddy.item4', 'Personalização avançada de tema e layout'),
    t('plans.buddy.item5', 'Flashcards, resumos, quizzes e analytics'),
    t('plans.buddy.item6', 'Experiência sem anúncios'),
  ];

  return (
    <section aria-labelledby="plans-heading" className="grid gap-4 md:grid-cols-2">
      <h2 id="plans-heading" className="sr-only">
        {t('plans.title', 'Planos Learn Buddy')}
      </h2>

      <div className="rounded-xl border-2 border-foreground/15 bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-base font-bold text-foreground">{t('plans.freeTitle', 'Plano Free')}</h3>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          {t('plans.freeSubtitle', 'Tudo o que você precisa para começar a estudar hoje.')}
        </p>
        <ul className="space-y-2">
          {freeItems.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative overflow-hidden rounded-xl border-2 border-accent bg-gradient-to-br from-accent/10 via-card to-primary/10 p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-accent" />
            <h3 className="text-base font-bold text-foreground">{t('plans.buddyTitle', 'Plano Buddy')}</h3>
          </div>
          <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-bold text-accent-foreground">
            {t('plans.buddyPrice', '{{price}}/mês', { price: formatPlanPrice(i18n.language) })}
          </span>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          {t('plans.buddySubtitle', 'Estude mais rápido, com ferramentas premium e sem anúncios.')}
        </p>
        <ul className="mb-5 space-y-2">
          {buddyItems.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <Button className="w-full" onClick={() => navigate('/buddy')}>
          {isBuddy
            ? t('plans.manageBuddy', 'Gerenciar meu plano Buddy')
            : t('plans.upgradeCta', 'Quero ser Buddy')}
        </Button>
      </div>
    </section>
  );
};
