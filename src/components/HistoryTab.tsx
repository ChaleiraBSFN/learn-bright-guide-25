import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { History, BookOpen, PenTool, Trash2, LogIn, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface HistoryEntry {
  id: string;
  type: "study" | "exercise";
  topic: string;
  level: string | null;
  content: any;
  created_at: string;
}

interface HistoryTabProps {
  onViewStudy: (content: any, topic: string) => void;
  onViewExercise: (content: any) => void;
}

export const HistoryTab = ({ onViewStudy, onViewExercise }: HistoryTabProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) setHistory(data as HistoryEntry[]);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("user_history").delete().eq("id", id);
    if (!error) {
      setHistory((prev) => prev.filter((h) => h.id !== id));
    } else {
      toast({ title: t("premium.error"), description: error.message, variant: "destructive" });
    }
  };

  const handleView = (entry: HistoryEntry) => {
    if (entry.type === "study") {
      onViewStudy(entry.content, entry.topic);
    } else {
      onViewExercise(entry.content);
    }
  };

  if (!user) {
    return (
      <div className="card-elevated p-8 text-center space-y-4">
        <History className="h-12 w-12 mx-auto text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">{t("history.loginRequired")}</h3>
        <p className="text-sm text-muted-foreground">{t("history.loginDescription")}</p>
        <Button variant="default" onClick={() => window.location.href = "/auth"} className="gap-2">
          <LogIn className="h-4 w-4" />
          {t("auth.login")}
        </Button>
      </div>
    );
  }

  return (
    <div className="card-elevated p-6 md:p-8 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <History className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground text-lg">{t("history.title")}</h3>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">{t("history.loading")}</div>
      ) : history.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">{t("history.empty")}</div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {history.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border hover:border-primary/30 transition-colors"
              >
                <div className="shrink-0">
                  {entry.type === "study" ? (
                    <BookOpen className="h-5 w-5 text-primary" />
                  ) : (
                    <PenTool className="h-5 w-5 text-secondary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{entry.topic}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.type === "study" ? t("tabs.study") : t("tabs.exercises")} •{" "}
                    {format(new Date(entry.created_at), "dd/MM/yyyy HH:mm")}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {entry.level && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {entry.level}
                      </span>
                    )}
                    {entry.type === "exercise" && (
                      <>
                        {entry.content?._meta?.quantidade && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium">
                            {entry.content._meta.quantidade} {t("exercises.quantity").toLowerCase()}
                          </span>
                        )}
                        {entry.content?._meta?.dificuldade && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                            {entry.content._meta.dificuldade}
                          </span>
                        )}
                        {!entry.content?._meta?.quantidade && entry.content?.exercicios && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium">
                            {entry.content.exercicios.length} {t("exercises.quantity").toLowerCase()}
                          </span>
                        )}
                      </>
                    )}
                    {entry.type === "study" && entry.content?._meta?.prazo && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium">
                        {entry.content._meta.prazo} {t("form.deadline").toLowerCase()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(entry)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("history.deleteTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("history.deleteDescription")}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("history.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(entry.id)}>{t("history.confirm")}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};
