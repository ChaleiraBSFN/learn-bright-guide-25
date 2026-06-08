import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, GraduationCap, Calendar, HelpCircle, Sparkles, CalendarDays } from "lucide-react";
import { StudyPlanFormData } from "@/types/study";

interface StudyPlanFormProps {
  onSubmit: (data: StudyPlanFormData) => void;
  isLoading: boolean;
}

export function StudyPlanForm({ onSubmit, isLoading }: StudyPlanFormProps) {
  const [tema, setTema] = useState("");
  const [nivel, setNivel] = useState("");
  const [dias, setDias] = useState("");
  const [duvidas, setDuvidas] = useState("");
  const { t } = useTranslation();

  const niveis = [
    { value: "fundamental1", label: t('form.levelFundamental1') },
    { value: "fundamental2", label: t('form.levelFundamental2') },
    { value: "medio", label: t('form.levelMedio') },
    { value: "superior", label: t('form.levelSuperior') },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tema || !nivel || !dias) return;
    onSubmit({ tema, nivel, dias: parseInt(dias), duvidas });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <CalendarDays className="h-5 w-5 text-primary" />
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">{t('planForm.title')}</h2>
      </div>

      <div className="space-y-2">
        <Label htmlFor="plan-tema" className="flex items-center gap-2 text-base font-medium">
          <BookOpen className="h-4 w-4 text-primary" />
          {t('planForm.topic')}
        </Label>
        <Input
          id="plan-tema"
          placeholder={t('planForm.topicPh')}
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          required
          className="bg-card"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="plan-dias" className="flex items-center gap-2 text-base font-medium">
            <Calendar className="h-4 w-4 text-accent" />
            {t('planForm.days')}
          </Label>
          <Input
            id="plan-dias"
            type="number"
            min="1"
            max="30"
            placeholder={t('planForm.daysPh')}
            value={dias}
            onChange={(e) => setDias(e.target.value)}
            required
            className="bg-card h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="plan-nivel" className="flex items-center gap-2 text-base font-medium">
            <GraduationCap className="h-4 w-4 text-secondary" />
            {t('planForm.level')}
          </Label>
          <Select value={nivel} onValueChange={setNivel} required>
            <SelectTrigger id="plan-nivel" className="bg-card h-12">
              <SelectValue placeholder={t('form.selectLevel')} />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {niveis.map((n) => (
                <SelectItem key={n.value} value={n.value}>
                  {n.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="plan-duvidas" className="flex items-center gap-2 text-base font-medium">
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
          {t('planForm.doubts')}
        </Label>
        <Textarea
          id="plan-duvidas"
          placeholder={t('planForm.doubtsPh')}
          value={duvidas}
          onChange={(e) => setDuvidas(e.target.value)}
          className="bg-card"
        />
      </div>

      <Button
        type="submit"
        variant="hero"
        size="xl"
        className="w-full"
        disabled={isLoading || !tema || !nivel || !dias}
      >
        {isLoading ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            {t('planForm.generating')}
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            {t('planForm.generate')}
          </>
        )}
      </Button>
    </form>
  );
}
