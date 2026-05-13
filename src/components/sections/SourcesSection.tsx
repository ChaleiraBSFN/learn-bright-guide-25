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
  tema?: string;
}

// Google Search com locale BR e personalização desativada (reduz bloqueios/captcha)
const buildSearchUrl = (q: string) =>
  `https://www.google.com/search?q=${encodeURIComponent(q)}&hl=pt-BR&gl=BR&pws=0`;

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const TRUSTED_DOMAINS: Array<{ name: string; domain: string; match: string[]; descricao: string }> = [
  { name: "Khan Academy", domain: "pt.khanacademy.org", match: ["khan academy"], descricao: "Aulas gratuitas e exercícios guiados para aprender passo a passo." },
  { name: "Brasil Escola", domain: "brasilescola.uol.com.br", match: ["brasil escola"], descricao: "Explicações escolares populares, diretas e em português." },
  { name: "Toda Matéria", domain: "todamateria.com.br", match: ["toda materia", "todamateria"], descricao: "Resumos simples, exemplos e revisões rápidas para estudantes." },
  { name: "Mundo Educação", domain: "mundoeducacao.uol.com.br", match: ["mundo educacao"], descricao: "Conteúdo didático confiável para reforçar o tema estudado." },
  { name: "InfoEscola", domain: "infoescola.com", match: ["infoescola"], descricao: "Artigos educacionais objetivos para pesquisa complementar." },
];

const openExternalUrl = (url: string) => {
  const opened = window.open(url, "_blank");
  if (opened) {
    opened.opener = null;
    opened.focus();
    return;
  }
  window.location.assign(url);
};

const getTrustedDomain = (siteName: string): string | null => {
  const name = normalizeText(siteName);
  return TRUSTED_DOMAINS.find((entry) => entry.match.some((m) => name.includes(m)))?.domain ?? null;
};

const enrichQuery = (base: string, tema?: string) => {
  if (!tema) return base;
  const b = normalizeText(base);
  const t = normalizeText(tema);
  return b.includes(t) ? base : `${tema} ${base}`;
};

const getSearchSuggestions = (consultas: string[], tema?: string) => {
  const base = tema?.trim() || consultas[0]?.trim() || "tema de estudo";
  const popular = [base, `${base} resumo`, `${base} explicação fácil`, `${base} exercícios`, `${base} mapa mental`];
  const merged = [...popular, ...consultas].filter((item) => item.trim().length > 2);
  return merged.filter((item, index, array) => array.findIndex((other) => normalizeText(other) === normalizeText(item)) === index).slice(0, 6);
};

const getResourceUrl = (
  site: { url?: string; termoBusca?: string; nome: string },
  tema?: string,
): string => {
  const url = site.url?.trim();
  if (url) {
    const withProtocol = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    if (/^https?:\/\/[^\s/$.?#].[^\s]*\.[a-z]{2,}/i.test(withProtocol)) return withProtocol;
  }
  const baseTerm = site.termoBusca?.trim() || site.nome;
  const query = enrichQuery(baseTerm, tema);
  const trustedDomain = getTrustedDomain(site.nome);
  if (trustedDomain) return buildSearchUrl(`site:${trustedDomain} ${query}`);
  return buildSearchUrl(`${query} ${site.nome}`);
};

const handleOpen = (event: MouseEvent<HTMLAnchorElement>, url: string) => {
  event.preventDefault();
  event.stopPropagation();
  openExternalUrl(url);
};

export function SourcesSection({ data, tema }: SourcesSectionProps) {
  const { t } = useTranslation();
  const searchSuggestions = getSearchSuggestions(data.consultas || [], tema);
  const recommendedSites = TRUSTED_DOMAINS.map((source) => ({
    nome: source.name,
    termoBusca: tema || data.sites?.[0]?.termoBusca || data.sites?.[0]?.nome || source.name,
    descricao: source.descricao,
  }));

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
              {searchSuggestions.map((consulta, index) => {
                const enriched = enrichQuery(consulta, tema);
                const url = buildSearchUrl(enriched);
                return (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener"
                    referrerPolicy="no-referrer"
                    onClick={(event) => handleOpen(event, url)}
                    title={`Pesquisar no Google: ${enriched}`}
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
              {recommendedSites.map((site, index) => {
                const url = getResourceUrl(site, tema);
                return (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener"
                    referrerPolicy="no-referrer"
                    onClick={(event) => handleOpen(event, url)}
                    title={url}
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
