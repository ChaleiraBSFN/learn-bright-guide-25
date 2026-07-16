import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AdSenseSlot } from '@/components/AdSenseSlot';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

import { toast } from 'sonner';
import { Coins, Play, Gift, Loader2 } from 'lucide-react';

const AD_DURATION_SECONDS = 20;
const DAILY_LIMIT = 3;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RewardShopModal = ({ open, onOpenChange }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [phase, setPhase] = useState<'idle' | 'watching' | 'claiming'>('idle');
  const [progress, setProgress] = useState(0);
  const [usedToday, setUsedToday] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    // count last 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    supabase
      .from('ad_rewards')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('watched_at', since)
      .then(({ count }) => setUsedToday(count ?? 0));
  }, [open, user]);

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
      const { data, error } = await supabase.functions.invoke('claim-ad-reward');
      if (error) throw error;
      if (data?.error === 'daily_limit') {
        toast.error(t('rewardShop.limitReached', 'Você já usou os anúncios de hoje. Volte amanhã!'));
      } else if (data?.success) {
        toast.success(
          t('rewardShop.gained', '+{{n}} créditos!', { n: data.credits_granted }),
        );
        setUsedToday(data.used_today);
        if (typeof data.credits_remaining === 'number') {
          window.dispatchEvent(new CustomEvent('credits_changed', { detail: { newTotal: data.credits_remaining } }));
        }
      } else {
        toast.error(data?.error || t('common.error', 'Erro'));
      }
    } catch (e) {
      toast.error(t('common.error', 'Erro'));
    } finally {
      setPhase('idle');
      setProgress(0);
    }
  };

  const canWatch = user && (usedToday === null || usedToday < DAILY_LIMIT);
  const remaining = usedToday === null ? DAILY_LIMIT : Math.max(0, DAILY_LIMIT - usedToday);

  return (
    <Dialog open={open} onOpenChange={(v) => phase === 'idle' && onOpenChange(v)}>
      <DialogContent
        className={`max-w-lg ${phase !== 'idle' ? '[&>button]:hidden' : ''}`}
        onPointerDownOutside={(e) => phase !== 'idle' && e.preventDefault()}
        onEscapeKeyDown={(e) => phase !== 'idle' && e.preventDefault()}
        onInteractOutside={(e) => phase !== 'idle' && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            {t('rewardShop.title', 'Mercadinho de créditos')}
          </DialogTitle>
          <DialogDescription>
            {t('rewardShop.subtitle', 'Ganhe créditos assistindo anúncios rápidos.')}
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="py-8 text-center text-muted-foreground">
            {t('rewardShop.needLogin', 'Faça login para ganhar créditos.')}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  <span className="font-bold">
                    {t('rewardShop.rewardLine', 'Assista 1 anúncio → +25 créditos')}
                  </span>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {t('rewardShop.remainingToday', '{{n}}/{{max}} hoje', { n: remaining, max: DAILY_LIMIT })}
                </span>
              </div>

              {phase === 'watching' && (
                <div className="space-y-3">
                  <AdSenseSlot />
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    {t('rewardShop.watching', 'Aguarde o anúncio terminar…')} {Math.ceil(AD_DURATION_SECONDS * (1 - progress / 100))}s
                  </p>
                </div>
              )}

              {phase === 'claiming' && (
                <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t('rewardShop.granting', 'Adicionando créditos…')}
                </div>
              )}

              {phase === 'idle' && (
                <Button
                  onClick={() => canWatch && setPhase('watching')}
                  disabled={!canWatch}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Play className="h-4 w-4" />
                  {canWatch
                    ? t('rewardShop.watchAd', 'Assistir anúncio')
                    : t('rewardShop.limitReached', 'Volte amanhã!')}
                </Button>
              )}
            </div>

            <p className="text-xs text-center text-muted-foreground">
              {t('rewardShop.limitInfo', 'Limite de {{max}} anúncios por dia.', { max: DAILY_LIMIT })}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
