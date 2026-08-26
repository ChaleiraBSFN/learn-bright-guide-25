import { FormEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, ArrowRight, BookOpen, PenTool, CalendarDays, History } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

export type IntroMode = "study" | "plan" | "exercises" | "history";

interface IntroScreenProps {
  onSubmitTopic: (topic: string, mode: IntroMode) => void;
  onExplore: () => void;
}

const MODE_ICONS: Record<IntroMode, typeof BookOpen> = {
  study: BookOpen,
  plan: CalendarDays,
  exercises: PenTool,
  history: History,
};

const MODE_LABEL_KEYS: Record<IntroMode, string> = {
  study: "tabs.study",
  plan: "tabs.plan",
  exercises: "tabs.exercises",
  history: "tabs.history",
};

/**
 * Gemini-style intro: on first load only the greeting and a single centered
 * glass input are visible. The rest of the home reveals after interaction.
 */
export const IntroScreen = ({ onSubmitTopic, onExplore }: IntroScreenProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<IntroMode>("study");
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  const chips = [
    t("home.chip1", "Fotossíntese"),
    t("home.chip2", "Revolução Francesa"),
    t("home.chip3", "Equação do 2º grau"),
    t("home.chip4", "Tabela periódica"),
    t("home.chip5", "Present Perfect"),
  ];

  const modes: IntroMode[] = user
    ? ["study", "plan", "exercises", "history"]
    : ["study", "plan", "exercises"];

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const topic = value.trim();
    if (mode === "history") {
      onSubmitTopic("", "history");
      return;
    }
    if (topic) onSubmitTopic(topic, mode);
    else onExplore();
  };

  const ModeIcon = MODE_ICONS[mode];

  return (
    <section className="relative isolate flex min-h-[calc(100svh-170px)] flex-col items-center justify-center gap-8 px-2 text-center">
      <motion.div
        className="hero-aurora"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
      />

      {/* Input zooms in first */}
      <motion.form
        onSubmit={submit}
        className="order-2 w-full max-w-xl"
        initial={{ opacity: 0, scale: 1.18 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="liquid-glass relative flex items-center gap-2 rounded-full p-2 pl-3 transition-shadow focus-within:shadow-[0_0_0_2px_hsl(var(--primary)/0.5)]">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={t(MODE_LABEL_KEYS[mode])}
              aria-expanded={menuOpen}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10"
            >
              <ModeIcon className="h-5 w-5" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="liquid-glass absolute bottom-12 left-0 z-50 w-56 overflow-hidden rounded-2xl p-1.5 text-left"
                >
                  {modes.map((m) => {
                    const Icon = MODE_ICONS[m];
                    const active = m === mode;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setMode(m);
                          setMenuOpen(false);
                          if (m === "history") onSubmitTopic("", "history");
                          else inputRef.current?.focus({ preventScroll: true });
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                          active ? "bg-primary/15 text-primary" : "text-foreground hover:bg-muted/60"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {t(MODE_LABEL_KEYS[m])}
                        {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("intro.placeholder", "O que você quer aprender hoje?")}
            aria-label={t("intro.placeholder", "O que você quer aprender hoje?")}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground md:text-base"
          />
          <button
            type="submit"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95"
            aria-label={t("intro.button", "Gerar")}
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </motion.form>

      {/* Texts, chips and actions fade in right after */}
      <motion.div
        className="order-1 space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
      >
        <span className="liquid-glass-soft inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-primary md:text-sm">
          <Sparkles className="h-4 w-4" />
          {t("hero.badge")}
        </span>
        <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl md:text-6xl">
          {t("hero.title")} <span className="gradient-text">{t("hero.titleHighlight")}</span>
        </h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground md:text-lg">{t("hero.description")}</p>
      </motion.div>

      <motion.div
        className="order-3 flex flex-wrap items-center justify-center gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45, ease: "easeOut" }}
      >
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => onSubmitTopic(chip, mode === "history" ? "study" : mode)}
            className="liquid-glass-soft px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:text-primary"
          >
            {chip}
          </button>
        ))}
      </motion.div>

      <motion.button
        type="button"
        onClick={onExplore}
        className="liquid-glass-soft order-4 border-2 border-primary/40 px-5 py-2 text-sm font-semibold text-foreground transition-all hover:border-primary hover:text-primary"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.55, ease: "easeOut" }}
      >
        {t("intro.explore", "Explorar a página inicial")}
      </motion.button>
    </section>
  );
};
