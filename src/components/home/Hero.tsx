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
    <section className="space-y-4 px-2 text-center">
      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary md:px-4 md:py-2 md:text-sm">
        <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
        {t("hero.badge")}
      </div>
      <h1 className="font-display text-2xl font-bold leading-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
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
            className="rounded-full border-2 border-border/60 bg-card px-3 py-1 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {chip}
          </button>
        ))}
      </div>
    </section>
  );
};
