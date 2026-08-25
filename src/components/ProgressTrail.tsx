import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Lock, Coins, Info, BookOpen, CheckCircle2, Crown, Sparkles, X, Gift } from 'lucide-react';
import { getRankForAchievements, getRankDisplayName } from '@/lib/ranks';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useCredits } from '@/hooks/useCredits';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAchievementData, availableIcons, TrailNodeDef, loadUserCompletedAchievements } from '@/hooks/useAchievements';

const typeGradient: Record<string, string> = {
  challenge: 'from-primary to-secondary',
  quiz: 'from-secondary to-accent',
  milestone: 'from-accent to-primary',
  reward: 'from-primary to-accent',
  boss: 'from-destructive to-primary',
  secret: 'from-muted to-accent',
  event: 'from-secondary to-primary',
  legendary: 'from-accent to-secondary',
};

interface ProgressTrailProps {
  open: boolean;
  onClose: () => void;
}

const buildPath = (from: TrailNodeDef, to: TrailNodeDef) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const cx1 = from.x + dx * 0.35;
  const cy1 = from.y + dy * 0.1;
  const cx2 = to.x - dx * 0.35;
  const cy2 = to.y - dy * 0.1;
  return `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
};

export const ProgressTrail = ({ open, onClose }: ProgressTrailProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { credits } = useCredits();
  const { toast } = useToast();
  const { nodes: trailNodes } = useAchievementData();
  const { isBuddy } = useSubscription();
  const navigate = useNavigate();

  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [translatedNodes, setTranslatedNodes] = useState<Record<string, Record<number, { title: string; objective: string }>>>({});
  const [, setTranslatingLang] = useState<string | null>(null);
  const [tab, setTab] = useState<'classic' | 'premium'>('classic');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const currentLang = i18n.language;

  // Translate trail nodes when language is not pt-BR
  const translateTrailNodes = useCallback(async (lang: string, nodes: TrailNodeDef[]) => {
    if (lang === 'pt-BR' || lang === 'pt' || translatedNodes[lang]) return;
    setTranslatingLang(lang);
    try {
      const toTranslate: Record<string, string> = {};
      nodes.forEach(n => {
        toTranslate[`title_${n.id}`] = n.title;
        toTranslate[`obj_${n.id}`] = n.objective || '';
      });
      const { data, error } = await supabase.functions.invoke('translate-content', {
        body: { content: toTranslate, targetLanguage: lang },
      });
      if (!error && data) {
        const mapped: Record<number, { title: string; objective: string }> = {};
        nodes.forEach(n => {
          mapped[n.id] = {
            title: data[`title_${n.id}`] || n.title,
            objective: data[`obj_${n.id}`] || n.objective || '',
          };
        });
        setTranslatedNodes(prev => ({ ...prev, [lang]: mapped }));
      }
    } catch (e) {
      console.error('Trail translation error:', e);
    }
    setTranslatingLang(null);
  }, [translatedNodes]);

  useEffect(() => {
    if (open && currentLang !== 'pt-BR' && currentLang !== 'pt' && trailNodes.length > 0) {
      translateTrailNodes(currentLang, trailNodes);
    }
  }, [open, currentLang, trailNodes, translateTrailNodes]);

  const getNodeText = useCallback((node: TrailNodeDef) => {
    const lang = currentLang;
    if (lang === 'pt-BR' || lang === 'pt') return { title: node.title, objective: node.objective || '' };
    const translated = translatedNodes[lang]?.[node.id];
    return translated || { title: node.title, objective: node.objective || '' };
  }, [currentLang, translatedNodes]);

  const classicNodes = useMemo(() => trailNodes.filter((node) => !node.buddyOnly), [trailNodes]);
  const premiumNodes = useMemo(() => trailNodes.filter((node) => node.buddyOnly), [trailNodes]);
  const activeNodes = tab === 'premium' ? premiumNodes : classicNodes;

  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);
  const completedCount = useMemo(() => activeNodes.filter((node) => completedSet.has(node.id)).length, [activeNodes, completedSet]);
  const mapWidth = Math.max(...activeNodes.map((node) => node.x), 0) + 240;
  const mapHeight = Math.max(...activeNodes.map((node) => node.y), 0) + 280;

  useEffect(() => {
    const loadProgress = async () => {
      if (!user) {
        setCompletedIds([]);
        return;
      }

      try {
        const ids = await loadUserCompletedAchievements(user.id);
        setCompletedIds(ids);
      } catch {
        setCompletedIds([]);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') loadProgress();
    };

    if (open) loadProgress();

    const interval = window.setInterval(() => {
      if (open) loadProgress();
    }, 15000);

    const channel = user && open
      ? supabase
          .channel(`user-achievements-${user.id}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'user_achievements',
            filter: `user_id=eq.${user.id}`,
          }, loadProgress)
          .subscribe()
      : null;

    window.addEventListener('achievement_unlocked', loadProgress);
    window.addEventListener('achievements_updated', loadProgress);
    window.addEventListener('trail_nodes_updated', loadProgress);
    window.addEventListener('storage', loadProgress);
    window.addEventListener('focus', loadProgress);
    window.addEventListener('online', loadProgress);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('achievement_unlocked', loadProgress);
      window.removeEventListener('achievements_updated', loadProgress);
      window.removeEventListener('trail_nodes_updated', loadProgress);
      window.removeEventListener('storage', loadProgress);
      window.removeEventListener('focus', loadProgress);
      window.removeEventListener('online', loadProgress);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (channel) supabase.removeChannel(channel);
    };
  }, [open, user]);

  useEffect(() => {
    if (!open) setSelectedId(null);
  }, [open]);

  const isNodeLocked = useCallback((node: TrailNodeDef) => {
    if (node.buddyOnly && !isBuddy) return true;
    return node.parents.length > 0 && !node.parents.every((parentId) => completedSet.has(parentId));
  }, [completedSet, isBuddy]);

  const handleNodeClick = (node: TrailNodeDef) => {
    setSelectedId((prev) => (prev === node.id ? null : node.id));
    if (!user) {
      toast({
        title: t('trail.createAccount', 'Crie uma conta'),
        description: t('trail.loginToSave', 'Faça login para salvar seu progresso!'),
      });
    }
  };

  const progressPercent = activeNodes.length > 0 ? (completedCount / activeNodes.length) * 100 : 0;
  const selectedNode = useMemo(() => activeNodes.find((node) => node.id === selectedId) || null, [activeNodes, selectedId]);
  const isPremiumTab = tab === 'premium';
  const premiumBlocked = isPremiumTab && !isBuddy;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="flex max-h-[92vh] w-[96vw] max-w-6xl flex-col overflow-hidden bg-background p-0">
        <DialogHeader className="z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
          <DialogTitle className="flex items-center justify-between gap-3 text-base">
            <span className="flex items-center gap-2">
              {isPremiumTab ? <Crown className="h-5 w-5 text-buddy" /> : <BookOpen className="h-5 w-5 text-primary" />}
              {t('trail.title', 'Trilha de Conquistas')}
            </span>
            <Badge variant="outline" className="gap-1 text-xs font-bold">
              <Coins className="h-3.5 w-3.5 text-primary" />
              {credits ?? '...'} {t('credits.label', 'Créditos')}
            </Badge>
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('trail.description', 'Sua trilha de conquistas e progresso')}
          </DialogDescription>

          <Tabs value={tab} onValueChange={(value) => { setTab(value as 'classic' | 'premium'); setSelectedId(null); }} className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="classic" className="gap-1.5 text-xs">
                <BookOpen className="h-3.5 w-3.5" />
                {t('trail.tabClassic', 'Trilha clássica')}
              </TabsTrigger>
              <TabsTrigger
                value="premium"
                className="gap-1.5 text-xs data-[state=active]:bg-buddy data-[state=active]:text-buddy-foreground"
              >
                <Crown className="h-3.5 w-3.5" />
                {t('trail.tabPremium', 'Trilha Buddy')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="classic" />
            <TabsContent value="premium" />
          </Tabs>

          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{completedCount}/{activeNodes.length} {t('trail.completedPlural', 'completas')}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress
              value={progressPercent}
              className={`h-1.5 ${isPremiumTab ? '[&>div]:bg-buddy' : ''}`}
            />
          </div>
        </DialogHeader>

        <div className={`relative min-h-[460px] flex-1 overflow-auto ${isPremiumTab ? 'bg-buddy/5' : 'bg-muted/20'}`}>
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle, hsl(var(${isPremiumTab ? '--buddy' : '--border'})) 1px, transparent 1px)`,
              backgroundSize: '26px 26px',
              opacity: isPremiumTab ? 0.18 : 0.28,
            }}
          />

          {!user && (
            <div className="absolute left-1/2 top-3 z-20 w-[88%] max-w-sm -translate-x-1/2 rounded-lg border border-accent/30 bg-background/90 p-2.5 text-center text-xs text-foreground shadow-sm">
              <Info className="mr-1 inline h-3.5 w-3.5 text-primary" /> {t('trail.loginToSave', 'Faça login para salvar progresso!')}
            </div>
          )}

          {premiumBlocked && (
            <div className="absolute left-1/2 top-3 z-20 w-[92%] max-w-md -translate-x-1/2 rounded-xl border-2 border-buddy/50 bg-background/95 p-3 text-center shadow-lg backdrop-blur-sm">
              <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-buddy">
                <Sparkles className="h-4 w-4" />
                {t('trail.buddyOnly', 'Desafio exclusivo Buddy')}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t('trail.buddyOnlyHint', 'Assine o Plano Buddy para desbloquear os desafios premium da trilha.')}
              </p>
              <Button
                size="sm"
                className="mt-2 h-8 bg-buddy text-buddy-foreground hover:bg-buddy/90"
                onClick={() => { onClose(); navigate('/buddy'); }}
              >
                <Crown className="mr-1 h-3.5 w-3.5" />
                {t('trail.unlockPremium', 'Desbloquear trilha Buddy')}
              </Button>
            </div>
          )}

          <div className="relative" style={{ width: mapWidth, height: mapHeight, minWidth: '100%' }}>
            <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ width: mapWidth, height: mapHeight }}>
              <defs>
                <filter id="trail-glow">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Layer 1: road backgrounds */}
              <g>
                {activeNodes.flatMap((node) =>
                  node.parents.map((parentId) => {
                    const parent = activeNodes.find((item) => item.id === parentId);
                    if (!parent) return null;
                    return (
                      <path
                        key={`road-${parent.id}-${node.id}`}
                        d={buildPath(parent, node)}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={34}
                        stroke={isPremiumTab ? 'hsl(var(--buddy) / 0.22)' : 'hsl(220, 60%, 20%)'}
                      />
                    );
                  }),
                )}
              </g>

              {/* Layer 2: glow for completed segments */}
              <g>
                {activeNodes.flatMap((node) =>
                  node.parents.map((parentId) => {
                    const parent = activeNodes.find((item) => item.id === parentId);
                    if (!parent || !completedSet.has(parent.id)) return null;
                    return (
                      <path
                        key={`glow-${parent.id}-${node.id}`}
                        d={buildPath(parent, node)}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={36}
                        stroke={isPremiumTab ? 'hsl(var(--buddy) / 0.35)' : 'hsl(var(--primary) / 0.15)'}
                        filter="url(#trail-glow)"
                      />
                    );
                  }),
                )}
              </g>

              {/* Layer 3: animated dashed center line */}
              <g>
                {activeNodes.flatMap((node) =>
                  node.parents.map((parentId) => {
                    const parent = activeNodes.find((item) => item.id === parentId);
                    if (!parent) return null;
                    return (
                      <path
                        key={`dash-${parent.id}-${node.id}`}
                        d={buildPath(parent, node)}
                        fill="none"
                        strokeLinecap="round"
                        strokeWidth={isPremiumTab ? 3 : 2}
                        strokeDasharray="10,8"
                        stroke={isPremiumTab ? 'hsl(var(--buddy))' : 'hsl(220, 50%, 30%)'}
                      >
                        {isPremiumTab && (
                          <animate attributeName="stroke-dashoffset" from="36" to="0" dur="1.6s" repeatCount="indefinite" />
                        )}
                      </path>
                    );
                  }),
                )}
              </g>
            </svg>

            {activeNodes.map((node, index) => {
              const Icon = availableIcons[node.iconName] || availableIcons.BookOpen;
              const isCompleted = completedSet.has(node.id);
              const premiumLocked = Boolean(node.buddyOnly) && !isBuddy;
              const isLocked = isNodeLocked(node);
              const isNext = !isCompleted && !isLocked;
              const isSelected = selectedId === node.id;

              return (
                <div key={node.id} className="absolute" style={{ left: node.x, top: node.y }}>
                  <motion.button
                    onClick={() => handleNodeClick(node)}
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02, duration: 0.25 }}
                    className="relative -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                  >
                    <div
                      className={`relative flex h-14 w-14 items-center justify-center rounded-full border-[3px] shadow-lg transition-all duration-300 ${
                        isSelected ? 'ring-4 ring-offset-2 ring-offset-background ' + (node.buddyOnly ? 'ring-buddy' : 'ring-primary') + ' ' : ''
                      }${
                        node.buddyOnly
                          ? isCompleted
                            ? 'border-background bg-gradient-to-br from-buddy to-secondary shadow-[0_0_26px_hsl(var(--buddy)/0.55)]'
                            : premiumLocked
                              ? 'border-buddy/40 bg-buddy-soft text-buddy'
                              : 'border-background bg-gradient-to-br from-buddy to-secondary shadow-[0_0_22px_hsl(var(--buddy)/0.45)]'
                          : isCompleted
                            ? `bg-gradient-to-br ${typeGradient[node.type]} border-background shadow-[0_0_18px_hsl(var(--primary)/0.28)]`
                            : isLocked
                              ? 'border-border bg-muted text-muted-foreground/60'
                              : `bg-gradient-to-br ${typeGradient[node.type]} border-background shadow-[0_0_22px_hsl(var(--primary)/0.34)]`
                      }`}
                    >
                      {isLocked && !isCompleted ? (
                        <Lock className="h-5 w-5" />
                      ) : (
                        <Icon className={`h-5 w-5 ${node.buddyOnly ? 'text-buddy-foreground' : 'text-primary-foreground'}`} />
                      )}

                      {node.buddyOnly && !isCompleted && (
                        <span className="absolute -left-1 -top-1 rounded-full border-2 border-background bg-buddy p-0.5 shadow-sm">
                          <Crown className="h-3 w-3 text-buddy-foreground" />
                        </span>
                      )}

                      {isCompleted && (
                        <span className={`absolute -right-1 -top-1 rounded-full border-2 border-background p-0.5 shadow-sm ${node.buddyOnly ? 'bg-buddy' : 'bg-primary'}`}>
                          <CheckCircle2 className={`h-3 w-3 ${node.buddyOnly ? 'text-buddy-foreground' : 'text-primary-foreground'}`} />
                        </span>
                      )}

                      {isNext && (
                        <span className={`absolute inset-0 animate-ping rounded-full border-2 ${node.buddyOnly ? 'border-buddy/50' : 'border-primary/40'}`} />
                      )}
                    </div>

                    <div className="absolute left-1/2 top-full mt-2 flex w-32 -translate-x-1/2 flex-col items-center gap-1 text-center">
                      <span className="rounded-md bg-background/90 px-2 py-1 text-[10px] font-semibold leading-tight text-foreground shadow-sm ring-1 ring-border/60 backdrop-blur-sm">
                        {getNodeText(node).title}
                      </span>
                      <span className={`text-[10px] font-medium ${isCompleted ? (node.buddyOnly ? 'text-buddy' : 'text-primary') : premiumLocked ? 'text-buddy' : isLocked ? 'text-red-500' : 'text-green-500'}`}>
                        {isCompleted
                          ? `✓ ${t('trail.done', 'Feito')}`
                          : premiumLocked
                            ? `👑 ${t('trail.buddyOnlyShort', 'Só Buddy')}`
                            : isLocked
                              ? `🔒 ${t('trail.locked', 'Bloqueado')}`
                              : `⏳ ${t('trail.inProgress', 'Em andamento')}`}
                      </span>
                      {!node.buddyOnly && (() => {
                        const nodeRank = getRankForAchievements(node.id);
                        const prevRank = node.id > 1 ? getRankForAchievements(node.id - 1) : null;
                        const isNewRank = !prevRank || nodeRank.key !== prevRank.key || nodeRank.subTier !== prevRank.subTier;
                        if (!isNewRank) return null;
                        return (
                          <span className={`text-[9px] font-bold ${nodeRank.textColor} flex items-center gap-0.5`}>
                            {nodeRank.emoji} {getRankDisplayName(nodeRank, t)}
                          </span>
                        );
                      })()}
                    </div>
                  </motion.button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive detail panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`border-t px-4 py-3 ${selectedNode.buddyOnly ? 'border-buddy/40 bg-buddy/10' : 'border-border bg-muted/30'}`}
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-bold">
                    {selectedNode.buddyOnly && <Crown className="h-4 w-4 shrink-0 text-buddy" />}
                    {getNodeText(selectedNode).title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {getNodeText(selectedNode).objective || t('trail.defaultObjective', 'Continue usando o app para desbloquear essa conquista.')}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={`gap-1 text-[10px] ${selectedNode.buddyOnly ? 'border-buddy/50 text-buddy' : ''}`}>
                      <Gift className="h-3 w-3" /> +{selectedNode.creditReward} {t('credits.label', 'créditos')}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {completedSet.has(selectedNode.id)
                        ? `✅ ${t('trail.completed', 'Concluído')}`
                        : isNodeLocked(selectedNode)
                          ? `🔒 ${t('trail.locked', 'Bloqueado')}`
                          : `⏳ ${t('trail.inProgress', 'Em andamento')}`}
                    </Badge>
                    {selectedNode.buddyOnly && !isBuddy && (
                      <Button
                        size="sm"
                        className="h-7 bg-buddy text-buddy-foreground hover:bg-buddy/90"
                        onClick={() => { onClose(); navigate('/buddy'); }}
                      >
                        {t('trail.unlockPremium', 'Desbloquear trilha Buddy')}
                      </Button>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setSelectedId(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
