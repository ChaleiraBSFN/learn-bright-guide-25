import { useTranslation } from "react-i18next";
import { PenTool, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ExercisesSectionProps {
  data: {
    titulo: string;
    lista: Array<{
      nivel: string;
      pergunta: string;
      resposta: string;
      explicacao: string;
    }>;
  };
}

export function ExercisesSection({ data }: ExercisesSectionProps) {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const { t, i18n } = useTranslation();

  const toggleReveal = (index: number) => {
    setRevealed(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const getLevelTranslation = (nivel: string) => {
    // We keep the AI "nivel" values in PT-BR for consistency, and translate for display.
    if (i18n.language === 'pt-BR') return nivel;

    const dictEn: Record<string, string> = {
      'Aquecimento': 'Warm-up',
      'Básico': 'Basic',
      'Básico 2': 'Basic 2',
      'Intermediário': 'Intermediate',
      'Intermediário 2': 'Intermediate 2',
      'Médio': 'Intermediate',
      'Avançado': 'Advanced',
      'Avançado 2': 'Advanced 2',
      'Desafio': 'Challenge',
      'Desafio Master': 'Master Challenge',
      'Desafio Extra': 'Extra Challenge',
      'Aplicação Real': 'Real-world Application',
    };

    const dictEs: Record<string, string> = {
      'Aquecimento': 'Calentamiento',
      'Básico': 'Básico',
      'Básico 2': 'Básico 2',
      'Intermediário': 'Intermedio',
      'Intermediário 2': 'Intermedio 2',
      'Médio': 'Intermedio',
      'Avançado': 'Avanzado',
      'Avançado 2': 'Avanzado 2',
      'Desafio': 'Desafío',
      'Desafio Master': 'Desafío Maestro',
      'Desafio Extra': 'Desafío Extra',
      'Aplicação Real': 'Aplicación Real',
    };

    const dict = i18n.language === 'es' ? dictEs : dictEn;

    // Handle prefixes like "Básico 3" gracefully
    for (const key of Object.keys(dict)) {
      if (nivel === key) return dict[key];
      if (nivel.startsWith(key + ' ')) return dict[key] + nivel.slice(key.length);
    }

    return nivel;
  };

  const nivelColors: Record<string, string> = {
    "Básico": "bg-secondary/20 text-secondary border-secondary/30",
    "Médio": "bg-accent/20 text-accent border-accent/30",
    "Desafio": "bg-destructive/20 text-destructive border-destructive/30",
  };

  return (
    <section className="section-card bg-card border border-border fade-in" style={{ animationDelay: '0.4s' }}>
      <div className="absolute left-0 top-0 h-full w-1.5 rounded-l-2xl bg-section-exercises" />
      <div className="space-y-4">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl bg-section-exercises/10">
            <PenTool className="h-5 w-5 md:h-6 md:w-6 text-section-exercises" />
          </div>
          <h3 className="font-display text-lg md:text-xl font-bold text-foreground pt-1 md:pt-2">
            4. {data.titulo}
          </h3>
        </div>
        
        <div className="ml-0 md:ml-16 space-y-3 md:space-y-4">
          {data.lista.map((exercicio, index) => (
            <div key={index} className="rounded-xl border border-border bg-background/50 p-3 md:p-4 space-y-2 md:space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-2 md:px-3 py-1 rounded-full border ${nivelColors[exercicio.nivel] || 'bg-muted text-muted-foreground'}`}>
                  {getLevelTranslation(exercicio.nivel)}
                </span>
              </div>
              <p className="font-medium text-foreground text-sm md:text-base">{exercicio.pergunta}</p>
              
              {revealed[index] ? (
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-secondary">{exercicio.resposta}</p>
                      <p className="text-sm text-muted-foreground mt-1">{exercicio.explicacao}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleReveal(index)}
                  className="w-full"
                >
                  {t('sections.viewAnswer')}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}