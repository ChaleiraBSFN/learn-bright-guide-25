import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FloatingActions } from '@/components/FloatingActions';
import { SEO } from '@/components/SEO';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Coins, Gift } from 'lucide-react';

export default function RewardShop() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title={t('rewardShop.pageTitle', 'Mercadinho de créditos — Learn Buddy')}
        description={t('credits.explanation')}
        path="/reward-shop"
      />
      <FloatingActions />

      <header className="sticky top-0 z-30 border-b-2 border-foreground/15 bg-background/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label={t('header.back', 'Voltar')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="h-9 w-9 rounded-xl border-2 border-foreground/15 bg-amber-500/10 flex items-center justify-center shadow-sm">
              <Gift className="h-5 w-5 text-amber-500" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-base sm:text-lg font-bold leading-tight truncate">
                {t('rewardShop.title', 'Mercadinho de créditos')}
              </h1>
              <p className="text-[11px] text-muted-foreground leading-tight truncate">
                {t('credits.explanation')}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {!user ? (
          <div className="rounded-2xl border-2 border-foreground/10 bg-card p-8 text-center">
            <Coins className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">{t('rewardShop.needLogin', 'Faça login para ganhar créditos.')}</h2>
            <Button onClick={() => navigate('/auth')} className="mt-4">
              {t('auth.signIn', 'Entrar')}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 sm:p-6">
              <h2 className="font-bold text-lg">{t('sectionGate.title')}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t('sectionGate.message')}</p>
            </div>

            <div className="rounded-2xl border-2 border-foreground/10 bg-card p-5">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-500" />
                {t('credits.whatFor', 'Para que servem os créditos?')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('credits.explanation', 'Créditos são usados para gerar materiais de estudo, exercícios e planos de estudo personalizados.')}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
