import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ArrowRight } from 'lucide-react';

export const CommunityBanner = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <motion.button
      type="button"
      onClick={() => navigate('/community')}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="group relative w-full overflow-hidden rounded-2xl border-2 border-violet-500/40 bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-purple-600/15 p-4 text-left shadow-[0_8px_30px_-12px_hsl(270_70%_55%/0.5)] backdrop-blur-sm transition-all hover:border-violet-500/70 hover:shadow-[0_12px_40px_-12px_hsl(270_70%_55%/0.7)]"
      aria-label={t('community.bannerTitle')}
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-500/20 blur-2xl" aria-hidden />
      <div className="absolute -left-4 -bottom-8 h-20 w-20 rounded-full bg-fuchsia-500/20 blur-2xl" aria-hidden />
      <div className="relative flex items-center gap-3">
        <div className="shrink-0 rounded-xl bg-violet-500/20 p-2.5 ring-2 ring-violet-500/30">
          <HeartHandshake className="h-5 w-5 text-violet-600 dark:text-violet-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-sm md:text-base font-bold text-violet-900 dark:text-violet-100">
            {t('community.bannerTitle')}
          </p>
          <p className="text-xs md:text-sm text-violet-800/80 dark:text-violet-200/80 mt-0.5">
            {t('community.bannerDesc')}
          </p>
        </div>
        <div className="hidden sm:flex shrink-0 items-center gap-1 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md group-hover:bg-violet-700 transition-colors">
          {t('community.bannerCta')}
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </motion.button>
  );
};
