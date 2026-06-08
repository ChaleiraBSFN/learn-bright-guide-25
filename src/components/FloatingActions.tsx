import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Map, Sun, Moon, Users, MessageSquare, Maximize, Minimize, MoreHorizontal } from 'lucide-react';

import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { StudyGroups } from '@/components/StudyGroups';
import { ProgressTrail } from '@/components/ProgressTrail';
import { RankingDialog } from '@/components/RankingDialog';
import { Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFullscreen } from '@/hooks/useFullscreen';

export const FloatingActions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const [showTrail, setShowTrail] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [isInstalled] = useState(
    window.matchMedia('(display-mode: standalone)').matches
  );
  
  const [rankingEnabled, setRankingEnabled] = useState(true);
  const [trailEnabled, setTrailEnabled] = useState(true);
  const [groupsEnabled, setGroupsEnabled] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  // Auto-collapse while generating content
  useEffect(() => {
    const onGen = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.generating) setCollapsed(true);
      else setCollapsed(false);
    };
    window.addEventListener('lb_generating_changed', onGen);
    return () => window.removeEventListener('lb_generating_changed', onGen);
  }, []);


  useEffect(() => {
    const checkSettings = () => {
      const stored = localStorage.getItem('lb_platform_settings');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.rankingEnabled !== undefined) {
            setRankingEnabled(parsed.rankingEnabled);
          }
          if (parsed.trailEnabled !== undefined) {
            setTrailEnabled(parsed.trailEnabled);
          }
          if (parsed.groupsEnabled !== undefined) {
            setGroupsEnabled(parsed.groupsEnabled);
          }
        } catch (e) {}
      }
    };
    checkSettings();
    window.addEventListener('storage', checkSettings);
    window.addEventListener('lb_settings_changed', checkSettings);
    const interval = setInterval(checkSettings, 2000);
    return () => {
      window.removeEventListener('storage', checkSettings);
      window.removeEventListener('lb_settings_changed', checkSettings);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <div className="fixed right-3 bottom-6 md:right-4 md:bottom-8 z-40 flex flex-col items-center gap-2 rounded-full border-2 border-foreground/25 bg-background/55 px-2 py-2.5 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.28),inset_0_-18px_30px_hsl(var(--primary)/0.08),0_14px_34px_-18px_hsl(var(--foreground)/0.55)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/45">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? t('settings.themeLight', 'Tema claro') : t('settings.themeDark', 'Tema escuro')}
              className="h-10 w-10 !min-w-10 !min-h-10 shrink-0 p-0 flex items-center justify-center rounded-full bg-background/95 backdrop-blur-sm border-2 border-accent/40 hover:bg-accent hover:text-accent-foreground transition-all shadow-[0_0_24px_-2px_hsl(var(--accent)/0.6),0_4px_14px_-3px_hsl(var(--accent)/0.5),inset_0_1px_0_hsl(0_0%_100%/0.2),inset_0_-2px_0_hsl(var(--accent)/0.2)] hover:shadow-[0_0_36px_-2px_hsl(var(--accent)/0.85),0_6px_20px_-4px_hsl(var(--accent)/0.7)]"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-accent" /> : <Moon className="h-4 w-4 text-primary" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {theme === 'dark' ? t('settings.themeLight', 'Tema claro') : t('settings.themeDark', 'Tema escuro')}
          </TooltipContent>
        </Tooltip>

        {/* Fullscreen */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? t('fullscreen.exit', 'Sair da Tela Cheia') : t('fullscreen.enter', 'Tela Cheia')}
              className="h-10 w-10 !min-w-10 !min-h-10 shrink-0 p-0 flex items-center justify-center rounded-full bg-background/95 backdrop-blur-sm border-2 border-foreground/20 hover:bg-foreground hover:text-background transition-all shadow-[0_0_24px_-2px_hsl(var(--foreground)/0.3),0_4px_14px_-3px_hsl(var(--foreground)/0.25),inset_0_1px_0_hsl(0_0%_100%/0.2)]"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {isFullscreen ? t('fullscreen.exit', 'Sair da Tela Cheia') : t('fullscreen.enter', 'Tela Cheia')}
          </TooltipContent>
        </Tooltip>

        {trailEnabled && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowTrail(true)}
                aria-label={t('trail.title', 'Trilha de Progresso')}
                className="h-10 w-10 !min-w-10 !min-h-10 shrink-0 p-0 flex items-center justify-center rounded-full bg-background/95 backdrop-blur-sm border-2 border-primary/40 hover:bg-primary hover:text-primary-foreground transition-all shadow-[0_0_24px_-2px_hsl(var(--primary)/0.6),0_4px_14px_-3px_hsl(var(--primary)/0.5),inset_0_1px_0_hsl(0_0%_100%/0.2),inset_0_-2px_0_hsl(var(--primary)/0.2)] hover:shadow-[0_0_36px_-2px_hsl(var(--primary)/0.85),0_6px_20px_-4px_hsl(var(--primary)/0.7)]"
              >
                <Map className="h-4 w-4 text-primary group-hover:text-primary-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {t('trail.title', 'Trilha de Progresso')}
            </TooltipContent>
          </Tooltip>
        )}

        {rankingEnabled && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowRanking(true)}
                aria-label={t('ranking.title')}
                className="h-10 w-10 !min-w-10 !min-h-10 shrink-0 p-0 flex items-center justify-center rounded-full bg-background/95 backdrop-blur-sm border-2 border-yellow-500/40 hover:bg-yellow-500 hover:text-white transition-all shadow-[0_0_24px_-2px_hsl(45_100%_50%/0.6),0_4px_14px_-3px_hsl(45_100%_50%/0.5),inset_0_1px_0_hsl(0_0%_100%/0.2),inset_0_-2px_0_hsl(45_100%_50%/0.2)] hover:shadow-[0_0_36px_-2px_hsl(45_100%_50%/0.85),0_6px_20px_-4px_hsl(45_100%_50%/0.7)]"
              >
                <Trophy className="h-4 w-4 text-yellow-500 group-hover:text-white" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {t('ranking.title')}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Community */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/community')}
              aria-label={t('community.tooltip', 'Comunidade')}
              className="h-10 w-10 !min-w-10 !min-h-10 shrink-0 p-0 flex items-center justify-center rounded-full bg-background/95 backdrop-blur-sm border-2 border-violet-500/40 hover:bg-violet-500 hover:text-white transition-all shadow-[0_0_24px_-2px_hsl(270_70%_55%/0.6),0_4px_14px_-3px_hsl(270_70%_55%/0.5),inset_0_1px_0_hsl(0_0%_100%/0.2)]"
            >
              <Users className="h-4 w-4 text-violet-500" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">{t('community.tooltip', 'Comunidade')}</TooltipContent>
        </Tooltip>

        {/* Chat Buddy */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/chat-buddy')}
              aria-label={t('chatBuddy.tooltip', 'Chat com Learn Buddy')}
              className="h-10 w-10 !min-w-10 !min-h-10 shrink-0 p-0 flex items-center justify-center rounded-full bg-background/95 backdrop-blur-sm border-2 border-pink-500/40 hover:bg-pink-500 hover:text-white transition-all shadow-[0_0_24px_-2px_hsl(330_80%_60%/0.6),0_4px_14px_-3px_hsl(330_80%_60%/0.5),inset_0_1px_0_hsl(0_0%_100%/0.2)] hover:shadow-[0_0_36px_-2px_hsl(330_80%_60%/0.85)]"
            >
              <MessageSquare className="h-4 w-4 text-pink-500" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">{t('chatBuddy.tooltip', 'Chat com Learn Buddy')}</TooltipContent>
        </Tooltip>


        {/* Study Groups */}
        {groupsEnabled && <StudyGroups />}

        {/* Install Button */}
        {!isInstalled && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/install')}
                aria-label={t('install.downloadApp')}
                className="h-10 w-10 !min-w-10 !min-h-10 shrink-0 p-0 flex items-center justify-center rounded-full bg-background/95 backdrop-blur-sm border-2 border-secondary/40 hover:bg-secondary hover:text-secondary-foreground transition-all shadow-[0_0_24px_-2px_hsl(var(--secondary)/0.6),0_4px_14px_-3px_hsl(var(--secondary)/0.5),inset_0_1px_0_hsl(0_0%_100%/0.2),inset_0_-2px_0_hsl(var(--secondary)/0.2)] hover:shadow-[0_0_36px_-2px_hsl(var(--secondary)/0.85),0_6px_20px_-4px_hsl(var(--secondary)/0.7)]"
              >
                <Download className="h-4 w-4 text-secondary group-hover:text-secondary-foreground" />
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
