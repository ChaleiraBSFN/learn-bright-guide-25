import type { MouseEvent } from "react";
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

// Mapeamento amplo de sites educacionais conhecidos -> URL de busca interna
const KNOWN_SITES: Array<{ match: string[]; build: (q: string) => string }> = [
  { match: ["brasil escola"], build: (q) => `https://brasilescola.uol.com.br/pesquisa?q=${encodeURIComponent(q)}` },
  { match: ["mundo educacao"], build: (q) => `https://mundoeducacao.uol.com.br/pesquisa?q=${encodeURIComponent(q)}` },
  { match: ["toda materia", "todamateria"], build: (q) => `https://www.todamateria.com.br/?s=${encodeURIComponent(q)}` },
  { match: ["khan academy"], build: (q) => `https://pt.khanacademy.org/search?page_search_query=${encodeURIComponent(q)}` },
  { match: ["wikipedia"], build: (q) => `https://pt.wikipedia.org/w/index.php?search=${encodeURIComponent(q)}` },
  { match: ["youtube"], build: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` },
  { match: ["coursera"], build: (q) => `https://www.coursera.org/search?query=${encodeURIComponent(q)}` },
  { match: ["edx"], build: (q) => `https://www.edx.org/search?q=${encodeURIComponent(q)}` },
  { match: ["infoescola"], build: (q) => `https://www.infoescola.com/?s=${encodeURIComponent(q)}` },
  { match: ["sobiologia"], build: (q) => `https://www.sobiologia.com.br/?s=${encodeURIComponent(q)}` },
  { match: ["stoodi"], build: (q) => `https://www.stoodi.com.br/busca/?q=${encodeURIComponent(q)}` },
  { match: ["descomplica"], build: (q) => `https://descomplica.com.br/busca/?q=${encodeURIComponent(q)}` },
  { match: ["me salva", "mesalva"], build: (q) => `https://www.mesalva.com/busca?q=${encodeURIComponent(q)}` },
  { match: ["responde ai", "respondeai"], build: (q) => `https://www.respondeai.com.br/busca?termo=${encodeURIComponent(q)}` },
  { match: ["bbc"], build: (q) => `https://www.bbc.com/portuguese/search?q=${encodeURIComponent(q)}` },
  { match: ["nat geo", "national geographic"], build: (q) => `https://www.nationalgeographicbrasil.com/search?q=${encodeURIComponent(q)}` },
  { match: ["uol"], build: (q) => `https://busca.uol.com.br/?q=${encodeURIComponent(q)}` },
  { match: ["g1", "globo"], build: (q) => `https://g1.globo.com/busca/?q=${encodeURIComponent(q)}` },
  { match: ["scielo"], build: (q) => `https://search.scielo.org/?q=${encodeURIComponent(q)}&lang=pt` },
  { match: ["google scholar", "scholar"], build: (q) => `https://scholar.google.com/scholar?q=${encodeURIComponent(q)}&hl=pt-BR` },
  { match: ["mit"], build: (q) => `https://ocw.mit.edu/search/?q=${encodeURIComponent(q)}` },
  { match: ["ted"], build: (q) => `https://www.ted.com/search?q=${encodeURIComponent(q)}` },
];

const TRUSTED_DOMAINS: Array<{ name: string; domain: string; match: string[] }> = [
  { name: "Brasil Escola", domain: "brasilescola.uol.com.br", match: ["brasil escola"] },
  { name: "Toda Matéria", domain: "todamateria.com.br", match: ["toda materia", "todamateria"] },
  { name: "Khan Academy", domain: "pt.khanacademy.org", match: ["khan academy"] },
  { name: "Mundo Educação", domain: "mundoeducacao.uol.com.br", match: ["mundo educacao"] },
  { name: "InfoEscola", domain: "infoescola.com", match: ["infoescola"] },
  { name: "Wikipédia", domain: "pt.wikipedia.org", match: ["wikipedia", "wikipédia"] },
  { name: "SciELO", domain: "scielo.org", match: ["scielo"] },
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

const getKnownSiteSearchUrl = (siteName: string, query: string): string | null => {
  const name = normalizeText(siteName);
  for (const entry of KNOWN_SITES) {
    if (entry.match.some((m) => name.includes(m))) return entry.build(query);
  }
  return null;
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
  const knownSiteUrl = getKnownSiteSearchUrl(site.nome, query);
  if (knownSiteUrl) return knownSiteUrl;
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
              {data.sites.map((site, index) => {
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
