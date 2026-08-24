import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Crown, Loader2, Zap, Coins, Trophy, Palette, Sparkles, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SEO } from '@/components/SEO';
import { BuddyTools } from '@/components/buddy/BuddyTools';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Switch } from '@/components/ui/switch';
import { useSubscription, BUDDY_PRICE_BRL } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Buddy = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const { isBuddy, loading, subscriptionEnd, cancelAtPeriodEnd, refresh, startCheckout, openPortal } =
    useSubscription();
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<{ total: number; studies: number; exercises: number; plans: number } | null>(null);
  const { isAdmin } = useAdmin();
  const [testBuddy, setTestBuddy] = useState(false);
  const [testBusy, setTestBusy] = useState(false);

  useEffect(() => {
    if (!user || !isAdmin) return;
    const load = async () => {
      const { data } = await supabase.rpc('has_test_buddy', { _user_id: user.id });
      setTestBuddy(data === true);
    };
    void load();
  }, [user, isAdmin]);

  const handleTestBuddy = async (enable: boolean) => {
    setTestBusy(true);
    const { data, error } = await supabase.rpc('admin_set_test_buddy', { _enable: enable });
    setTestBusy(false);
    if (error) {
      toast({ title: t('buddy.testError', 'Não foi possível alterar o modo de teste'), variant: 'destructive' });
      return;
    }
    setTestBuddy(data === true);
    await refresh();
    toast({
      title: data === true
        ? t('buddy.testOn', 'Premium de teste ativado')
        : t('buddy.testOff', 'Premium de teste desativado'),
    });
  };

  useEffect(() => {
    if (params.get('checkout') === 'success') {
      toast({
        title: t('buddy.welcomeTitle', 'Bem-vindo ao Buddy!'),
        description: t('buddy.welcomeDesc', 'Sua assinatura está sendo confirmada.'),
      });
      void refresh();
    }
  }, [params, refresh, t, toast]);

  useEffect(() => {
    if (!user || !isBuddy) return;
    const load = async () => {
      const { data } = await supabase.from('user_history').select('type').eq('user_id', user.id);
      if (!data) return;
      setStats({
        total: data.length,
        studies: data.filter((r) => r.type === 'study').length,
        exercises: data.filter((r) => r.type === 'exercise').length,
        plans: data.filter((r) => r.type === 'plan').length,
      });
    };
    void load();
  }, [user, isBuddy]);

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    // URL já pré-carregada: abre na hora, sem espera.
    const cached = getCheckoutUrlSync();
    if (cached) {
      window.open(cached, '_blank');
      return;
    }
    setBusy(true);
    const url = await startCheckout();
    setBusy(false);
    if (!url) {
      toast({
        title: t('buddy.checkoutError', 'Não foi possível abrir o pagamento'),
        description: t('buddy.checkoutErrorHint', 'Tente novamente em instantes.'),
        variant: 'destructive',
      });
      return;
    }
    window.open(url, '_blank');
  };


  const handlePortal = async () => {
    setBusy(true);
    const url = await openPortal();
    setBusy(false);
    if (!url) {
      toast({
        title: t('buddy.portalError', 'Não foi possível abrir o gerenciamento'),
        variant: 'destructive',
      });
      return;
    }
    window.open(url, '_blank');
  };

  const benefits = [
    { icon: Zap, title: t('buddy.b1Title', 'Geração prioritária'), desc: t('buddy.b1Desc', 'Seus estudos entram na frente da fila.') },
    { icon: Coins, title: t('buddy.b2Title', '30 créditos por mês'), desc: t('buddy.b2Desc', 'Recarregados automaticamente a cada ciclo.') },
    { icon: Trophy, title: t('buddy.b3Title', 'Desafios exclusivos'), desc: t('buddy.b3Desc', 'Conquistas Buddy na trilha de progresso.') },
    { icon: Palette, title: t('buddy.b4Title', 'Personalização avançada'), desc: t('buddy.b4Desc', 'Paletas e temas extras nas suas páginas.') },
    { icon: Sparkles, title: t('buddy.b5Title', 'Ferramentas premium'), desc: t('buddy.b5Desc', 'Flashcards, resumos, quizzes e analytics.') },
    { icon: BellOff, title: t('buddy.b6Title', 'Sem anúncios'), desc: t('buddy.b6Desc', 'Estude sem interrupções.') },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        path="/buddy"
        title={t('buddy.seoTitle', 'Plano Buddy — Learn Buddy Premium')}

        description={t(
          'buddy.seoDesc',
          'Assine o plano Buddy do Learn Buddy: geração prioritária, créditos mensais, flashcards, resumos, quizzes e experiência sem anúncios.',
        )}
      />

      <header className="border-b border-border bg-card/60">
        <div className="container mx-auto flex items-center gap-3 px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label={t('common.back', 'Voltar')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-accent" />
            <h1 className="text-lg font-bold text-foreground">{t('buddy.title', 'Plano Buddy')}</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl space-y-6 px-4 py-6">
        <Card className="border-2 border-accent">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-2">
              <span>
                {isBuddy
                  ? t('buddy.activeTitle', 'Você é Buddy 🎉')
                  : t('buddy.ctaTitle', 'Turbine seus estudos')}
              </span>
              <span className="text-base font-bold text-accent">
                {t('plans.buddyPrice', 'R$ {{price}}/mês', {
                  price: BUDDY_PRICE_BRL.toFixed(2).replace('.', ','),
                })}
              </span>
            </CardTitle>
            <CardDescription>
              {isBuddy
                ? subscriptionEnd
                  ? t('buddy.renewsOn', 'Renova em {{date}}', {
                      date: new Date(subscriptionEnd).toLocaleDateString(),
                    })
                  : t('buddy.activeDesc', 'Assinatura ativa.')
                : t('buddy.ctaDesc', 'Cancele quando quiser, direto no portal do Stripe.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {benefits.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 rounded-xl border-2 border-foreground/10 p-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <div>
                    <p className="text-sm font-bold text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {cancelAtPeriodEnd && (
              <p className="text-xs text-muted-foreground">
                {t('buddy.cancelScheduled', 'Sua assinatura será encerrada no fim do período atual.')}
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              {isBuddy ? (
                <Button onClick={handlePortal} disabled={busy} className="flex-1">
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('buddy.manage', 'Gerenciar assinatura')}
                </Button>
              ) : (
                <Button onClick={handleSubscribe} disabled={busy || loading} className="flex-1">
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('buddy.subscribe', 'Assinar o plano Buddy')}
                </Button>
              )}
              <Button variant="outline" onClick={() => void refresh()} disabled={loading} className="sm:w-auto">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('buddy.refresh', 'Atualizar status')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="border-2 border-primary/40">
            <CardHeader>
              <CardTitle className="text-base">
                {t('buddy.testTitle', 'Modo de teste (somente CEO/admin)')}
              </CardTitle>
              <CardDescription>
                {t('buddy.testDesc', 'Ative o Premium na sua conta por 30 dias, sem pagamento, para testar tudo.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {testBuddy
                  ? t('buddy.testActive', 'Premium de teste ativo nesta conta.')
                  : t('buddy.testInactive', 'Premium de teste desativado.')}
              </p>
              <Switch
                checked={testBuddy}
                disabled={testBusy}
                onCheckedChange={(v) => void handleTestBuddy(v)}
                aria-label={t('buddy.testTitle', 'Modo de teste (somente CEO/admin)')}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t('buddy.toolsTitle', 'Ferramentas de estudo Buddy')}</CardTitle>
            <CardDescription>
              {t('buddy.toolsDesc', 'Gere flashcards, resumos e quizzes sobre qualquer tema.')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isBuddy ? (
              <BuddyTools />
            ) : (
              <div className="rounded-xl border-2 border-dashed border-accent/50 p-6 text-center">
                <Crown className="mx-auto mb-2 h-6 w-6 text-accent" />
                <p className="text-sm text-muted-foreground">
                  {t('buddy.locked', 'Assine o plano Buddy para liberar as ferramentas premium.')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {isBuddy && (
          <Card>
            <CardHeader>
              <CardTitle>{t('buddy.analyticsTitle', 'Suas estatísticas de estudo')}</CardTitle>
              <CardDescription>{t('buddy.analyticsDesc', 'Acompanhe seu ritmo de aprendizagem.')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: t('buddy.statTotal', 'Total'), value: stats?.total ?? 0 },
                  { label: t('buddy.statStudies', 'Estudos'), value: stats?.studies ?? 0 },
                  { label: t('buddy.statExercises', 'Exercícios'), value: stats?.exercises ?? 0 },
                  { label: t('buddy.statPlans', 'Planos'), value: stats?.plans ?? 0 },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg bg-muted/40 p-3 text-center">
                    <p className="text-xl font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              <Link to="/settings" className="mt-3 inline-block text-xs text-primary hover:underline">
                {t('buddy.customizeLink', 'Personalizar cores do app')}
              </Link>
            </CardContent>

          </Card>
        )}
      </main>
    </div>
  );
};

export default Buddy;
