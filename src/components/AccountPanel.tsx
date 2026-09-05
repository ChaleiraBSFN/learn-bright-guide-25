import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Map, Trophy, FileText, Loader2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatsPanel from "@/components/StatsPanel";
import { ProgressTrail } from "@/components/ProgressTrail";
import { RankingDialog } from "@/components/RankingDialog";
import type { ExerciseFormData } from "@/types/exercises";

interface AccountPanelProps {
  /** Gera a prova reaproveitando o motor de exercícios. */
  onCreateExam: (data: ExerciseFormData) => void;
  isCreatingExam?: boolean;
}

export default function AccountPanel({ onCreateExam, isCreatingExam }: AccountPanelProps) {
  const { t } = useTranslation();
  const [showTrail, setShowTrail] = useState(false);
  const [showRanking, setShowRanking] = useState(false);

  const [tema, setTema] = useState("");
  const [quantidade, setQuantidade] = useState("10");
  const [dificuldade, setDificuldade] = useState("medio");
  const [nivel, setNivel] = useState("medio");

  const submitExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tema.trim() || isCreatingExam) return;
    onCreateExam({
      tema: tema.trim(),
      nivel,
      quantidade: Number(quantidade),
      dificuldade,
    });
  };

  return (
    <div className="space-y-6">
      {/* Currículo e estatísticas */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-bold">
            {t("account.statsTitle", "Seu currículo e estatísticas")}
          </h3>
        </div>
        <StatsPanel />
      </section>

      {/* Trilha e ranking */}
      <section className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setShowTrail(true)}
          className="depth-card flex items-center gap-3 p-5 text-left transition-transform active:scale-[0.98]"
        >
          <Map className="h-6 w-6 shrink-0 text-primary" />
          <span>
            <span className="block font-bold">{t("account.trailTitle", "Trilha de progresso")}</span>
            <span className="block text-xs text-muted-foreground">
              {t("account.trailDesc", "Veja seus desafios concluídos e os próximos.")}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setShowRanking(true)}
          className="depth-card flex items-center gap-3 p-5 text-left transition-transform active:scale-[0.98]"
        >
          <Trophy className="h-6 w-6 shrink-0 text-yellow-500" />
          <span>
            <span className="block font-bold">{t("account.rankingTitle", "Ranking")}</span>
            <span className="block text-xs text-muted-foreground">
              {t("account.rankingDesc", "Compare seu progresso com outros estudantes.")}
            </span>
          </span>
        </button>
      </section>

      {/* Criar prova */}
      <section className="liquid-glass p-5 md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-secondary" />
          <div>
            <h3 className="font-display text-lg font-bold">{t("account.examTitle", "Criar uma prova")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("account.examDesc", "Monte uma prova com o número de questões e a dificuldade que quiser.")}
            </p>
          </div>
        </div>

        <form onSubmit={submitExam} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="exam-tema">{t("account.examSubject", "Assunto da prova")}</Label>
            <Input
              id="exam-tema"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder={t("account.examSubjectPlaceholder", "Ex.: Revolução Francesa")}
              className="rounded-xl"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>{t("account.examCount", "Questões")}</Label>
              <Select value={quantidade} onValueChange={setQuantidade}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["5", "10", "15", "20"].map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("account.examDifficulty", "Dificuldade")}</Label>
              <Select value={dificuldade} onValueChange={setDificuldade}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="facil">{t("exercises.easy", "Fácil")}</SelectItem>
                  <SelectItem value="medio">{t("exercises.medium", "Médio")}</SelectItem>
                  <SelectItem value="dificil">{t("exercises.hard", "Difícil")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("account.examLevel", "Nível de ensino")}</Label>
              <Select value={nivel} onValueChange={setNivel}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fundamental">{t("levels.fundamental", "Fundamental")}</SelectItem>
                  <SelectItem value="medio">{t("levels.medio", "Médio")}</SelectItem>
                  <SelectItem value="superior">{t("levels.superior", "Superior")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            variant="hero"
            disabled={!tema.trim() || isCreatingExam}
            className="liquid-btn w-full rounded-full"
          >
            {isCreatingExam ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {t("account.examSubmit", "Gerar prova")}
          </Button>
        </form>
      </section>

      <ProgressTrail open={showTrail} onClose={() => setShowTrail(false)} />
      <RankingDialog open={showRanking} onClose={() => setShowRanking(false)} />
    </div>
  );
}
