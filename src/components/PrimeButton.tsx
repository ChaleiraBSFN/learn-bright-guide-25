import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePrime, formatDuration } from '@/hooks/usePrime';
import { toast } from 'sonner';

export const PrimeButton = () => {
  const { isActive, canActivate, cooldownRemainingMs, activeRemainingMs, activate } = usePrime();

  const handleClick = () => {
    if (isActive) {
      toast.info('Prime já está ativo!', {
        description: `Tempo restante: ${formatDuration(activeRemainingMs)}`,
      });
      return;
    }
    if (!canActivate) {
      toast.error('Prime em recarga', {
        description: `Disponível em ${formatDuration(cooldownRemainingMs)}`,
      });
      return;
    }
    if (activate()) {
      toast.success('👑 Prime ATIVADO!', {
        description: 'Desafios 60% mais fáceis por 10 minutos. Aproveite!',
      });
    }
  };

  const cooldownLabel = cooldownRemainingMs > 0 ? formatDuration(cooldownRemainingMs) : null;

  return (
    <div className="flex flex-col items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={handleClick}
            aria-label="Ativar Prime"
            className={`h-10 w-10 !min-w-10 !min-h-10 shrink-0 p-0 flex items-center justify-center rounded-full backdrop-blur-sm border-2 transition-all
              ${isActive
                ? 'bg-gradient-to-br from-yellow-400 to-pink-500 border-yellow-300 text-white shadow-[0_0_30px_-2px_hsl(45_100%_50%/0.9),0_0_50px_-4px_hsl(320_100%_60%/0.6)] animate-pulse'
                : canActivate
                  ? 'bg-background/95 border-yellow-400/60 hover:bg-gradient-to-br hover:from-yellow-400 hover:to-pink-500 hover:text-white hover:border-yellow-300 shadow-[0_0_24px_-2px_hsl(45_100%_50%/0.7),0_4px_14px_-3px_hsl(320_100%_60%/0.5),inset_0_1px_0_hsl(0_0%_100%/0.2)] hover:shadow-[0_0_40px_-2px_hsl(45_100%_50%/0.95),0_0_60px_-4px_hsl(320_100%_60%/0.7)]'
                  : 'bg-background/95 border-muted-foreground/30 opacity-70 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.15),0_2px_8px_-2px_hsl(var(--foreground)/0.3)]'
              }`}
          >
            <Crown className={`h-4 w-4 ${isActive ? 'text-white' : canActivate ? 'text-yellow-500' : 'text-muted-foreground'}`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          {isActive
            ? `Prime ativo • ${formatDuration(activeRemainingMs)}`
            : canActivate
              ? 'Ativar Prime (10 min, desafios 60% mais fáceis)'
              : `Prime em recarga: ${formatDuration(cooldownRemainingMs)}`}
        </TooltipContent>
      </Tooltip>
      {cooldownLabel && !isActive && (
        <span className="text-[9px] font-mono font-bold tabular-nums text-muted-foreground/80 leading-none">
          {cooldownLabel}
        </span>
      )}
    </div>
  );
};
