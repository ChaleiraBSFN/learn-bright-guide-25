import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Map, Users, MessageSquare, Maximize, Minimize, ChevronUp, ChevronDown, Coins, Trophy } from 'lucide-react';
import learnBuddyLogo from "@/assets/learn-buddy-logo.png";


import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { StudyGroups } from '@/components/StudyGroups';
import { ProgressTrail } from '@/components/ProgressTrail';
import { RankingDialog } from '@/components/RankingDialog';
import { useNavigate } from 'react-router-dom';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSectionFlag } from '@/hooks/useSectionFlag';
import { useUnderDevGate } from '@/hooks/useUnderDevGate';
import { RewardShopModal } from '@/components/RewardShopModal';

interface FloatingActionsProps {
  showSideActions?: boolean;
}

export const FloatingActions = ({ showSideActions = false }: FloatingActionsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const isMobile = useIsMobile();
  const [showTrail, setShowTrail] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const shopFlag = useSectionFlag('shop').flag;
  const trailGate = useUnderDevGate('trail');
  const rankingGate = useUnderDevGate('ranking');
  const communityGate = useUnderDevGate('community');
  const chatBuddyGate = useUnderDevGate('chat_buddy');
  const groupsGate = useUnderDevGate('study_groups');
  const shopGate = useUnderDevGate('shop');
  const [isInstalled] = useState(
    window.matchMedia('(display-mode: standalone)').matches
  );
  
  const [rankingEnabled, setRankingEnabled] = useState(true);
  const [trailEnabled, setTrailEnabled] = useState(true);
  const [groupsEnabled, setGroupsEnabled] = useState(true);
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

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

  // Open reward shop from banner CTAs
  useEffect(() => {
    const onOpenShop = () => shopGate.guard(() => setShowShop(true))();
    window.addEventListener('open_reward_shop', onOpenShop);
    return () => window.removeEventListener('open_reward_shop', onOpenShop);
  }, [shopGate]);


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
    const interval = setInterval(checkSettings, 15000);
    return () => {
      window.removeEventListener('storage', checkSettings);
      window.removeEventListener('lb_settings_changed', checkSettings);
      clearInterval(interval);
    };
  }, []);

  // Ações do dock mobile (Liquid Glass, na parte de baixo)
  const dockItems = [
    trailEnabled && {
      key: 'trail',
      icon: <Map className="h-5 w-5 text-primary" />,
      label: t('trail.title', 'Trilha'),
      onClick: trailGate.guard(() => setShowTrail(true)),
    },
    {
      key: 'shop',
      icon: <Coins className="h-5 w-5 text-amber-500" />,
      label: t('rewardShop.short', 'Créditos'),
      onClick: shopGate.guard(() => setShowShop(true)),
    },
    {
      key: 'chat',
      icon: <img src={learnBuddyLogo} alt="" className="h-6 w-6 rounded-md object-cover" />,
      label: t('chatBuddy.short', 'Perguntar'),
      onClick: chatBuddyGate.guard(() => navigate('/chat-buddy')),
    },
    rankingEnabled && {
      key: 'ranking',
      icon: <Trophy className="h-5 w-5 text-yellow-500" />,
      label: t('ranking.short', 'Ranking'),
      onClick: rankingGate.guard(() => setShowRanking(true)),
    },
    {
      key: 'community',
      icon: <MessageSquare className="h-5 w-5 text-violet-500" />,
      label: t('community.short', 'Comunidade'),
      onClick: communityGate.guard(() => navigate('/community')),
    },
    groupsEnabled && {
      key: 'groups',
      icon: <Users className="h-5 w-5 text-cyan-500" />,
      label: t('groups.short', 'Salas'),
      onClick: groupsGate.guard(() => {
        if (groupsGate.enabled) window.dispatchEvent(new CustomEvent('open_study_groups'));
      }),
    },
    !isInstalled && {
      key: 'install',
      icon: <Download className="h-5 w-5 text-secondary" />,
      label: t('install.short', 'App'),
      onClick: () => navigate('/install'),
    },
  ].filter(Boolean) as { key: string; icon: JSX.Element; label: string; onClick: () => void }[];

  const showBottomDock = isMobile || !showSideActions;

  return (
    <>
      {showBottomDock && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-2.5 pb-[max(0.55rem,env(safe-area-inset-bottom))] sm:px-4 md:px-6" data-testid="actions-dock">
          <nav className={`ios-liquid-dock mx-auto ${collapsed ? 'max-w-[430px] md:max-w-[650px]' : 'max-w-[430px] md:max-w-[760px]'}`} aria-label={t('common.actions', 'Ações')}>
            <div className="ios-liquid-dock__highlight" aria-hidden="true" />
            <div className="relative z-10 flex items-center gap-1 p-1.5 sm:p-2">
              <div className={collapsed ? 'flex min-w-0 flex-1 items-center justify-around gap-0.5' : 'grid min-w-0 flex-1 grid-cols-4 gap-1 md:flex md:justify-around'}>
                {(collapsed ? dockItems.slice(0, 4) : dockItems).map((item) => (
                  <Button
                    key={item.key}
                    type="button"
                    variant="ghost"
                    onClick={item.onClick}
                    aria-label={item.label}
                    className="ios-liquid-dock__item group h-[54px] min-w-0 flex-1 flex-col gap-0.5 rounded-[18px] px-1.5 py-1.5 text-[10px] font-bold text-muted-foreground sm:min-w-[68px] sm:px-2 md:h-[58px] md:min-w-[76px] md:text-[11px]"
                  >
                    <span className="ios-liquid-dock__icon">{item.icon}</span>
                    <span className="w-full truncate leading-none">{item.label}</span>
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed((current) => !current)}
                aria-expanded={!collapsed}
                aria-label={collapsed ? t('common.showActions', 'Mostrar ações') : t('common.hideActions', 'Recolher ações')}
                className="ios-liquid-dock__toggle h-11 w-11 shrink-0 rounded-[16px] text-foreground sm:h-12 sm:w-12"
              >
                {collapsed ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </div>
          </nav>
        </div>
      )}

      {!showBottomDock && (collapsed ? (
        <div className="fixed right-3 bottom-6 md:right-4 md:bottom-8 z-40">
          <Button
            variant="outline"
            size="icon"
            onPointerDown={(e) => { e.preventDefault(); setCollapsed(false); }}
            aria-label={t('common.showActions', 'Mostrar ações')}
            className="h-11 w-11 !min-w-11 !min-h-11 shrink-0 p-0 flex items-center justify-center rounded-full bg-background/95 backdrop-blur-xl border-2 border-foreground/30 hover:bg-primary hover:text-primary-foreground transition-all shadow-[inset_0_1px_0_hsl(0_0%_100%/0.28),0_10px_30px_-12px_hsl(var(--foreground)/0.55)]"
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
        </div>
      ) : (

        <div className="fixed right-3 bottom-6 md:right-4 md:bottom-8 z-40 flex flex-col items-center gap-2 rounded-full border-2 border-foreground/25 bg-background/55 px-2 py-2.5 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.28),inset_0_-18px_30px_hsl(var(--primary)/0.08),0_14px_34px_-18px_hsl(var(--foreground)/0.55)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/45">
          <Button
            variant="ghost"
            size="icon"
            onPointerDown={(e) => { e.preventDefault(); setCollapsed(true); }}
            aria-label={t('common.hideActions', 'Recolher ações')}
            className="h-7 w-7 !min-w-7 !min-h-7 shrink-0 p-0 flex items-center justify-center rounded-full hover:bg-foreground/10"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>




        {/* Fullscreen (desktop only) */}
        {!isMobile && (
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
        )}

        {trailEnabled && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={trailGate.guard(() => setShowTrail(true))}
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

        {/* Reward shop / mercadinho */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={shopGate.guard(() => setShowShop(true))}
              aria-label={t('rewardShop.title', 'Mercadinho de créditos')}
              className="h-10 w-10 !min-w-10 !min-h-10 shrink-0 p-0 flex items-center justify-center rounded-full bg-background/95 backdrop-blur-sm border-2 border-amber-500/40 hover:bg-amber-500 hover:text-white transition-all shadow-[0_0_24px_-2px_hsl(45_100%_50%/0.6),0_4px_14px_-3px_hsl(45_100%_50%/0.5),inset_0_1px_0_hsl(0_0%_100%/0.2),inset_0_-2px_0_hsl(45_100%_50%/0.2)] hover:shadow-[0_0_36px_-2px_hsl(45_100%_50%/0.85)]"
            >
              <Coins className="h-4 w-4 text-amber-500" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {t('rewardShop.title', 'Mercadinho de créditos')}
          </TooltipContent>
        </Tooltip>

        {rankingEnabled && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={rankingGate.guard(() => setShowRanking(true))}
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
              onClick={communityGate.guard(() => navigate('/community'))}
              aria-label={t('community.tooltip', 'Comunidade')}
              className="h-10 w-10 !min-w-10 !min-h-10 shrink-0 p-0 flex items-center justify-center rounded-full bg-background/95 backdrop-blur-sm border-2 border-violet-500/40 hover:bg-violet-500 hover:text-white transition-all shadow-[0_0_24px_-2px_hsl(270_70%_55%/0.6),0_4px_14px_-3px_hsl(270_70%_55%/0.5),inset_0_1px_0_hsl(0_0%_100%/0.2)]"
            >
              <MessageSquare className="h-4 w-4 text-violet-500" />
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
              onClick={chatBuddyGate.guard(() => navigate('/chat-buddy'))}
              aria-label={t('chatBuddy.tooltip', 'Chat com Learn Buddy')}
              className="h-10 w-10 !min-w-10 !min-h-10 shrink-0 p-0 flex items-center justify-center rounded-full bg-background/95 backdrop-blur-sm border-2 border-pink-500/40 hover:bg-pink-500 hover:text-white transition-all shadow-[0_0_24px_-2px_hsl(330_80%_60%/0.6),0_4px_14px_-3px_hsl(330_80%_60%/0.5),inset_0_1px_0_hsl(0_0%_100%/0.2)] hover:shadow-[0_0_36px_-2px_hsl(330_80%_60%/0.85)] overflow-hidden"
            >
              <img src={learnBuddyLogo} alt="Learn Buddy" className="h-6 w-6 rounded-md object-cover" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">{t('chatBuddy.tooltip', 'Chat com Learn Buddy')}</TooltipContent>
        </Tooltip>


        {/* Study Groups */}
        {groupsEnabled && (
          groupsGate.enabled ? (
            <StudyGroups />
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={groupsGate.guard(() => {})}
                  aria-label={t('groups.title', 'Grupos de Estudo')}
                  className="h-10 w-10 !min-w-10 !min-h-10 shrink-0 p-0 flex items-center justify-center rounded-full bg-background/95 backdrop-blur-sm border-2 border-cyan-500/40 hover:bg-cyan-500 hover:text-white transition-all"
                >
                  <Users className="h-4 w-4 text-cyan-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">{t('groups.title', 'Grupos de Estudo')}</TooltipContent>
            </Tooltip>
          )
        )}

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
      ))}


      {/* Progress Trail Dialog */}
      <ProgressTrail open={showTrail} onClose={() => setShowTrail(false)} />

      {/* Ranking Dialog */}
      <RankingDialog open={showRanking} onClose={() => setShowRanking(false)} />

      {/* Reward Shop Modal */}
      <RewardShopModal open={showShop} onOpenChange={setShowShop} />

      {groupsEnabled && groupsGate.enabled && showBottomDock && <StudyGroups hidden />}

      {/* Under-development dialogs (shown when admin disables a section) */}
      {trailGate.dialog}
      {rankingGate.dialog}
      {communityGate.dialog}
      {chatBuddyGate.dialog}
      {groupsGate.dialog}
      {shopGate.dialog}
    </>
  );
};
