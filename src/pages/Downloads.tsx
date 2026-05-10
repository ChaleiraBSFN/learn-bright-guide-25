import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Download, Film, PlayCircle } from 'lucide-react';
import { FloatingActions } from '@/components/FloatingActions';
import { Link } from 'react-router-dom';

const downloadFile = async (url: string, filename: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    window.open(url, '_blank');
  }
};

const videos = [
  {
    id: 'trailer',
    title: 'Trailer de Anúncio',
    filename: 'learn-buddy-trailer.mp4',
    url: '/learn-buddy-trailer.mp4',
    icon: Film,
  },
  {
    id: 'demo',
    title: 'Aprenda a Usar (Demo)',
    filename: 'learn-buddy-demo.mp4',
    url: '/learn-buddy-demo.mp4',
    icon: PlayCircle,
  },
];

export default function Downloads() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <FloatingActions />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Downloads</h1>
          <NavLink to="/" variant="outline" size="sm">
            Voltar
          </NavLink>
        </div>

        <div className="space-y-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className="flex items-center justify-between rounded-xl border-2 border-foreground p-4 bg-card hover:bg-accent/10 transition-colors"
            >
              <div className="flex items-center gap-4">
                <video.icon className="h-8 w-8 text-primary" />
                <div>
                  <h2 className="font-semibold text-lg">{video.title}</h2>
                  <p className="text-sm text-muted-foreground">{video.filename}</p>
                </div>
              </div>
              <Button
                onClick={() => downloadFile(video.url, video.filename)}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm text-muted-foreground text-center">
          Se o download não funcionar, clique com o botão direito no botão e escolha "Salvar link como".
        </p>
      </div>
    </div>
  );
}
