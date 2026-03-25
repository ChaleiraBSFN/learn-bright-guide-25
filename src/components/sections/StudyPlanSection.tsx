import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, CheckSquare, Target, Award, ChevronDown, ChevronUp, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudyPlanSectionProps {
  data: {
    titulo: string;
    blocos: Array<{
      numero: number;
      periodo: string;
      objetivo: string;
      tarefas: string[];
      evidencia: string;
    }>;
  };
  onGenerateExercise?: (taskDescription: string) => void;
  isGeneratingExercise?: boolean;
}

export function StudyPlanSection({ data, onGenerateExercise, isGeneratingExercise }: StudyPlanSectionProps) {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  
  const visibleBlocks = showAll ? data.blocos : data.blocos.slice(0, 7);
  const hasMore = data.blocos.length > 7;

  return (
    <section className="section-card bg-card border border-border fade-in" style={{ animationDelay: '0.7s' }}>
      <div className="absolute left-0 top-0 h-full w-1.5 rounded-l-2xl bg-section-plan" />
      <div className="space-y-4">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl bg-section-plan/10">
            <CalendarDays className="h-5 w-5 md:h-6 md:w-6 text-section-plan" />
          </div>
          <div className="pt-1 md:pt-2">
            <h3 className="font-display text-lg md:text-xl font-bold text-foreground">
              7. {data.titulo}
            </h3>
            <p className="text-sm text-muted-foreground">
              {data.blocos.length} {t('sections.daysCount')}
            </p>
          </div>
        </div>
        
        <div className="ml-0 md:ml-16 space-y-3">
          {visibleBlocks.map((bloco) => {
            const exercises = bloco.tarefas.filter(t => 
              t.toLowerCase().startsWith('exerc') || t.toLowerCase().startsWith('exercise') || 
              t.toLowerCase().startsWith('übung') || t.toLowerCase().startsWith('ejerc') ||
              t.toLowerCase().startsWith('演習') || t.toLowerCase().startsWith('练习') ||
              t.toLowerCase().startsWith('упражн') || t.toLowerCase().startsWith('eserciz') ||
              t.includes('?') || t.includes('？')
            );
            const tasks = bloco.tarefas.filter(t => !exercises.includes(t));
            
            return (
              <div key={bloco.numero} className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-section-plan text-sm font-bold text-primary-foreground">
                      {bloco.numero}
                    </span>
                    <span className="font-semibold text-foreground">{bloco.periodo}</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-primary shrink-0 mt-1" />
                  <p className="text-sm text-foreground/90">{bloco.objetivo}</p>
                </div>

                {tasks.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('sections.tasks')}:</p>
                    <ul className="space-y-1">
                      {tasks.map((tarefa, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-foreground/80">
                          <CheckSquare className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                          {tarefa}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {exercises.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <Dumbbell className="h-3 w-3" />
                      {t('sections.exercises', 'Exercícios')}:
                    </p>
                    <ul className="space-y-2">
                      {exercises.map((ex, index) => (
                        <li key={index} className="space-y-1">
                          <div className="flex items-start gap-2 text-sm text-primary/90 font-medium">
                            <Dumbbell className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            {ex}
                          </div>
                          {onGenerateExercise && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onGenerateExercise(ex)}
                              disabled={isGeneratingExercise}
                              className="ml-6 gap-1.5 text-xs h-7 border-primary/30 text-primary hover:bg-primary/10"
                            >
                              <Dumbbell className="h-3 w-3" />
                              {isGeneratingExercise ? t('sections.generating', 'Gerando...') : t('sections.generateNow', 'Praticar agora')}
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-start gap-2 pt-2 border-t border-border">
                  <Award className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <p className="text-sm text-accent">{bloco.evidencia}</p>
                </div>
              </div>
            );
          })}
          
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="w-full gap-2 text-muted-foreground"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  {t('sections.showLess')}
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  {t('sections.showMore')} ({data.blocos.length} {t('sections.daysCount')})
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}