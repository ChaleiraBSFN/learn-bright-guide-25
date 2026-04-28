import { useTranslation } from "react-i18next";
import { Search, ExternalLink, Globe } from "lucide-react";

interface SourcesSectionProps {
  data: {
    titulo: string;
    consultas: string[];
    sites: Array<{
      nome: string;
      url?: string;
      termoBusca?: string;
      descricao: string;
    }>;
  };
}

const buildSearchUrl = (q: string) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`;

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const openExternalLink = (event: React.MouseEvent<HTMLAnchorElement>, url: string) => {
  event.preventDefault();
  event.stopPropagation();
  const popup = window.open(url, "_blank", "noopener,noreferrer");
  if (!popup) {
    window.location.assign(url);
  }
};

const getKnownSiteSearchUrl = (siteName: string, query: string): string | null => {
  const name = normalizeText(siteName);
  const encoded = encodeURIComponent(query);

  if (name.includes("brasil escola")) return `https://brasilescola.uol.com.br/pesquisa?q=${encoded}`;
  if (name.includes("khan academy")) return `https://pt.khanacademy.org/search?page_search_query=${encoded}`;
  if (name.includes("toda materia") || name.includes("todamateria")) return `https://www.todamateria.com.br/?s=${encoded}`;
  if (name.includes("mundo educacao")) return `https://mundoeducacao.uol.com.br/pesquisa?q=${encoded}`;
  if (name.includes("wikipedia")) return `https://pt.wikipedia.org/w/index.php?search=${encoded}`;
  if (name.includes("youtube")) return `https://www.youtube.com/results?search_query=${encoded}`;
  if (name.includes("coursera")) return `https://www.coursera.org/search?query=${encoded}`;
  if (name.includes("edx")) return `https://www.edx.org/search?q=${encoded}`;

  return null;
};

const getResourceUrl = (site: { url?: string; termoBusca?: string; nome: string }): string => {
  const url = site.url?.trim();
  // Only use direct URL if it looks like a real, complete URL (has a domain with TLD)
  if (url && /^https?:\/\/[^\s/$.?#].[^\s]*\.[a-z]{2,}/i.test(url)) {
    return url;
  }
  const topic = site.termoBusca?.trim() || site.nome;
  const knownSiteUrl = getKnownSiteSearchUrl(site.nome, topic);
  if (knownSiteUrl) return knownSiteUrl;
  return buildSearchUrl(`${topic} ${site.nome}`);
};

export function SourcesSection({ data }: SourcesSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="section-card bg-card border border-border fade-in" style={{ animationDelay: "0.8s" }}>
      <div className="absolute left-0 top-0 h-full w-1.5 rounded-l-2xl bg-section-sources" />
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-section-sources/10">
            <Search className="h-6 w-6 text-section-sources" />
          </div>
          <h3 className="font-display text-xl font-bold text-foreground pt-2">8. {data.titulo}</h3>
        </div>

        <div className="ml-16 space-y-6">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t("sections.searchSuggestions")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.consultas.map((consulta, index) => {
                const url = buildSearchUrl(consulta);
                return (
                  <a
                    key={index}
                    href={url}
                    onClick={(event) => openExternalLink(event, url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Search className="h-3 w-3" />
                    {consulta}
                    <ExternalLink className="h-3 w-3 opacity-70" />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t("sections.recommendedSources")}
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.sites.map((site, index) => {
                const url = getResourceUrl(site);
                return (
                  <a
                    key={index}
                    href={url}
                    onClick={(event) => openExternalLink(event, url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-left flex items-start gap-3 p-3 rounded-xl border border-border bg-background/50 hover:bg-muted transition-colors group"
                  >
                    <Globe className="h-5 w-5 text-section-sources shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-foreground group-hover:text-primary truncate">{site.nome}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{site.descricao}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
