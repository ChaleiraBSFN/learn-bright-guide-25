import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Youtube, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideosSectionProps {
  data: {
    titulo: string;
    lista: Array<{
      titulo: string;
      canal: string;
      descricao: string;
      termoBusca: string;
      url?: string;
    }>;
  };
}

export function VideosSection({ data }: VideosSectionProps) {
  const { t } = useTranslation();

  const openVideo = (video: { url?: string; termoBusca: string }) => {
    if (video.url && /^https?:\/\//i.test(video.url)) {
      window.open(video.url, '_blank');
    } else {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(video.termoBusca)}`;
      window.open(searchUrl, '_blank');
    }
  };

  return (
    <Card className="card-elevated slide-up border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600">
            <Youtube className="h-5 w-5 text-white" />
          </div>
          <span className="flex items-center gap-2">
            {data.titulo}
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{t('result.premiumBadge')}</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4">
        {data.lista.map((video, index) => (
          <div
            key={index}
            className="p-3 md:p-4 rounded-xl bg-card border border-border hover:border-red-500/50 transition-all group"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 md:gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <h4 className="font-semibold text-foreground group-hover:text-red-500 transition-colors text-sm md:text-base">
                  {video.titulo}
                </h4>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {t('sections.channel')}: <span className="text-foreground">{video.canal}</span>
                </p>
                <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{video.descricao}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openVideo(video)}
                className="gap-2 shrink-0 hover:bg-red-500 hover:text-white hover:border-red-500 w-full sm:w-auto text-xs md:text-sm"
              >
                <ExternalLink className="h-3 w-3 md:h-4 md:w-4" />
                {t('sections.searchOnYoutube')}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
