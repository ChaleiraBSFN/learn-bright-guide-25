import { useTranslation } from "react-i18next";
import { Camera, CheckCircle2, BookOpen, Lightbulb } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ImageAnalysisData {
  titulo: string;
  descricao: string;
  exerciciosIdentificados?: Array<{
    numero: number;
    enunciado: string;
    resolucao: string;
    explicacao: string;
  }>;
  conceitosExtraidos?: string[];
  observacoes?: string;
}

interface ImageAnalysisSectionProps {
  data: ImageAnalysisData;
}

export function ImageAnalysisSection({ data }: ImageAnalysisSectionProps) {
  const { t } = useTranslation();

  return (
    <Accordion type="single" collapsible defaultValue="image-analysis">
      <AccordionItem value="image-analysis" className="card-elevated border rounded-2xl overflow-hidden">
        <AccordionTrigger className="px-4 md:px-6 py-4 hover:no-underline">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
              <Camera className="h-5 w-5 text-violet-600" />
            </div>
            <div className="text-left">
              <h3 className="font-display text-base md:text-lg font-bold text-foreground">
                {data.titulo || t('result.imageAnalysis', 'Análise da Imagem')}
              </h3>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 md:px-6 pb-4 space-y-4">
          {/* Description */}
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {data.descricao}
          </p>

          {/* Extracted concepts */}
          {data.conceitosExtraidos && data.conceitosExtraidos.length > 0 && (
            <div className="space-y-2">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <BookOpen className="h-4 w-4 text-primary" />
                {t('result.extractedConcepts', 'Conceitos Identificados')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.conceitosExtraidos.map((conceito, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
                  >
                    {conceito}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Exercises found in the image */}
          {data.exerciciosIdentificados && data.exerciciosIdentificados.length > 0 && (
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {t('result.solvedExercises', 'Exercícios Resolvidos da Imagem')}
              </h4>
              <div className="space-y-3">
                {data.exerciciosIdentificados.map((ex, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-card p-4 space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {ex.numero}
                      </span>
                      <p className="text-sm font-medium text-foreground">{ex.enunciado}</p>
                    </div>
                    <div className="ml-8 space-y-2">
                      <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                          {t('result.solution', 'Resolução')}:
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{ex.resolucao}</p>
                      </div>
                      <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">
                          <Lightbulb className="inline h-3.5 w-3.5 mr-1" />
                          {t('result.explanation', 'Explicação')}:
                        </p>
                        <p className="text-sm text-foreground">{ex.explicacao}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional observations */}
          {data.observacoes && (
            <div className="rounded-lg bg-muted/50 border border-border p-3">
              <p className="text-xs text-muted-foreground italic">{data.observacoes}</p>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
