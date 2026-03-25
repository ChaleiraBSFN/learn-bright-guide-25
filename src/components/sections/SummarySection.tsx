import { BookText, Loader2 } from "lucide-react";

interface AIImage {
  tipo: "ai";
  label?: string;
  url: string;
  descricao: string;
}

interface SummarySectionProps {
  data: {
    titulo: string;
    conteudo: string;
  };
  summaryImage?: AIImage;
  imagesLoading?: boolean;
}

export function SummarySection({ data, summaryImage, imagesLoading }: SummarySectionProps) {
  return (
    <section className="section-card bg-card border border-border fade-in" style={{ animationDelay: '0.2s' }}>
      <div className="absolute left-0 top-0 h-full w-1.5 rounded-l-2xl bg-section-summary" />
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-section-summary/10">
          <BookText className="h-6 w-6 text-section-summary" />
        </div>
        <div className="space-y-3 flex-1 min-w-0">
          <h3 className="font-display text-xl font-bold text-foreground">
            2. {data.titulo}
          </h3>

          {/* Inline image alongside summary */}
          <div className={`flex flex-col ${summaryImage ? 'md:flex-row' : ''} gap-4`}>
            <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-line flex-1">
              {data.conteudo}
            </p>
            {imagesLoading && !summaryImage && (
              <div className="w-full md:w-48 h-36 rounded-xl border border-border bg-muted/30 flex items-center justify-center shrink-0">
                <Loader2 className="h-5 w-5 animate-spin text-section-summary/50" />
              </div>
            )}
            {summaryImage && (
              <div className="w-full md:w-56 shrink-0 rounded-xl overflow-hidden border border-section-summary/30 shadow-sm hover:shadow-md transition-shadow">
                <img
                  src={summaryImage.url}
                  alt={summaryImage.descricao}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <p className="text-[10px] text-muted-foreground px-2 py-1 bg-muted/50">{summaryImage.descricao}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
