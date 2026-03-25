import { Target } from "lucide-react";

interface ObjectiveSectionProps {
  data: {
    titulo: string;
    conteudo: string;
  };
}

export function ObjectiveSection({ data }: ObjectiveSectionProps) {
  return (
    <section className="section-card bg-card border border-border fade-in" style={{ animationDelay: '0.1s' }}>
      <div className="absolute left-0 top-0 h-full w-1.5 rounded-l-2xl bg-section-objective" />
      <div className="flex items-start gap-3 md:gap-4">
        <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl bg-section-objective/10">
          <Target className="h-5 w-5 md:h-6 md:w-6 text-section-objective" />
        </div>
        <div className="space-y-2 min-w-0">
          <h3 className="font-display text-lg md:text-xl font-bold text-foreground">
            1. {data.titulo}
          </h3>
          <p className="text-sm md:text-base leading-relaxed text-foreground/90">
            {data.conteudo}
          </p>
        </div>
      </div>
    </section>
  );
}
