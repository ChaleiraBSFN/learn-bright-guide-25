import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, PenTool, CalendarDays, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HowItWorksProps {
  onOpenTab: (tab: string) => void;
}

export const HowItWorks = ({ onOpenTab }: HowItWorksProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState<string | null>("study");

  const blocks = [
    {
      id: "study",
      icon: BookOpen,
      title: t("home.how.study", "Estudo completo"),
      desc: t("home.how.studyDesc", "Objetivo, resumo, passo a passo, mapa mental e fontes — tudo em um material só."),
      sample: t("home.how.studySample", "Exemplo: “Fotossíntese” vira resumo em tópicos, esquema visual do processo e erros comuns em provas."),
    },
    {
      id: "exercises",
      icon: PenTool,
      title: t("home.how.exercises", "Exercícios corrigidos"),
      desc: t("home.how.exercisesDesc", "Questões objetivas e discursivas com correção comentada na hora."),
      sample: t("home.how.exercisesSample", "Exemplo: 10 questões de equação do 2º grau com gabarito explicado passo a passo."),
    },
    {
      id: "plan",
      icon: CalendarDays,
      title: t("home.how.plan", "Plano de estudos"),
      desc: t("home.how.planDesc", "Cronograma dia a dia adaptado ao seu tempo disponível."),
      sample: t("home.how.planSample", "Exemplo: 30 dias para o ENEM com metas diárias e revisões espaçadas."),
    },
  ];

  return (
    <section aria-labelledby="how-heading" className="space-y-3">
      <div className="text-center">
        <h2 id="how-heading" className="font-display text-xl font-bold text-foreground md:text-2xl">
          {t("home.how.title", "Veja funcionando")}
        </h2>
        <p className="text-xs text-muted-foreground md:text-sm">
          {t("home.how.subtitle", "Três formas de estudar com o Learn Buddy.")}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {blocks.map(({ id, icon: Icon, title, desc, sample }) => {
          const isOpen = open === id;
          return (
            <div
              key={id}
              className={`rounded-xl border-2 bg-card p-4 transition-colors ${isOpen ? "border-primary" : "border-border/50"}`}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : id)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-2 text-left"
              >
                <Icon className="h-4 w-4 shrink-0 text-primary" />
                <span className="flex-1 text-sm font-bold text-foreground">{title}</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <p className="mt-2 text-xs text-muted-foreground">{desc}</p>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <p className="mt-3 rounded-lg bg-muted/60 p-3 text-xs text-foreground">{sample}</p>
                    <button
                      type="button"
                      onClick={() => onOpenTab(id)}
                      className="mt-3 text-xs font-bold text-primary hover:underline"
                    >
                      {t("home.how.cta", "Experimentar agora")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
};
