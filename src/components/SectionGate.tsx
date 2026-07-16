import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSectionFlag } from '@/hooks/useSectionFlag';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wrench, ArrowRight } from 'lucide-react';

interface Props {
  sectionKey: string;
  children: ReactNode;
  /** If true, render nothing when disabled (useful for FABs/banners). */
  hideWhenDisabled?: boolean;
  /** Compact variant for embedded sections. */
  variant?: 'card' | 'compact';
}

export const SectionGate = ({
  sectionKey,
  children,
  hideWhenDisabled = false,
  variant = 'card',
}: Props) => {
  const { flag, loading } = useSectionFlag(sectionKey);
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (loading) return null;
  if (!flag || flag.enabled) return <>{children}</>;
  if (hideWhenDisabled) return null;

  const title =
    flag.title || t('sectionGate.title', 'Em desenvolvimento');
  const message =
    flag.message ||
    t(
      'sectionGate.message',
      'Estamos trabalhando nesta funcionalidade. Volte em breve!',
    );

  const handleCta = () => {
    if (!flag.cta_url) return;
    if (flag.cta_url.startsWith('http')) {
      window.open(flag.cta_url, '_blank', 'noopener,noreferrer');
    } else {
      navigate(flag.cta_url);
    }
  };

  const content = (
    <div className="flex flex-col items-center text-center gap-3 py-8 px-6">
      <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-3">
        <Wrench className="h-6 w-6 text-amber-600 dark:text-amber-400" />
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">{message}</p>
      {flag.cta_url && (
        <Button onClick={handleCta} className="mt-2 gap-2">
          {flag.cta_label || t('sectionGate.learnMore', 'Saiba mais')}
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  if (variant === 'compact') return content;
  return <Card className="border-2 border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20">{content}</Card>;
};
