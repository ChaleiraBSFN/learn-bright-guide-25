import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lock, Coins, Info, BookOpen, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
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

  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [translatedNodes, setTranslatedNodes] = useState<Record<string, Record<number, { title: string; objective: string }>>>({});
  const [translatingLang, setTranslatingLang] = useState<string | null>(null);

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
    const t = translatedNodes[lang]?.[node.id];
    return t || { title: node.title, objective: node.objective || '' };
  }, [currentLang, translatedNodes]);

  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);
  const completedCount = useMemo(() => trailNodes.filter((node) => completedSet.has(node.id)).length, [trailNodes, completedSet]);
  const mapWidth = Math.max(...trailNodes.map((node) => node.x), 0) + 240;
  const mapHeight = Math.max(...trailNodes.map((node) => node.y), 0) + 280;

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

    const handleTrailNodesUpdated = () => {
      loadProgress();
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
    window.addEventListener('trail_nodes_updated', handleTrailNodesUpdated);
    window.addEventListener('storage', loadProgress);
    window.addEventListener('focus', loadProgress);
    window.addEventListener('online', loadProgress);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('achievement_unlocked', loadProgress);
      window.removeEventListener('achievements_updated', loadProgress);
      window.removeEventListener('trail_nodes_updated', handleTrailNodesUpdated);
      window.removeEventListener('storage', loadProgress);
      window.removeEventListener('focus', loadProgress);
      window.removeEventListener('online', loadProgress);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (channel) supabase.removeChannel(channel);
    };
  }, [open, user]);

  const handleNodeClick = (node: TrailNodeDef, isCompleted: boolean, isLocked: boolean) => {
    if (!user) {
      toast({ title: t('trail.createAccount', 'Crie uma conta'), description: t('trail.loginToSave', 'Faça login para salvar seu progresso!'), variant: 'destructive' });
      return;
    }

    const { title: nodeTitle, objective: nodeObjective } = getNodeText(node);
    const statusText = isCompleted ? `✅ ${t('trail.completed', 'Concluído')}` : isLocked ? `🔒 ${t('trail.locked', 'Bloqueado')}` : `🔓 ${t('trail.inProgress', 'Em andamento')}`;
    const objective = nodeObjective || t('trail.defaultObjective', 'Continue usando o app para desbloquear essa conquista.');

    toast({
      title: `${nodeTitle} — ${statusText}`,
      description: isCompleted
        ? `${objective}\n\n🎉 ${t('trail.alreadyEarned', 'Você já ganhou')} +${node.creditReward} ${t('credits.label', 'créditos')}!`
        : `📋 ${objective}\n\n🎁 ${t('trail.reward', 'Recompensa')}: +${node.creditReward} ${t('credits.label', 'créditos')}.`,
      duration: 7000,
    });
  };

  const progressPercent = trailNodes.length > 0 ? (completedCount / trailNodes.length) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="flex max-h-[92vh] w-[96vw] max-w-6xl flex-col overflow-hidden bg-background p-0">
        <DialogHeader className="z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
          <DialogTitle className="flex items-center justify-between gap-3 text-base">
            <span className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
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

          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{completedCount}/{trailNodes.length} completas</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        </DialogHeader>

        <div className="relative min-h-[460px] flex-1 overflow-auto bg-muted/20">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
              backgroundSize: '26px 26px',
              opacity: 0.28,
            }}
          />

          {!user && (
            <div className="absolute left-1/2 top-3 z-20 w-[88%] max-w-sm -translate-x-1/2 rounded-lg border border-accent/30 bg-background/90 p-2.5 text-center text-xs text-foreground shadow-sm">
              <Info className="mr-1 inline h-3.5 w-3.5 text-primary" /> Faça login para salvar progresso!
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

              {/* Layer 1: All road backgrounds in one group to avoid overlap artifacts */}
              <g>
                {trailNodes.flatMap((node) =>
                  node.parents.map((parentId) => {
                    const parent = trailNodes.find((item) => item.id === parentId);
                    if (!parent) return null;
                    return <path key={`road-${parent.id}-${node.id}`} d={buildPath(parent, node)} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={34} stroke="hsl(220, 60%, 20%)" />;
                  }),
                )}
              </g>

              {/* Layer 2: Glow for unlocked segments */}
              <g>
                {trailNodes.flatMap((node) =>
                  node.parents.map((parentId) => {
                    const parent = trailNodes.find((item) => item.id === parentId);
                    if (!parent || !completedSet.has(parent.id)) return null;
                    return <path key={`glow-${parent.id}-${node.id}`} d={buildPath(parent, node)} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={36} stroke="hsl(var(--primary) / 0.15)" filter="url(#trail-glow)" />;
                  }),
                )}
              </g>

              {/* Layer 3: Dashed center line */}
              <g>
                {trailNodes.flatMap((node) =>
                  node.parents.map((parentId) => {
                    const parent = trailNodes.find((item) => item.id === parentId);
                    if (!parent) return null;
                    return <path key={`dash-${parent.id}-${node.id}`} d={buildPath(parent, node)} fill="none" strokeLinecap="round" strokeWidth={2} strokeDasharray="10,8" stroke="hsl(220, 50%, 30%)" />;
                  }),
                )}
              </g>
            </svg>

            {trailNodes.map((node, index) => {
              const Icon = availableIcons[node.iconName] || availableIcons.BookOpen;
              const isCompleted = completedSet.has(node.id);
              const isLocked = node.parents.length > 0 && !node.parents.every((parentId) => completedSet.has(parentId));
              const isNext = !isCompleted && !isLocked;

              return (
                <div key={node.id} className="absolute" style={{ left: node.x, top: node.y }}>
                  <motion.button
                    onClick={() => handleNodeClick(node, isCompleted, isLocked)}
                    whileHover={!isLocked ? { scale: 1.08, y: -2 } : {}}
                    whileTap={!isLocked ? { scale: 0.95 } : {}}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.025, duration: 0.25 }}
                    className="relative -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                  >
                    <div
                      className={`relative flex h-14 w-14 items-center justify-center rounded-full border-[3px] shadow-lg transition-all duration-300 ${
                        isLocked
                          ? 'border-border bg-muted text-muted-foreground/60'
                          : isCompleted
                            ? `bg-gradient-to-br ${typeGradient[node.type]} border-background shadow-[0_0_18px_hsl(var(--primary)/0.28)]`
                            : `bg-gradient-to-br ${typeGradient[node.type]} border-background shadow-[0_0_22px_hsl(var(--primary)/0.34)]`
                      }`}
                    >
                      {isLocked ? <Lock className="h-5 w-5" /> : <Icon className="h-5 w-5 text-primary-foreground" />}

                      {isCompleted && (
                        <span className="absolute -right-1 -top-1 rounded-full border-2 border-background bg-primary p-0.5 shadow-sm">
                          <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                        </span>
                      )}

                      {isNext && <span className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping" />}
                    </div>

                    <div className="absolute left-1/2 top-full mt-2 flex w-32 -translate-x-1/2 flex-col items-center gap-1 text-center">
                      <span className="rounded-md bg-background/90 px-2 py-1 text-[10px] font-semibold leading-tight text-foreground shadow-sm ring-1 ring-border/60 backdrop-blur-sm">
                        {getNodeText(node).title}
                      </span>
                      <span className={`text-[10px] font-medium ${isCompleted ? 'text-primary' : isLocked ? 'text-muted-foreground/60' : 'text-foreground/80'}`}>
                        {isCompleted ? `✓ ${t('trail.done', 'Feito')}` : `+${node.creditReward} ${t('credits.label', 'créditos')}`}
                      </span>
                    </div>
                  </motion.button>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
