import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, GraduationCap, Calendar, HelpCircle, Sparkles } from "lucide-react";
import { StudyFormData } from "@/types/study";
import { ImageUpload } from "./ImageUpload";


interface StudyFormProps {
  onSubmit: (data: StudyFormData) => void;
  isLoading: boolean;
}

export function StudyForm({ onSubmit, isLoading }: StudyFormProps) {
  const [tema, setTema] = useState("");
  const [nivel, setNivel] = useState("");
  const [prazo, setPrazo] = useState("");
  const [duvidas, setDuvidas] = useState("");
  const [imagemBase64, setImagemBase64] = useState<string | undefined>();
  const { t } = useTranslation();

  const niveis = [
    { value: "fundamental1", label: t('form.levelFundamental1') },
    { value: "fundamental2", label: t('form.levelFundamental2') },
    { value: "medio", label: t('form.levelMedio') },
    { value: "superior", label: t('form.levelSuperior') },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tema || !nivel || !prazo) return;
    
    onSubmit({
      tema,
      nivel,
      prazo: parseInt(prazo),
      duvidas,
      imagemBase64,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="tema" className="flex items-center gap-2 text-base font-medium">
          <BookOpen className="h-4 w-4 text-primary" />
          {t('form.topic')}
        </Label>
        <Input
          id="tema"
          placeholder={t('form.topicPlaceholder')}
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          required
          className="bg-card"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nivel" className="flex items-center gap-2 text-base font-medium">
            <GraduationCap className="h-4 w-4 text-secondary" />
            {t('form.level')}
          </Label>
          <Select value={nivel} onValueChange={setNivel} required>
            <SelectTrigger id="nivel" className="bg-card h-12">
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

        <div className="space-y-2">
          <Label htmlFor="prazo" className="flex items-center gap-2 text-base font-medium whitespace-pre-wrap">
            <Calendar className="h-4 w-4 text-accent" />
            {t('form.deadline')}
          </Label>
          <Input
            id="prazo"
            type="number"
            min="1"
            max="90"
            placeholder="Ex.: 7"
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
            required
            className="bg-card"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duvidas" className="flex items-center gap-2 text-base font-medium">
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
          {t('form.doubts')}
        </Label>
        <Textarea
          id="duvidas"
          placeholder={t('form.doubtsPlaceholder')}
          value={duvidas}
          onChange={(e) => setDuvidas(e.target.value)}
          className="bg-card"
        />
      </div>

      <ImageUpload onImageChange={setImagemBase64} disabled={isLoading} />

      <Button
        type="submit"
        variant="hero"
        size="xl"
        className="w-full"
        disabled={isLoading || !tema || !nivel || !prazo}
      >
        {isLoading ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            {t('form.generating')}
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            {t('form.generate')}
          </>
        )}
      </Button>
    </form>
  );
}