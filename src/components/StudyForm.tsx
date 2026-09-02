import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BookOpen,
  GraduationCap,
  HelpCircle,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Brain,
  CalendarClock,
  RefreshCw,
  Target,
  Calculator,
  Magnet,
  FlaskConical,
  Dna,
  Landmark,
  Globe2,
  Languages,
  PenLine,
  Code2,
  type LucideIcon,
} from "lucide-react";
import { StudyFormData, StudyGoal } from "@/types/study";
import { setExamMode } from "@/lib/examMode";
import { ImageUpload } from "./ImageUpload";

interface StudyFormProps {
  onSubmit: (data: StudyFormData) => void;
  isLoading: boolean;
  /** Tema sugerido (chips do hero). Preenche o campo quando muda. */
  presetTema?: string;
}

const SUBJECTS: Array<{ key: string; icon: LucideIcon }> = [
  { key: "math", icon: Calculator },
  { key: "physics", icon: Magnet },
  { key: "chemistry", icon: FlaskConical },
  { key: "biology", icon: Dna },
  { key: "history", icon: Landmark },
  { key: "geography", icon: Globe2 },
  { key: "portuguese", icon: BookOpen },
  { key: "english", icon: Languages },
  { key: "essay", icon: PenLine },
  { key: "programming", icon: Code2 },
  { key: "other", icon: Sparkles },
];

const GOALS: Array<{ key: StudyGoal; icon: typeof Brain }> = [
  { key: "understand", icon: Brain },
  { key: "exam", icon: CalendarClock },
  { key: "review", icon: RefreshCw },
];

const stepVariants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

export function StudyForm({ onSubmit, isLoading, presetTema }: StudyFormProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [materia, setMateria] = useState<string>("");
  const [objetivo, setObjetivo] = useState<StudyGoal>("understand");
  const [dataProva, setDataProva] = useState("");
  const [notaAlvo, setNotaAlvo] = useState("");
  const [modoResumo, setModoResumo] = useState(false);
  const [tema, setTema] = useState("");
  const [nivel, setNivel] = useState("");
  const [duvidas, setDuvidas] = useState("");
  const [imagemBase64, setImagemBase64] = useState<string | undefined>();
  const temaRef = useRef<HTMLInputElement>(null);

  const focusTema = () => {
    const el = temaRef.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Abre já com o cursor no campo de tema quando chega no último passo.
  useEffect(() => {
    if (step !== 2) return;
    const id = window.setTimeout(focusTema, 220);
    return () => window.clearTimeout(id);
  }, [step]);

  // Chips do hero preenchem o tema e pulam direto para os detalhes.
  useEffect(() => {
    if (!presetTema) return;
    setTema(presetTema);
    setStep(2);
  }, [presetTema]);

  const niveis = [
    { value: "fundamental1", label: t("form.levelFundamental1") },
    { value: "fundamental2", label: t("form.levelFundamental2") },
    { value: "medio", label: t("form.levelMedio") },
    { value: "superior", label: t("form.levelSuperior") },
  ];

  const hasImage = !!imagemBase64;
  const canSubmit = hasImage || (!!tema && !!nivel);

  const todayIso = new Date().toISOString().slice(0, 10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const nota = notaAlvo ? Math.min(10, Math.max(0, Number(notaAlvo))) : undefined;
    const provaValida = objetivo === "exam" && dataProva >= todayIso ? dataProva : undefined;

    if (provaValida) {
      setExamMode({ materia, tema, dataProva: provaValida, notaAlvo: nota });
    }

    onSubmit({
      tema: tema || (hasImage ? t("form.imageOnlyTopic") : ""),
      nivel: nivel || (hasImage ? "auto" : ""),
      duvidas,
      imagemBase64,
      materia: materia || undefined,
      objetivo,
      dataProva: provaValida,
      notaAlvo: nota,
      modoResumo,
    });
  };

  const steps = [t("form.steps.subject"), t("form.steps.goal"), t("form.steps.details")];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Indicador de passos */}
      <div className="flex items-center gap-2">
        {steps.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(i)}
            className="group flex flex-1 flex-col gap-1.5 text-left"
            aria-current={step === i}
          >
            <span className="h-1.5 overflow-hidden rounded-full bg-muted/40">
              <motion.span
                className="block h-full rounded-full bg-gradient-to-r from-secondary to-primary"
                initial={false}
                animate={{ width: step >= i ? "100%" : "0%" }}
                transition={{ duration: 0.35 }}
              />
            </span>
            <span className={`text-xs font-medium ${step === i ? "text-foreground" : "text-muted-foreground"}`}>
              {label}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={stepVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="space-y-5"
        >
          {step === 0 && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-medium">
                <BookOpen className="h-4 w-4 text-primary" />
                {t("form.subjectTitle")}{" "}
                <span className="text-xs font-normal text-muted-foreground">{t("form.optional")}</span>
              </Label>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {SUBJECTS.map((s, i) => (
                  <motion.button
                    key={s.key}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => {
                      setMateria(s.key);
                      setStep(1);
                    }}
                    data-selected={materia === s.key}
                    className="chip-glass flex items-center gap-2"
                  >
                    <s.icon className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">{t(`form.subjects.${s.key}`)}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <Label className="flex items-center gap-2 text-base font-medium">
                <Target className="h-4 w-4 text-secondary" />
                {t("form.goalTitle")}
              </Label>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {GOALS.map((g, i) => (
                  <motion.button
                    key={g.key}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setObjetivo(g.key)}
                    data-selected={objetivo === g.key}
                    className="chip-glass flex flex-col items-start gap-1 p-4 text-left"
                  >
                    <g.icon className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{t(`form.goals.${g.key}.title`)}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {t(`form.goals.${g.key}.desc`)}
                    </span>
                  </motion.button>
                ))}
              </div>

              <AnimatePresence>
                {objetivo === "exam" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid gap-4 overflow-hidden sm:grid-cols-2"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="dataProva">{t("form.examDate")}</Label>
                      <Input
                        id="dataProva"
                        type="date"
                        min={todayIso}
                        value={dataProva}
                        onChange={(e) => setDataProva(e.target.value)}
                        className="h-12 rounded-full bg-card/60 px-5 backdrop-blur-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notaAlvo">{t("form.targetGrade")}</Label>
                      <Input
                        id="notaAlvo"
                        type="number"
                        min={0}
                        max={10}
                        step={0.5}
                        inputMode="decimal"
                        placeholder="8"
                        value={notaAlvo}
                        onChange={(e) => setNotaAlvo(e.target.value)}
                        className="h-12 rounded-full bg-card/60 px-5 backdrop-blur-xl"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              {hasImage && (
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 text-sm text-foreground">
                  ✨ {t("form.imageDetected")}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="tema" className="flex items-center gap-2 text-base font-medium">
                  <BookOpen className="h-4 w-4 text-primary" />
                  {t("form.topic")}{" "}
                  {hasImage && <span className="text-xs font-normal text-muted-foreground">{t("form.optional")}</span>}
                </Label>
                <Input
                  id="tema"
                  ref={temaRef}
                  autoFocus
                  placeholder={hasImage ? t("form.optional") : t("form.topicPlaceholder")}
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  required={!hasImage}
                  className="h-12 rounded-full bg-card/60 px-5 backdrop-blur-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nivel" className="flex items-center gap-2 text-base font-medium">
                  <GraduationCap className="h-4 w-4 text-secondary" />
                  {t("form.level")}{" "}
                  {hasImage && <span className="text-xs font-normal text-muted-foreground">{t("form.optional")}</span>}
                </Label>
                <Select value={nivel} onValueChange={setNivel} required={!hasImage}>
                  <SelectTrigger id="nivel" className="h-12 rounded-full bg-card/60 px-5 backdrop-blur-xl">
                    <SelectValue placeholder={hasImage ? t("form.optional") : t("form.selectLevel")} />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    {niveis.map((n) => (
                      <SelectItem key={n.value} value={n.value}>
                        {n.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duvidas" className="flex items-center gap-2 text-base font-medium">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  {t("form.doubts")}{" "}
                  <span className="text-xs font-normal text-muted-foreground">{t("form.optional")}</span>
                </Label>
                <Textarea
                  id="duvidas"
                  placeholder={t("form.doubtsPlaceholder")}
                  value={duvidas}
                  onChange={(e) => setDuvidas(e.target.value)}
                  className="rounded-2xl bg-card/60 px-5 py-3 backdrop-blur-xl"
                />
              </div>

              <div className="depth-card flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-semibold text-foreground">{t("form.summaryMode")}</p>
                  <p className="text-sm text-muted-foreground">{t("form.summaryModeHint")}</p>
                </div>
                <Switch checked={modoResumo} onCheckedChange={setModoResumo} aria-label={t("form.summaryMode")} />
              </div>

              <ImageUpload onImageChange={setImagemBase64} disabled={isLoading} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center gap-3">
        {step > 0 && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="liquid-btn rounded-full"
            onClick={() => setStep((s) => s - 1)}
          >
            <ArrowLeft className="h-4 w-4" />
            {t("form.back")}
          </Button>
        )}

        {step < 2 ? (
          <Button
            type="button"
            variant="hero"
            size="lg"
            className="liquid-btn flex-1 rounded-full"
            onClick={() => setStep((s) => s + 1)}
          >
            {t("form.next")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            variant="hero"
            size="xl"
            className="liquid-btn flex-1 rounded-full"
            disabled={isLoading || !canSubmit}
          >
            {isLoading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                {t("form.generating")}
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                {t("form.generate")}
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  );
}
