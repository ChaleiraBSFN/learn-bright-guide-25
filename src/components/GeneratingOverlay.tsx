import { useTranslation } from "react-i18next";
import { BookOpen, Dumbbell, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

interface GeneratingOverlayProps {
  type: "study" | "exercise";
  isFinishing?: boolean;
}

/** Etapas mostradas enquanto o conteúdo é gerado. */
const STEPS = [
  { key: "understanding", target: 22, fallback: "Entendendo o tema" },
  { key: "topics", target: 55, fallback: "Montando os tópicos" },
  { key: "examples", target: 82, fallback: "Criando os exemplos" },
  { key: "finishing", target: 97, fallback: "Finalizando" },
];

/**
 * Overlay de geração com barra Liquid Glass preenchendo até 100%.
 * Usa apenas CSS + um timer leve, para não pesar em celulares simples.
 */
export function GeneratingOverlay({ type, isFinishing }: GeneratingOverlayProps) {
  const { t } = useTranslation();
  const isStudy = type === "study";
  const Icon = isStudy ? BookOpen : Dumbbell;

  const [progress, setProgress] = useState(4);

  // Avisa os botões flutuantes para recolherem durante a geração
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("lb_generating_changed", { detail: { generating: true } }));
    return () => {
      window.dispatchEvent(new CustomEvent("lb_generating_changed", { detail: { generating: false } }));
    };
  }, []);

  // Progresso suave: acelera no começo e desacelera perto do fim.
  useEffect(() => {
    if (isFinishing) {
      setProgress(100);
      return;
    }
    const id = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 97) return 97;
        const remaining = 97 - p;
        return Math.min(97, p + Math.max(0.35, remaining * 0.045));
      });
    }, 220);
    return () => window.clearInterval(id);
  }, [isFinishing]);

  const stepIndex = isFinishing
    ? STEPS.length - 1
    : Math.max(0, STEPS.findIndex((s) => progress <= s.target));
  const current = STEPS[stepIndex === -1 ? STEPS.length - 1 : stepIndex];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-background/90 backdrop-blur-[3px] transition-all duration-500 ease-out"
      style={{
        opacity: isFinishing ? 0 : 1,
        transform: isFinishing ? "scale(1.02)" : "scale(1)",
        willChange: "opacity, transform",
        pointerEvents: isFinishing ? "none" : "auto",
      }}
    >
      <div className="liquid-glass w-[min(26rem,88vw)] px-6 py-7">
        <div className="flex flex-col items-center gap-5">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div
              className="absolute h-16 w-16 rounded-full border-[3px] border-transparent border-t-primary border-r-primary/30"
              style={{ animation: "spin 1.2s linear infinite" }}
            />
            <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary via-secondary to-accent shadow-lg">
              {isFinishing ? (
                <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
              ) : (
                <Icon className="h-5 w-5 text-primary-foreground" />
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-base font-bold text-foreground">
              {isFinishing
                ? t("generating.studyDone", "Pronto! 🎉")
                : isStudy
                  ? t("generating.studyTitle", "Gerando material de estudo")
                  : t("generating.exerciseTitle", "Gerando exercícios")}
            </span>
            <span className="text-xs text-muted-foreground">
              {isFinishing
                ? t("generating.stepDone", "Tudo pronto")
                : t(`generating.step.${current.key}`, current.fallback)}
            </span>
          </div>

          {/* Barra Liquid Glass */}
          <div className="w-full space-y-2">
            <div className="glass-progress-track h-3.5">
              <div
                className="glass-progress-fill relative overflow-hidden"
                style={{ width: `${Math.round(isFinishing ? 100 : progress)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
              <span>{t("generating.progressLabel", "Progresso")}</span>
              <span className="tabular-nums text-foreground">
                {Math.round(isFinishing ? 100 : progress)}%
              </span>
            </div>
          </div>

          {!isFinishing && (
            <p className="max-w-xs text-center text-[11px] leading-snug text-muted-foreground">
              {t(
                "generating.complexityHint",
                "Pode demorar alguns segundos devido à geração de conteúdos complexos, imagens, diagramas e detalhes personalizados."
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
