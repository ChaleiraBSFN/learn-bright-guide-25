import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Medal, Star, Crown, ChevronRight } from 'lucide-react';
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
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [ranking, setRanking] = useState<RankingUser[]>([]);

  useEffect(() => {
    if (!open) return;
    
    const loadRanking = async () => {
      setLoading(true);
      try {
        // Get all achievements
        const { data: achievements, error } = await (supabase.from as any)('user_achievements')
          .select('user_id');
          
        if (error) throw error;
        
        // Group and count
        const counts: Record<string, { score: number }> = {};
        achievements?.forEach((ach: any) => {
          const uid = ach.user_id;
          if (!counts[uid]) {
            counts[uid] = { score: 0 };
          }
          counts[uid].score += 1;
        });

        // Find users to get names/emails
        const userIds = Object.keys(counts);
        let profiles: any[] = [];

        if (userIds.length > 0) {
          const { data: profs } = await (supabase.from as any)('profiles')
            .select('user_id, display_name, email')
            .in('user_id', userIds);
          
          if (profs) profiles = profs;
        }
        
        const sorted = userIds
          .map((userId) => {
            const profile = profiles.find((p: any) => p.user_id === userId);
            const name = profile?.display_name || profile?.email?.split('@')[0] || 'Estudante Anônimo';
            return { userId, name, score: counts[userId].score };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 100); // Top 100
          
        setRanking(sorted);
      } catch (err) {
        console.error("Falha ao carregar ranking do banco real", err);
        setRanking([]);
      }
      setLoading(false);
    };
    
    loadRanking();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] p-0 overflow-hidden flex flex-col bg-zinc-50 dark:bg-zinc-950">
        
        <DialogHeader className="p-5 pb-4 border-b border-border bg-card/95 backdrop-blur-md">
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Ranking de Conquistas
          </DialogTitle>
          <p className="text-xs text-muted-foreground pt-1">Os melhores estudantes da plataforma com mais nós destravados na Trilha.</p>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex justify-center p-8 opacity-50 text-sm">Carregando...</div>
          ) : ranking.length === 0 ? (
            <div className="text-center p-8 flex flex-col items-center justify-center gap-3">
              <Trophy className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground text-sm font-medium">
                Nenhum progresso real encontrado ainda.
              </p>
              <p className="text-xs text-muted-foreground/60 max-w-[250px]">
                Se você é o administrador, certifique-se de executar o arquivo SQL <b>20260324000000_user_achievements.sql</b> no Supabase para inicializar os perfis reais!
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {ranking.map((user, index) => {
                const isTop3 = index < 3;
                return (
                  <div 
                    key={user.userId} 
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      index === 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 
                      index === 1 ? 'bg-zinc-200/50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700' :
                      index === 2 ? 'bg-orange-500/5 border-orange-500/20' : 
                      'bg-card border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400' :
                        index === 1 ? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300' :
                        index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-400' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index === 0 ? <Crown className="h-4 w-4" /> : `#${index + 1}`}
                      </div>
                      <span className={`font-semibold text-sm ${isTop3 ? 'text-foreground' : 'text-foreground/80'}`}>
                        {user.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`gap-1 ${
                        isTop3 ? 'border-primary/30 text-primary bg-primary/5' : 'border-border text-muted-foreground'
                      }`}>
                        <Star className="h-3 w-3" />
                        {user.score} conquistas
                      </Badge>
                    </div>
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
