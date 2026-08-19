import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getAdConsent, setAdConsent } from '@/lib/adConsent';

export const CookieConsent = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getAdConsent() === null) setVisible(true);
  }, []);

  if (!visible) return null;

  const choose = (consent: 'personalized' | 'basic') => {
    setAdConsent(consent);
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4">
      <div className="mx-auto max-w-3xl rounded-xl border-2 border-foreground bg-card p-4 shadow-lg">
        <h2 className="mb-1 text-base font-bold text-foreground">
          {t('cookies.title', 'Cookies e anúncios')}
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {t(
            'cookies.body',
            'Usamos cookies essenciais e, com sua permissão, cookies do Google AdSense para exibir anúncios que mantêm a plataforma gratuita.',
          )}{' '}
          <Link to="/privacy" className="font-semibold text-primary hover:underline">
            {t('cookies.privacyLink', 'Política de Privacidade')}
          </Link>
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={() => choose('personalized')}>
            {t('cookies.accept', 'Aceitar anúncios personalizados')}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => choose('basic')}>
            {t('cookies.reject', 'Usar apenas anúncios não personalizados')}
          </Button>
        </div>
      </div>
    </div>
  );
};
