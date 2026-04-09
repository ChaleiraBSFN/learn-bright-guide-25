import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Users, Crown, BarChart3, Clock, BookOpen, PenTool, TrendingUp, RefreshCw, Wifi } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';
import learnBuddyLogo from '@/assets/learn-buddy-logo.jpeg';

interface AnalyticsData {
  totalUsers: number;
  premiumUsers: number;
  totalStudies: number;
  totalExercises: number;
  studiesLast7Days: number;
  exercisesLast7Days: number;
  studiesLast30Days: number;
  exercisesLast30Days: number;
  totalCreditsUsed: number;
  totalAchievements: number;
  activeToday: number;
}

const ManageUsers = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) navigate('/');
  }, [isAdmin, adminLoading, user, navigate]);

  const fetchAnalytics = useCallback(async (showLoader = false) => {
    if (!isAdmin) return;
    if (showLoader) setLoading(true);
    try {
      const [profilesRes, subsRes, historyRes, creditsRes, achievementsRes, visitsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('id, status, expires_at'),
        supabase.from('user_history').select('type, created_at'),
        supabase.from('user_credits').select('total_earned'),
        supabase.from('user_achievements').select('id', { count: 'exact', head: true }),
        supabase.rpc('get_site_analytics'),
      ]);

      const totalUsers = profilesRes.count || 0;
      const premiumUsers = (subsRes.data || []).filter(
        s => s.status === 'active' && s.expires_at && new Date(s.expires_at) > new Date()
      ).length;

      const history = historyRes.data || [];
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const totalStudies = history.filter(h => h.type === 'study').length;
      const totalExercises = history.filter(h => h.type === 'exercise').length;
      const studiesLast7Days = history.filter(h => h.type === 'study' && new Date(h.created_at) >= sevenDaysAgo).length;
      const exercisesLast7Days = history.filter(h => h.type === 'exercise' && new Date(h.created_at) >= sevenDaysAgo).length;
      const studiesLast30Days = history.filter(h => h.type === 'study' && new Date(h.created_at) >= thirtyDaysAgo).length;
      const exercisesLast30Days = history.filter(h => h.type === 'exercise' && new Date(h.created_at) >= thirtyDaysAgo).length;

      const totalCreditsUsed = (creditsRes.data || []).reduce((sum, c) => sum + (c.total_earned || 0), 0);
      const totalAchievements = achievementsRes.count || 0;

      const visits = visitsRes.data || [];
      const activeToday = new Set(
        visits.filter((v: any) => new Date(v.started_at) >= todayStart).map((v: any) => v.user_id || v.session_id)
      ).size;

      setAnalytics({
        totalUsers, premiumUsers, totalStudies, totalExercises,
        studiesLast7Days, exercisesLast7Days, studiesLast30Days, exercisesLast30Days,
        totalCreditsUsed, totalAchievements, activeToday,
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  // Initial load
  useEffect(() => {
    fetchAnalytics(true);
  }, [fetchAnalytics]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!isLive || !isAdmin) return;
    const interval = setInterval(() => fetchAnalytics(false), 30000);
    return () => clearInterval(interval);
  }, [isLive, isAdmin, fetchAnalytics]);

  // Realtime: refresh when new history or achievements are inserted
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel('analytics-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_history' }, () => fetchAnalytics(false))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_achievements' }, () => fetchAnalytics(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchAnalytics(false))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, fetchAnalytics]);

  // Refresh on visibility
  useEffect(() => {
    const handler = () => { if (document.visibilityState === 'visible') fetchAnalytics(false); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [fetchAnalytics]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const timeAgo = lastUpdate
    ? `${Math.round((Date.now() - lastUpdate.getTime()) / 1000)}s atrás`
    : '';

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={learnBuddyLogo} alt="Learn Buddy" className="h-10 w-10 rounded-xl object-cover" />
              <div>
                <h1 className="font-display text-xl font-bold text-foreground">Learn Buddy</h1>
                <p className="text-xs text-muted-foreground">{t('admin.analytics', 'Analytics')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={isLive ? 'default' : 'outline'}
                className="cursor-pointer gap-1 text-[10px]"
                onClick={() => setIsLive(!isLive)}
              >
                <Wifi className={`h-3 w-3 ${isLive ? 'animate-pulse' : ''}`} />
                {isLive ? 'LIVE' : 'PAUSED'}
              </Badge>
              {lastUpdate && (
                <span className="text-[10px] text-muted-foreground hidden sm:inline">{timeAgo}</span>
              )}
              <Button variant="ghost" size="icon" onClick={() => fetchAnalytics(false)} title="Atualizar agora">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <LanguageSelector />
              <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {t('header.back')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : analytics ? (
            <>
              {/* Top Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="card-elevated p-5 text-center">
                  <Users className="h-5 w-5 text-primary mx-auto mb-1" />
                  <span className="text-2xl font-bold text-foreground">{analytics.totalUsers}</span>
                  <p className="text-[11px] text-muted-foreground mt-1">{t('admin.totalUsers')}</p>
                </div>
                <div className="card-elevated p-5 text-center">
                  <Crown className="h-5 w-5 text-accent mx-auto mb-1" />
                  <span className="text-2xl font-bold text-accent">{analytics.premiumUsers}</span>
                  <p className="text-[11px] text-muted-foreground mt-1">{t('admin.premiumUsers')}</p>
                </div>
                <div className="card-elevated p-5 text-center">
                  <Wifi className="h-5 w-5 text-primary mx-auto mb-1" />
                  <span className="text-2xl font-bold text-foreground">{analytics.activeToday}</span>
                  <p className="text-[11px] text-muted-foreground mt-1">Ativos hoje</p>
                </div>
                <div className="card-elevated p-5 text-center">
                  <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
                  <span className="text-2xl font-bold text-foreground">{analytics.totalAchievements}</span>
                  <p className="text-[11px] text-muted-foreground mt-1">Conquistas desbloq.</p>
                </div>
              </div>

              {/* Last 7 days */}
              <div className="card-elevated overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    {t('admin.last7Days', 'Últimos 7 dias')}
                  </h2>
                </div>
                <div className="grid grid-cols-2 divide-x divide-border">
                  <div className="p-6 text-center">
                    <BookOpen className="h-5 w-5 text-primary mx-auto mb-1" />
                    <span className="text-2xl font-bold text-foreground">{analytics.studiesLast7Days}</span>
                    <p className="text-sm text-muted-foreground">{t('admin.studiesGenerated', 'Estudos gerados')}</p>
                  </div>
                  <div className="p-6 text-center">
                    <PenTool className="h-5 w-5 text-accent mx-auto mb-1" />
                    <span className="text-2xl font-bold text-foreground">{analytics.exercisesLast7Days}</span>
                    <p className="text-sm text-muted-foreground">{t('admin.exercisesGenerated', 'Exercícios gerados')}</p>
                  </div>
                </div>
              </div>

              {/* Last 30 days */}
              <div className="card-elevated overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    {t('admin.last30Days', 'Últimos 30 dias')}
                  </h2>
                </div>
                <div className="grid grid-cols-2 divide-x divide-border">
                  <div className="p-6 text-center">
                    <BookOpen className="h-5 w-5 text-primary mx-auto mb-1" />
                    <span className="text-2xl font-bold text-foreground">{analytics.studiesLast30Days}</span>
                    <p className="text-sm text-muted-foreground">{t('admin.studiesGenerated', 'Estudos gerados')}</p>
                  </div>
                  <div className="p-6 text-center">
                    <PenTool className="h-5 w-5 text-accent mx-auto mb-1" />
                    <span className="text-2xl font-bold text-foreground">{analytics.exercisesLast30Days}</span>
                    <p className="text-sm text-muted-foreground">{t('admin.exercisesGenerated', 'Exercícios gerados')}</p>
                  </div>
                </div>
              </div>

              {/* All-time */}
              <div className="card-elevated overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    {t('admin.allTime', 'Total geral')}
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
                  <div className="p-6 text-center">
                    <BookOpen className="h-5 w-5 text-primary mx-auto mb-1" />
                    <span className="text-2xl font-bold text-foreground">{analytics.totalStudies}</span>
                    <p className="text-[11px] text-muted-foreground">{t('admin.studiesGenerated', 'Estudos')}</p>
                  </div>
                  <div className="p-6 text-center">
                    <PenTool className="h-5 w-5 text-accent mx-auto mb-1" />
                    <span className="text-2xl font-bold text-foreground">{analytics.totalExercises}</span>
                    <p className="text-[11px] text-muted-foreground">{t('admin.exercisesGenerated', 'Exercícios')}</p>
                  </div>
                  <div className="p-6 text-center col-span-2 sm:col-span-1">
                    <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
                    <span className="text-2xl font-bold text-foreground">{analytics.totalCreditsUsed}</span>
                    <p className="text-[11px] text-muted-foreground">Créditos ganhos</p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default ManageUsers;
