import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, Target, X, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getExamMode, clearExamMode, daysUntil, EXAM_MODE_EVENT, type ExamModeState } from "@/lib/examMode";

interface ExamModeCardProps {
  onTrain?: (tema: string) => void;
}

export default function ExamModeCard({ onTrain }: ExamModeCardProps) {
  const { t } = useTranslation();
  const [exam, setExam] = useState<ExamModeState | null>(null);

  useEffect(() => {
    const sync = () => setExam(getExamMode());
    sync();
    window.addEventListener(EXAM_MODE_EVENT, sync);
    return () => window.removeEventListener(EXAM_MODE_EVENT, sync);
  }, []);

  if (!exam) return null;

  const days = daysUntil(exam.dataProva);
  const label = days === 0 ? t("examMode.today") : t("examMode.daysLeft", { days });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="depth-card mb-6 flex flex-wrap items-center gap-4 p-5"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15">
          <CalendarClock className="h-6 w-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">{t("examMode.title")}</p>
          <p className="text-lg font-bold text-foreground">{label}</p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {exam.tema && <span className="line-clamp-1">{exam.tema}</span>}
            {typeof exam.notaAlvo === "number" && (
              <span className="inline-flex items-center gap-1">
                <Target className="h-3.5 w-3.5" />
                {t("examMode.goal", { grade: exam.notaAlvo })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onTrain && exam.tema && (
            <Button
              variant="hero"
              size="sm"
              className="liquid-btn rounded-full"
              onClick={() => onTrain(exam.tema as string)}
            >
              <Dumbbell className="h-4 w-4" />
              {t("examMode.train")}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label={t("examMode.clear")}
            onClick={() => clearExamMode()}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
