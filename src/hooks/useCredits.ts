import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const ANON_CREDITS_KEY = 'learn_buddy_anon_credits';
const ANON_MAX_CREDITS = 10;
const AUTH_MAX_CREDITS = 15;

export const useCredits = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const maxCredits = user ? AUTH_MAX_CREDITS : ANON_MAX_CREDITS;

  // Load credits
  const loadCredits = useCallback(async () => {
    setLoading(true);
    if (user) {
      const { data, error } = await supabase.rpc('get_credits', { _user_id: user.id });
      if (!error && data !== null) {
        setCredits(data as number);
      } else {
        setCredits(AUTH_MAX_CREDITS);
      }
    } else {
      const stored = localStorage.getItem(ANON_CREDITS_KEY);
      if (stored !== null) {
        setCredits(parseInt(stored, 10));
      } else {
        localStorage.setItem(ANON_CREDITS_KEY, String(ANON_MAX_CREDITS));
        setCredits(ANON_MAX_CREDITS);
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadCredits();
    
    // Listen for cross-component triggers
    const handleCreditsChanged = (e: any) => {
      if (e.detail && typeof e.detail.newTotal === 'number') {
        setCredits(e.detail.newTotal);
      } else {
        loadCredits();
      }
    };
    window.addEventListener('credits_changed', handleCreditsChanged);
    return () => window.removeEventListener('credits_changed', handleCreditsChanged);
  }, [loadCredits]);

  const useCredit = useCallback(async (): Promise<boolean> => {
    if (credits === null || credits <= 0) return false;

    if (user) {
      const { data, error } = await supabase.rpc('use_credit', { _user_id: user.id });
      if (error || (data as number) === -1) return false;
      setCredits(data as number);
      window.dispatchEvent(new CustomEvent('credits_changed', { detail: { newTotal: data as number } }));
      return true;
    } else {
      const current = parseInt(localStorage.getItem(ANON_CREDITS_KEY) || '0', 10);
      if (current <= 0) return false;
      const newVal = current - 1;
      localStorage.setItem(ANON_CREDITS_KEY, String(newVal));
      setCredits(newVal);
      window.dispatchEvent(new CustomEvent('credits_changed', { detail: { newTotal: newVal } }));
      return true;
    }
  }, [user, credits]);

  const addCredits = useCallback(async (amount: number) => {
    // Optimistic Update: Force UI update instantly regardless of DB
    setCredits(prev => {
      const current = prev !== null ? prev : (user ? AUTH_MAX_CREDITS : ANON_MAX_CREDITS);
      const newVal = current + amount;
      
      // Broadcast instantly
      window.dispatchEvent(new CustomEvent('credits_changed', { detail: { newTotal: newVal } }));
      
      // Update local storage for anon
      if (!user) {
        localStorage.setItem(ANON_CREDITS_KEY, String(newVal));
      }
      return newVal;
    });

    if (!user) return;

    // Background push to DB
    try {
      await supabase.rpc('add_credits', { _user_id: user.id, _amount: amount });
    } catch (e) {
      console.warn("Could not save to DB, keeping optimistic value", e);
    }
  }, [user]);

  const hasCredits = credits !== null && credits > 0;

  return { credits, maxCredits, loading, hasCredits, useCredit, addCredits };
};
