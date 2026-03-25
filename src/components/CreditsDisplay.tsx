import { useTranslation } from 'react-i18next';
import { useCredits } from '@/hooks/useCredits';
import { useAuth } from '@/hooks/useAuth';
import { Coins, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';

export const CreditsDisplay = () => {
  const { credits, loading } = useCredits();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">
        <Loader2 className="h-3 w-3 animate-spin" />
      </div>
    );
  }

  const isLow = credits !== null && credits <= 2;
  const isEmpty = credits !== null && credits <= 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => !user && navigate('/auth')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
            isEmpty
              ? 'bg-destructive/10 text-destructive border border-destructive/30'
              : isLow
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
              : 'bg-primary/10 text-primary border border-primary/20'
          }`}
        >
          <Coins className="h-3 w-3" />
          <span>{credits}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{t('credits.remaining', { count: credits })}</p>
        {!user && <p className="text-xs opacity-70">{t('credits.signupForMore')}</p>}
      </TooltipContent>
    </Tooltip>
  );
};
