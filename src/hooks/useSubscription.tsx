import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const BUDDY_PRICE_BRL = 5.9;

interface SubscriptionState {
  isBuddy: boolean;
  loading: boolean;
  subscriptionEnd: string | null;
  cancelAtPeriodEnd: boolean;
  refresh: () => Promise<void>;
  startCheckout: () => Promise<string | null>;
  openPortal: () => Promise<string | null>;
}

const SubscriptionContext = createContext<SubscriptionState | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isBuddy, setIsBuddy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setIsBuddy(false);
      setSubscriptionEnd(null);
      setCancelAtPeriodEnd(false);
      setLoading(false);
      return;
    }
    setLoading(true);

    // Fast local read first so the UI unlocks instantly.
    const { data: dbBuddy } = await supabase.rpc('is_buddy', { _user_id: user.id });
    if (typeof dbBuddy === 'boolean') setIsBuddy(dbBuddy);

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (!error && data) {
        setIsBuddy(Boolean(data.subscribed));
        setSubscriptionEnd(data.subscription_end ?? null);
        setCancelAtPeriodEnd(Boolean(data.cancel_at_period_end));
        if (data.credits_granted) {
          window.dispatchEvent(new CustomEvent('credits_changed'));
        }
      }
    } catch {
      // keep the value read from the database
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    const id = window.setInterval(() => void refresh(), 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [user, refresh]);

  const startCheckout = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('create-checkout');
    if (error || !data?.url) return null;
    return data.url as string;
  }, []);

  const openPortal = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('customer-portal');
    if (error || !data?.url) return null;
    return data.url as string;
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{ isBuddy, loading, subscriptionEnd, cancelAtPeriodEnd, refresh, startCheckout, openPortal }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionState => {
  const ctx = useContext(SubscriptionContext);
  if (ctx) return ctx;
  // Safe fallback so components work outside the provider (e.g. isolated tests).
  return {
    isBuddy: false,
    loading: false,
    subscriptionEnd: null,
    cancelAtPeriodEnd: false,
    refresh: async () => {},
    startCheckout: async () => null,
    openPortal: async () => null,
  };
};
