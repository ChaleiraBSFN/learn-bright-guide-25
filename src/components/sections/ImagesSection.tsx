import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image as ImageIcon, ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIImage {
  tipo: "ai";
  url: string;
  descricao: string;
}

interface ImagesSectionProps {
  aiImages?: AIImage[];
  isLoading?: boolean;
  tema?: string;
  data?: {
    titulo: string;
    lista: Array<{
      descricao: string;
      imagemBase64?: string;
    }>;
  };
}

const normalize = (v: string) =>
  v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const enrich = (descricao: string, tema?: string) => {
  if (!tema) return descricao;
  return normalize(descricao).includes(normalize(tema))
    ? descricao
    : `${tema} — ${descricao}`;
};

export function ImagesSection({ tema, data }: ImagesSectionProps) {
  const { t } = useTranslation();

  if (!tema) return null;

  const query = encodeURIComponent(tema);
  const googleImagesUrl = `https://www.google.com/search?tbm=isch&q=${query}`;
  const googleUrl = `https://www.google.com/search?q=${query}`;

  const items = data?.lista ?? [];

  return (
    <Card className="card-elevated slide-up border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
            <ImageIcon className="h-5 w-5 text-white" />
          </div>
          {data?.titulo || t("sections.illustrativeImages", "Imagens Ilustrativas")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t(
            "sections.imagesGoogleHint",
            "Veja imagens reais sobre o tema diretamente na busca do Google."
          )}
        </p>

        {items.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {items.map((item, index) => {
              const q = encodeURIComponent(enrich(item.descricao, tema));
              const url = `https://www.google.com/search?tbm=isch&q=${q}`;
              return (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 p-3 rounded-xl border border-border bg-background/50 hover:border-primary/50 hover:bg-muted transition-colors"
                  title={decodeURIComponent(q)}
                >
                  <Search className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground line-clamp-2 group-hover:text-primary">
                      {item.descricao}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      {t("sections.searchGoogleImages", "Buscar no Google Imagens")}
                      <ExternalLink className="h-3 w-3" />
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button asChild variant="outline" className="gap-2">
            <a href={googleImagesUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              {t("sections.searchGoogleImages", "Buscar no Google Imagens")}: {tema}
            </a>
          </Button>
          <Button asChild variant="ghost" className="gap-2">
            <a href={googleUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              {t("sections.searchGoogle", "Buscar no Google")}
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
