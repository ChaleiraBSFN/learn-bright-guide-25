import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { StudyGroups } from '@/components/StudyGroups';
import { ProgressTrail } from '@/components/ProgressTrail';
import { RankingDialog } from '@/components/RankingDialog';
import { Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FloatingActions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showTrail, setShowTrail] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [isInstalled] = useState(
    window.matchMedia('(display-mode: standalone)').matches
  );

  return (
    <>
      <div className="fixed right-4 bottom-24 md:bottom-8 z-40 flex flex-col gap-3">
        {/* Progress Trail Button */}
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
          <TooltipContent side="left">
            {t('trail.title', 'Trilha de Progresso')}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowRanking(true)}
              className="h-12 w-12 !min-w-12 !min-h-12 shrink-0 p-0 flex items-center justify-center rounded-full bg-background/95 backdrop-blur-sm border-2 border-yellow-500/30 hover:bg-yellow-500 hover:text-white transition-all shadow-[0_4px_14px_-3px_hsl(45_100%_50%/0.4),inset_0_1px_0_hsl(0_0%_100%/0.2),inset_0_-2px_0_hsl(45_100%_50%/0.15)]"
            >
              <Trophy className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            Ranking Público
          </TooltipContent>
        </Tooltip>

        {/* Study Groups */}
        <StudyGroups />

        {/* Install Button */}
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
            <TooltipContent side="left">
              {t('install.downloadApp')}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Progress Trail Dialog */}
      <ProgressTrail open={showTrail} onClose={() => setShowTrail(false)} />

      {/* Ranking Dialog */}
      <RankingDialog open={showRanking} onClose={() => setShowRanking(false)} />
    </>
  );
};
