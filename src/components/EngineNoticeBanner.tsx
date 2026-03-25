import { useEffect, useMemo, useState } from 'react';
import { useActiveNotices } from '@/hooks/useEngineNotices';
import { AlertTriangle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

export const EngineNoticeBanner = () => {
  const { data: notices } = useActiveNotices();
  const { t, i18n } = useTranslation();
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});

  const engineNameMap = useMemo(
    () => ({
      content_engine: t('aiInfo.sysContentEngine'),
      exercise_engine: t('aiInfo.sysExerciseEngine'),
      correction_engine: t('aiInfo.sysCorrectionEngine'),
      image_engine: t('aiInfo.sysImageEngine'),
      translation_engine: t('aiInfo.sysTranslationEngine'),
      auth: t('aiInfo.sysAuth'),
      database: t('aiInfo.sysDatabase'),
      realtime: t('aiInfo.sysRealtime'),
      storage: t('aiInfo.sysStorage'),
      cdn: t('aiInfo.sysCDN'),
      rate_limit: t('aiInfo.sysRateLimit'),
    }),
    [t]
  );

  useEffect(() => {
    let isMounted = true;

    const translateNoticeMessages = async () => {
      if (!notices?.length) {
        if (isMounted) setTranslatedMessages({});
        return;
      }

      const noticesWithMessages = notices.filter((notice) => notice.notice_message?.trim());

      if (i18n.language === 'pt-BR' || noticesWithMessages.length === 0) {
        if (isMounted) {
          setTranslatedMessages(
            Object.fromEntries(
              noticesWithMessages.map((notice) => [notice.id, notice.notice_message ?? ''])
            )
          );
        }
        return;
      }

      try {
        const payload = noticesWithMessages.map((notice) => ({
          id: notice.id,
          notice_message: notice.notice_message,
        }));

        const { data, error } = await supabase.functions.invoke('translate-content', {
          body: {
            content: payload,
            targetLanguage: i18n.language,
          },
        });

        if (error) throw error;

        if (isMounted) {
          setTranslatedMessages(
            Object.fromEntries(
              (Array.isArray(data) ? data : payload).map((notice) => [notice.id, notice.notice_message ?? ''])
            )
          );
        }
      } catch (error) {
        console.error('Engine notice translation error:', error);
        if (isMounted) {
          setTranslatedMessages(
            Object.fromEntries(
              noticesWithMessages.map((notice) => [notice.id, notice.notice_message ?? ''])
            )
          );
        }
      }
    };

    translateNoticeMessages();

    return () => {
      isMounted = false;
    };
  }, [i18n.language, notices]);

  if (!notices || notices.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="space-y-2 mb-4">
        {notices.map((notice) => {
          const isInactive = notice.status === 'inactive';
          const localizedEngineName = engineNameMap[notice.engine_key as keyof typeof engineNameMap] || notice.engine_name;
          const localizedMessage = translatedMessages[notice.id] ?? notice.notice_message;

          return (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`rounded-xl border p-3 flex items-start gap-3 ${
                isInactive
                  ? 'bg-destructive/10 border-destructive/30'
                  : 'bg-amber-500/10 border-amber-500/30'
              }`}
            >
              {isInactive ? (
                <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-semibold ${isInactive ? 'text-destructive' : 'text-amber-700'}`}>
                  {localizedEngineName} — {isInactive ? t('engineNotice.unavailable') : t('engineNotice.maintenance')}
                </p>
                {localizedMessage && (
                  <p className="text-xs text-muted-foreground mt-0.5">{localizedMessage}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </AnimatePresence>
  );
};
