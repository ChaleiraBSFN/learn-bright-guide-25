import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { Gift } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RewardShopModal = ({ open, onOpenChange }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] overflow-y-auto overflow-x-hidden p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            {t('rewardShop.title', 'Mercadinho de créditos')}
          </DialogTitle>
          <DialogDescription>
            {t('credits.explanation')}
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="py-8 text-center text-muted-foreground">
            {t('rewardShop.needLogin', 'Faça login para ganhar créditos.')}
          </div>
        ) : (
          <div className="space-y-2 rounded-xl border border-border bg-card p-4">
            <p className="font-semibold">{t('sectionGate.title')}</p>
            <p className="text-sm text-muted-foreground">{t('sectionGate.message')}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
