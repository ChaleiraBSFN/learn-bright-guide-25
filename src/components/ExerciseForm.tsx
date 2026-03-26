import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Dumbbell, Hash, Zap, Lock } from "lucide-react";
import { ExerciseFormData } from "@/types/exercises";

interface ExerciseFormProps {
  onSubmit: (data: ExerciseFormData) => void;
  isLoading: boolean;
}

export function ExerciseForm({ onSubmit, isLoading }: ExerciseFormProps) {
  const [tema, setTema] = useState("");
  const [nivel, setNivel] = useState("");
  const [quantidade, setQuantidade] = useState("5");
  const [dificuldade, setDificuldade] = useState("variado");
  const { t } = useTranslation();
  const [generationDisabled, setGenerationDisabled] = useState(false);

  useEffect(() => {
    const check = () => {
      try {
        const stored = localStorage.getItem('lb_platform_settings');
        if (stored) {
          const parsed = JSON.parse(stored);
          setGenerationDisabled(parsed.contentGenerationEnabled === false);
        }
      } catch (e) {}
    };
    check();
    window.addEventListener('lb_settings_changed', check);
    window.addEventListener('storage', check);
    return () => {
      window.removeEventListener('lb_settings_changed', check);
      window.removeEventListener('storage', check);
    };
  }, []);

  const niveis = [
    { value: "fundamental1", label: t('form.levelFundamental1') },
    { value: "fundamental2", label: t('form.levelFundamental2') },
    { value: "medio", label: t('form.levelMedio') },
    { value: "superior", label: t('form.levelSuperior') },
  ];

  const dificuldades = [
    { value: "variado", label: t('exercises.difficultyMixed') },
    { value: "basico", label: t('exercises.difficultyBasic') },
    { value: "intermediario", label: t('exercises.difficultyIntermediate') },
    { value: "avancado", label: t('exercises.difficultyAdvanced') },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tema || !nivel) return;
    onSubmit({
      tema,
      nivel,
      quantidade: parseInt(quantidade),
      dificuldade,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="exercise-tema" className="flex items-center gap-2 text-base font-medium">
          <Dumbbell className="h-4 w-4 text-primary" />
          {t('exercises.topic')}
        </Label>
        <Input
          id="exercise-tema"
          placeholder={t('exercises.topicPlaceholder')}
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          required
          className="bg-card"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="exercise-nivel" className="flex items-center gap-2 text-base font-medium">
            <GraduationCap className="h-4 w-4 text-secondary" />
            {t('form.level')}
          </Label>
          <Select value={nivel} onValueChange={setNivel} required>
            <SelectTrigger id="exercise-nivel" className="bg-card h-12">
              <SelectValue placeholder={t('form.selectLevel')} />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {niveis.map((n) => (
                <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="exercise-qtd" className="flex items-center gap-2 text-base font-medium">
            <Hash className="h-4 w-4 text-accent" />
            {t('exercises.quantity')}
          </Label>
          <Input
            id="exercise-qtd"
            type="number"
            min="1"
            max="20"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            required
            className="bg-card"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="exercise-diff" className="flex items-center gap-2 text-base font-medium">
            <Zap className="h-4 w-4 text-destructive" />
            {t('exercises.difficulty')}
          </Label>
          <Select value={dificuldade} onValueChange={setDificuldade}>
            <SelectTrigger id="exercise-diff" className="bg-card h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {dificuldades.map((d) => (
                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        type="submit"
        variant="hero"
        size="xl"
        className="w-full"
        disabled={isLoading || !tema || !nivel}
      >
        {isLoading ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            {t('exercises.generating')}
          </>
        ) : (
          <>
            <Dumbbell className="h-5 w-5" />
            {t('exercises.generate')}
          </>
        )}
      </Button>
    </form>
  );
}
