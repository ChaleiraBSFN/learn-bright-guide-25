import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";

interface HeroProps {
  onPickTopic: (topic: string) => void;
}

export const Hero = ({ onPickTopic }: HeroProps) => {
  const { t } = useTranslation();

  const chips = [
    t("home.chip1", "Fotossíntese"),
    t("home.chip2", "Revolução Francesa"),
    t("home.chip3", "Equação do 2º grau"),
    t("home.chip4", "Tabela periódica"),
    t("home.chip5", "Present Perfect"),
  ];

  return (
    <section className="relative isolate space-y-5 px-2 py-6 text-center md:py-10">
      <div className="hero-aurora" aria-hidden="true" />

      <div className="flex items-center justify-center gap-2">
        <span className="liquid-glass-soft inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary md:px-4 md:text-sm">
          <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
          {t("hero.badge")}
        </span>
      </div>

      <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
        {t("hero.title")} <span className="gradient-text">{t("hero.titleHighlight")}</span>
      </h1>
      <p className="mx-auto max-w-xl text-sm text-muted-foreground md:text-lg">{t("hero.description")}</p>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <span className="text-xs text-muted-foreground">{t("home.chipsLabel", "Comece por:")}</span>
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => onPickTopic(chip)}
            className="liquid-glass-soft px-3.5 py-1.5 text-xs font-semibold text-foreground hover:text-primary"
          >
            {chip}
          </button>
        ))}
      </div>
    </section>
  );
};
