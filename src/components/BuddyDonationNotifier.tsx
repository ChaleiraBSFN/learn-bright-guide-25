import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Shows a toast to the post author whenever someone donates buddies to their post.
 */
export function BuddyDonationNotifier() {
  const { user } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`buddy-donations-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_buddies', filter: `author_id=eq.${user.id}` },
        async (payload) => {
          const row: any = payload.new;
          const amount = row?.amount ?? 1;
          let name = t('community.donorAnonymous');
          if (row?.donor_id) {
            const { data } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('user_id', row.donor_id)
              .maybeSingle();
            if (data?.display_name) name = data.display_name;
          }
          toast.success(t('community.donateReceived', { name, count: amount }));
          window.dispatchEvent(new CustomEvent('credits_changed'));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, t]);

  return null;
}
