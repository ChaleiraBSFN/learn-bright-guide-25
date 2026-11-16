import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Crown, Layers, FileText, ListChecks, Network, CalendarDays, Timer, Library, Download, Zap, Coins, Trophy, ArrowUpRight, Lock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useSubscription } from '@/hooks/useSubscription';

const resources = [
  { id: 'flashcards', icon: Layers, title: 'buddy.home.tool_flashcards', desc: 'buddy.pro.benefitCards', category: 'create' },
  { id: 'summary', icon: FileText, title: 'buddy.home.tool_summary', desc: 'buddy.tools.summaryDesc', category: 'create' },
  { id: 'quiz', icon: ListChecks, title: 'buddy.home.tool_quiz', desc: 'buddy.pro.benefitQuiz', category: 'create' },
  { id: 'map', icon: Network, title: 'buddy.pro.map', desc: 'buddy.pro.benefitMap', category: 'create' },
  { id: 'review', icon: CalendarDays, title: 'buddy.pro.review', desc: 'buddy.pro.benefitReview', category: 'organize' },
  { id: 'focus', icon: Timer, title: 'buddy.pro.focus', desc: 'buddy.pro.benefitFocus', category: 'organize' },
  { id: 'library', icon: Library, title: 'buddy.pro.library', desc: 'buddy.pro.localOnly', category: 'organize' },
  { id: 'export', icon: Download, title: 'buddy.pro.download', desc: 'buddy.pro.benefitExport', category: 'organize' },
] as const;

export const ProBenefitsTab = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isBuddy, loading } = useSubscription();
  const [category, setCategory] = useState('all');
  const [topic, setTopic] = useState('');
  const open = (id: string) => {
    if (!isBuddy) { navigate('/buddy'); return; }
    const params = new URLSearchParams();
    if (['flashcards', 'summary', 'quiz', 'map', 'review'].includes(id)) params.set('tool', id);
    if (topic.trim()) params.set('topic', topic.trim());
    navigate(`/buddy?${params.toString()}#${id === 'library' ? 'pro-library' : id === 'focus' ? 'pro-focus' : 'tools'}`);
  };
  return (
    <section className="space-y-6 pb-8" aria-labelledby="pro-benefits-title">
      <div className="space-y-3 border-b border-buddy/30 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="pro-benefits-title" className="flex items-center gap-2 text-2xl font-extrabold text-foreground"><Crown className="h-7 w-7 text-buddy" />Buddy Pro</h2>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-buddy">{isBuddy ? <Check className="h-4 w-4" /> : <Lock className="h-4 w-4" />}{t(isBuddy ? 'buddy.activeDesc' : 'proHub.exclusive')}</span>
        </div>
        <p className="text-sm text-muted-foreground">{t('proHub.subtitle')}</p>
        <Button variant="outline" className="gap-2 rounded-full border-buddy/40" onClick={() => navigate('/buddy')} disabled={loading}><Crown className="h-4 w-4" />{t(isBuddy ? 'buddy.manage' : 'proHub.viewPlan')}<ArrowUpRight className="h-4 w-4" /></Button>
      </div>
      <label className="block space-y-2 text-sm font-bold text-foreground">{t('buddy.tools.step2')}<Input value={topic} onChange={e => setTopic(e.target.value)} maxLength={120} placeholder={t('buddy.home.placeholder')} className="rounded-xl" /></label>
      <Tabs value={category} onValueChange={setCategory}>
        <TabsList className="grid h-auto w-full grid-cols-3 rounded-full bg-muted/40 p-1">
          {['all', 'create', 'organize'].map(value => <TabsTrigger key={value} value={value} className="min-w-0 whitespace-normal rounded-full px-2 py-2 text-xs sm:text-sm">{t(`proHub.${value}`)}</TabsTrigger>)}
        </TabsList>
      </Tabs>
      <div className="grid gap-3 sm:grid-cols-2">
        {resources.filter(item => category === 'all' || item.category === category).map(({ id, icon: Icon, title, desc }) => (
          <article key={id} className="glass-effect flex min-w-0 flex-col rounded-xl border border-buddy/25 bg-card/60 p-4">
            <Icon className="mb-3 h-6 w-6 text-buddy" />
            <h3 className="font-bold text-foreground">{t(title)}</h3>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">{t(desc)}</p>
            <Button variant="outline" className="mt-auto h-auto min-h-10 justify-between gap-2 whitespace-normal border-buddy/30 text-left" disabled={loading} onClick={() => open(id)}>{t(isBuddy ? 'proHub.open' : 'proHub.unlock')}<ArrowUpRight className="h-4 w-4 shrink-0" /></Button>
          </article>
        ))}
      </div>
      <div className="space-y-3 border-t border-border pt-5">
        <h3 className="font-bold text-foreground">{t('proHub.included')}</h3>
        {[{ icon: Zap, key: 'buddy.b1Title' }, { icon: Coins, key: 'buddy.b2Title' }, { icon: Trophy, key: 'buddy.b3Title' }].map(({ icon: Icon, key }) => <div key={key} className="flex items-center gap-3 text-sm text-foreground"><Icon className="h-4 w-4 shrink-0 text-buddy" />{t(key)}</div>)}
      </div>
    </section>
  );
};
