import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Star, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RankingUser {
  userId: string;
  name: string;
  score: number;
}

interface RankingDialogProps {
  open: boolean;
  onClose: () => void;
}

export const RankingDialog = ({ open, onClose }: RankingDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [ranking, setRanking] = useState<RankingUser[]>([]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const loadRanking = async () => {
      setLoading(true);
      try {
        const { data: achievements, error } = await (supabase.from as any)('user_achievements')
          .select('user_id, achievement_id');

        if (error) throw error;

        const perUser = new Map<string, Set<number>>();
        achievements?.forEach((achievement: any) => {
          const userId = achievement.user_id;
          const achievementId = Number(achievement.achievement_id);
          if (!userId || !Number.isFinite(achievementId)) return;
          if (!perUser.has(userId)) perUser.set(userId, new Set<number>());
          perUser.get(userId)!.add(achievementId);
        });

        const userIds = Array.from(perUser.keys());
        let profiles: any[] = [];

        if (userIds.length > 0) {
          const { data: profileRows } = await (supabase.from as any)('profiles')
            .select('user_id, display_name, email')
            .in('user_id', userIds);
          profiles = profileRows || [];
        }

        const nextRanking = userIds
          .map((userId) => {
            const profile = profiles.find((item) => item.user_id === userId);
            return {
              userId,
              name: profile?.display_name || profile?.email?.split('@')[0] || 'Estudante Anônimo',
              score: perUser.get(userId)?.size || 0,
            };
          })
          .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
          .slice(0, 100);

        if (!cancelled) setRanking(nextRanking);
      } catch (error) {
        console.error('Falha ao carregar ranking:', error);
        if (!cancelled) setRanking([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRanking();
    const intervalId = window.setInterval(loadRanking, 15000);
    const refresh = () => loadRanking();
    window.addEventListener('achievements_changed', refresh);
    window.addEventListener('storage', refresh);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('achievements_changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] p-0 overflow-hidden flex flex-col bg-card">
        <DialogHeader className="p-5 pb-4 border-b border-border bg-card/95 backdrop-blur-md">
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Ranking de Conquistas
          </DialogTitle>
          <p className="text-xs text-muted-foreground pt-1">Usuários reais com mais conquistas únicas destravadas.</p>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex justify-center p-8 opacity-50 text-sm">Carregando...</div>
          ) : ranking.length === 0 ? (
            <div className="text-center p-8 flex flex-col items-center justify-center gap-3">
              <Trophy className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground text-sm font-medium">Ninguém pontuou no ranking ainda.</p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {ranking.map((user, index) => {
                const isTop3 = index < 3;
                return (
                  <div
                    key={user.userId}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      index === 0
                        ? 'bg-primary/10 border-primary/30'
                        : index === 1
                        ? 'bg-secondary/10 border-secondary/30'
                        : index === 2
                        ? 'bg-accent/10 border-accent/30'
                        : 'bg-card border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${isTop3 ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {index === 0 ? <Crown className="h-4 w-4" /> : `#${index + 1}`}
                      </div>
                      <span className={`font-semibold text-sm truncate ${isTop3 ? 'text-foreground' : 'text-foreground/80'}`}>
                        {user.name}
                      </span>
                    </div>
                    <Badge variant="outline" className={`${isTop3 ? 'border-primary/30 text-primary bg-primary/5' : 'border-border text-muted-foreground'} gap-1 shrink-0`}>
                      <Star className="h-3 w-3" />
                      {user.score}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};