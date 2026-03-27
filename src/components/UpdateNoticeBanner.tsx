import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Megaphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

  useEffect(() => {
    const stored = localStorage.getItem('lb_dismissed_notices');
    if (stored) {
      try { setDismissed(JSON.parse(stored)); } catch {}
    }

    const load = async () => {
      const { data, error } = await (supabase.from as any)('update_notices')
        .select('id, title, message, type, created_at')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(5);
      if (!error && data) setNotices(data);
    };
    load();
  }, []);

  const dismiss = (id: string) => {
    const updated = [...dismissed, id];
    setDismissed(updated);
    localStorage.setItem('lb_dismissed_notices', JSON.stringify(updated));
  };

  const visible = notices.filter(n => !dismissed.includes(n.id));
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
