import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image, ExternalLink } from "lucide-react";
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

export function ImagesSection({ tema }: ImagesSectionProps) {
  const { t } = useTranslation();

  if (!tema) return null;

  const query = encodeURIComponent(tema);
  const googleImagesUrl = `https://www.google.com/search?tbm=isch&q=${query}`;
  const googleUrl = `https://www.google.com/search?q=${query}`;

  return (
    <Card className="card-elevated slide-up border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
            <Image className="h-5 w-5 text-white" />
          </div>
          {t("sections.illustrativeImages", "Imagens Ilustrativas")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t(
            "sections.imagesGoogleHint",
            "Veja imagens reais sobre o tema diretamente na busca do Google."
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="gap-2">
            <a href={googleImagesUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              {t("sections.searchGoogleImages", "Buscar no Google Imagens")}
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
