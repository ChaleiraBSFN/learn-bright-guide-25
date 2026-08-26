import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, Users, Languages } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  studies: number;
  users: number;
}

const compact = (value: number, locale: string) => {
  try {
    return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(value);
  } catch {
    return String(value);
  }
};

export const SocialProof = () => {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase.rpc("get_public_stats" as never);
        if (error || !active) return;
        const row = Array.isArray(data) ? (data[0] as { studies_count: number; users_count: number } | undefined) : undefined;
        if (!row) return;
        const studies = Number(row.studies_count ?? 0);
        const users = Number(row.users_count ?? 0);
        if (studies <= 0 && users <= 0) return;
        setStats({ studies, users });
      } catch {
        /* silent */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!stats) return null;

  const items = [
    { icon: BookOpen, value: compact(stats.studies, i18n.language), label: t("home.stats.studies", "estudos gerados") },
    { icon: Users, value: compact(stats.users, i18n.language), label: t("home.stats.users", "estudantes na plataforma") },
    { icon: Languages, value: "9", label: t("home.stats.languages", "idiomas disponíveis") },
  ];

  return (
    <section aria-label={t("home.stats.title", "Números da plataforma")} className="grid grid-cols-3 gap-2 rounded-xl border-2 border-border/50 bg-card p-3 md:gap-4 md:p-4">
      {items.map(({ icon: Icon, value, label }) => (
        <div key={label} className="flex flex-col items-center gap-1 text-center">
          <Icon className="h-4 w-4 text-primary" />
          <span className="font-display text-lg font-bold text-foreground md:text-2xl">{value}</span>
          <span className="text-[11px] leading-tight text-muted-foreground md:text-xs">{label}</span>
        </div>
      ))}
    </section>
  );
};
