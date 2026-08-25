import { useTranslation } from "react-i18next";
import { BookOpen, Dumbbell, CheckCircle2 } from "lucide-react";
import { useEffect } from "react";

interface GeneratingOverlayProps {
  type: "study" | "exercise";
  isFinishing?: boolean;
}

/**
 * Lightweight generating overlay: pure CSS animations (no framer-motion,
 * no particles/confetti) so the UI stays smooth on low-end devices.
 */
export function GeneratingOverlay({ type, isFinishing }: GeneratingOverlayProps) {
  const { t } = useTranslation();
  const isStudy = type === "study";
  const Icon = isStudy ? BookOpen : Dumbbell;

  // Notify floating actions to collapse while generating
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('lb_generating_changed', { detail: { generating: true } }));
    return () => {
      window.dispatchEvent(new CustomEvent('lb_generating_changed', { detail: { generating: false } }));
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-background/90 backdrop-blur-[2px] transition-all duration-500 ease-out"
      style={{
        opacity: isFinishing ? 0 : 1,
        transform: isFinishing ? "scale(1.02)" : "scale(1)",
        willChange: "opacity, transform",
        pointerEvents: isFinishing ? "none" : "auto",
      }}
    >
      <div className="flex flex-col items-center gap-6 px-6">
        <div className="relative flex h-24 w-24 items-center justify-center">
          {/* Outer ring */}
          <div
            className="absolute h-20 w-20 rounded-full border-[3px] border-transparent border-t-primary border-r-primary/30"
            style={{ animation: "spin 1.1s linear infinite" }}
          />
          {/* Inner ring */}
          <div
            className="absolute h-12 w-12 rounded-full border-2 border-transparent border-b-secondary border-l-secondary/30"
            style={{ animation: "spin 1.6s linear infinite reverse" }}
          />
          {/* Center icon */}
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary via-secondary to-accent shadow-lg">
            {isFinishing ? (
              <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
            ) : (
              <Icon className="h-5 w-5 text-primary-foreground" />
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-lg font-bold text-foreground">
            {isFinishing
              ? t('generating.studyDone', 'Pronto! 🎉')
              : isStudy
                ? t('generating.studyTitle', 'Gerando material de estudo')
                : t('generating.exerciseTitle', 'Gerando exercícios')}
          </span>

          {!isFinishing && (
            <p className="max-w-xs text-[11px] leading-snug text-muted-foreground">
              {t(
                'generating.complexityHint',
                'Pode demorar alguns segundos devido à geração de conteúdos complexos, imagens, diagramas e detalhes personalizados. Às vezes as imagens podem não ser geradas caso o limite de requisições seja excedido.'
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
