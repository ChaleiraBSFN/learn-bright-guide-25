import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FocusTimer() {
  const { t } = useTranslation();
  const [minutes, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState(1500);
  const [end, setEnd] = useState<number | null>(null);
  useEffect(() => {
    if (end === null) return;
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setRemaining(seconds);
      if (!seconds) setEnd(null);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [end]);
  return <section className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-4">
    <div className="flex items-center gap-3"><Timer className="h-5 w-5 text-buddy" /><div><h3 className="text-sm font-bold">{t('buddy.pro.focus')}</h3><p className="text-2xl font-bold tabular-nums" role="timer">{Math.floor(remaining / 60).toString().padStart(2, '0')}:{(remaining % 60).toString().padStart(2, '0')}</p>{remaining === 0 && <p role="status" className="text-sm text-primary">{t('buddy.pro.finished')}</p>}</div></div>
    <div className="flex flex-wrap gap-2">
      {[15,25,50].map(n => <Button key={n} size="sm" variant={minutes === n ? 'default' : 'outline'} disabled={end !== null} onClick={() => { setMinutes(n); setRemaining(n * 60); }}>{n} min</Button>)}
      <Button size="icon" variant="outline" aria-label={t(end === null ? 'buddy.pro.start' : 'buddy.pro.pause')} onClick={() => setEnd(end === null ? Date.now() + remaining * 1000 : null)} disabled={remaining === 0}>{end === null ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}</Button>
      <Button size="icon" variant="ghost" aria-label={t('buddy.pro.restart')} onClick={() => {setEnd(null);setRemaining(minutes * 60);}}><RotateCcw className="h-4 w-4" /></Button>
    </div>
  </section>;
}