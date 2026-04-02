import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';
import learnBuddyLogo from '@/assets/learn-buddy-logo.jpeg';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: t('settings.error'), description: t('auth.invalidEmail'), variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch {
      toast({ title: t('settings.error'), description: t('settings.resetError'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => navigate('/auth')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="absolute top-4 right-4"><LanguageSelector /></div>
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <CheckCircle className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-xl font-bold text-foreground">{t('auth.resetEmailSentTitle')}</h2>
            <p className="text-muted-foreground">{t('auth.resetEmailSentDesc')}</p>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{t('auth.checkSpamTitle')}</span>
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-500">{t('auth.checkSpamDesc')}</p>
            </div>
            <p className="text-sm text-muted-foreground">{t('auth.resetLinkInfo')}</p>
            <Button onClick={() => navigate('/auth')} variant="outline" className="mt-4">
              {t('auth.backToLogin')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => navigate('/auth')}>
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="absolute top-4 right-4"><LanguageSelector /></div>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src={learnBuddyLogo} alt="Learn Buddy" className="h-14 w-14 rounded-xl object-cover" loading="eager" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">{t('auth.forgotPassword')}</h1>
          <p className="text-muted-foreground mt-2">{t('auth.forgotPasswordDesc')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-primary" />
              {t('auth.recoverAccount')}
            </CardTitle>
            <CardDescription>{t('auth.recoverAccountDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recovery-email">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="recovery-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {t('auth.sendRecoveryEmail')}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button type="button" onClick={() => navigate('/auth')} className="text-sm text-primary hover:underline">
                {t('auth.backToLogin')}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
