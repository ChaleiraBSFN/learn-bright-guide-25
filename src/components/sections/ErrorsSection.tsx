import { useTranslation } from "react-i18next";
import { AlertTriangle, ShieldCheck } from "lucide-react";

interface ErrorsSectionProps {
  data: {
    titulo: string;
    lista: Array<{
      erro: string;
      comoEvitar: string;
    }>;
  };
}

export function ErrorsSection({ data }: ErrorsSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="section-card bg-card border border-border fade-in" style={{ animationDelay: '0.5s' }}>
      <div className="absolute left-0 top-0 h-full w-1.5 rounded-l-2xl bg-section-errors" />
      <div className="space-y-4">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl bg-section-errors/10">
            <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-section-errors" />
          </div>
          <h3 className="font-display text-lg md:text-xl font-bold text-foreground pt-1 md:pt-2">
            5. {data.titulo}
          </h3>
        </div>
        
        <div className="ml-0 md:ml-16 space-y-3">
          {data.lista.map((item, index) => (
            <div key={index} className="rounded-xl border border-border bg-background/50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-section-errors shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-medium text-foreground">{item.erro}</p>
                  <div className="flex items-start gap-2 text-sm">
                    <ShieldCheck className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                    <p className="text-secondary">{item.comoEvitar}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}