import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, GraduationCap, HelpCircle, Sparkles } from "lucide-react";
import { StudyFormData } from "@/types/study";
import { ImageUpload } from "./ImageUpload";

interface StudyFormProps {
  onSubmit: (data: StudyFormData) => void;
  isLoading: boolean;
}

export function StudyForm({ onSubmit, isLoading }: StudyFormProps) {
  const [tema, setTema] = useState("");
  const [nivel, setNivel] = useState("");
  const [duvidas, setDuvidas] = useState("");
  const [imagemBase64, setImagemBase64] = useState<string | undefined>();
  const { t } = useTranslation();

  const niveis = [
    { value: "fundamental1", label: t('form.levelFundamental1') },
    { value: "fundamental2", label: t('form.levelFundamental2') },
    { value: "medio", label: t('form.levelMedio') },
    { value: "superior", label: t('form.levelSuperior') },
  ];

  const hasImage = !!imagemBase64;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasImage && (!tema || !nivel)) return;

    onSubmit({
      tema: tema || (hasImage ? "Análise da imagem enviada" : ""),
      nivel: nivel || (hasImage ? "auto" : ""),
      duvidas,
      imagemBase64,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {hasImage && (
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-3 text-sm text-foreground">
          ✨ Imagem detectada — você pode enviar apenas a imagem. Tema e nível viraram opcionais; a IA analisará automaticamente.
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="tema" className="flex items-center gap-2 text-base font-medium">
          <BookOpen className="h-4 w-4 text-primary" />
          {t('form.topic')} {hasImage && <span className="text-xs text-muted-foreground font-normal">(opcional)</span>}
        </Label>
        <Input
          id="tema"
          placeholder={hasImage ? "Opcional — deixe em branco para análise automática" : t('form.topicPlaceholder')}
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          required={!hasImage}
          className="bg-card"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nivel" className="flex items-center gap-2 text-base font-medium">
          <GraduationCap className="h-4 w-4 text-secondary" />
          {t('form.level')} {hasImage && <span className="text-xs text-muted-foreground font-normal">(opcional)</span>}
        </Label>
        <Select value={nivel} onValueChange={setNivel} required={!hasImage}>
          <SelectTrigger id="nivel" className="bg-card h-12">
            <SelectValue placeholder={hasImage ? "Opcional" : t('form.selectLevel')} />
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
        disabled={isLoading || (!hasImage && (!tema || !nivel))}
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
