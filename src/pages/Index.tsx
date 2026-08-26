import { lazy, Suspense, useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { StudyForm } from "@/components/StudyForm";
import { Hero } from "@/components/home/Hero";
import { IntroScreen } from "@/components/home/IntroScreen";

import { triggerRateLimit } from "@/components/RateLimitBar";
import { StudyContent, StudyFormData, StudyPlanContent, StudyPlanFormData } from "@/types/study";
import { ExerciseContent, ExerciseFormData } from "@/types/exercises";
import { BookOpen, Brain, Sparkles, ArrowLeft, Dumbbell, PenTool, History, Loader2, Languages, CalendarDays } from "lucide-react";
import learnBuddyLogo from "@/assets/learn-buddy-logo.jpeg";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { UserMenu } from "@/components/UserMenu";
import { SEO } from "@/components/SEO";
import { LanguageSelector } from "@/components/LanguageSelector";
import { CreditsDisplay } from "@/components/CreditsDisplay";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import { useAchievements } from '@/hooks/useAchievements';

const ExerciseForm = lazy(() => import("@/components/ExerciseForm").then((module) => ({ default: module.ExerciseForm })));
const ExerciseResult = lazy(() => import("@/components/ExerciseResult").then((module) => ({ default: module.ExerciseResult })));
const FloatingActions = lazy(() => import("@/components/FloatingActions").then((module) => ({ default: module.FloatingActions })));
const GeneratingOverlay = lazy(() => import("@/components/GeneratingOverlay").then((module) => ({ default: module.GeneratingOverlay })));
const HistoryTab = lazy(() => import("@/components/HistoryTab").then((module) => ({ default: module.HistoryTab })));
const StudyResult = lazy(() => import("@/components/StudyResult").then((module) => ({ default: module.StudyResult })));
const SupportChat = lazy(() => import("@/components/SupportChat").then((module) => ({ default: module.SupportChat })));
const StudyPlanSection = lazy(() => import("@/components/sections/StudyPlanSection").then((m) => ({ default: m.StudyPlanSection })));
const StudyPlanForm = lazy(() => import("@/components/StudyPlanForm").then((m) => ({ default: m.StudyPlanForm })));
const FeatureCarousel = lazy(() => import("@/components/FeatureCarousel").then((m) => ({ default: m.FeatureCarousel })));
const PromoBanners = lazy(() => import("@/components/PromoBanners").then((m) => ({ default: m.PromoBanners })));
const EngineNoticeBanner = lazy(() => import("@/components/EngineNoticeBanner").then((m) => ({ default: m.EngineNoticeBanner })));
const UpdateNoticeBanner = lazy(() => import("@/components/UpdateNoticeBanner").then((m) => ({ default: m.UpdateNoticeBanner })));
const AdSenseSlot = lazy(() => import("@/components/AdSenseSlot").then((m) => ({ default: m.AdSenseSlot })));
const PlanComparison = lazy(() => import("@/components/PlanComparison").then((m) => ({ default: m.PlanComparison })));
const SocialProof = lazy(() => import("@/components/home/SocialProof").then((m) => ({ default: m.SocialProof })));
const HowItWorks = lazy(() => import("@/components/home/HowItWorks").then((m) => ({ default: m.HowItWorks })));



const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const } },
};


const tabContentVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2, ease: "easeOut" as const } },
};

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

/** Mounts heavy, below-the-fold widgets only after the page is interactive. */
const useDeferredMount = () => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const idle = (window as any).requestIdleCallback as undefined | ((cb: () => void, o?: any) => number);
    if (idle) {
      const id = idle(() => setReady(true), { timeout: 1500 });
      return () => (window as any).cancelIdleCallback?.(id);
    }
    const timer = window.setTimeout(() => setReady(true), 600);
    return () => window.clearTimeout(timer);
  }, []);
  return ready;
};

interface PlatformSettings {
  exercisesEnabled: boolean;
  studyGenEnabled: boolean;
  rankingEnabled: boolean;
  trailEnabled: boolean;
}

const getSettings = (): PlatformSettings => {
  try {
    const stored = localStorage.getItem('lb_platform_settings');
    if (stored) {
      const raw = JSON.parse(stored);
      // If old format had contentGenerationEnabled=false but no explicit studyGenEnabled/exercisesEnabled,
      // migrate: use contentGenerationEnabled value. Otherwise default true.
      const hasExplicitStudy = 'studyGenEnabled' in raw;
      const hasExplicitExercises = 'exercisesEnabled' in raw;
      return {
        exercisesEnabled: hasExplicitExercises ? raw.exercisesEnabled : (raw.contentGenerationEnabled ?? true),
        studyGenEnabled: hasExplicitStudy ? raw.studyGenEnabled : (raw.contentGenerationEnabled ?? true),
        rankingEnabled: raw.rankingEnabled ?? true,
        trailEnabled: raw.trailEnabled ?? true,
      };
    }
  } catch (e) {}
  return { exercisesEnabled: true, studyGenEnabled: true, rankingEnabled: true, trailEnabled: true };
};

const Index = () => {
  const deferredReady = useDeferredMount();
  const [isLoading, setIsLoading] = useState(false);
  const [isFinishingStudy, setIsFinishingStudy] = useState(false);
  const [studyContent, setStudyContent] = useState<StudyContent | null>(null);
  const [currentTema, setCurrentTema] = useState("");
  const [currentNivel, setCurrentNivel] = useState("");
  
  const [isExerciseLoading, setIsExerciseLoading] = useState(false);
  const [isFinishingExercise, setIsFinishingExercise] = useState(false);
  const [exerciseContent, setExerciseContent] = useState<ExerciseContent | null>(null);

  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [isFinishingPlan, setIsFinishingPlan] = useState(false);
  const [planContent, setPlanContent] = useState<StudyPlanContent | null>(null);
  const [currentPlanTema, setCurrentPlanTema] = useState("");

  const studyResultRef = useRef<HTMLDivElement>(null);
  const exerciseResultRef = useRef<HTMLDivElement>(null);
  const planResultRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState<PlatformSettings>(getSettings());
  const [activeTab, setActiveTab] = useState(() => {
    const s = getSettings();
    if (s.studyGenEnabled) return "study";
    if (s.exercisesEnabled) return "exercises";
    return "history";
  });
  const [presetTema, setPresetTema] = useState<string | undefined>(undefined);
  const [introOpen, setIntroOpen] = useState(true);

  const submitRef = useRef<((data: StudyFormData) => void) | null>(null);

  const handlePickTopic = useCallback((topic: string, tab: string = "study") => {
    setActiveTab(tab);
    if (topic) setPresetTema(topic);
    setIntroOpen(false);
    // Gera imediatamente quando o usuário envia um tema na tela inicial
    if (topic && tab === "study") {
      setTimeout(() => {
        submitRef.current?.({ tema: topic, nivel: "medio", duvidas: "" });
      }, 0);
    }
  }, []);



  
  // Image states
  const [aiImages, setAiImages] = useState<AIImage[]>([]);
  const [webImages, setWebImages] = useState<WebImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);

  const { checkAndUnlock } = useAchievements();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { hasCredits, consumeCredit } = useCredits();
  const [isTranslating, setIsTranslating] = useState(false);
  const contentLanguageRef = useRef(i18n.language);

  // Sync settings when Admin alters them across tabs
  useEffect(() => {
    const handleSettingsChange = () => {
      const s = getSettings();
      setSettings(s);
      if (!s.studyGenEnabled && activeTab === 'study') {
        setActiveTab(s.exercisesEnabled ? 'exercises' : 'history');
      } else if (!s.exercisesEnabled && activeTab === 'exercises') {
        setActiveTab(s.studyGenEnabled ? 'study' : 'history');
      }
    };
    window.addEventListener('lb_settings_changed', handleSettingsChange);
    // Also listen to storage events if changed in another tab
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'lb_platform_settings') handleSettingsChange();
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('lb_settings_changed', handleSettingsChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, [activeTab]);

  // Translate content when language changes
  useEffect(() => {
    const handleLanguageChange = async (newLang: string) => {
      if (newLang === contentLanguageRef.current) return;
      
      const hasContent = studyContent || exerciseContent;
      contentLanguageRef.current = newLang;
      
      if (!hasContent) {
        return;
      }

      setIsTranslating(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (sessionData.session?.access_token) {
          headers.Authorization = `Bearer ${sessionData.session.access_token}`;
        }

        if (studyContent) {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-content`,
            { method: "POST", headers, body: JSON.stringify({ content: studyContent, targetLanguage: newLang, contentType: "study" }) }
          );
          if (response.ok) {
            const translated = await response.json();
            if (contentLanguageRef.current === newLang) {
              setStudyContent(translated);
            }
          }
        }

        if (exerciseContent) {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-content`,
            { method: "POST", headers, body: JSON.stringify({ content: exerciseContent, targetLanguage: newLang, contentType: "exercise" }) }
          );
          if (response.ok) {
            const translated = await response.json();
            if (contentLanguageRef.current === newLang) {
              setExerciseContent(translated);
            }
          }
        }
      } catch (error) {
        console.error("Translation error:", error);
        toast({ title: t('premium.error'), description: "Translation failed", variant: "destructive" });
      } finally {
        setIsTranslating(false);
      }
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => { i18n.off('languageChanged', handleLanguageChange); };
  }, [studyContent, exerciseContent, i18n, toast, t]);

  const saveToHistory = async (type: "study" | "exercise", topic: string, level: string | null, content: any, meta?: Record<string, any>) => {
    if (!user) return;
    try {
      await supabase.from("user_history").insert({
        user_id: user.id,
        type,
        topic,
        level,
        content: { ...content, _meta: meta },
      });
    } catch (e) {
      console.error("Error saving to history:", e);
    }
  };

  const fetchImages = useCallback(async (_tema: string, _nivel: string, _passos?: Array<{ titulo: string; conceito: string }>) => {
    // AI image generation disabled. Real images are now linked via Google Images search from the result UI.
    setImagesLoading(false);
    setAiImages([]);
    setWebImages([]);
  }, []);

  /**
   * Waits until the result container is actually mounted in the DOM and its
   * children are painted. This guarantees the overlay only fades away once
   * the generated content is visible behind it.
   */
  const waitForContentPaint = (ref: React.RefObject<HTMLElement | null>, timeout = 3000) => {
    return new Promise<void>((resolve) => {
      const start = Date.now();
      const finish = () => resolve();
      const check = () => {
        const el = ref.current;
        if (el && el.children.length > 0) {
          // Double rAF ensures the browser has painted the content.
          requestAnimationFrame(() => requestAnimationFrame(finish));
          return;
        }
        if (Date.now() - start > timeout) {
          resolve();
          return;
        }
        requestAnimationFrame(check);
      };
      check();
    });
  };

  const handleSubmit = async (data: StudyFormData) => {

    if (!hasCredits) {
      toast({ title: t('credits.noCredits'), description: user ? t('credits.earnMore') : t('credits.signupForMore'), variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    setCurrentTema(data.tema);
    setCurrentNivel(data.nivel || "");
    setStudyContent(null);
    setAiImages([]);
    setWebImages([]);

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: sessionData } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (sessionData.session?.access_token) {
        headers.Authorization = `Bearer ${sessionData.session.access_token}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-study-content`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ 
            tema: data.tema, nivel: data.nivel,
            duvidas: data.duvidas, idioma: i18n.language,
            imagemBase64: data.imagemBase64,
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }));
        if (response.status === 429) {
          const retryAfter = Number(response.headers.get("retry-after")) || 60;
          triggerRateLimit(retryAfter);
          throw new Error("Limite de requisições excedido. Aguarde alguns instantes.");
        }
        if (response.status === 402) throw new Error("Créditos insuficientes.");
        throw new Error(errorData.error || "Erro ao gerar conteúdo");
      }

      const content = await response.json();
      // Accept the response if it has the standard study fields OR just the image analysis
      // (when the user uploaded only an image, the AI may return mostly analiseImagem)
      const hasUsableContent = content && (
        (content.objetivo && content.resumo) || content.analiseImagem
      );
      if (!hasUsableContent) {
        throw new Error("O conteúdo gerado está incompleto. Tente novamente.");
      }

      // Set content first (renders behind overlay), then play finish animation
      setStudyContent(content);
      contentLanguageRef.current = i18n.language;
      await consumeCredit();
      saveToHistory("study", data.tema, data.nivel, content);

      // Start image generation IN PARALLEL with the finishing animation,
      // so images are ready (or close to it) when overlay disappears — works on mobile too.
      const passos = content.demonstracoes?.passos?.map((p: any) => ({
        titulo: p.titulo,
        conceito: p.conceito,
      }));
      const imagesPromise = fetchImages(data.tema, data.nivel, passos);

      toast({
        title: t('generate.success'),
        description: t('generate.successDesc'),
      });
      // Trigger achievement
      checkAndUnlock('generate_study');

      // Keep the "generating" animation running while images load,
      // so the user never sees an empty/blank result behind the overlay.
      await imagesPromise;

      // Only fade out after the StudyResult DOM is actually rendered and painted.
      await waitForContentPaint(studyResultRef);

      // Then play the celebration "finishing" animation smoothly.
      setIsFinishingStudy(true);
      await new Promise(resolve => setTimeout(resolve, 520));
    } catch (error) {
      console.error("Error generating study content:", error);
      const message = error instanceof Error
        ? (error.name === 'AbortError' ? 'A conexão demorou muito. Verifique sua internet e tente novamente.' : error.message)
        : "Não foi possível gerar o material.";
      toast({ title: "Erro", description: message, variant: "destructive" });
      setStudyContent(null);
    } finally {
      setIsLoading(false);
      setIsFinishingStudy(false);
    }
  };

  const handleExerciseSubmit = async (data: ExerciseFormData) => {
    if (!hasCredits) {
      toast({ title: t('credits.noCredits'), description: user ? t('credits.earnMore') : t('credits.signupForMore'), variant: 'destructive' });
      return;
    }
    setIsExerciseLoading(true);
    setExerciseContent(null);
    setStudyContent(null); // Clear study content so the view shifts to exercise
    setAiImages([]);
    setWebImages([]);

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: sessionData } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (sessionData.session?.access_token) {
        headers.Authorization = `Bearer ${sessionData.session.access_token}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-exercises`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            tema: data.tema, nivel: data.nivel,
            quantidade: data.quantidade, dificuldade: data.dificuldade,
            idioma: i18n.language,
            imagemBase64: data.imagemBase64,
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }));
        if (response.status === 429) {
          const retryAfter = Number(response.headers.get("retry-after")) || 60;
          triggerRateLimit(retryAfter);
          throw new Error("Limite de requisições excedido. Aguarde alguns instantes.");
        }
        if (response.status === 402) throw new Error("Créditos insuficientes.");
        throw new Error(errorData.error || "Erro ao gerar exercícios");
      }

      const content = await response.json();
      if (!content || !content.exercicios) {
        throw new Error("Os exercícios gerados estão incompletos. Tente novamente.");
      }
      content.exercicios = content.exercicios.map((ex: any) => ({
        ...ex,
        tipo: ex.tipo || "objetiva",
      }));

      // Set content first (renders behind overlay), then play finish animation
      setExerciseContent(content);
      contentLanguageRef.current = i18n.language;
      await consumeCredit();
      saveToHistory("exercise", data.tema, data.nivel, content, { quantidade: data.quantidade, dificuldade: data.dificuldade });

      toast({
        title: t('generate.exercisesSuccess'),
        description: t('generate.exercisesSuccessDesc'),
      });
      // Trigger achievement
      checkAndUnlock('generate_quiz');
      
      // Only fade out after the ExerciseResult DOM is actually rendered and painted.
      await waitForContentPaint(exerciseResultRef);

      // Trigger finishing animation while content is already rendered behind
      setIsFinishingExercise(true);
      await new Promise(resolve => setTimeout(resolve, 520));

      fetchImages(data.tema, data.nivel);
    } catch (error) {
      console.error("Error generating exercises:", error);
      const message = error instanceof Error
        ? (error.name === 'AbortError' ? 'A conexão demorou muito. Verifique sua internet e tente novamente.' : error.message)
        : "Não foi possível gerar os exercícios.";
      toast({ title: "Erro", description: message, variant: "destructive" });
      setExerciseContent(null);
    } finally {
      setIsExerciseLoading(false);
      setIsFinishingExercise(false);
    }
  };

  const handlePlanSubmit = async (data: StudyPlanFormData) => {
    if (!hasCredits) {
      toast({ title: t('credits.noCredits'), description: user ? t('credits.earnMore') : t('credits.signupForMore'), variant: 'destructive' });
      return;
    }
    setIsPlanLoading(true);
    setPlanContent(null);
    setCurrentPlanTema(data.tema);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (sessionData.session?.access_token) {
        headers.Authorization = `Bearer ${sessionData.session.access_token}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-study-plan`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            tema: data.tema, nivel: data.nivel, dias: data.dias,
            duvidas: data.duvidas, idioma: i18n.language,
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }));
        if (response.status === 429) {
          const retryAfter = Number(response.headers.get("retry-after")) || 60;
          triggerRateLimit(retryAfter);
          throw new Error("Limite de requisições excedido. Aguarde alguns instantes.");
        }
        if (response.status === 402) throw new Error("Créditos insuficientes.");
        throw new Error(errorData.error || "Erro ao gerar roteiro");
      }

      const content = await response.json() as StudyPlanContent;
      if (!content?.planoEstudo?.blocos?.length) {
        throw new Error("O roteiro gerado está incompleto. Tente novamente.");
      }

      setPlanContent(content);
      await consumeCredit();
      saveToHistory("study", data.tema, data.nivel, content, { kind: "plan", dias: data.dias });

      // Only fade out after the StudyPlanSection DOM is actually rendered and painted.
      await waitForContentPaint(planResultRef);

      setIsFinishingPlan(true);
      await new Promise(resolve => setTimeout(resolve, 520));

      toast({ title: t('planForm.success'), description: t('planForm.successDesc') });
      checkAndUnlock('generate_study');
    } catch (error) {
      console.error("Error generating plan:", error);
      const message = error instanceof Error
        ? (error.name === 'AbortError' ? 'A conexão demorou muito. Verifique sua internet e tente novamente.' : error.message)
        : "Não foi possível gerar o roteiro.";
      toast({ title: "Erro", description: message, variant: "destructive" });
      setPlanContent(null);
    } finally {
      setIsPlanLoading(false);
      setIsFinishingPlan(false);
    }
  };

  const handleReset = () => {
    setStudyContent(null);
    setExerciseContent(null);
    setPlanContent(null);
    setCurrentTema("");
    setCurrentPlanTema("");
    setAiImages([]);
    setWebImages([]);
    setIntroOpen(true);
  };

  const showingResult = studyContent || exerciseContent || planContent;
  const viewKey = showingResult ? (studyContent ? "study-result" : planContent ? "plan-result" : "exercise-result") : "form";

  // SEO dinâmico: resultados de estudo viram páginas ricas e indexáveis
  const seoProps = (() => {
    const clean = (s: string) => s.replace(/\s+/g, " ").trim();
    const cut = (s: string, n = 155) => (s.length > n ? `${clean(s).slice(0, n - 1)}…` : clean(s));

    if (studyContent && currentTema) {
      const resumo = clean(studyContent.resumo?.conteudo || studyContent.objetivo?.conteudo || "");
      const topics = (studyContent.demonstracoes?.passos || []).map((p) => p.titulo).filter(Boolean);
      const description = cut(
        resumo || `Resumo completo, exemplos práticos, exercícios e mapa mental sobre ${currentTema}.`
      );
      return {
        title: `${clean(currentTema)} — Resumo, Exemplos e Exercícios | Studdy Buddy`,
        description,
        path: "/",
        type: "article",
        keywords: [currentTema, "resumo", "exercícios resolvidos", "mapa mental", "estudar com IA", "Studdy Buddy", ...topics.slice(0, 5)].join(", "),
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "LearningResource",
          name: `${clean(currentTema)} — material de estudo`,
          description,
          inLanguage: "pt-BR",
          learningResourceType: ["Resumo", "Exercícios", "Mapa mental"],
          educationalLevel: currentNivel || "medio",
          about: { "@type": "Thing", name: clean(currentTema) },
          teaches: topics.slice(0, 8),
          isAccessibleForFree: true,
          publisher: { "@type": "Organization", name: "Studdy Buddy", url: "https://studdybuddy.com.br" },
          hasPart: (studyContent.exercicios?.lista || []).slice(0, 5).map((ex) => ({
            "@type": "Question",
            name: clean(ex.pergunta),
            acceptedAnswer: { "@type": "Answer", text: cut(ex.resposta || ex.explicacao || "", 300) },
          })),
        } as Record<string, unknown>,
      };
    }

    if (planContent && currentPlanTema) {
      return {
        title: `Plano de estudos de ${clean(currentPlanTema)} | Studdy Buddy`,
        description: cut(`Cronograma de estudos personalizado e gratuito sobre ${currentPlanTema}, com metas diárias, tarefas e checkpoints.`),
        path: "/",
        type: "article",
        keywords: `${currentPlanTema}, plano de estudos, cronograma, rotina de estudo, Studdy Buddy`,
      };
    }

    return {
      title: "Learn Buddy – Estude com IA grátis",
      description:
        "Plataforma 100% gratuita para estudar com IA: resumos, exercícios corrigidos, mapas mentais e plano de estudos personalizado.",
      path: "/",
    };
  })();


  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO {...seoProps} />
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-4">
          <div className="flex items-center justify-between">
            <a
              href="/"
              aria-label="Learn Buddy - Voltar para a página inicial"
              className="flex items-center gap-3 rounded-xl transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <img src={learnBuddyLogo} alt="Learn Buddy" width="40" height="40" className="h-10 w-10 rounded-xl object-cover" loading="eager" />
              <div className="hidden sm:block">
                <span className="font-display text-xl font-bold text-foreground block">Learn Buddy</span>
                <p className="text-xs text-muted-foreground">{t('header.subtitle')}</p>
              </div>
            </a>
            <div className="flex items-center gap-2">
              <AnimatePresence>
                {showingResult && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button variant="ghost" onClick={handleReset} className="gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      {t('header.back')}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
              <CreditsDisplay />
              <LanguageSelector />
              {deferredReady && (
                <Suspense fallback={null}>
                  <SupportChat />
                </Suspense>
              )}
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Floating Actions - Study Groups & Install */}
      {deferredReady && (
        <Suspense fallback={null}>
          <FloatingActions />
        </Suspense>
      )}

      <main className="container mx-auto px-4 py-8 md:py-12">
        <AnimatePresence mode="wait">
          {!showingResult ? (
            <motion.div
              key="form-view"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mx-auto max-w-2xl space-y-8"
            >
              {/* Update Notice Banner */}
              <Suspense fallback={null}><UpdateNoticeBanner /></Suspense>

              {/* Engine Notice Banner */}
              <Suspense fallback={null}><EngineNoticeBanner /></Suspense>

              {introOpen ? (
                <>
                  <IntroScreen onSubmitTopic={handlePickTopic} onExplore={() => setIntroOpen(false)} />
                  {/* Planos logo abaixo do botão explorar */}
                  <div className="pt-2 pb-8">
                    {deferredReady ? (
                      <Suspense fallback={<div className="min-h-[200px] rounded-xl bg-muted/20" />}>
                        <PlanComparison />
                      </Suspense>
                    ) : (
                      <div className="min-h-[200px] rounded-xl bg-muted/20" />
                    )}
                    {/* Anúncio abaixo dos planos */}
                    {deferredReady && (
                      <div className="pt-6">
                        <Suspense fallback={null}><AdSenseSlot variant="card" /></Suspense>
                      </div>
                    )}
                  </div>
                </>

              ) : (
              <>
              {/* Promo Banners (admin-managed) */}
              {deferredReady && <Suspense fallback={null}><PromoBanners /></Suspense>}


              {/* Hero */}
              <Hero onPickTopic={handlePickTopic} />

              {/* Prova social */}
              {deferredReady && (
                <Suspense fallback={null}>
                  <SocialProof />
                </Suspense>
              )}


              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid h-auto gap-3 bg-transparent p-0" style={{ gridTemplateColumns: `repeat(${[settings.studyGenEnabled, settings.exercisesEnabled, true, true].filter(Boolean).length}, minmax(0, 1fr))` }}>
                  {settings.studyGenEnabled && (
                    <TabsTrigger value="study" className="flex items-center justify-center gap-2 rounded-xl text-sm md:text-base py-3.5 px-4 border-2 border-border/60 bg-card text-muted-foreground font-semibold transition-all hover:border-primary/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-lg">
                      <BookOpen className="h-4 w-4" />
                      <span className="hidden sm:inline">{t('tabs.study')}</span>
                    </TabsTrigger>
                  )}
                  {settings.exercisesEnabled && (
                    <TabsTrigger value="exercises" className="flex items-center justify-center gap-2 rounded-xl text-sm md:text-base py-3.5 px-4 border-2 border-border/60 bg-card text-muted-foreground font-semibold transition-all hover:border-primary/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-lg">
                      <PenTool className="h-4 w-4" />
                      <span className="hidden sm:inline">{t('tabs.exercises')}</span>
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="plan" className="flex items-center justify-center gap-2 rounded-xl text-sm md:text-base py-3.5 px-4 border-2 border-border/60 bg-card text-muted-foreground font-semibold transition-all hover:border-primary/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-lg">
                    <CalendarDays className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('tabs.plan')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center justify-center gap-2 rounded-xl text-sm md:text-base py-3.5 px-4 border-2 border-border/60 bg-card text-muted-foreground font-semibold transition-all hover:border-primary/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-lg">
                    <History className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('tabs.history')}</span>
                  </TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    variants={tabContentVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="mt-6"
                  >
                    {activeTab === "study" ? (
                      <div className="liquid-glass p-6 md:p-8">
                        <StudyForm onSubmit={handleSubmit} isLoading={isLoading} presetTema={presetTema} />
                      </div>
                    ) : activeTab === "exercises" ? (
                      <div className="liquid-glass p-6 md:p-8">
                        <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" />}>
                          <ExerciseForm onSubmit={handleExerciseSubmit} isLoading={isExerciseLoading} />
                        </Suspense>
                      </div>
                    ) : activeTab === "plan" ? (
                      <div className="liquid-glass p-6 md:p-8">
                        <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" />}>
                          <StudyPlanForm onSubmit={handlePlanSubmit} isLoading={isPlanLoading} />
                        </Suspense>
                      </div>
                    ) : (
                      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" />}>
                        <HistoryTab
                          onViewStudy={(content, topic) => {
                            setStudyContent(content);
                            setCurrentTema(topic);
                          }}
                          onViewExercise={(content) => {
                            setExerciseContent(content);
                          }}
                        />
                      </Suspense>
                    )}
                  </motion.div>
                </AnimatePresence>
              </Tabs>

              {/* Veja funcionando */}
              {deferredReady && (
                <Suspense fallback={null}>
                  <HowItWorks onOpenTab={setActiveTab} />
                </Suspense>
              )}

              {/* Feature Banner Carousel */}
              {deferredReady ? (
                <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-muted" />}><FeatureCarousel /></Suspense>
              ) : (
                <div className="h-32 rounded-xl bg-muted/40" />
              )}

              <div className="pt-4">
                {deferredReady && (
                  <Suspense fallback={<div className="min-h-[200px] rounded-xl bg-muted/20" />}>
                    <PlanComparison />
                  </Suspense>
                )}
                {deferredReady && (
                  <div className="pt-6">
                    <Suspense fallback={null}><AdSenseSlot variant="card" /></Suspense>
                  </div>
                )}
              </div>

              </>
              )}

            </motion.div>
          ) : studyContent ? (
            <motion.div
              ref={studyResultRef}
              key="study-result"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mx-auto max-w-4xl relative lb-expand-container"
            >
              <Suspense fallback={<div className="h-80 animate-pulse rounded-xl bg-muted" />}>
                <StudyResult
                  content={studyContent}
                  tema={currentTema}
                  nivel={currentNivel}
                  aiImages={aiImages}
                  webImages={webImages}
                  imagesLoading={imagesLoading}
                  onGenerateExercise={(taskDescription) => {
                    handleExerciseSubmit({
                      tema: taskDescription,
                      nivel: "medio",
                      quantidade: 5,
                      dificuldade: "variado",
                    });
                  }}
                  isGeneratingExercise={isExerciseLoading}
                />
              </Suspense>
            </motion.div>
          ) : exerciseContent ? (
            <motion.div
              ref={exerciseResultRef}
              key="exercise-result"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mx-auto max-w-4xl relative lb-expand-container"
            >
              <Suspense fallback={<div className="h-80 animate-pulse rounded-xl bg-muted" />}>
                <ExerciseResult
                  content={exerciseContent}
                  aiImages={aiImages}
                  webImages={webImages}
                  imagesLoading={imagesLoading}
                />
              </Suspense>
            </motion.div>
          ) : planContent ? (
            <motion.div
              ref={planResultRef}
              key="plan-result"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mx-auto max-w-4xl relative lb-expand-container"
            >
              <Suspense fallback={<div className="h-80 animate-pulse rounded-xl bg-muted" />}>
                <StudyPlanSection
                  data={planContent.planoEstudo}
                  hideNumberPrefix
                  onGenerateExercise={(taskDescription) => {
                    handleExerciseSubmit({
                      tema: taskDescription,
                      nivel: "medio",
                      quantidade: 5,
                      dificuldade: "variado",
                    });
                  }}
                  isGeneratingExercise={isExerciseLoading}
                />
              </Suspense>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Fullscreen generating overlays */}
      <AnimatePresence>
        {isLoading && (
          <Suspense fallback={null}>
            <GeneratingOverlay type="study" isFinishing={isFinishingStudy} />
          </Suspense>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isPlanLoading && (
          <Suspense fallback={null}>
            <GeneratingOverlay type="study" isFinishing={isFinishingPlan} />
          </Suspense>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isExerciseLoading && (
          <Suspense fallback={null}>
            <GeneratingOverlay type="exercise" isFinishing={isFinishingExercise} />
          </Suspense>
        )}
      </AnimatePresence>

      {/* Fixed fullscreen translating overlay */}
      <AnimatePresence>
        {isTranslating && (
          <motion.div
            key="translating-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ background: 'radial-gradient(ellipse at center, hsl(var(--background) / 0.97) 0%, hsl(var(--background) / 0.85) 60%, hsl(var(--background) / 0.7) 100%)' }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 18 }}
              className="flex flex-col items-center gap-8"
            >
              {/* Outer glow */}
              <div className="relative flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.15, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute h-36 w-36 rounded-full bg-primary/20 blur-xl"
                />

                {/* Outer ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute h-28 w-28 rounded-full border-[3px] border-transparent border-t-primary border-r-primary/30"
                />

                {/* Middle ring */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                  className="absolute h-20 w-20 rounded-full border-[3px] border-transparent border-b-secondary border-l-secondary/30"
                />

                {/* Inner ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                  className="absolute h-12 w-12 rounded-full border-2 border-transparent border-t-accent border-r-accent/30"
                />

                {/* Center icon */}
                <motion.div
                  animate={{ scale: [1, 1.25, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="relative h-10 w-10 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg"
                >
                  <Languages className="h-5 w-5 text-primary-foreground" />
                </motion.div>
              </div>

              {/* Animated text */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-baseline gap-1">
                  <motion.span
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="text-lg font-bold text-foreground"
                  >
                    {t('header.translating', 'Traduzindo')}
                  </motion.span>
                  {[0, 0.3, 0.6].map((delay, i) => (
                    <motion.span
                      key={i}
                      animate={{ opacity: [0, 1, 0], y: [0, -4, 0] }}
                      transition={{ duration: 1, repeat: Infinity, delay, ease: "easeInOut" }}
                      className="text-xl font-bold text-primary"
                    >
                      .
                    </motion.span>
                  ))}
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ delay: 1 }}
                  className="text-xs text-muted-foreground"
                >
                  {t('header.translatingHint', 'Isso pode levar alguns segundos')}
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Learn Buddy Footer Ad */}
      <section className="w-full px-4 py-6">
        <div className="container mx-auto max-w-4xl">
          {deferredReady && (
            <Suspense fallback={null}>
              <AdSenseSlot variant="card" />
            </Suspense>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground space-y-2">
          <p>{t('footer.developed')}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link to="/privacy" className="text-primary hover:underline font-medium">
              {t('footer.privacy', 'Política de Privacidade')}
            </Link>
            <Link to="/terms" className="text-primary hover:underline font-medium">
              {t('footer.terms', 'Termos de Uso')}
            </Link>
            <Link to="/about" className="text-primary hover:underline font-medium">
              {t('footer.about', 'Sobre e Contato')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
