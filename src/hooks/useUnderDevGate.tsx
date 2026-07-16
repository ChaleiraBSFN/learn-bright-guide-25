import { useState, ReactNode } from 'react';
import { useSectionFlag } from '@/hooks/useSectionFlag';
import { UnderDevelopmentDialog } from '@/components/UnderDevelopmentDialog';

/**
 * Intercepts an action when a section is disabled by admin.
 * The dialog is only mounted while open (avoids many idle Radix portals).
 */
export function useUnderDevGate(sectionKey: string) {
  const { flag, loading } = useSectionFlag(sectionKey);
  const [open, setOpen] = useState(false);

  const enabled = loading || !flag || flag.enabled;

  const guard = (fn: () => void) => () => {
    if (enabled) fn();
    else setOpen(true);
  };

  const dialog: ReactNode = open ? (
    <UnderDevelopmentDialog open={open} onOpenChange={setOpen} flag={flag} />
  ) : null;

  return { enabled, guard, dialog };
}
