import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';

const Settings = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [newEmail, setNewEmail] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [showCurrentEmail, setShowCurrentEmail] = useState(false);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleUpdateName = async () => {
    if (!displayName.trim() || displayName.trim().length < 2) {
      toast({ title: t('settings.error'), description: t('settings.nameMinLength'), variant: 'destructive' });
      return;
    }
    setSavingName(true);
    const { error } = await updateProfile({ display_name: displayName.trim() });
    setSavingName(false);
    if (error) {
      toast({ title: t('settings.error'), description: t('settings.updateError'), variant: 'destructive' });
    } else {
      toast({ title: t('settings.success'), description: t('settings.nameUpdated') });
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast({ title: t('settings.error'), description: t('auth.invalidEmail'), variant: 'destructive' });
      return;
    }
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setSavingEmail(false);
    if (error) {
      toast({ title: t('settings.error'), description: t('settings.emailUpdateError'), variant: 'destructive' });
    } else {
      toast({ title: t('settings.success'), description: t('settings.emailConfirmationSent') });
      setNewEmail('');
    }
  };

  const handleResetPassword = async () => {
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email!, {
      redirectTo: 'https://studdybuddy.com.br/reset-password',
    });
    setSendingReset(false);
    if (error) {
      toast({ title: t('settings.error'), description: t('settings.resetError'), variant: 'destructive' });
    } else {
      toast({ title: t('settings.success'), description: t('settings.resetEmailSent') });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t('header.back')}
        </Button>

        <h1 className="text-2xl font-bold text-foreground mb-6">{t('settings.title')}</h1>

        {/* Display Name */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              {t('settings.displayName')}
            </CardTitle>
            <CardDescription>{t('settings.displayNameDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t('auth.displayNamePlaceholder')} maxLength={50} />
            <Button onClick={handleUpdateName} disabled={savingName} size="sm">
              {savingName && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('settings.save')}
            </Button>
          </CardContent>
        </Card>

        {/* Email */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-primary" />
              {t('settings.changeEmail')}
            </CardTitle>
            <CardDescription>{t('settings.changeEmailDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm text-muted-foreground">{t('settings.currentEmail')}</Label>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm font-medium text-foreground">
                  {showCurrentEmail ? user.email : '••••••••@••••••'}
                </p>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowCurrentEmail(!showCurrentEmail)}>
                  {showCurrentEmail ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            <div>
              <Label>{t('settings.newEmail')}</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder={t('settings.newEmailPlaceholder')} className="mt-1" />
            </div>
            <p className="text-xs text-muted-foreground">{t('settings.emailConfirmNote')}</p>
            <Button onClick={handleUpdateEmail} disabled={savingEmail || !newEmail.trim()} size="sm">
              {savingEmail && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('settings.updateEmail')}
            </Button>
          </CardContent>
        </Card>

        {/* Password */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5 text-primary" />
              {t('settings.changePassword')}
            </CardTitle>
            <CardDescription>{t('settings.changePasswordDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{t('settings.passwordResetInfo')}</p>
            <Button onClick={handleResetPassword} disabled={sendingReset} size="sm" variant="outline">
              {sendingReset && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('settings.sendResetEmail')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
