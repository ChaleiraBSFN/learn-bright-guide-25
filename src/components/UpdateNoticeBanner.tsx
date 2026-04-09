import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Sparkles, Wrench, Bug } from 'lucide-react';

const typeIcons: Record<string, any> = {
  feature: Sparkles,
  improvement: Wrench,
  bugfix: Bug,
  announcement: Megaphone,
};

const typeStyles: Record<string, string> = {
  feature: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700',
  improvement: 'bg-blue-500/10 border-blue-500/30 text-blue-700',
  bugfix: 'bg-orange-500/10 border-orange-500/30 text-orange-700',
  announcement: 'bg-purple-500/10 border-purple-500/30 text-purple-700',
};

export const UpdateNoticeBanner = () => {
  const { data: notices } = useQuery({
    queryKey: ['update-notices-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('update_notices')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30_000,
  });

  if (!notices || notices.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="space-y-2 mb-4">
        {notices.map((notice) => {
          const Icon = typeIcons[notice.type] || Megaphone;
          const style = typeStyles[notice.type] || typeStyles.announcement;

          return (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`rounded-xl border p-3 flex items-start gap-3 ${style}`}
            >
              <Icon className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">{notice.title}</p>
                <p className="text-xs opacity-80 mt-0.5">{notice.message}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </AnimatePresence>
  );
};
