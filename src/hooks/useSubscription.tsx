import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getPlanPrice } from '@/lib/currency';

export const BUDDY_PRICE_BRL = 5.9;

interface SubscriptionState {
  isBuddy: boolean;
  loading: boolean;
  subscriptionEnd: string | null;
  cancelAtPeriodEnd: boolean;
  refresh: () => Promise<void>;
  startCheckout: () => Promise<string | null>;
  prefetchCheckout: () => void;
  getCheckoutUrlSync: () => string | null;
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

  // Pré-carrega a sessão de checkout para o clique abrir instantaneamente.
  const checkoutCache = useRef<Record<string, { url: string | null; promise: Promise<string | null> | null }>>({});
  const { i18n } = useTranslation();
  const currency = getPlanPrice(i18n.language).currency;

  const requestCheckout = useCallback(
    (cur: string) => {
      const entry = checkoutCache.current[cur];
      if (entry?.url) return Promise.resolve(entry.url);
      if (entry?.promise) return entry.promise;
      const promise = supabase.functions
        .invoke('create-checkout', { body: { currency: cur } })
        .then(({ data, error }) => {
          const url = !error && data?.url ? (data.url as string) : null;
          checkoutCache.current[cur] = { url, promise: null };
          return url;
        })
        .catch(() => {
          checkoutCache.current[cur] = { url: null, promise: null };
          return null;
        });
      checkoutCache.current[cur] = { url: null, promise };
      return promise;
    },
    [],
  );

  const startCheckout = useCallback(() => requestCheckout(currency), [requestCheckout, currency]);

  const prefetchCheckout = useCallback(() => {
    if (!user) return;
    void requestCheckout(currency);
  }, [user, requestCheckout, currency]);

  const getCheckoutUrlSync = useCallback(
    () => checkoutCache.current[currency]?.url ?? null,
    [currency],
  );

  useEffect(() => {
    if (user && !isBuddy && !loading) void requestCheckout(currency);
  }, [currency, user, isBuddy, loading, requestCheckout]);


  const openPortal = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('customer-portal');
    if (error || !data?.url) return null;
    return data.url as string;
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        isBuddy,
        loading,
        subscriptionEnd,
        cancelAtPeriodEnd,
        refresh,
        startCheckout,
        prefetchCheckout,
        getCheckoutUrlSync,
        openPortal,
      }}
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
    prefetchCheckout: () => {},
    getCheckoutUrlSync: () => null,
    openPortal: async () => null,
  };
};

