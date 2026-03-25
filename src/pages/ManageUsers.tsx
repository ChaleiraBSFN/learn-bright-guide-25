import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Users, Crown, BarChart3, Clock, BookOpen, PenTool, TrendingUp } from 'lucide-react';
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
}

const ManageUsers = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) navigate('/');
  }, [isAdmin, adminLoading, user, navigate]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!isAdmin) return;
      setLoading(true);
      try {
        // Fetch counts without personal data
        const [profilesRes, subsRes, historyRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('subscriptions').select('id, status, expires_at'),
          supabase.from('user_history').select('type, created_at'),
        ]);

        const totalUsers = profilesRes.count || 0;
        const premiumUsers = (subsRes.data || []).filter(
          s => s.status === 'active' && s.expires_at && new Date(s.expires_at) > new Date()
        ).length;

        const history = historyRes.data || [];
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const totalStudies = history.filter(h => h.type === 'study').length;
        const totalExercises = history.filter(h => h.type === 'exercise').length;
        const studiesLast7Days = history.filter(h => h.type === 'study' && new Date(h.created_at) >= sevenDaysAgo).length;
        const exercisesLast7Days = history.filter(h => h.type === 'exercise' && new Date(h.created_at) >= sevenDaysAgo).length;
        const studiesLast30Days = history.filter(h => h.type === 'study' && new Date(h.created_at) >= thirtyDaysAgo).length;
        const exercisesLast30Days = history.filter(h => h.type === 'exercise' && new Date(h.created_at) >= thirtyDaysAgo).length;

        setAnalytics({
          totalUsers, premiumUsers, totalStudies, totalExercises,
          studiesLast7Days, exercisesLast7Days, studiesLast30Days, exercisesLast30Days,
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [isAdmin]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
              {/* User Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card-elevated p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-3xl font-bold text-foreground">{analytics.totalUsers}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('admin.totalUsers')}</p>
                </div>
                <div className="card-elevated p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Crown className="h-5 w-5 text-accent" />
                    <span className="text-3xl font-bold text-accent">{analytics.premiumUsers}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('admin.premiumUsers')}</p>
                </div>
              </div>

              {/* Usage Stats - Last 7 days */}
              <div className="card-elevated overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    {t('admin.last7Days', 'Últimos 7 dias')}
                  </h2>
                </div>
                <div className="grid grid-cols-2 divide-x divide-border">
                  <div className="p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <span className="text-2xl font-bold text-foreground">{analytics.studiesLast7Days}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{t('admin.studiesGenerated', 'Estudos gerados')}</p>
                  </div>
                  <div className="p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <PenTool className="h-5 w-5 text-accent" />
                      <span className="text-2xl font-bold text-foreground">{analytics.exercisesLast7Days}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{t('admin.exercisesGenerated', 'Exercícios gerados')}</p>
                  </div>
                </div>
              </div>

              {/* Usage Stats - Last 30 days */}
              <div className="card-elevated overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    {t('admin.last30Days', 'Últimos 30 dias')}
                  </h2>
                </div>
                <div className="grid grid-cols-2 divide-x divide-border">
                  <div className="p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <span className="text-2xl font-bold text-foreground">{analytics.studiesLast30Days}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{t('admin.studiesGenerated', 'Estudos gerados')}</p>
                  </div>
                  <div className="p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <PenTool className="h-5 w-5 text-accent" />
                      <span className="text-2xl font-bold text-foreground">{analytics.exercisesLast30Days}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{t('admin.exercisesGenerated', 'Exercícios gerados')}</p>
                  </div>
                </div>
              </div>

              {/* All-time Stats */}
              <div className="card-elevated overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    {t('admin.allTime', 'Total geral')}
                  </h2>
                </div>
                <div className="grid grid-cols-2 divide-x divide-border">
                  <div className="p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <span className="text-2xl font-bold text-foreground">{analytics.totalStudies}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{t('admin.studiesGenerated', 'Estudos gerados')}</p>
                  </div>
                  <div className="p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <PenTool className="h-5 w-5 text-accent" />
                      <span className="text-2xl font-bold text-foreground">{analytics.totalExercises}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{t('admin.exercisesGenerated', 'Exercícios gerados')}</p>
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