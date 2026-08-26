import { FormEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, ArrowRight, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { motion } from "framer-motion";

interface IntroScreenProps {
  onSubmitTopic: (topic: string) => void;
  onExplore: () => void;
}

/**
 * Gemini-style intro: on first load only the greeting and a single centered
 * glass input are visible. The rest of the home reveals after interaction.
 */
export const IntroScreen = ({ onSubmitTopic, onExplore }: IntroScreenProps) => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 350);
    return () => window.clearTimeout(timer);
  }, []);

  const chips = [
    t("home.chip1", "Fotossíntese"),
    t("home.chip2", "Revolução Francesa"),
    t("home.chip3", "Equação do 2º grau"),
    t("home.chip4", "Tabela periódica"),
    t("home.chip5", "Present Perfect"),
  ];

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const topic = value.trim();
    if (topic) onSubmitTopic(topic);
    else onExplore();
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative isolate flex min-h-[62vh] flex-col items-center justify-center gap-8 px-2 text-center"
    >
      <div className="hero-aurora" aria-hidden="true" />

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? t("theme.light", "Tema claro") : t("theme.dark", "Tema escuro")}
        className="liquid-glass-soft absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center text-foreground"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <div className="space-y-4">
        <span className="liquid-glass-soft inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-primary md:text-sm">
          <Sparkles className="h-4 w-4" />
          {t("hero.badge")}
        </span>
        <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl md:text-6xl">
          {t("hero.title")} <span className="gradient-text">{t("hero.titleHighlight")}</span>
        </h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground md:text-lg">{t("hero.description")}</p>
      </div>

      <form onSubmit={submit} className="w-full max-w-xl">
        <div className="liquid-glass flex items-center gap-2 rounded-full p-2 pl-5 transition-shadow focus-within:shadow-[0_0_0_2px_hsl(var(--primary)/0.5)]">
          <Sparkles className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
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
      </form>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => onSubmitTopic(chip)}
            className="liquid-glass-soft px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:text-primary"
          >
            {chip}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onExplore}
        className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
      >
        {t("intro.explore", "Explorar a página inicial")}
      </button>
    </motion.section>
  );
};
