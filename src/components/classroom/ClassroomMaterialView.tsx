import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StudyResult } from '@/components/StudyResult';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2 } from 'lucide-react';
import type { ClassroomMaterial } from '@/hooks/useClassroom';
import type { Exercise } from '@/types/exercises';
import { getMaterialParts } from '@/lib/classroomParts';

interface Props {
  material: ClassroomMaterial;
  /** When false the exercises are shown with answers revealed (teacher view). */
  answerable?: boolean;
  submitting?: boolean;
  submittedScore?: number | null;
  onSubmitAnswers?: (answers: Array<{ numero: number; resposta: string }>, score: number) => void;
  /** When set, only this part of the material is shown (live presentation). */
  sectionIndex?: number;
}

export function ClassroomMaterialView({ material, answerable, submitting, submittedScore, onSubmitAnswers, sectionIndex }: Props) {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [done, setDone] = useState(false);

  const parts = useMemo(() => getMaterialParts(material), [material]);
  const hasPart = typeof sectionIndex === 'number' && parts.length > 0;
  const partIdx = hasPart ? Math.min(Math.max(sectionIndex as number, 0), parts.length - 1) : 0;
  const part = hasPart ? parts[partIdx] : null;

  const allExercises: Exercise[] = useMemo(
    () => (material.type === 'exercises' ? material.content?.exercicios || [] : []),
    [material],
  );
  const exercises: Exercise[] = hasPart && part?.exercise ? [part.exercise as Exercise] : allExercises;

  const partHeader = part ? (
    <div className="mb-3 flex items-center gap-2 flex-wrap">
      <Badge variant="secondary">
        {t('classroom.part', 'Parte')} {partIdx + 1}/{parts.length}
      </Badge>
      <span className="text-sm font-semibold text-foreground">{part.title}</span>
    </div>
  ) : null;

  if (material.type === 'study') {
    return (
      <div>
        {partHeader}
        <StudyResult
          content={part ? part.content : material.content}
          tema={material.title}
          compact={!!part}
        />
      </div>
    );
  }


  const objectives = allExercises.filter((e) => e.tipo === 'objetiva');

  const handleSubmit = () => {
    let correct = 0;
    objectives.forEach((ex: any) => {
      const given = (answers[ex.numero] || '').trim().toUpperCase();
      if (given && given === String(ex.resposta || '').trim().toUpperCase()) correct++;
    });
    const score = objectives.length ? Math.round((correct / objectives.length) * 100) : 0;
    onSubmitAnswers?.(
      allExercises.map((ex) => ({ numero: ex.numero, resposta: answers[ex.numero] || '' })),
      score,
    );
    setDone(true);
  };

  const revealed = !answerable || done || submittedScore != null;

  return (
    <div className="space-y-4">
      {partHeader}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-lg font-semibold text-foreground">{material.title}</h3>
        {submittedScore != null && (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {t('classroom.scoreLabel', 'Acertos')}: {submittedScore}%
          </Badge>
        )}
      </div>

      {exercises.map((ex: any) => (
        <div key={ex.numero} className="rounded-2xl border border-border p-4 space-y-3 bg-card/60">
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="shrink-0">{ex.numero}</Badge>
            <p className="text-sm text-foreground whitespace-pre-wrap">{ex.enunciado}</p>
          </div>

          {ex.tipo === 'objetiva' ? (
            <div className="space-y-2">
              {(ex.alternativas || []).map((alt: string, idx: number) => {
                const letter = String.fromCharCode(65 + idx);
                const selected = (answers[ex.numero] || '') === letter;
                const isRight = revealed && String(ex.resposta).trim().toUpperCase() === letter;
                return (
                  <button
                    key={letter}
                    type="button"
                    disabled={!answerable || done}
                    onClick={() => setAnswers((p) => ({ ...p, [ex.numero]: letter }))}
                    className={`w-full text-left text-sm rounded-xl border px-3 py-2 transition-colors ${
                      isRight
                        ? 'border-primary bg-primary/10 text-foreground'
                        : selected
                          ? 'border-accent bg-accent/10 text-foreground'
                          : 'border-border hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <span className="font-semibold mr-2">{letter}.</span>
                    {alt.replace(/^[A-Ea-e][).]\s*/, '')}
                  </button>
                );
              })}
            </div>
          ) : (
            <Textarea
              value={answers[ex.numero] || ''}
              disabled={!answerable || done}
              onChange={(e) => setAnswers((p) => ({ ...p, [ex.numero]: e.target.value }))}
              placeholder={t('classroom.answerPlaceholder', 'Escreva sua resposta')}
              className="min-h-[80px]"
            />
          )}

          {revealed && (
            <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
              <p>
                <strong className="text-foreground">{t('classroom.correctAnswer', 'Resposta')}: </strong>
                {ex.tipo === 'objetiva' ? ex.respostaCompleta || ex.resposta : ex.respostaEsperada}
              </p>
              {ex.explicacao && <p>{ex.explicacao}</p>}
            </div>
          )}
        </div>
      ))}

      {answerable && !done && exercises.length > 0 && (!hasPart || partIdx === parts.length - 1) && (
        <Button onClick={handleSubmit} disabled={submitting} className="w-full">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('classroom.submitAnswers', 'Enviar respostas')}
        </Button>
      )}
    </div>
  );
}
