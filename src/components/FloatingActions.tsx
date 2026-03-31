import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Map, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { StudyGroups } from '@/components/StudyGroups';
import { ProgressTrail } from '@/components/ProgressTrail';
import { RankingDialog } from '@/components/RankingDialog';
import { useNavigate } from 'react-router-dom';

interface PlatformSettings {
  trailEnabled: boolean;
  groupsEnabled: boolean;
  rankingEnabled: boolean;
}

const readSettings = (): PlatformSettings => {
  try {
    const stored = localStorage.getItem('lb_platform_settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        trailEnabled: parsed.trailEnabled !== false,
        groupsEnabled: parsed.groupsEnabled !== false,
        rankingEnabled: parsed.rankingEnabled !== false,
      };
    }
  } catch {}

  return {
    trailEnabled: true,
    groupsEnabled: true,
    rankingEnabled: true,
  };
};

export const FloatingActions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showTrail, setShowTrail] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [isInstalled] = useState(window.matchMedia('(display-mode: standalone)').matches);
  const [settings, setSettings] = useState<PlatformSettings>(readSettings());

  useEffect(() => {
    const syncSettings = () => setSettings(readSettings());
    syncSettings();
    window.addEventListener('storage', syncSettings);
    window.addEventListener('lb_settings_changed', syncSettings);
    return () => {
      window.removeEventListener('storage', syncSettings);
      window.removeEventListener('lb_settings_changed', syncSettings);
    };
  }, []);

  return (
    <>
      <div className="fixed right-4 bottom-24 md:bottom-8 z-40 flex flex-col gap-3">
        {settings.trailEnabled && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowTrail(true)}
                className="h-12 w-12 !min-w-12 !min-h-12 shrink-0 p-0 flex items-center justify-center rounded-full bg-background/95 backdrop-blur-sm border-2 border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all shadow-[0_4px_14px_-3px_hsl(var(--primary)/0.4),inset_0_1px_0_hsl(0_0%_100%/0.2),inset_0_-2px_0_hsl(var(--primary)/0.15)]"
              >
                <Map className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">{t('trail.title', 'Trilha de Progresso')}</TooltipContent>
          </Tooltip>
        )}

        {settings.rankingEnabled && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowRanking(true)}
                className="h-12 w-12 !min-w-12 !min-h-12 shrink-0 p-0 flex items-center justify-center rounded-full bg-background/95 backdrop-blur-sm border-2 border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all shadow-[0_4px_14px_-3px_hsl(var(--primary)/0.4),inset_0_1px_0_hsl(0_0%_100%/0.2),inset_0_-2px_0_hsl(var(--primary)/0.15)]"
              >
                <Trophy className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Ranking Público</TooltipContent>
          </Tooltip>
        )}

        {settings.groupsEnabled && <StudyGroups />}

        {!isInstalled && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/install')}
                className="h-12 w-12 !min-w-12 !min-h-12 shrink-0 p-0 flex items-center justify-center rounded-full bg-background/95 backdrop-blur-sm border-2 border-secondary/30 hover:bg-secondary hover:text-secondary-foreground transition-all shadow-[0_4px_14px_-3px_hsl(var(--secondary)/0.4),inset_0_1px_0_hsl(0_0%_100%/0.2),inset_0_-2px_0_hsl(var(--secondary)/0.15)]"
              >
                <Download className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">{t('install.downloadApp')}</TooltipContent>
          </Tooltip>
        )}
      </div>

      <ProgressTrail open={showTrail && settings.trailEnabled} onClose={() => setShowTrail(false)} />
      <RankingDialog open={showRanking && settings.rankingEnabled} onClose={() => setShowRanking(false)} />
    </>
  );
};