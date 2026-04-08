import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lock, Coins, Info, BookOpen, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAchievementData, availableIcons, TrailNodeDef, loadUserCompletedAchievements } from '@/hooks/useAchievements';

const typeGradient: Record<string, string> = {
  challenge: 'from-blue-500 to-cyan-400',
  quiz: 'from-violet-500 to-fuchsia-400',
  milestone: 'from-amber-500 to-yellow-300',
  reward: 'from-emerald-500 to-lime-400',
};

interface ProgressTrailProps {
  open: boolean;
  onClose: () => void;
}

export const ProgressTrail = ({ open, onClose }: ProgressTrailProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { credits } = useCredits();
  const { toast } = useToast();
  const { nodes: trailNodes } = useAchievementData();

  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const mapWidth = Math.max(...trailNodes.map(n => n.x), 0) + 200;
  const mapHeight = Math.max(...trailNodes.map(n => n.y), 0) + 180;

  useEffect(() => {
    const loadProgress = async () => {
      if (!user) { setCompletedIds([]); return; }
      setLoading(true);
      try {
        const ids = await loadUserCompletedAchievements(user.id);
        setCompletedIds(ids);
      } catch { setCompletedIds([]); }
      finally { setLoading(false); }
    };

    const onVis = () => { if (document.visibilityState === 'visible') loadProgress(); };
    if (open) loadProgress();
    const interval = window.setInterval(() => { if (open) loadProgress(); }, 15000);

    const channel = user && open
      ? supabase.channel(`user-achievements-${user.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'user_achievements', filter: `user_id=eq.${user.id}` }, loadProgress)
          .subscribe()
      : null;

    window.addEventListener('achievement_unlocked', loadProgress);
    window.addEventListener('achievements_updated', loadProgress);
    window.addEventListener('storage', loadProgress);
    window.addEventListener('focus', loadProgress);
    document.addEventListener('visibilitychange', onVis);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('achievement_unlocked', loadProgress);
      window.removeEventListener('achievements_updated', loadProgress);
      window.removeEventListener('storage', loadProgress);
      window.removeEventListener('focus', loadProgress);
      document.removeEventListener('visibilitychange', onVis);
      if (channel) supabase.removeChannel(channel);
    };
  }, [open, user]);

  const handleNodeClick = (node: TrailNodeDef, isCompleted: boolean, isLocked: boolean) => {
    if (!user) {
      toast({ title: "Crie uma conta", description: "Faça login para salvar seu progresso!", variant: "destructive" });
      return;
    }
    const status = isCompleted ? "✅ Concluído" : isLocked ? "🔒 Bloqueado" : "🔓 Em andamento";
    const obj = node.objective || "Continue usando o app para desbloquear.";
    toast({
      title: `${node.title} — ${status}`,
      description: isCompleted
        ? `${obj}\n\n🎉 +${node.creditReward} créditos ganhos!`
        : `📋 ${obj}\n\n🎁 Recompensa: +${node.creditReward} créditos.`,
      duration: 6000,
    });
  };

  const progressPercent = trailNodes.length > 0 ? (completedIds.length / trailNodes.length) * 100 : 0;

  // Build curved SVG paths between connected nodes
  const buildPath = (from: TrailNodeDef, to: TrailNodeDef) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    // Create a smooth bezier curve
    const cx1 = from.x + dx * 0.5;
    const cy1 = from.y;
    const cx2 = from.x + dx * 0.5;
    const cy2 = to.y;
    return `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[96vw] max-w-5xl max-h-[92vh] flex flex-col p-0 bg-background overflow-hidden">

        {/* HEADER */}
        <DialogHeader className="z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
          <DialogTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {t('trail.title', 'Trilha de Conquistas')}
            </span>
            <Badge variant="outline" className="gap-1 font-bold text-yellow-500 border-yellow-500/30 text-xs">
              <Coins className="h-3.5 w-3.5" /> {credits ?? '...'} Créditos
            </Badge>
          </DialogTitle>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{completedIds.length}/{trailNodes.length} completas</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        </DialogHeader>

        {/* MAP */}
        <div className="flex-1 w-full overflow-auto relative min-h-[400px]"
          style={{ background: 'radial-gradient(circle at 30% 20%, hsl(var(--primary) / 0.06) 0%, transparent 60%), hsl(var(--muted) / 0.15)' }}>

          {/* Grid dots for map feel */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            opacity: 0.3,
          }} />

          {!user && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-[88%] max-w-sm p-2.5 rounded-lg bg-orange-100 dark:bg-orange-950/80 border border-orange-300 dark:border-orange-800 text-xs text-center text-orange-800 dark:text-orange-300 shadow">
              <Info className="h-3.5 w-3.5 inline mr-1" /> Faça login para salvar progresso!
            </div>
          )}

          <div className="relative" style={{ width: mapWidth, height: mapHeight, minWidth: '100%' }}>
            {/* SVG Paths */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ width: mapWidth, height: mapHeight }}>
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              {trailNodes.map(node =>
                node.parents.map(parentId => {
                  const parent = trailNodes.find(n => n.id === parentId);
                  if (!parent) return null;
                  const unlocked = completedIds.includes(parent.id);
                  return (
                    <path
                      key={`${parent.id}-${node.id}`}
                      d={buildPath(parent, node)}
                      fill="none"
                      strokeLinecap="round"
                      strokeWidth={unlocked ? 4 : 2}
                      strokeDasharray={unlocked ? 'none' : '8,6'}
                      className={unlocked ? 'stroke-primary' : 'stroke-border dark:stroke-zinc-700'}
                      filter={unlocked ? 'url(#glow)' : undefined}
                      style={{ transition: 'all 0.5s ease' }}
                    />
                  );
                })
              )}
            </svg>

            {/* Nodes */}
            {trailNodes.map((node, index) => {
              const Icon = availableIcons[node.iconName] || availableIcons.BookOpen;
              const isCompleted = completedIds.includes(node.id);
              const isLocked = node.parents.length > 0 && !node.parents.some(p => completedIds.includes(p));
              const isNext = !isCompleted && !isLocked;

              return (
                <motion.button
                  key={node.id}
                  onClick={() => handleNodeClick(node, isCompleted, isLocked)}
                  whileHover={!isLocked ? { scale: 1.08, y: -2 } : {}}
                  whileTap={!isLocked ? { scale: 0.95 } : {}}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03, duration: 0.25 }}
                  style={{ left: node.x, top: node.y }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center rounded-xl w-[120px] p-2 transition-all duration-200
                    ${isLocked
                      ? 'opacity-50 cursor-not-allowed grayscale'
                      : isCompleted
                        ? 'cursor-pointer'
                        : 'cursor-pointer'
                    }`}
                >
                  {/* Node circle */}
                  <div className={`relative w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-[3px] transition-all duration-300
                    ${isLocked
                      ? 'bg-muted border-border'
                      : isCompleted
                        ? `bg-gradient-to-br ${typeGradient[node.type]} border-white/40 shadow-[0_0_16px_2px_hsl(var(--primary)/0.35)]`
                        : `bg-gradient-to-br ${typeGradient[node.type]} border-white/20 animate-pulse shadow-[0_0_20px_4px_hsl(var(--primary)/0.5)]`
                    }`}>
                    {isLocked ? (
                      <Lock className="h-5 w-5 text-muted-foreground/60" />
                    ) : (
                      <Icon className="h-5 w-5 text-white drop-shadow" />
                    )}
                    {/* Completed checkmark */}
                    {isCompleted && (
                      <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-background shadow">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                    )}
                    {/* Pulsing ring for next available */}
                    {isNext && (
                      <span className="absolute inset-0 rounded-full border-2 border-primary/60 animate-ping" />
                    )}
                  </div>

                  {/* Title */}
                  <span className={`mt-1.5 text-[10px] font-semibold leading-tight text-center line-clamp-2 max-w-[110px]
                    ${isLocked ? 'text-muted-foreground/60' : 'text-foreground'}`}>
                    {node.title}
                  </span>

                  {/* Reward badge */}
                  <span className={`mt-0.5 text-[9px] font-medium
                    ${isCompleted ? 'text-green-500' : isLocked ? 'text-muted-foreground/40' : 'text-primary'}`}>
                    {isCompleted ? '✓ Feito' : `+${node.creditReward}`}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
