import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface StudyStats {
  totalStudies: number;
  totalExercises: number;
  totalChats: number;
  streak: number;
  minutes: number;
  topTopics: Array<{ topic: string; count: number }>;
  week: Array<{ label: string; day: string; count: number }>;
}

const EMPTY: StudyStats = {
  totalStudies: 0,
  totalExercises: 0,
  totalChats: 0,
  streak: 0,
  minutes: 0,
  topTopics: [],
  week: [],
};

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function build(rows: Array<{ type: string; topic: string | null; created_at: string }>): StudyStats {
  const stats: StudyStats = { ...EMPTY, topTopics: [], week: [] };
  const byDay = new Set<string>();
  const topics = new Map<string, number>();

  for (const row of rows) {
    if (row.type === "study") stats.totalStudies++;
    else if (row.type === "exercise") stats.totalExercises++;
    else if (row.type === "chat") stats.totalChats++;

    const created = new Date(row.created_at);
    byDay.add(dayKey(created));

    const topic = (row.topic || "").trim();
    if (topic) topics.set(topic, (topics.get(topic) || 0) + 1);
  }

  // Estimativa simples de tempo dedicado
  stats.minutes = stats.totalStudies * 8 + stats.totalExercises * 5 + stats.totalChats * 2;

  // Sequência de dias seguidos (conta a partir de hoje ou de ontem)
  const cursor = new Date();
  if (!byDay.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (byDay.has(dayKey(cursor))) {
    stats.streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  stats.topTopics = [...topics.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Últimos 7 dias
  const week: StudyStats["week"] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    week.push({
      label: key,
      day: String(d.getDate()),
      count: rows.filter((r) => dayKey(new Date(r.created_at)) === key).length,
    });
  }
  stats.week = week;

  return stats;
}

export function useStudyStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudyStats>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user) {
      setStats(EMPTY);
      return;
    }
    setLoading(true);
    supabase
      .from("user_history")
      .select("type, topic, created_at")
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data, error }) => {
        if (!active) return;
        if (!error && data) setStats(build(data as never));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  return { stats, loading, isSignedIn: !!user };
}
