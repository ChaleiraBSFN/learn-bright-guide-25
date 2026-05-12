import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { ListOrdered, Lightbulb, BookOpen, Sparkles, Loader2, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { triggerRateLimit } from "@/components/RateLimitBar";
import { FormattedExplanation } from "@/components/FormattedExplanation";

interface AIImage {
  tipo: "ai";
  label?: string;
  url: string;
  descricao: string;
}

interface StepsSectionProps {
  data: {
    titulo: string;
    passos: Array<{
      numero: number;
      titulo: string;
      conceito: string;
      exemplo: string;
      dicaImportante?: string;
    }>;
  };
  stepsImage?: AIImage;
  stepImages?: AIImage[];
  imagesLoading?: boolean;
  tema?: string;
  nivel?: string;
}

export function StepsSection({ data, stepsImage, stepImages, imagesLoading, tema, nivel }: StepsSectionProps) {
  const { t } = useTranslation();
  const [explanations, setExplanations] = useState<Record<number, string>>({});
  const [loadingExp, setLoadingExp] = useState<Record<number, boolean>>({});
  const [currentLang, setCurrentLang] = useState(i18n.language);

  // Clear cached explanations when language changes so they can be regenerated
  useEffect(() => {
    const handleLangChange = (lng: string) => {
      if (lng !== currentLang) {
        setExplanations({});
        setCurrentLang(lng);
      }
    };
    i18n.on('languageChanged', handleLangChange);
    return () => { i18n.off('languageChanged', handleLangChange); };
  }, [currentLang]);

  const getStepImage = (index: number) => stepImages?.find(img => img.label === `step-${index}`);

  const handleVerMais = async (passoNumero: number, exemplo: string) => {
    if (explanations[passoNumero]) return;

    setLoadingExp(prev => ({ ...prev, [passoNumero]: true }));
    try {
      const lang = i18n.language || 'pt-BR';
      const { data: result, error } = await supabase.functions.invoke('explain-example', {
        body: { exemplo, contexto: data.titulo || "", idioma: lang, tema, nivel },
      });

      // Detect 429 from invoke errors (FunctionsHttpError exposes context.response)
      const status = (error as any)?.context?.response?.status;
      if (status === 429) {
        triggerRateLimit(60);
        throw new Error("Limite de requisições excedido. Aguarde alguns instantes.");
      }
      if (error) throw new Error(error.message || "Erro ao gerar explicação.");
      if (result?.error) {
        if (/limite|rate/i.test(result.error)) triggerRateLimit(60);
        throw new Error(result.error);
      }
      if (!result?.explicacao) throw new Error("Resposta vazia da IA.");

      setExplanations(prev => ({ ...prev, [passoNumero]: result.explicacao }));
    } catch (error: any) {
      console.error("Erro ao gerar explicação:", error);
      toast.error(error.message || t('sections.explainError', 'Erro ao gerar explicação. Tente novamente.'));
    } finally {
      setLoadingExp(prev => ({ ...prev, [passoNumero]: false }));
    }
  };

  return (
    <section className="section-card bg-card border border-border fade-in" style={{ animationDelay: '0.3s' }}>
      <div className="absolute left-0 top-0 h-full w-1.5 rounded-l-2xl bg-section-steps" />
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl bg-section-steps/10">
            <ListOrdered className="h-5 w-5 md:h-6 md:w-6 text-section-steps" />
          </div>
          <h3 className="font-display text-lg md:text-xl font-bold text-foreground pt-1 md:pt-2">
            3. {data.titulo}
          </h3>
        </div>
        
        <div className="ml-0 md:ml-16 space-y-4 md:space-y-6">
          {data.passos.map((passo, index) => {
            const img = getStepImage(index);
            return (
              <div 
                key={passo.numero} 
                className="relative rounded-xl border border-border/50 bg-muted/30 p-3 md:p-5 space-y-3 md:space-y-4"
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="flex h-7 w-7 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-section-steps text-xs md:text-sm font-bold text-primary-foreground">
                    {passo.numero}
                  </div>
                  <h4 className="font-display text-base md:text-lg font-semibold text-foreground">
                    {passo.titulo}
                  </h4>
                </div>

                {/* Concept with inline image */}
                <div className={`flex flex-col ${img ? 'md:flex-row' : ''} gap-4`}>
                  <div className="flex gap-2 md:gap-3 rounded-lg bg-background/50 p-3 md:p-4 border-l-4 border-primary flex-1">
                    <BookOpen className="h-4 w-4 md:h-5 md:w-5 shrink-0 text-primary mt-0.5" />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-1 block">
                        {t('sections.concept')}
                      </span>
                      <p className="text-foreground leading-relaxed text-sm md:text-base">
                        {passo.conceito}
                      </p>
                    </div>
                  </div>

                  {/* Step image */}
                  {imagesLoading && !img && index < 5 && (
                    <div className="w-full md:w-44 h-32 rounded-xl border border-border bg-muted/30 flex items-center justify-center shrink-0">
                      <Loader2 className="h-5 w-5 animate-spin text-section-steps/50" />
                    </div>
                  )}
                  {img && (
                    <div className="w-full md:w-48 shrink-0 rounded-xl overflow-hidden border border-section-steps/30 shadow-sm hover:shadow-md transition-shadow self-start">
                      <img
                        src={img.url}
                        alt={img.descricao}
                        className="w-full h-auto object-cover"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <p className="text-[10px] text-muted-foreground px-2 py-1 bg-muted/50 truncate">{img.descricao}</p>
                    </div>
                  )}
                </div>

                <div className="rounded-xl bg-accent/20 p-3 md:p-5 border border-accent/30 space-y-2 md:space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-accent-foreground" />
                      <span className="text-xs md:text-sm font-semibold uppercase tracking-wider text-accent-foreground">
                        {t('sections.practicalExample')}
                      </span>
                    </div>
                    {!explanations[passo.numero] && (
                      <div className="flex items-center gap-2">
                        {/* Flechinhas grandes e bem visíveis apontando para o botão */}
                        <span
                          className="hidden sm:inline-flex text-[11px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400"
                          style={{ animation: 'arrow-point 1.1s ease-in-out infinite' }}
                        >
                          Clique aqui
                        </span>
                        <ArrowRight
                          className="h-5 w-5 text-amber-500 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]"
                          style={{ animation: 'arrow-point 1.1s ease-in-out infinite' }}
                          strokeWidth={3}
                          aria-hidden="true"
                        />
                        <ArrowRight
                          className="h-5 w-5 -ml-2 text-amber-600 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]"
                          style={{ animation: 'arrow-point 1.1s ease-in-out infinite', animationDelay: '0.18s' }}
                          strokeWidth={3}
                          aria-hidden="true"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-9 text-xs px-3.5 font-bold bg-amber-400/90 text-amber-950 hover:bg-amber-400 border-2 border-amber-500 shadow-[0_0_0_4px_rgba(251,191,36,0.25)] transition-all"
                          onClick={() => handleVerMais(passo.numero, passo.exemplo)}
                          disabled={loadingExp[passo.numero]}
                        >
                          {loadingExp[passo.numero] ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          ) : (
                            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                          )}
                          {t('sections.seeMore', 'Ver mais')}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="pl-0 md:pl-7">
                    <ul className="space-y-1.5 text-xs md:text-sm text-foreground">
                      {passo.exemplo.split('\n').filter(l => l.trim()).map((linha, idx) => (
                        <li key={idx} className="flex items-start gap-2 leading-relaxed">
                          <span className="text-accent mt-1 shrink-0">•</span>
                          <span className="break-words">{linha.trim()}</span>
                        </li>
                      ))}
                    </ul>
                    {explanations[passo.numero] && (
                      <div className="mt-4 p-4 md:p-5 bg-background shadow-sm rounded-xl border border-accent/30 text-sm md:text-base text-foreground/90 leading-relaxed whitespace-pre-wrap animate-in fade-in zoom-in-95 duration-300">
                        {explanations[passo.numero]}
                      </div>
                    )}
                  </div>
                </div>

                {passo.dicaImportante && (
                  <div className="flex gap-2 md:gap-3 rounded-lg bg-section-steps/10 p-3 md:p-4 border-l-4 border-section-steps">
                    <Lightbulb className="h-4 w-4 md:h-5 md:w-5 shrink-0 text-section-steps mt-0.5" />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold uppercase tracking-wider text-section-steps mb-1 block">
                        {t('sections.importantTip')}
                      </span>
                      <p className="text-foreground leading-relaxed text-sm md:text-base">
                        {passo.dicaImportante}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
