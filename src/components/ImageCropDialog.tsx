import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Square, RectangleHorizontal, RectangleVertical, Maximize } from 'lucide-react';

interface ImageCropDialogProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedFile: File) => void;
  fileName?: string;
}

const ASPECT_OPTIONS = [
  { label: '1:1', value: 1, icon: Square },
  { label: '4:3', value: 4 / 3, icon: RectangleHorizontal },
  { label: '3:4', value: 3 / 4, icon: RectangleVertical },
  { label: 'Free', value: undefined, icon: Maximize },
] as const;

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 80 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

export function ImageCropDialog({ open, onClose, imageSrc, onCropComplete, fileName = 'cropped.jpg' }: ImageCropDialogProps) {
  const { t } = useTranslation();
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [selectedAspect, setSelectedAspect] = useState<number | undefined>(1);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const aspect = selectedAspect ?? 1;
    const newCrop = centerAspectCrop(width, height, aspect);
    setCrop(newCrop);
  }, [selectedAspect]);

  const handleAspectChange = (aspect: number | undefined) => {
    setSelectedAspect(aspect);
    if (imgRef.current && aspect) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  };

  const handleConfirm = async () => {
    if (!imgRef.current || !completedCrop) return;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], fileName, { type: 'image/jpeg' });
        onCropComplete(file);
        onClose();
      },
      'image/jpeg',
      0.92
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('imageCrop.title', 'Recortar Imagem')}
          </DialogTitle>
        </DialogHeader>

        {/* Aspect ratio buttons */}
        <div className="flex items-center justify-center gap-2">
          {ASPECT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = selectedAspect === opt.value;
            return (
              <Button
                key={opt.label}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleAspectChange(opt.value)}
                className="gap-1.5"
              >
                <Icon className="h-4 w-4" />
                {opt.label === 'Free' ? t('imageCrop.free', 'Livre') : opt.label}
              </Button>
            );
          })}
        </div>

        {/* Crop area */}
        <div className="flex-1 overflow-auto flex items-center justify-center min-h-0 max-h-[50vh] rounded-lg bg-muted/30">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={selectedAspect}
            className="max-h-[50vh]"
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              onLoad={onImageLoad}
              className="max-h-[50vh] max-w-full object-contain"
            />
          </ReactCrop>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('imageCrop.cancel', 'Cancelar')}
          </Button>
          <Button onClick={handleConfirm} disabled={!completedCrop}>
            {t('imageCrop.confirm', 'Confirmar')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}