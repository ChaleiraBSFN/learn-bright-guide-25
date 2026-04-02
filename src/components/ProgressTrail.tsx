import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lock, Coins, Info, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAchievementData, availableIcons, TrailNodeDef } from '@/hooks/useAchievements';

const nodeColors: Record<string, string> = {
  challenge: 'from-primary to-primary/80',
  quiz: 'from-secondary to-secondary/80',
  milestone: 'from-accent to-accent/80',
  reward: 'from-purple-500 to-pink-500',
};

const nodeBorderColors: Record<string, string> = {
  challenge: 'border-primary/50',
  quiz: 'border-secondary/50',
  milestone: 'border-accent/50',
  reward: 'border-purple-500/50',
};

interface ProgressTrailProps {
  open: boolean;
  onClose: () => void;
}

export const ProgressTrail = ({ open, onClose }: ProgressTrailProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { credits, addCredits } = useCredits();
  const { toast } = useToast();
  const { nodes: trailNodes } = useAchievementData();
  
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const loadProgress = async () => {
      setLoading(true);
      try {
        const { data, error } = await (supabase.from as any)('user_achievements')
          .select('achievement_id')
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        let ids = data?.map((r: any) => r.achievement_id) || [];

        const stored = JSON.parse(localStorage.getItem(`achievements_v2_${user.id}`) || '[]');
        if (stored.length > 0) {
          const missingInCloud = stored.filter((id: number) => !ids.includes(id));
          if (missingInCloud.length > 0) {
            console.log("Enviando progresso local antigo para a nuvem...", missingInCloud);
            for (const mId of missingInCloud) {
               await (supabase.from as any)('user_achievements').insert({ user_id: user.id, achievement_id: mId }).catch(() => {});
            }
            ids = [...ids, ...missingInCloud];
          }
        }

        setCompletedIds(ids);
      } catch (err) {
        console.log('Fallback para localStorage', err);
        const stored = JSON.parse(localStorage.getItem(`achievements_v2_${user.id}`) || '[]');
        setCompletedIds(stored);
      }
      setLoading(false);
    };
    
    // Alvo de problema corrigido: só carregar se estiver aberto ou carregar em background para não perder estado
    if (open) {
      loadProgress();
    }
    
    window.addEventListener('achievement_unlocked', loadProgress);
    return () => window.removeEventListener('achievement_unlocked', loadProgress);
  }, [open, user]);

  const handleNodeClick = async (node: TrailNodeDef, isCompleted: boolean, isLocked: boolean) => {
    if (!user) {
      toast({ 
        title: "Crie uma conta", 
        description: "Você precisa fazer login para salvar seu progresso e ganhar créditos na trilha!", 
        variant: "destructive" 
      });
      return;
    }

    let statusText = "Em andamento";
    if (isCompleted) statusText = "Concluído ✅";
    if (isLocked) statusText = "Bloqueado 🔒";

    let objective = node.objective || "Continue usando o aplicativo para desbloquear essa conquista. A conclusão é automática dependendo do desafio.";

    toast({ 
      title: `${node.title} (${statusText})`, 
      description: isCompleted 
        ? `Você já ganhou +${node.creditReward} créditos por essa conquista!` 
        : `Objetivo: ${objective} \nRecompensa: +${node.creditReward} créditos. A conclusão é automática.`,
      duration: 6000,
    });
  };

  const progressPercent = (completedIds.length / trailNodes.length) * 100;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
        
        {/* HEADER */}
        <DialogHeader className="z-10 bg-background/95 backdrop-blur-sm border-b border-border p-4 pb-3">
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {t('trail.title', 'Trilha de Conquistas')}
            </span>
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="outline" className="gap-1 font-bold text-yellow-500 border-yellow-500/30">
                <Coins className="h-4 w-4" /> {credits !== null ? credits : '...'} Créditos
              </Badge>
            </div>
          </DialogTitle>
          
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completedIds.length}/{trailNodes.length} completas</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </DialogHeader>

        {/* MAP CONTAINER */}
        <div className="flex-1 w-full overflow-auto relative min-h-[400px] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] dark:bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-20">
          
          {/* Subtle grid overlay to enhance map feel */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          
          {!user && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-md p-3 rounded-lg bg-orange-100 dark:bg-orange-950/80 border border-orange-200 dark:border-orange-800 text-sm text-center text-orange-800 dark:text-orange-300 shadow-md">
              <span className="font-semibold flex items-center justify-center gap-2">
                <Info className="h-4 w-4" /> Faça login para jogar!
              </span>
              Seu progresso não está sendo salvo atualmente.
            </div>
          )}

          <div className="relative w-[1450px] h-[400px] p-8">
            {/* SVG Connections */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              {trailNodes.map(node => {
                const isCompleted = completedIds.includes(node.id);
                return node.parents.map(parentId => {
                  const parent = trailNodes.find(n => n.id === parentId);
                  if (!parent) return null;
                  
                  // Check if this path is "unlocked"
                  const isPathUnlocked = completedIds.includes(parent.id);
                  
                  return (
                    <line 
                      key={`${parent.id}-${node.id}`}
                      x1={parent.x} 
                      y1={parent.y} 
                      x2={node.x} 
                      y2={node.y} 
                      className={`transition-colors duration-500 ${isPathUnlocked ? 'stroke-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]' : 'stroke-border dark:stroke-zinc-800'}`}
                      strokeWidth={isPathUnlocked ? "6" : "3"}
                      strokeLinecap="round"
                      strokeDasharray={isPathUnlocked ? "none" : "6,6"}
                    />
                  );
                });
              })}
            </svg>

            {/* Nodes */}
            {trailNodes.map((node, index) => {
              const Icon = availableIcons[node.iconName] || availableIcons.BookOpen;
              const isCompleted = completedIds.includes(node.id);
              // A node is locked if it has parents, and NOT ALL of its parents are completed.
              // Wait, in standard progression trees, usually ONE parent completed is enough, OR ALL parents.
              // Let's require ONE parent to be completed to unlock.
              const isLocked = node.parents.length > 0 && !node.parents.some(p => completedIds.includes(p));
              const isNext = !isCompleted && !isLocked;

              return (
                <motion.button
                  key={node.id}
                  onClick={() => handleNodeClick(node, isCompleted, isLocked)}
                  whileHover={!isLocked ? { scale: 1.05 } : {}}
                  whileTap={!isLocked ? { scale: 0.95 } : {}}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  style={{ left: node.x, top: node.y }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center p-3 rounded-2xl w-40 transition-all duration-300 shadow-md backdrop-blur-md
                    ${isLocked 
                      ? 'bg-muted/80 border-2 border-dashed border-border opacity-70 cursor-not-allowed filter grayscale drop-shadow-none'
                      : isCompleted
                      ? 'bg-card/90 border-2 border-primary/40 shadow-[0_0_15px_-3px_hsl(var(--primary)/0.3)] ring-1 ring-primary/20'
                      : 'bg-card/95 border-2 border-primary shadow-[0_0_20px_-3px_hsl(var(--primary)/0.6)] ring-4 ring-primary/20 cursor-pointer hover:shadow-[0_0_25px_-3px_hsl(var(--primary)/0.8)] scale-[1.02]'
                    }`}
                >
                  <div className={`relative shrink-0 h-10 w-10 mb-2 rounded-xl flex items-center justify-center shadow-inner
                    ${isCompleted
                      ? 'bg-gradient-to-br ' + nodeColors[node.type]
                      : isLocked
                      ? 'bg-muted border border-muted-foreground/30'
                      : 'bg-gradient-to-br ' + nodeColors[node.type] + ' ring-2 ring-background'
                    }`}>
                    {isLocked ? (
                      <Lock className="h-5 w-5 text-muted-foreground/50" />
                    ) : (
                      <Icon className={`h-5 w-5 ${isCompleted || isNext ? 'text-white' : 'text-foreground'}`} />
                    )}
                  </div>

                  <h4 className={`font-bold text-center text-[11px] leading-tight px-1 mb-1 ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {node.title}
                  </h4>
                  
                  <div className="flex items-center gap-1 justify-center">
                    <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 border-transparent ${isCompleted ? 'bg-primary/20 text-primary' : 'bg-orange-500/10 text-orange-600'}`}>
                      {isCompleted ? 'Feito' : `+${node.creditReward} Créditos`}
                    </Badge>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};
