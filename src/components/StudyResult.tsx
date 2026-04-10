import { useTranslation } from "react-i18next";
import { StudyContent } from "@/types/study";
import { ObjectiveSection } from "./sections/ObjectiveSection";
import { SummarySection } from "./sections/SummarySection";
import { StepsSection } from "./sections/StepsSection";
import { ExercisesSection } from "./sections/ExercisesSection";
import { ErrorsSection } from "./sections/ErrorsSection";
import { MindMapSection } from "./sections/MindMapSection";
import { StudyPlanSection } from "./sections/StudyPlanSection";
import { SourcesSection } from "./sections/SourcesSection";
import { VideosSection } from "./sections/VideosSection";
import { ImagesSection } from "./sections/ImagesSection";
import { ImageAnalysisSection } from "./sections/ImageAnalysisSection";

interface AIImage {
  tipo: "ai";
  label?: string;
  url: string;
  descricao: string;
}

interface WebImage {
  tipo: "web";
  label?: string;
  searchUrl: string;
  descricao: string;
}

interface StudyResultProps {
  content: StudyContent;
  tema: string;
  aiImages?: AIImage[];
  webImages?: WebImage[];
  imagesLoading?: boolean;
  onGenerateExercise?: (taskDescription: string) => void;
  isGeneratingExercise?: boolean;
}

export function StudyResult({ content, tema, aiImages, webImages, imagesLoading, onGenerateExercise, isGeneratingExercise }: StudyResultProps) {
  const { t } = useTranslation();

  if (!content || !content.objetivo || !content.resumo) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">{t('result.contentNotLoaded')}</p>
      </div>
    );
  }

  // Distribute images by label
  const summaryImage = aiImages?.find(img => img.label === "summary");
  const stepImages = aiImages?.filter(img => img.label?.startsWith("step-"));
  const mindmapImages = aiImages?.filter(img => img.label?.startsWith("mindmap"));
  
  // General images (diagram, concepts, and any non-labeled)
  const generalAiImages = aiImages?.filter(img => 
    !img.label || img.label === "diagram" || img.label === "concepts"
  );

  return (
    <div className="space-y-6 md:space-y-8 px-1 md:px-0">
      <div className="text-center space-y-2 slide-up">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {t('result.studyMaterial')}
          </h2>
        </div>
        <p className="text-base md:text-lg text-muted-foreground">
          {t('result.topic')}: <span className="font-semibold text-primary">{tema}</span>
        </p>
      </div>

      <div className="space-y-4 md:space-y-6">
        {content.analiseImagem && <ImageAnalysisSection data={content.analiseImagem} />}
        {content.objetivo && <ObjectiveSection data={content.objetivo} />}
        
        {content.resumo && (
          <SummarySection
            data={content.resumo}
            summaryImage={summaryImage}
            imagesLoading={imagesLoading}
          />
        )}
        
        {content.demonstracoes && (
          <StepsSection
            data={content.demonstracoes}
            stepImages={stepImages}
            imagesLoading={imagesLoading}
          />
        )}

        {content.exercicios && <ExercisesSection data={content.exercicios} />}
        {content.errosComuns && <ErrorsSection data={content.errosComuns} />}
        
        {content.mapaVisual && (
          <MindMapSection
            data={content.mapaVisual}
            aiImages={mindmapImages}
            imagesLoading={imagesLoading}
          />
        )}

        {/* General images section */}
        <ImagesSection
          aiImages={generalAiImages}
          isLoading={imagesLoading}
          data={content.imagensIlustrativas}
        />

        {content.videosRecomendados && <VideosSection data={content.videosRecomendados} />}
        {content.planoEstudo && (
          <StudyPlanSection
            data={content.planoEstudo}
            onGenerateExercise={onGenerateExercise}
            isGeneratingExercise={isGeneratingExercise}
          />
        )}
        {content.fontes && <SourcesSection data={content.fontes} />}
      </div>
    </div>
  );
}
