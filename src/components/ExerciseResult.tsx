import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ExerciseContent, ExerciseObjective, ExerciseSubjective } from "@/types/exercises";
import { CheckCircle, XCircle, Lightbulb, BookOpen, Send, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ImagesSection } from "./sections/ImagesSection";

interface ExerciseResultProps {
  content: ExerciseContent;
  aiImages?: Array<{ tipo: "ai"; label?: string; url: string; descricao: string }>;
  webImages?: Array<{ tipo: "web"; label?: string; searchUrl: string; descricao: string }>;
  imagesLoading?: boolean;
}

interface CorrectionResult {
  correto: boolean;
  nota: number;
  feedback: string;
  correcao: string;
  pontosPositivos: string[];
  pontosAMelhorar: string[];
}

export function ExerciseResult({ content, aiImages, webImages, imagesLoading }: ExerciseResultProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [subjectiveAnswers, setSubjectiveAnswers] = useState<Record<number, string>>({});
  const [corrections, setCorrections] = useState<Record<number, CorrectionResult>>({});
  const [correcting, setCorrecting] = useState<Record<number, boolean>>({});
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  const handleAnswer = (exerciseIndex: number, answer: string) => {
    if (revealed[exerciseIndex]) return;
    setAnswers(prev => ({ ...prev, [exerciseIndex]: answer }));
  };

  const revealAnswer = (index: number) => {
    setRevealed(prev => ({ ...prev, [index]: true }));
  };

  const revealAll = () => {
    const allRevealed: Record<number, boolean> = {};
    content.exercicios.forEach((_, i) => { allRevealed[i] = true; });
    setRevealed(allRevealed);

    let correct = 0;
    content.exercicios.forEach((ex, i) => {
      if (ex.tipo === "objetiva" && answers[i] === ex.resposta) correct++;
      if (ex.tipo === "dissertativa" && corrections[i]?.correto) correct++;
    });
    const totalObjective = content.exercicios.filter(e => e.tipo === "objetiva").length;
    const totalSubjCorrect = content.exercicios.filter((e, i) => e.tipo === "dissertativa" && corrections[i]?.correto).length;
    setScore({ correct: correct, total: totalObjective + Object.keys(corrections).filter(k => content.exercicios[Number(k)]?.tipo === "dissertativa").length || content.exercicios.length });
  };

  const handleCorrectSubjective = async (index: number, ex: ExerciseSubjective) => {
    const userAnswer = subjectiveAnswers[index];
    if (!userAnswer?.trim()) {
      toast({ title: t('exercises.writeAnswer'), variant: "destructive" });
      return;
    }

    setCorrecting(prev => ({ ...prev, [index]: true }));

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: sessionData } = await supabase.auth.getSession();

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (sessionData.session?.access_token) {
        headers.Authorization = `Bearer ${sessionData.session.access_token}`;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/correct-exercise`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            pergunta: ex.enunciado,
            respostaUsuario: userAnswer,
            respostaEsperada: ex.respostaEsperada,
            criterios: ex.criterios,
            idioma: i18n.language,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao corrigir");
      }

      const correction = await response.json();
      setCorrections(prev => ({ ...prev, [index]: correction }));
      setRevealed(prev => ({ ...prev, [index]: true }));
    } catch (error) {
      toast({
        title: "Erro",
        description: t('exercises.correctionError'),
        variant: "destructive",
      });
    } finally {
      setCorrecting(prev => ({ ...prev, [index]: false }));
    }
  };

  const nivelColors: Record<string, string> = {
    "Básico": "bg-secondary/20 text-secondary border-secondary/30",
    "Intermediário": "bg-accent/20 text-accent border-accent/30",
    "Avançado": "bg-primary/20 text-primary border-primary/30",
    "Desafio": "bg-destructive/20 text-destructive border-destructive/30",
  };

  return (
    <div className="space-y-6 md:space-y-8 px-1 md:px-0">
      {/* Header */}
      <div className="text-center space-y-2 slide-up">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          {content.titulo}
        </h2>
        <p className="text-base md:text-lg text-muted-foreground">{content.descricao}</p>
      </div>

      {/* Topic Summary */}
      {content.resumoTema && (
        <div className="section-card bg-card border border-border fade-in p-4 md:p-6">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-primary shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">{t('exercises.topicSummary')}</h3>
              <p className="text-muted-foreground text-sm md:text-base">{content.resumoTema}</p>
            </div>
          </div>
        </div>
      )}

      {/* Images */}
      <ImagesSection
        aiImages={aiImages}
        isLoading={imagesLoading}
      />

      {/* Score */}
      {score && (
        <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20 fade-in">
          <p className="text-2xl font-bold text-primary">
            {score.correct}/{score.total}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('exercises.scoreLabel')} — {Math.round((score.correct / score.total) * 100)}%
          </p>
        </div>
      )}

      {/* Exercises */}
      <div className="space-y-4 md:space-y-6">
        {content.exercicios.map((ex, index) => {
          const isRevealed = revealed[index];

          if (ex.tipo === "dissertativa") {
            return (
              <SubjectiveExercise
                key={index}
                ex={ex}
                index={index}
                isRevealed={isRevealed}
                correction={corrections[index]}
                isCorrecting={correcting[index] || false}
                userAnswer={subjectiveAnswers[index] || ""}
                onAnswerChange={(val) => setSubjectiveAnswers(prev => ({ ...prev, [index]: val }))}
                onCorrect={() => handleCorrectSubjective(index, ex)}
                nivelColors={nivelColors}
                t={t}
              />
            );
          }

          // Objective exercise
          const selectedAnswer = answers[index];
          const isCorrect = selectedAnswer === ex.resposta;

          return (
            <ObjectiveExercise
              key={index}
              ex={ex}
              index={index}
              isRevealed={isRevealed}
              selectedAnswer={selectedAnswer}
              isCorrect={isCorrect}
              onAnswer={handleAnswer}
              onReveal={revealAnswer}
              nivelColors={nivelColors}
              t={t}
            />
          );
        })}
      </div>

      {/* Reveal all button */}
      {!score && (
        <div className="text-center">
          <Button onClick={revealAll} variant="default" size="lg">
            {t('exercises.finishAndCheck')}
          </Button>
        </div>
      )}
    </div>
  );
}

// --- Objective Exercise Component ---
function ObjectiveExercise({
  ex, index, isRevealed, selectedAnswer, isCorrect, onAnswer, onReveal, nivelColors, t
}: {
  ex: ExerciseObjective;
  index: number;
  isRevealed: boolean;
  selectedAnswer: string | undefined;
  isCorrect: boolean;
  onAnswer: (index: number, answer: string) => void;
  onReveal: (index: number) => void;
  nivelColors: Record<string, string>;
  t: (key: string) => string;
}) {
  return (
    <div
      className="section-card bg-card border border-border fade-in p-4 md:p-6 space-y-4"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">#{ex.numero}</span>
          <Badge variant="outline" className={nivelColors[ex.nivel] || 'bg-muted text-muted-foreground'}>
            {ex.nivel}
          </Badge>
          <Badge variant="outline" className="bg-muted/50 text-muted-foreground text-xs">
            {t('exercises.typeObjective')}
          </Badge>
        </div>
        {isRevealed && selectedAnswer && (
          isCorrect ? (
            <CheckCircle className="h-6 w-6 text-secondary" />
          ) : (
            <XCircle className="h-6 w-6 text-destructive" />
          )
        )}
      </div>

      <p className="font-medium text-foreground text-sm md:text-base leading-relaxed">
        {ex.enunciado}
      </p>

      <div className="space-y-2">
        {ex.alternativas.map((alt, altIndex) => {
          const letter = String.fromCharCode(97 + altIndex);
          const isSelected = selectedAnswer === letter;
          const isCorrectAnswer = letter === ex.resposta;

          let altClass = "border border-border bg-background/50 hover:bg-muted/50 cursor-pointer";
          if (isRevealed) {
            if (isCorrectAnswer) altClass = "border-secondary bg-secondary/10";
            else if (isSelected && !isCorrectAnswer) altClass = "border-destructive bg-destructive/10";
            else altClass = "border border-border bg-background/30 opacity-60";
          } else if (isSelected) {
            altClass = "border-primary bg-primary/10 ring-2 ring-primary/30";
          }

          return (
            <button
              key={altIndex}
              onClick={() => onAnswer(index, letter)}
              disabled={isRevealed}
              className={`w-full text-left p-3 rounded-xl transition-all text-sm md:text-base ${altClass}`}
            >
              {alt}
            </button>
          );
        })}
      </div>

      {!isRevealed ? (
        <Button variant="outline" size="sm" onClick={() => onReveal(index)} className="w-full">
          {t('exercises.checkAnswer')}
        </Button>
      ) : (
        <div className="space-y-3 pt-3 border-t border-border">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-secondary text-sm">{t('exercises.correctAnswer')}:</p>
              <p className="text-foreground text-sm">{ex.respostaCompleta}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <BookOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-primary text-sm">{t('exercises.explanation')}:</p>
              <p className="text-muted-foreground text-sm">{ex.explicacao}</p>
            </div>
          </div>
          {ex.dicaExtra && (
            <div className="flex items-start gap-2">
              <Lightbulb className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-accent text-sm">{t('exercises.extraTip')}:</p>
                <p className="text-muted-foreground text-sm">{ex.dicaExtra}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Subjective Exercise Component ---
function SubjectiveExercise({
  ex, index, isRevealed, correction, isCorrecting, userAnswer, onAnswerChange, onCorrect, nivelColors, t
}: {
  ex: ExerciseSubjective;
  index: number;
  isRevealed: boolean;
  correction: CorrectionResult | undefined;
  isCorrecting: boolean;
  userAnswer: string;
  onAnswerChange: (val: string) => void;
  onCorrect: () => void;
  nivelColors: Record<string, string>;
  t: (key: string) => string;
}) {
  return (
    <div
      className="section-card bg-card border border-border fade-in p-4 md:p-6 space-y-4"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-foreground">#{ex.numero}</span>
        <Badge variant="outline" className={nivelColors[ex.nivel] || 'bg-muted text-muted-foreground'}>
          {ex.nivel}
        </Badge>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
          {t('exercises.typeSubjective')}
        </Badge>
        {isRevealed && correction && (
          <div className="ml-auto flex items-center gap-2">
            {correction.nota >= 7 ? (
              <CheckCircle className="h-6 w-6 text-secondary" />
            ) : correction.nota >= 4 ? (
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            ) : (
              <XCircle className="h-6 w-6 text-destructive" />
            )}
            <span className={`text-lg font-bold ${correction.nota >= 7 ? 'text-secondary' : correction.nota >= 4 ? 'text-yellow-500' : 'text-destructive'}`}>
              {correction.nota}/10
            </span>
          </div>
        )}
      </div>

      <p className="font-medium text-foreground text-sm md:text-base leading-relaxed">
        {ex.enunciado}
      </p>

      {!isRevealed ? (
        <div className="space-y-3">
          <Textarea
            placeholder={t('exercises.writeYourAnswer')}
            value={userAnswer}
            onChange={(e) => onAnswerChange(e.target.value)}
            className="min-h-[100px] bg-background/50"
            disabled={isCorrecting}
          />
          <Button
            onClick={onCorrect}
            disabled={isCorrecting || !userAnswer.trim()}
            className="w-full gap-2"
            variant="default"
          >
            {isCorrecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('exercises.correcting')}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {t('exercises.submitForCorrection')}
              </>
            )}
          </Button>
        </div>
      ) : correction ? (
        <div className="space-y-3 pt-3 border-t border-border">
          {/* User's answer */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs font-semibold text-muted-foreground mb-1">{t('exercises.yourAnswer')}:</p>
            <p className="text-sm text-foreground">{userAnswer}</p>
          </div>

          {/* Feedback */}
          <div className="flex items-start gap-2">
            {correction.nota >= 7 ? (
              <CheckCircle className="h-6 w-6 text-secondary shrink-0 mt-0.5" />
            ) : correction.nota >= 4 ? (
              <AlertTriangle className="h-6 w-6 text-yellow-500 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`font-semibold text-sm ${correction.nota >= 7 ? 'text-secondary' : correction.nota >= 4 ? 'text-yellow-500' : 'text-destructive'}`}>
                {correction.nota >= 7 ? t('exercises.correctLabel') : correction.nota >= 4 ? t('exercises.partialLabel') : t('exercises.incorrectLabel')}
              </p>
              <p className="text-muted-foreground text-sm mt-1">{correction.feedback}</p>
            </div>
          </div>

          {/* Correction if wrong or partial */}
          {correction.nota < 7 && correction.correcao && (
            <div className="flex items-start gap-2">
              <BookOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-primary text-sm">{t('exercises.correctAnswer')}:</p>
                <p className="text-muted-foreground text-sm">{correction.correcao}</p>
              </div>
            </div>
          )}

          {/* Positive points */}
          {correction.pontosPositivos?.length > 0 && (
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-secondary text-sm">{t('exercises.positivePoints')}:</p>
                <ul className="text-muted-foreground text-sm list-disc ml-4 mt-1">
                  {correction.pontosPositivos.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            </div>
          )}

          {/* Points to improve */}
          {correction.pontosAMelhorar?.length > 0 && (
            <div className="flex items-start gap-2">
              <Lightbulb className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-accent text-sm">{t('exercises.pointsToImprove')}:</p>
                <ul className="text-muted-foreground text-sm list-disc ml-4 mt-1">
                  {correction.pontosAMelhorar.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Revealed without correction (via "finish all") */
        <div className="space-y-3 pt-3 border-t border-border">
          <div className="flex items-start gap-2">
            <BookOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-primary text-sm">{t('exercises.expectedAnswer')}:</p>
              <p className="text-muted-foreground text-sm">{ex.respostaEsperada}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Lightbulb className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-accent text-sm">{t('exercises.explanation')}:</p>
              <p className="text-muted-foreground text-sm">{ex.explicacao}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
