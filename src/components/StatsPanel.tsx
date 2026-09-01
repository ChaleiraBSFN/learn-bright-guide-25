import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BookOpen, PenTool, Flame, Clock, BarChart3, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudyStats } from "@/hooks/useStudyStats";

export default function StatsPanel() {
  const { t } = useTranslation();
  const { stats, loading, isSignedIn } = useStudyStats();

  if (!isSignedIn) {
    return (
      <div className="depth-card p-8 text-center">
        <BarChart3 className="mx-auto mb-3 h-10 w-10 text-primary" />
        <p className="mb-4 text-muted-foreground">{t("stats.signedOut")}</p>
        <Button asChild variant="hero" className="liquid-btn rounded-full">
          <Link to="/auth">
            <LogIn className="h-4 w-4" />
            {t("stats.signIn")}
          </Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-3xl bg-muted/40" />
        ))}
      </div>
    );
  }

  const cards = [
    { icon: BookOpen, label: t("stats.studies"), value: stats.totalStudies },
    { icon: PenTool, label: t("stats.exercises"), value: stats.totalExercises },
    { icon: Flame, label: t("stats.streak"), value: stats.streak },
    { icon: Clock, label: t("stats.time"), value: `${Math.round(stats.minutes / 60)}h` },
  ];

  const hasData = stats.totalStudies + stats.totalExercises + stats.totalChats > 0;
  const maxWeek = Math.max(1, ...stats.week.map((d) => d.count));
  const maxTopic = Math.max(1, ...stats.topTopics.map((s) => s.count));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            className="depth-card p-5"
          >
            <card.icon className="mb-3 h-5 w-5 text-primary" />
            <p className="text-3xl font-bold text-foreground">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {!hasData ? (
        <div className="depth-card p-8 text-center text-muted-foreground">{t("stats.empty")}</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="depth-card p-6"
          >
            <h3 className="mb-4 text-lg font-semibold text-foreground">{t("stats.week")}</h3>
            <div className="flex h-36 items-end gap-2">
              {stats.week.map((d) => (
                <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.count / maxWeek) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full rounded-t-lg bg-gradient-to-t from-primary/40 to-primary"
                    style={{ minHeight: 4 }}
                  />
                  <span className="text-xs text-muted-foreground">{d.day}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="depth-card p-6"
          >
            <h3 className="mb-4 text-lg font-semibold text-foreground">{t("stats.topTopics")}</h3>
            <div className="space-y-3">
              {stats.topTopics.map((s) => (
                <div key={s.topic}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="line-clamp-1 text-foreground">{s.topic}</span>
                    <span className="text-muted-foreground">{s.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted/40">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(s.count / maxTopic) * 100}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-secondary to-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
