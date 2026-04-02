import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Camera, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  onImageChange: (base64: string | undefined) => void;
  disabled?: boolean;
}

export function ImageUpload({ onImageChange, disabled }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione uma imagem válida (JPG, PNG).",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 4MB.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreview(base64String);
        // Remove the data:image prefix to send cleanly if needed, but we can also just send it all
        // Let's send the full data URL so we know the mime type
        onImageChange(base64String);
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      setIsProcessing(false);
      toast({
        title: "Erro ao processar imagem",
        description: "Tente novamente ou use outra imagem.",
        variant: "destructive",
      });
    }
  };

  const handleClear = () => {
    setPreview(null);
    onImageChange(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {preview ? (
        <div className="relative inline-block w-full rounded-lg border overflow-hidden bg-muted/30">
          <img src={preview} alt="Upload preview" className="w-full max-h-48 object-contain" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={disabled || isProcessing}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed border-2 py-8 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Camera className="h-5 w-5 mr-2" />
            )}
            {isProcessing ? "Processando..." : "Anexar foto para análise (Opcional, máx 4MB)"}
          </Button>
        </div>
      )}
    </div>
  );
}
