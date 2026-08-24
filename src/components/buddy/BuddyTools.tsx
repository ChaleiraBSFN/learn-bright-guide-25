import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Layers, FileText, ListChecks, RotateCcw, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

type Tool = 'flashcards' | 'summary' | 'quiz';

interface Flashcard { front: string; back: string }
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
  const [topic, setTopic] = useState('');
  const [tool, setTool] = useState<Tool>('flashcards');
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<Flashcard[] | null>(null);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const hasResult = Boolean(cards || summary || quiz);
  const canGenerate = topic.trim().length >= 2;

  const reset = () => {
    setCards(null);
    setSummary(null);
    setQuiz(null);
    setFlipped({});
    setAnswers({});
  };

  const run = async () => {
    if (!canGenerate) return;
    setLoading(true);
    reset();

    const { data, error } = await supabase.functions.invoke('buddy-tools', {
      body: { tool, topic: topic.trim(), language: i18n.language },
    });
    setLoading(false);

    if (error || !data || data.error) {
      toast({
        title: t('buddy.tools.error', 'Não conseguimos gerar agora'),
        description: t('buddy.tools.errorHint', 'Tente novamente em alguns segundos.'),
        variant: 'destructive',
      });
      return;
    }

    if (tool === 'flashcards') setCards(data.data?.cards ?? []);
    if (tool === 'summary') setSummary(data.data ?? {});
    if (tool === 'quiz') setQuiz(data.data?.questions ?? []);
  };

  const tools: { key: Tool; label: string; desc: string; icon: typeof Layers }[] = [
    {
      key: 'flashcards',
      label: t('buddy.tools.flashcards', 'Flashcards'),
      desc: t('buddy.tools.flashcardsDesc', 'Cartões de pergunta e resposta'),
      icon: Layers,
    },
    {
      key: 'summary',
      label: t('buddy.tools.summary', 'Resumo inteligente'),
      desc: t('buddy.tools.summaryDesc', 'Pontos-chave em poucos itens'),
      icon: FileText,
    },
    {
      key: 'quiz',
      label: t('buddy.tools.quiz', 'Quiz'),
      desc: t('buddy.tools.quizDesc', 'Perguntas com correção na hora'),
      icon: ListChecks,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Step 1 — choose what to create */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {t('buddy.tools.step1', '1. O que você quer criar?')}
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {tools.map(({ key, label, desc, icon: Icon }) => {
            const active = tool === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTool(key)}
                aria-pressed={active}
                className={`rounded-xl border-2 p-3 text-left transition-colors ${
                  active
                    ? 'border-primary bg-primary/10'
                    : 'border-foreground/10 hover:border-primary/50'
                }`}
              >
                <Icon className={`mb-1 h-4 w-4 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="text-sm font-bold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </button>
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
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void run();
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

      {cards && cards.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((card, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setFlipped((p) => ({ ...p, [i]: !p[i] }))}
              className="min-h-24 rounded-xl border-2 border-foreground/15 bg-card p-4 text-left transition-colors hover:border-primary"
            >
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {flipped[i] ? t('buddy.tools.answer', 'Resposta') : t('buddy.tools.question', 'Pergunta')}
              </div>
              <p className="text-sm font-medium text-foreground">{flipped[i] ? card.back : card.front}</p>
            </button>
          ))}
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
                    <button
                      key={oi}
                      type="button"
                      onClick={() => setAnswers((p) => ({ ...p, [qi]: oi }))}
                      className={`w-full rounded-lg border-2 p-2 text-left text-sm transition-colors ${
                        answered && isCorrect
                          ? 'border-primary bg-primary/10 text-foreground'
                          : answered && isChosen
                          ? 'border-destructive bg-destructive/10 text-foreground'
                          : 'border-foreground/10 text-foreground hover:border-primary'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {answers[qi] !== undefined && q.explanation && (
                <p className="mt-3 text-xs text-muted-foreground">{q.explanation}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
