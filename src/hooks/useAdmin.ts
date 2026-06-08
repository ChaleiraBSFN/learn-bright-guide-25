import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const adminRoleCache = new Map<string, { value: boolean; expiresAt: number }>();
const adminRoleRequests = new Map<string, Promise<boolean>>();
const ADMIN_ROLE_CACHE_MS = 60_000;

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkAdminRole();
    } else {
      setIsAdmin(false);
      setLoading(false);
    }
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) return;

    try {
      const cached = adminRoleCache.get(user.id);
      if (cached && cached.expiresAt > Date.now()) {
        setIsAdmin(cached.value);
        setLoading(false);
        return;
      }

      let request = adminRoleRequests.get(user.id);
      if (!request) {
        request = (async () => {
          try {
            const { data, error } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id)
              .eq('role', 'admin')
              .maybeSingle();
            if (error) throw error;
            const value = !!data;
            adminRoleCache.set(user.id, { value, expiresAt: Date.now() + ADMIN_ROLE_CACHE_MS });
            return value;
          } finally {
            adminRoleRequests.delete(user.id);
          }
        })();
        adminRoleRequests.set(user.id, request);
      }

      setIsAdmin(await request);
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  return { isAdmin, loading };
};
