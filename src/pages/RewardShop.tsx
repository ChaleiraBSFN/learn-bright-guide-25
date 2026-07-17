import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AdSenseSlot } from '@/components/AdSenseSlot';
import { FloatingActions } from '@/components/FloatingActions';
import { SEO } from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ArrowLeft, Coins, Gift, Loader2, Play } from 'lucide-react';

const AD_DURATION_SECONDS = 20;
const DAILY_LIMIT = 3;

export default function RewardShop() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phase, setPhase] = useState<'idle' | 'watching' | 'claiming'>('idle');
  const [progress, setProgress] = useState(0);
  const [usedToday, setUsedToday] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    supabase
      .from('ad_rewards')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('watched_at', since)
      .then(({ count }) => setUsedToday(count ?? 0));
  }, [user]);

  useEffect(() => {
    if (phase !== 'watching') return;
    const start = Date.now();
    const total = AD_DURATION_SECONDS * 1000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / total) * 100);
      setProgress(pct);
      if (elapsed >= total) {
        clearInterval(interval);
        claim();
      }
    }, 200);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const claim = async () => {
    setPhase('claiming');
    try {
      const { data, error } = await supabase.rpc('claim_ad_reward');
      if (error) throw error;

      const result = data as {
        success?: boolean;
        error?: string;
        credits_granted?: number;
        credits_remaining?: number;
        used_today?: number;
      } | null;

      if (result?.error === 'daily_limit') {
        toast.error(t('rewardShop.limitReached', 'Você já usou os anúncios de hoje. Volte amanhã!'));
      } else if (result?.error === 'too_fast') {
        toast.error(t('rewardShop.waitFullAd', 'Aguarde o anúncio terminar para receber os créditos.'));
      } else if (result?.success) {
        toast.success(t('rewardShop.gained', '+{{n}} créditos!', { n: result.credits_granted }));
        setUsedToday(result.used_today ?? null);
        if (typeof result.credits_remaining === 'number') {
          window.dispatchEvent(new CustomEvent('credits_changed', { detail: { newTotal: result.credits_remaining } }));
        }
      } else {
        toast.error(result?.error || t('common.error', 'Erro'));
      }
    } catch (e) {
      toast.error(t('common.error', 'Erro'));
    } finally {
      setPhase('idle');
      setProgress(0);
    }
  };

  const canWatch = user && (usedToday === null || usedToday < DAILY_LIMIT);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title={t('rewardShop.pageTitle', 'Mercadinho de créditos — Learn Buddy')}
        description={t('rewardShop.pageDescription', 'Ganhe créditos assistindo anúncios rápidos no Learn Buddy.')}
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
                {t('rewardShop.subtitle', 'Ganhe créditos assistindo anúncios rápidos.')}
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-start gap-3 min-w-0">
                  <Coins className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h2 className="font-bold text-lg break-words leading-tight">
                      {t('rewardShop.rewardLine', 'Assista 1 anúncio → +25 créditos')}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('rewardShop.limitInfo', 'Limite de {{max}} anúncios por dia.', { max: DAILY_LIMIT })}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium shrink-0 self-start sm:self-center">
                  {t('rewardShop.remainingToday', '{{n}} de {{max}} usados hoje', { n: usedToday ?? 0, max: DAILY_LIMIT })}
                </span>
              </div>

              {phase === 'watching' && (
                <div className="space-y-3">
                  <AdSenseSlot className="max-w-full" />
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    {t('rewardShop.watching', 'Aguarde o anúncio terminar…')} {Math.ceil(AD_DURATION_SECONDS * (1 - progress / 100))}s
                  </p>
                </div>
              )}

              {phase === 'claiming' && (
                <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t('rewardShop.granting', 'Adicionando créditos…')}
                </div>
              )}

              {phase === 'idle' && (
                <Button
                  onClick={() => canWatch && setPhase('watching')}
                  disabled={!canWatch}
                  className="w-full gap-2 h-auto min-h-[52px] py-3 whitespace-normal break-words"
                  size="lg"
                >
                  <Play className="h-4 w-4 shrink-0" />
                  {canWatch
                    ? t('rewardShop.watchAd', 'Assistir anúncio')
                    : t('rewardShop.limitReached', 'Volte amanhã!')}
                </Button>
              )}
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
