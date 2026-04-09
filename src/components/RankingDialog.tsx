import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Crown, ChevronRight, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { loadUserCompletedAchievements } from '@/hooks/useAchievements';
import { ALL_RANK_TIERS, getRankForAchievements, getNextRank, getRankDisplayName, isTopRank, RankTier } from '@/lib/ranks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RankingUser {
  userId: string;
  name: string;
  score: number;
  rank: RankTier;
}

interface RankingDialogProps {
  open: boolean;
  onClose: () => void;
}

export const RankingDialog = ({ open, onClose }: RankingDialogProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [myAchievements, setMyAchievements] = useState(0);

  useEffect(() => {
    if (!open) return;

    const loadMyProgress = async () => {
      if (!user) return;
      try {
        const ids = await loadUserCompletedAchievements(user.id);
        setMyAchievements(ids.length);
      } catch { /* ignore */ }
    };

    const loadRanking = async () => {
      setLoading(true);
      try {
        const { data: achievements, error } = await (supabase.from as any)('user_achievements')
          .select('user_id')
          .limit(50000);

        if (error) throw error;

        const counts: Record<string, number> = {};
        achievements?.forEach((ach: any) => {
          counts[ach.user_id] = (counts[ach.user_id] || 0) + 1;
        });

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
            const name = profile?.display_name || profile?.email?.split('@')[0] || t('ranking.anonymousStudent');
            const score = counts[userId];
            return { userId, name, score, rank: getRankForAchievements(score) };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 100);

        setRanking(sorted);
      } catch (err) {
        console.error("Failed to load ranking", err);
        setRanking([]);
      }
      setLoading(false);
    };

    loadMyProgress();
    loadRanking();
  }, [open, t, user]);

  const myRank = useMemo(() => getRankForAchievements(myAchievements), [myAchievements]);
  const nextRank = useMemo(() => getNextRank(myRank), [myRank]);
  const progressToNext = useMemo(() => {
    if (!nextRank) return 100;
    const rangeSize = nextRank.minAchievements - myRank.minAchievements;
    if (rangeSize <= 0) return 100;
    return Math.min(100, ((myAchievements - myRank.minAchievements) / rangeSize) * 100);
  }, [myAchievements, myRank, nextRank]);

  // Only show users with top rank (Surreal) in global top
  const globalTop = useMemo(() => ranking.filter(u => isTopRank(u.rank)), [ranking]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0 overflow-hidden flex flex-col bg-zinc-50 dark:bg-zinc-950">
        <DialogHeader className="p-5 pb-3 border-b border-border bg-card/95 backdrop-blur-md">
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {t('ranking.title')}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            {t('ranking.description')}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="myrank" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-3 grid grid-cols-3">
            <TabsTrigger value="myrank">{t('ranking.myRank', 'Meu Rank')}</TabsTrigger>
            <TabsTrigger value="map">{t('ranking.rankMap', 'Mapa')}</TabsTrigger>
            <TabsTrigger value="global">{t('ranking.globalTop', 'Top Global')}</TabsTrigger>
          </TabsList>

          {/* MY RANK TAB */}
          <TabsContent value="myrank" className="flex-1 overflow-auto px-4 pb-4">
            {!user ? (
              <div className="text-center p-8 text-muted-foreground text-sm">
                {t('trail.loginToSave', 'Faça login para ver seu rank!')}
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {/* Current rank card */}
                <div className={`rounded-2xl border-2 ${myRank.borderColor} ${myRank.bgColor} p-5 text-center space-y-3`}>
                  <div className="text-4xl">{myRank.emoji}</div>
                  <div className={`text-xl font-bold ${myRank.textColor}`}>
                    {getRankDisplayName(myRank, t)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {myAchievements} {t('ranking.achievements')}
                  </div>
                </div>

                {/* Progress to next */}
                {nextRank ? (
                  <div className="space-y-2 rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {t('ranking.nextRank', 'Próximo rank')}
                      </span>
                      <span className={`font-semibold ${nextRank.textColor}`}>
                        {nextRank.emoji} {getRankDisplayName(nextRank, t)}
                      </span>
                    </div>
                    <Progress value={progressToNext} className="h-2" />
                    <div className="text-[11px] text-muted-foreground text-center">
                      {nextRank.minAchievements - myAchievements} {t('ranking.achievementsLeft', 'conquistas restantes')}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-sm text-primary font-semibold p-3">
                    👑 {t('ranking.maxRank', 'Você atingiu o rank máximo!')}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* RANK MAP TAB */}
          <TabsContent value="map" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-4 pb-4">
              <div className="space-y-2 pt-1">
                {ALL_RANK_TIERS.map((tier, idx) => {
                  const isCurrent = tier === myRank;
                  const isReached = myAchievements >= tier.minAchievements;
                  return (
                    <div
                      key={`${tier.key}-${tier.subTier}`}
                      className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                        isCurrent
                          ? `${tier.borderColor} ${tier.bgColor} ring-2 ring-offset-1 ring-primary/30`
                          : isReached
                            ? `${tier.borderColor} ${tier.bgColor} opacity-80`
                            : 'border-border bg-card opacity-50'
                      }`}
                    >
                      <span className="text-xl w-8 text-center">{tier.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-bold ${isReached ? tier.textColor : 'text-muted-foreground'}`}>
                          {getRankDisplayName(tier, t)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {tier.minAchievements}+ {t('ranking.achievements')}
                        </div>
                      </div>
                      {isCurrent && (
                        <Badge variant="outline" className="text-[10px] gap-1 border-primary/40">
                          <ChevronRight className="h-3 w-3" />
                          {t('ranking.youAreHere', 'Você está aqui')}
                        </Badge>
                      )}
                      {isReached && !isCurrent && (
                        <span className="text-primary text-xs">✓</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* GLOBAL TOP TAB */}
          <TabsContent value="global" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-4 pb-4">
              {loading ? (
                <div className="flex justify-center p-8 opacity-50 text-sm">{t('ranking.loading')}</div>
              ) : globalTop.length === 0 ? (
                <div className="text-center p-8 flex flex-col items-center justify-center gap-3">
                  <Crown className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-muted-foreground text-sm font-medium">
                    {t('ranking.noSurreal', 'Ninguém atingiu o rank máximo ainda!')}
                  </p>
                  <p className="text-xs text-muted-foreground/60 max-w-[250px]">
                    {t('ranking.noSurrealHint', 'Complete todos os desafios da trilha para aparecer aqui!')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {globalTop.map((u, index) => (
                    <div
                      key={u.userId}
                      className={`flex items-center justify-between p-3 rounded-xl border ${
                        index === 0
                          ? 'bg-purple-500/10 border-purple-500/30'
                          : 'bg-card border-border'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-xs">
                          {index === 0 ? <Crown className="h-4 w-4" /> : `#${index + 1}`}
                        </div>
                        <div>
                          <span className="font-semibold text-sm text-foreground">{u.name}</span>
                          <div className={`text-[10px] font-medium ${u.rank.textColor}`}>
                            {u.rank.emoji} {getRankDisplayName(u.rank, t)}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="gap-1 border-purple-500/30 text-purple-400 bg-purple-500/5">
                        <Star className="h-3 w-3" />
                        {u.score}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Full ranking below */}
              {ranking.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xs font-semibold text-muted-foreground mb-3 px-1">
                    {t('ranking.allPlayers', 'Todos os jogadores')}
                  </h3>
                  <div className="space-y-2">
                    {ranking.map((u, index) => (
                      <div
                        key={u.userId}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs w-6 text-center text-muted-foreground font-mono">
                            #{index + 1}
                          </span>
                          <span className="text-lg">{u.rank.emoji}</span>
                          <div>
                            <span className="text-xs font-medium text-foreground">{u.name}</span>
                            <div className={`text-[10px] ${u.rank.textColor}`}>
                              {getRankDisplayName(u.rank, t)}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{u.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
