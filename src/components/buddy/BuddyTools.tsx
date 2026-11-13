import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, Layers, FileText, ListChecks, RotateCcw, Sparkles, Network, CalendarDays, Download, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BuddyMaterial, BuddyTool, SavedBuddyMaterial, materialText, quizScore, missedQuestions, recordAnswer, reviewCardIndexes } from '@/lib/buddyPractice';
import { FocusTimer } from './FocusTimer';
type Tool = BuddyTool;

interface Flashcard { front: string; back: string; emoji?: string; tag?: string; tip?: string }
interface SummaryData {
  title?: string;
  bullets?: string[];
  keyTerms?: { term: string; definition: string }[];
  conclusion?: string;
}
interface QuizQuestion { question: string; options: string[]; correctIndex: number; explanation?: string }

export const BuddyTools = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isBuddy } = useSubscription();
  const [count, setCount] = useState(8);
  const [level, setLevel] = useState('intermediate');
  const [extra, setExtra] = useState<BuddyMaterial | null>(null);
  const [mastered, setMastered] = useState<Record<number, boolean>>({});
  const [onlyReview, setOnlyReview] = useState(false);
  const [saved, setSaved] = useState<SavedBuddyMaterial[]>([]);
  const [completedDays, setCompletedDays] = useState<Record<number, boolean>>({});
  const storageKey = user ? `buddy-materials:${user.id}` : null;
  const pending = useRef(false);
  useEffect(() => {
    try { setSaved(storageKey ? JSON.parse(localStorage.getItem(storageKey) || '[]') : []); }
    catch { setSaved([]); }
  }, [storageKey]);
  const persist = (items: SavedBuddyMaterial[]) => {
    if (!storageKey) return;
    try { localStorage.setItem(storageKey, JSON.stringify(items)); setSaved(items); }
    catch { toast({title:t('buddy.pro.storageError'),variant:'destructive'}); }
  };
  const [params] = useSearchParams();
  const initialTool = params.get('tool');
  const [topic, setTopic] = useState(() => (params.get('topic') || '').slice(0, 120));
  const [tool, setTool] = useState<Tool>(() => (['flashcards','summary','quiz','map','review'].includes(initialTool || '') ? initialTool as Tool : 'flashcards'));
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<Flashcard[] | null>(null);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const hasResult = Boolean(cards || summary || quiz || extra);
  const canGenerate = topic.trim().length >= 2;

  const reset = () => {
    setCards(null);
    setSummary(null);
    setQuiz(null);
    setFlipped({});
    setAnswers({});
    setExtra(null); setMastered({}); setOnlyReview(false); setCompletedDays({});
  };

  const run = async () => {
    if (!canGenerate || pending.current || !isBuddy) return;
    pending.current = true;
    setLoading(true);
    reset();

    try {
      const { data, error } = await supabase.functions.invoke('buddy-tools', {
        body: { tool, topic: topic.trim(), language: i18n.language, count, level },
      });
      if (error || !data?.data || data.error) throw new Error('generation_failed');
      if (tool === 'flashcards') setCards(data.data.cards);
      if (tool === 'summary') setSummary(data.data);
      if (tool === 'quiz') setQuiz(data.data.questions);
      if (tool === 'map' || tool === 'review') setExtra(data.data);
    } catch {
      toast({title:t('buddy.tools.error'),description:t('buddy.tools.errorHint'),variant:'destructive'});
    } finally { pending.current = false; setLoading(false); }
  };
  const resultData: BuddyMaterial = cards ? {cards} : quiz ? {questions:quiz} : summary ?? extra ?? {};
  const saveResult = () => persist([{id:crypto.randomUUID(),topic,tool,data:resultData,createdAt:new Date().toISOString()}, ...saved].slice(0,50));
  const download = () => {
    const url = URL.createObjectURL(new Blob([materialText(topic,resultData)], {type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a'); link.href = url; link.download = 'buddy-study.txt'; link.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  };

  const tools: { key: Tool; label: string; desc: string; icon: typeof Layers }[] = [
    {
      key: 'flashcards',
      label: `🃏 ${t('buddy.tools.flashcards', 'Flashcards')}`,
      desc: t('buddy.tools.flashcardsDesc', 'Cartões de pergunta e resposta'),
      icon: Layers,
    },
    {
      key: 'summary',
      label: `📝 ${t('buddy.tools.summary', 'Resumo inteligente')}`,
      desc: t('buddy.tools.summaryDesc', 'Pontos-chave em poucos itens'),
      icon: FileText,
    },
    {
      key: 'quiz',
      label: `🧠 ${t('buddy.tools.quiz', 'Quiz')}`,
      desc: t('buddy.tools.quizDesc', 'Perguntas com correção na hora'),
      icon: ListChecks,
    },
    {key:'map',label:t('buddy.pro.map'),desc:t('buddy.pro.mapDesc'),icon:Network},
    {key:'review',label:t('buddy.pro.review'),desc:t('buddy.pro.reviewDesc'),icon:CalendarDays},
  ];

  return (
    <div className="space-y-5" data-testid="buddy-tools">
      <FocusTimer />
      {/* Step 1 — choose what to create */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {t('buddy.tools.step1', '1. O que você quer criar?')}
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {tools.map(({ key, label, desc, icon: Icon }) => {
            const active = tool === key;
            return (
              <Button variant="outline"
                key={key}
                type="button"
                disabled={loading}
                onClick={() => {setTool(key);reset();}}
                aria-pressed={active}
                className={`h-auto flex-col items-start whitespace-normal rounded-xl border-2 p-3 text-left transition-colors ${
                  active
                    ? 'border-primary bg-primary/10'
                    : 'border-foreground/10 hover:border-primary/50'
                }`}
              >
                <Icon className={`mb-1 h-4 w-4 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="text-sm font-bold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Step 2 — topic + generate */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {t('buddy.tools.step2', '2. Sobre qual tema?')}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            maxLength={200}
            disabled={loading}
            aria-label={t('buddy.tools.step2')}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) void run();
            }}
            placeholder={t('buddy.tools.placeholder', 'Ex.: Revolução Francesa, funções quadráticas...')}
            className="flex-1"
          />
          <Button onClick={() => void run()} disabled={loading || !canGenerate} className="shrink-0">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {t('buddy.tools.generate', 'Gerar')}
          </Button>
          {hasResult && (
            <Button variant="ghost" onClick={reset} className="shrink-0">
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('buddy.tools.clear', 'Limpar')}
            </Button>
          )}
        </div>
        {!canGenerate && (
          <p className="text-xs text-muted-foreground">
            {t('buddy.tools.topicRequired', 'Digite um tema para começar')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1 text-xs font-bold">{t('buddy.pro.level')}<Select value={level} onValueChange={setLevel} disabled={loading}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['basic','intermediate','advanced'].map(v=><SelectItem key={v} value={v}>{t(`buddy.pro.${v}`)}</SelectItem>)}</SelectContent></Select></label>
        {(tool === 'quiz' || tool === 'flashcards') && <label className="space-y-1 text-xs font-bold">{t('buddy.pro.count')}<Select value={String(count)} onValueChange={v=>setCount(Number(v))} disabled={loading}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[8,12,20].map(v=><SelectItem key={v} value={String(v)}>{v}</SelectItem>)}</SelectContent></Select></label>}
      </div>
      {hasResult && <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={saveResult}><Save className="mr-2 h-4 w-4" />{t('buddy.pro.save')}</Button><Button variant="outline" size="sm" onClick={download}><Download className="mr-2 h-4 w-4" />{t('buddy.pro.download')}</Button></div>}
      {cards && cards.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              🃏 {t('buddy.tools.cardsTitle', 'Seus flashcards')}
            </p>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
              {Object.values(flipped).filter(Boolean).length}/{cards.length} {t('buddy.tools.flippedLabel', 'vistos')}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {reviewCardIndexes(cards,mastered,onlyReview).map(i => {
              const card = cards[i];
              const isFlipped = Boolean(flipped[i]);
              return (
                <div key={i} className="space-y-2">
                <Button variant="outline"
                  type="button"
                  onClick={() => setFlipped((p) => ({ ...p, [i]: !p[i] }))}
                  className={`h-auto w-full items-stretch whitespace-normal flex min-h-32 flex-col rounded-xl border-2 p-4 text-left transition-all ${
                    isFlipped ? 'border-primary bg-primary/5' : 'border-foreground/15 bg-card hover:border-primary/60'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span className="text-base leading-none">{card.emoji || '🃏'}</span>
                      {card.tag || `${t('buddy.tools.card', 'Card')} ${i + 1}`}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isFlipped ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {isFlipped ? `✅ ${t('buddy.tools.answer', 'Resposta')}` : `❓ ${t('buddy.tools.question', 'Pergunta')}`}
                    </span>
                  </div>

                  <p className="text-sm font-medium leading-relaxed text-foreground">
                    {isFlipped ? card.back : card.front}
                  </p>

                  {isFlipped && card.tip && (
                    <p className="mt-2 rounded-lg bg-accent/10 px-2 py-1.5 text-xs text-foreground">{card.tip}</p>
                  )}

                  <span className="mt-auto pt-2 text-[10px] text-muted-foreground">
                    👆 {isFlipped ? t('buddy.tools.tapBack', 'Toque para ver a pergunta') : t('buddy.tools.tapFlip', 'Toque para virar')}
                  </span>
                </Button>
                <Button variant={mastered[i] ? 'default' : 'outline'} size="sm" className="w-full" onClick={()=>setMastered(p=>({...p,[i]:!p[i]}))}>{t(mastered[i] ? 'buddy.pro.mastered' : 'buddy.pro.markMastered')}</Button>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" aria-pressed={onlyReview} onClick={()=>setOnlyReview(v=>!v)}>{t(onlyReview ? 'buddy.pro.allCards' : 'buddy.pro.onlyReview')} ({cards.length-Object.values(mastered).filter(Boolean).length})</Button>
            <Button size="sm" variant="outline" onClick={() => setFlipped(Object.fromEntries(cards.map((_, i) => [i, true])))}>
              👀 {t('buddy.tools.revealAll', 'Ver todas as respostas')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setFlipped({})}>
              🔄 {t('buddy.tools.resetCards', 'Recomeçar')}
            </Button>
          </div>
        </div>
      )}

      {summary && (
        <div className="rounded-xl border-2 border-foreground/15 bg-card p-5">
          {summary.title && <h3 className="mb-3 text-lg font-bold text-foreground">{summary.title}</h3>}
          <ul className="mb-4 space-y-2">
            {(summary.bullets ?? []).map((b, i) => (
              <li key={i} className="text-sm leading-relaxed text-foreground">{b}</li>
            ))}
          </ul>

          {(summary.keyTerms ?? []).length > 0 && (
            <div className="mb-4 space-y-1">
              {(summary.keyTerms ?? []).map((k, i) => (
                <p key={i} className="text-sm text-muted-foreground">
                  <span className="font-bold text-foreground">{k.term}:</span> {k.definition}
                </p>
              ))}
            </div>
          )}
          {summary.conclusion && <p className="text-sm text-foreground">{summary.conclusion}</p>}
        </div>
      )}

      {quiz && quiz.length > 0 && (
        <div className="space-y-4">
          <p role="status" className="text-sm font-bold">{t('buddy.pro.score',{correct:quizScore(quiz,answers),total:quiz.length})}</p>
          {Object.keys(answers).length === quiz.length && missedQuestions(quiz,answers).length > 0 && <Button variant="outline" onClick={()=>{setQuiz(missedQuestions(quiz,answers));setAnswers({});}}>{t('buddy.pro.retryMistakes')}</Button>}
          {quiz.map((q, qi) => (
            <div key={qi} className="rounded-xl border-2 border-foreground/15 bg-card p-4">
              <p className="mb-3 text-sm font-bold text-foreground">{qi + 1}. {q.question}</p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const chosen = answers[qi];
                  const isChosen = chosen === oi;
                  const isCorrect = oi === q.correctIndex;
                  const answered = chosen !== undefined;
                  return (
                    <Button variant="outline"
                      key={oi}
                      type="button"
                      disabled={answered}
                      onClick={() => setAnswers((p) => recordAnswer(p, qi, oi))}
                      className={`h-auto justify-start whitespace-normal w-full rounded-lg border-2 p-2 text-left text-sm transition-colors ${
                        answered && isCorrect
                          ? 'border-primary bg-primary/10 text-foreground'
                          : answered && isChosen
                          ? 'border-destructive bg-destructive/10 text-foreground'
                          : 'border-foreground/10 text-foreground hover:border-primary'
                      }`}
                    >
                      {opt}
                    </Button>
                  );
                })}
              </div>
              {answers[qi] !== undefined && q.explanation && (
                <p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                  {q.explanation.replace(/\s*•\s*/g, '\n• ').trim()}
                </p>
              )}

            </div>
          ))}
        </div>
      )}
      {extra?.branches && <section className="space-y-4"><h3 className="text-center text-lg font-bold text-buddy">{extra.title}</h3><div className="grid gap-3 sm:grid-cols-2">{extra.branches.map((branch,i)=><article key={i} className="rounded-xl border-2 border-buddy/30 bg-buddy/5 p-4"><h4 className="font-bold">{branch.title}</h4><ul className="my-2 list-disc space-y-1 pl-4 text-sm">{branch.points.map((point,j)=><li key={j}>{point}</li>)}</ul><p className="text-sm text-muted-foreground">💡 {branch.example}</p></article>)}</div></section>}
      {extra?.days && <section className="space-y-3"><h3 className="font-bold">{extra.title}</h3>{extra.days.map((day,i)=><article key={i} className="border-l-2 border-buddy pl-4"><label className="flex items-start gap-2 font-bold"><input type="checkbox" checked={Boolean(completedDays[i])} onChange={e=>setCompletedDays(p=>({...p,[i]:e.target.checked}))} /><span>{day.day}. {day.goal}</span></label><ul className="my-2 list-disc pl-5 text-sm">{day.tasks.map((task,j)=><li key={j}>{task}</li>)}</ul><p className="text-sm text-muted-foreground">🔎 {day.check}</p></article>)}</section>}
      <section className="space-y-3 border-t border-border pt-4"><h3 className="font-bold">{t('buddy.pro.library')}</h3><p className="text-xs text-muted-foreground">{t('buddy.pro.localOnly')}</p>{saved.length === 0 && <p className="text-sm text-muted-foreground">{t('buddy.pro.empty')}</p>}{saved.map(item=><div key={item.id} className="flex items-center gap-2"><Button variant="outline" className="h-auto min-w-0 flex-1 justify-start whitespace-normal text-left" disabled={loading} onClick={()=>{reset();setTopic(item.topic);setTool(item.tool);if(item.tool==='flashcards')setCards(item.data.cards??[]);else if(item.tool==='quiz')setQuiz(item.data.questions??[]);else if(item.tool==='summary')setSummary(item.data);else setExtra(item.data);}}>{item.topic} · {t(item.tool==='map'||item.tool==='review' ? `buddy.pro.${item.tool}` : `buddy.tools.${item.tool}`)}</Button><Button size="icon" variant="ghost" aria-label={t('buddy.pro.remove')} onClick={()=>persist(saved.filter(s=>s.id!==item.id))}><Trash2 className="h-4 w-4" /></Button></div>)}</section>
    </div>
  );
};
