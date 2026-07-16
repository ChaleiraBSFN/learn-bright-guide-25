import { useState, ReactNode } from 'react';
import { useSectionFlag } from '@/hooks/useSectionFlag';
import { UnderDevelopmentDialog } from '@/components/UnderDevelopmentDialog';

/**
 * Intercepts an action when a section is disabled by admin.
 * - If enabled: calls the original handler.
 * - If disabled: opens the "em desenvolvimento" dialog with the admin's message + CTA.
 */
export function useUnderDevGate(sectionKey: string) {
  const { flag, loading } = useSectionFlag(sectionKey);
  const [open, setOpen] = useState(false);

  const enabled = loading || !flag || flag.enabled;

  const guard = (fn: () => void) => () => {
    if (enabled) fn();
    else setOpen(true);
  };

  const dialog: ReactNode = (
    <UnderDevelopmentDialog open={open} onOpenChange={setOpen} flag={flag} />
  );

  return { enabled, guard, dialog };
}
