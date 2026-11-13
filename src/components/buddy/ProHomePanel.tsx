import { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Crown, Layers, FileText, ListChecks, Network, CalendarDays, Timer, Library, Zap, Gift } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';

const TOOLS = [
  { id: 'flashcards', icon: Layers },
  { id: 'summary', icon: FileText },
  { id: 'quiz', icon: ListChecks },
  { id: 'map', icon: Network },
  { id: 'review', icon: CalendarDays },
] as const;

export const ProHomePanel = ({ fallback }: { fallback: ReactNode }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isBuddy, subscriptionEnd } = useSubscription();
  const [topic, setTopic] = useState('');
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    try { setSavedCount(JSON.parse(localStorage.getItem(`buddy-materials:${user.id}`) || '[]').length); } catch { setSavedCount(0); }
  }, [user]);

  if (!isBuddy) return <>{fallback}</>;

  const go = (tool: string) => {
    const q = new URLSearchParams({ tool });
    if (topic.trim()) q.set('topic', topic.trim().slice(0, 120));
    navigate(`/buddy?${q.toString()}#tools`);
  };
  const renew = subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString(i18n.language) : null;

  return (
    <section aria-labelledby="pro-home" className="glass-effect relative overflow-hidden rounded-3xl border-2 border-buddy/40 bg-gradient-to-br from-buddy/15 via-card to-primary/10 p-5 shadow-xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-buddy" />
          <h2 id="pro-home" className="text-lg font-extrabold text-foreground">{t('buddy.home.title')}</h2>
        </div>
        {renew && <span className="rounded-full bg-buddy/20 px-3 py-1 text-xs font-bold text-foreground">{t('buddy.home.renews', { date: renew })}</span>}
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        {[
          { icon: Zap, label: t('buddy.home.perkSpeed') },
          { icon: Gift, label: t('buddy.home.perkCredits') },
          { icon: Library, label: t('buddy.home.perkLibrary', { count: savedCount }) },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 rounded-2xl border border-buddy/30 bg-background/40 p-3 text-sm font-semibold text-foreground">
            <Icon className="h-4 w-4 shrink-0 text-buddy" /><span className="min-w-0">{label}</span>
          </div>
        ))}
      </div>

      <p className="mb-2 text-sm font-bold text-foreground">{t('buddy.home.quickTitle')}</p>
      <Input value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={120} placeholder={t('buddy.home.placeholder')} className="mb-3 rounded-2xl" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {TOOLS.map(({ id, icon: Icon }) => (
          <button key={id} type="button" onClick={() => go(id)} className="flex items-center gap-2 rounded-2xl border-2 border-buddy/30 bg-card/70 p-3 text-left text-sm font-bold text-foreground transition hover:-translate-y-0.5 hover:border-buddy">
            <Icon className="h-4 w-4 shrink-0 text-buddy" /><span className="min-w-0">{t(`buddy.home.tool_${id}`)}</span>
          </button>
        ))}
        <button type="button" onClick={() => navigate('/buddy#tools')} className="flex items-center gap-2 rounded-2xl border-2 border-buddy/30 bg-card/70 p-3 text-left text-sm font-bold text-foreground transition hover:-translate-y-0.5 hover:border-buddy">
          <Timer className="h-4 w-4 shrink-0 text-buddy" /><span className="min-w-0">{t('buddy.home.tool_focus')}</span>
        </button>
      </div>
    </section>
  );
};
