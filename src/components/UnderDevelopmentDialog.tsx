import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wrench, ArrowRight } from 'lucide-react';

type Flag = {
  title?: string | null;
  message?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
} | null | undefined;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flag: Flag;
}

export const UnderDevelopmentDialog = ({ open, onOpenChange, flag }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const title = flag?.title || t('sectionGate.title', 'Em desenvolvimento');
  const message =
    flag?.message ||
    t('sectionGate.message', 'Estamos trabalhando nesta funcionalidade. Volte em breve!');

  const handleCta = () => {
    if (!flag?.cta_url) return;
    onOpenChange(false);
    if (flag.cta_url.startsWith('http')) {
      window.open(flag.cta_url, '_blank', 'noopener,noreferrer');
    } else {
      navigate(flag.cta_url);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center text-center gap-3 py-2">
            <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-4">
              <Wrench className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-xl">{title}</DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              {message}
            </DialogDescription>
          </div>
        </DialogHeader>
        {flag?.cta_url && (
          <div className="flex justify-center pt-2">
            <Button onClick={handleCta} className="gap-2" size="lg">
              {flag.cta_label || t('sectionGate.learnMore', 'Saiba mais')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
