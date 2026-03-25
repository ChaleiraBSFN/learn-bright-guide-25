import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download, Smartphone, CheckCircle, Monitor, Apple, Chrome } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) setPlatform('ios');
    else if (/Android/i.test(ua)) setPlatform('android');
    else setPlatform('desktop');

    if (window.matchMedia('(display-mode: standalone)').matches) setIsInstalled(true);

    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e as BeforeInstallPromptEvent); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    const confirmed = window.confirm(t('install.confirmInstall'));
    if (!confirmed) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CheckCircle className="h-16 w-16 text-secondary mx-auto mb-4" />
            <CardTitle className="text-2xl">{t('install.appInstalled')}</CardTitle>
            <CardDescription>{t('install.appInstalledDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">{t('install.goToApp')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <Smartphone className="h-16 w-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl">{t('install.installTitle')}</CardTitle>
          <CardDescription>{t('install.installDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {deferredPrompt && (
            <div className="space-y-2">
              <Button onClick={handleInstall} className="w-full gap-2" size="lg">
                <Download className="h-5 w-5" />
                {t('install.installNow')}
              </Button>
              <p className="text-xs text-muted-foreground text-center">{t('install.installNowHint')}</p>
            </div>
          )}

          <div className="flex gap-2 justify-center">
            {(['desktop', 'android', 'ios'] as const).map((p) => (
              <Button key={p} variant={platform === p ? 'default' : 'outline'} size="sm" onClick={() => setPlatform(p)} className="gap-1.5">
                {p === 'desktop' ? <Monitor className="h-4 w-4" /> : p === 'android' ? <Chrome className="h-4 w-4" /> : <Apple className="h-4 w-4" />}
                {t(`install.${p}`)}
              </Button>
            ))}
          </div>

          {platform === 'desktop' && (
            <div className="space-y-4 rounded-lg border border-border p-4 bg-muted/30">
              <p className="font-semibold text-foreground text-base" dangerouslySetInnerHTML={{ __html: t('install.desktopTitle') }} />
              <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
                <li dangerouslySetInnerHTML={{ __html: t('install.desktopStep1') }} />
                <li>{t('install.desktopStep2')} <span className="font-mono text-primary font-semibold">studdybuddy.com</span></li>
                <li dangerouslySetInnerHTML={{ __html: t('install.desktopStep3') }} />
                <li dangerouslySetInnerHTML={{ __html: t('install.desktopStep4') }} />
                <li dangerouslySetInnerHTML={{ __html: t('install.desktopStep5') }} />
              </ol>
              <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('install.desktopNote') }} />
            </div>
          )}

          {platform === 'android' && (
            <div className="space-y-4 rounded-lg border border-border p-4 bg-muted/30">
              <p className="font-semibold text-foreground text-base" dangerouslySetInnerHTML={{ __html: t('install.androidTitle') }} />
              <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
                <li dangerouslySetInnerHTML={{ __html: t('install.androidStep1') }} />
                <li>{t('install.androidStep2')} <span className="font-mono text-primary font-semibold">studdybuddy.com</span></li>
                <li dangerouslySetInnerHTML={{ __html: t('install.androidStep3') }} />
                <li dangerouslySetInnerHTML={{ __html: t('install.androidStep4') }} />
                <li dangerouslySetInnerHTML={{ __html: t('install.androidStep5') }} />
              </ol>
              <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('install.androidNote') }} />
            </div>
          )}

          {platform === 'ios' && (
            <div className="space-y-4 rounded-lg border border-border p-4 bg-muted/30">
              <p className="font-semibold text-foreground text-base" dangerouslySetInnerHTML={{ __html: t('install.iosTitle') }} />
              <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
                <li>
                  <span dangerouslySetInnerHTML={{ __html: t('install.iosStep1') }} />
                  <br />
                  <span className="text-xs" dangerouslySetInnerHTML={{ __html: t('install.iosStep1Note') }} />
                </li>
                <li>{t('install.iosStep2')} <span className="font-mono text-primary font-semibold">studdybuddy.com</span></li>
                <li dangerouslySetInnerHTML={{ __html: t('install.iosStep3') }} />
                <li dangerouslySetInnerHTML={{ __html: t('install.iosStep4') }} />
                <li dangerouslySetInnerHTML={{ __html: t('install.iosStep5') }} />
              </ol>
              <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('install.iosNote') }} />
            </div>
          )}

          <Button variant="outline" onClick={() => navigate('/')} className="w-full">{t('install.backToSite')}</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
