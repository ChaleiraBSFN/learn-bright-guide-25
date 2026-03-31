import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lock, Loader2, Eye, EyeOff, CheckCircle, Mail } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';
import learnBuddyLogo from '@/assets/learn-buddy-logo.jpeg';

const resetSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'password_mismatch',
  path: ['confirmPassword'],
});

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const verifyRecoverySession = async () => {
      try {
        setSessionReady(false);
        setIsRecovery(false);
        setRecoveryEmail('');

        await supabase.auth.signOut({ scope: 'local' });

        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
        const searchParams = new URLSearchParams(window.location.search);

        const hashType = hashParams.get('type');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const code = searchParams.get('code');
        const queryType = searchParams.get('type');
        const tokenHash = searchParams.get('token_hash');

        let verifiedEmail = '';

        if (hashType === 'recovery' && accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!error && data.session?.user?.email) {
            verifiedEmail = data.session.user.email;
          }
        } else if (queryType === 'recovery' && code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data.session?.user?.email) {
            verifiedEmail = data.session.user.email;
          }
        } else if (queryType === 'recovery' && tokenHash) {
          const { data, error } = await supabase.auth.verifyOtp({
            type: 'recovery',
            token_hash: tokenHash,
          });
          if (!error && data.session?.user?.email) {
            verifiedEmail = data.session.user.email;
          }
        }

        if (!cancelled && verifiedEmail) {
          setRecoveryEmail(verifiedEmail);
          setIsRecovery(true);
        } else if (!cancelled) {
          await supabase.auth.signOut({ scope: 'local' });
          setIsRecovery(false);
          setRecoveryEmail('');
        }
      } catch {
        if (!cancelled) {
          await supabase.auth.signOut({ scope: 'local' });
          setIsRecovery(false);
          setRecoveryEmail('');
        }
      } finally {
        if (!cancelled) {
          setSessionReady(true);
        }
      }
    };

    verifyRecoverySession();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isRecovery || !recoveryEmail) {
      toast({ title: t('settings.error'), description: t('settings.invalidResetLinkDesc'), variant: 'destructive' });
      return;
    }

    const parsed = resetSchema.safeParse({
      email,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message;
      if (firstIssue === 'password_mismatch') {
        toast({ title: t('settings.error'), description: t('auth.passwordsDoNotMatch'), variant: 'destructive' });
      } else if (!email.trim()) {
        toast({ title: t('settings.error'), description: t('auth.invalidEmail'), variant: 'destructive' });
      } else {
        toast({ title: t('settings.error'), description: t('auth.passwordMinLength'), variant: 'destructive' });
      }
      return;
    }

    if (parsed.data.email.trim().toLowerCase() !== recoveryEmail.toLowerCase()) {
      toast({ title: t('settings.error'), description: t('settings.emailMismatch'), variant: 'destructive' });
      return;
    }

    setSaving(true);

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user?.email || sessionData.session.user.email.toLowerCase() !== recoveryEmail.toLowerCase()) {
      setSaving(false);
      await supabase.auth.signOut({ scope: 'local' });
      setIsRecovery(false);
      toast({ title: t('settings.error'), description: t('settings.invalidResetLinkDesc'), variant: 'destructive' });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setSaving(false);

    if (error) {
      toast({ title: t('settings.error'), description: t('settings.passwordUpdateError'), variant: 'destructive' });
      return;
    }

    setSuccess(true);
    toast({ title: t('settings.success'), description: t('settings.passwordUpdated') });
    window.history.replaceState({}, document.title, '/reset-password');
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="absolute top-4 right-4"><LanguageSelector /></div>
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <CheckCircle className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-xl font-bold text-foreground">{t('settings.passwordUpdated')}</h2>
            <p className="text-muted-foreground">{t('settings.passwordUpdatedDesc')}</p>
            <Button onClick={() => navigate('/auth')} className="mt-4">
              {t('auth.backToLogin')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="absolute top-4 right-4"><LanguageSelector /></div>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">{t('settings.verifyingLink', 'Verificando link...')}</p>
        </div>
      </div>
    );
  }

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="absolute top-4 right-4"><LanguageSelector /></div>
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <Lock className="h-16 w-16 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-bold text-foreground">{t('settings.invalidResetLink')}</h2>
            <p className="text-muted-foreground">{t('settings.invalidResetLinkDesc')}</p>
            <Button onClick={() => navigate('/forgot-password')} variant="outline" className="mt-2">
              {t('auth.forgotPassword')}
            </Button>
            <Button onClick={() => navigate('/auth')} className="mt-2">
              {t('auth.backToLogin')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute top-4 right-4"><LanguageSelector /></div>
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src={learnBuddyLogo} alt="Learn Buddy" className="h-14 w-14 rounded-xl object-cover" loading="eager" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Learn Buddy</h1>
          <p className="text-muted-foreground mt-1">{t('settings.newPasswordDesc')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              {t('settings.newPassword')}
            </CardTitle>
            <CardDescription>{t('settings.confirmEmailToReset')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {t('auth.email')}
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('settings.confirmYourEmail')}
                  className="mt-1"
                  required
                  autoComplete="email"
                />
                <p className="text-xs text-muted-foreground mt-1">{t('settings.emailVerifyNote')}</p>
              </div>

              <div>
                <Label>{t('settings.newPassword')}</Label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label>{t('auth.confirmPassword')}</Label>
                <div className="relative mt-1">
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••"
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">{t('auth.passwordHint')}</p>

              <Button type="submit" className="w-full text-base font-bold py-5" disabled={saving || !email.trim()}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                🔐 {t('settings.updatePassword')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
