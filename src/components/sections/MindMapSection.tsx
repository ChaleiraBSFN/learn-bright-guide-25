import { Map, Loader2 } from "lucide-react";

interface AIImage {
  tipo: "ai";
  label?: string;
  url: string;
  descricao: string;
}

interface MindMapSectionProps {
  data: {
    titulo: string;
    temaCentral: string;
    ramos: Array<{
      nome: string;
      icone: string;
      cor: string;
      subitens: string[];
    }>;
  };
  aiImages?: AIImage[];
  imagesLoading?: boolean;
}

const colorClasses: Record<string, { bg: string; text: string; border: string; line: string }> = {
  blue: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300", line: "stroke-blue-400" },
  green: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300", line: "stroke-emerald-400" },
  amber: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300", line: "stroke-amber-400" },
  purple: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300", line: "stroke-purple-400" },
  rose: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-300", line: "stroke-rose-400" },
  cyan: { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-300", line: "stroke-cyan-400" },
};

export function MindMapSection({ data, aiImages, imagesLoading }: MindMapSectionProps) {
  const mindmapCenterImage = aiImages?.find(img => img.label === "mindmap-center");
  const mindmapBranchImage = aiImages?.find(img => img.label === "mindmap-branch");

  return (
    <section className="section-card bg-card border border-border fade-in" style={{ animationDelay: '0.6s' }}>
      <div className="absolute left-0 top-0 h-full w-1.5 rounded-l-2xl bg-section-mindmap" />
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl bg-section-mindmap/10">
            <Map className="h-5 w-5 md:h-6 md:w-6 text-section-mindmap" />
          </div>
          <h3 className="font-display text-lg md:text-xl font-bold text-foreground pt-1 md:pt-2">
            6. {data.titulo}
          </h3>
        </div>
        
        <div className="ml-0 md:ml-16">
          {/* Central Theme with Image */}
          <div className="flex flex-col items-center mb-8 relative">
            {mindmapCenterImage && (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-primary shadow-xl mb-4">
                <img
                  src={mindmapCenterImage.url}
                  alt={mindmapCenterImage.descricao}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            {imagesLoading && !mindmapCenterImage && (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-primary/30 bg-muted/50 flex items-center justify-center mb-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
              </div>
            )}
            <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-base md:text-lg shadow-lg text-center relative z-10">
              {data.temaCentral}
            </div>
            
            {/* SVG arrows from center to branches */}
            <svg className="absolute top-full left-1/2 -translate-x-1/2 w-full h-12 pointer-events-none" viewBox="0 0 400 48" preserveAspectRatio="none">
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" className="fill-primary/40" />
                </marker>
              </defs>
              {data.ramos.map((_, i) => {
                const totalBranches = data.ramos.length;
                const xEnd = ((i + 0.5) / totalBranches) * 400;
                return (
                  <path
                    key={i}
                    d={`M200,0 Q${200 + (xEnd - 200) * 0.3},24 ${xEnd},48`}
                    fill="none"
                    strokeWidth="2"
                    className="stroke-primary/30"
                    markerEnd="url(#arrowhead)"
                    strokeDasharray="6 3"
                  />
                );
              })}
            </svg>
          </div>

          {/* Branches with connections */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 relative">
            {data.ramos.map((ramo, index) => {
              const colors = colorClasses[ramo.cor] || colorClasses.blue;
              return (
                <div
                  key={index}
                  className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-4 transition-all hover:scale-[1.02] hover:shadow-lg relative`}
                >
                  {/* Connection dot at top */}
                  <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 ${colors.border} bg-white`} />
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{ramo.icone}</span>
                    <h4 className={`font-semibold ${colors.text}`}>{ramo.nome}</h4>
                  </div>

                  {/* Summary arrow path */}
                  <div className="flex items-center gap-1 mb-2">
                    <div className={`h-0.5 flex-1 ${colors.bg} border-t-2 border-dashed ${colors.border}`} />
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <polygon points="0,2 12,6 0,10" className={`${colors.text} fill-current opacity-40`} />
                    </svg>
                  </div>

                  <ul className="space-y-1.5">
                    {ramo.subitens.map((subitem, subIndex) => (
                      <li key={subIndex} className={`text-sm ${colors.text} flex items-start gap-2`}>
                        <svg className="mt-1.5 shrink-0" width="10" height="10" viewBox="0 0 10 10">
                          <circle cx="5" cy="5" r="4" fill="none" strokeWidth="1.5" className={`${colors.text} stroke-current`} />
                          <circle cx="5" cy="5" r="2" className={`${colors.text} fill-current`} />
                        </svg>
                        {subitem}
                      </li>
                    ))}
                  </ul>

                  {/* Inter-branch arrow for non-last items */}
                  {index < data.ramos.length - 1 && index % 3 !== 2 && (
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 hidden sm:block">
                      <svg width="20" height="16" viewBox="0 0 20 16">
                        <path d="M0,8 L14,8" fill="none" strokeWidth="1.5" className="stroke-muted-foreground/30" strokeDasharray="3 2" />
                        <polygon points="14,4 20,8 14,12" className="fill-muted-foreground/30" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mind Map Images Row */}
          {(mindmapBranchImage || imagesLoading) && (
            <div className="mt-6">
              {imagesLoading && !mindmapBranchImage && (
                <div className="rounded-xl border border-border bg-muted/30 p-6 flex items-center justify-center min-h-[160px]">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-section-mindmap/60" />
                    <span className="text-xs text-muted-foreground">Gerando diagrama...</span>
                  </div>
                </div>
              )}
              {mindmapBranchImage && (
                <div className="rounded-xl overflow-hidden border-2 border-section-mindmap/30 bg-card hover:shadow-lg transition-all">
                  <div className="aspect-[16/10] relative bg-muted">
                    <img
                      src={mindmapBranchImage.url}
                      alt={mindmapBranchImage.descricao}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3 flex items-center gap-2">
                    <Map className="h-4 w-4 text-section-mindmap shrink-0" />
                    <p className="text-xs text-muted-foreground line-clamp-1">{mindmapBranchImage.descricao}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
