import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image, Loader2, Sparkles } from "lucide-react";

interface AIImage {
  tipo: "ai";
  url: string;
  descricao: string;
}

interface ImagesSectionProps {
  aiImages?: AIImage[];
  isLoading?: boolean;
  data?: {
    titulo: string;
    lista: Array<{
      descricao: string;
      imagemBase64?: string;
    }>;
  };
}

export function ImagesSection({ aiImages, isLoading, data }: ImagesSectionProps) {
  const { t } = useTranslation();

  const legacyImages = data?.lista?.filter((img) => img.imagemBase64) || [];
  const hasAI = (aiImages && aiImages.length > 0) || legacyImages.length > 0;

  if (!hasAI && !isLoading) return null;

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
      <CardContent className="space-y-6">
        {isLoading && !hasAI && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              {t("sections.generatingImage", "Gerando imagens ilustrativas...")}
            </span>
          </div>
        )}

        {hasAI && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">
                {t("sections.aiGeneratedImages", "Geradas por IA")}
              </h4>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {aiImages?.map((img, index) => (
                <div
                  key={`ai-${index}`}
                  className="rounded-xl overflow-hidden border border-border bg-card hover:border-purple-500/50 transition-all group"
                >
                  <div className="aspect-[4/3] relative bg-muted">
                    <img
                      src={img.url}
                      alt={img.descricao}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).parentElement!.parentElement!.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">{img.descricao}</p>
                  </div>
                </div>
              ))}
              {legacyImages.map((img, index) => (
                <div
                  key={`legacy-${index}`}
                  className="rounded-xl overflow-hidden border border-border bg-card hover:border-purple-500/50 transition-all group"
                >
                  <div className="aspect-[4/3] relative bg-muted">
                    <img
                      src={img.imagemBase64}
                      alt={img.descricao}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">{img.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
