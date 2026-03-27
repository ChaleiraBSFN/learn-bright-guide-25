import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface UpdateNotice {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

const typeIcons: Record<string, string> = {
  feature: '🚀',
  improvement: '⚡',
  bugfix: '🐛',
  announcement: '📢',
};

export const UpdateNoticeBanner = () => {
  const [notices, setNotices] = useState<UpdateNotice[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const loadNotices = useCallback(async () => {
    const { data, error } = await supabase
      .from('update_notices')
      .select('id, title, message, type, created_at')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error loading update notices:', error);
      return;
    }

    setNotices(data ?? []);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('lb_dismissed_notices');
    if (stored) {
      try { setDismissed(JSON.parse(stored)); } catch {}
    }

    loadNotices();

    const handleRefresh = () => {
      loadNotices();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'lb_update_notices_refresh' || event.key === 'lb_dismissed_notices') {
        loadNotices();
        if (event.key === 'lb_dismissed_notices' && event.newValue) {
          try {
            setDismissed(JSON.parse(event.newValue));
          } catch {}
        }
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadNotices();
      }
    };

    const intervalId = window.setInterval(loadNotices, 15000);

    window.addEventListener('focus', handleRefresh);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('lb_update_notices_changed', handleRefresh);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('lb_update_notices_changed', handleRefresh);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadNotices]);

  const dismiss = (id: string) => {
    const updated = [...dismissed, id];
    setDismissed(updated);
    localStorage.setItem('lb_dismissed_notices', JSON.stringify(updated));
  };

  const visible = useMemo(() => notices.filter((n) => !dismissed.includes(n.id)), [notices, dismissed]);
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {visible.map(notice => (
          <motion.div
            key={notice.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="relative rounded-xl border border-primary/20 bg-primary/5 p-3 pr-8"
          >
            <button
              onClick={() => dismiss(notice.id)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-start gap-2">
              <span className="text-base shrink-0">{typeIcons[notice.type] || '📢'}</span>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground">{notice.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{notice.message}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
