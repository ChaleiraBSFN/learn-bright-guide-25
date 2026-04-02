import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { StudyForm } from "@/components/StudyForm";
import { StudyResult } from "@/components/StudyResult";
import { ExerciseForm } from "@/components/ExerciseForm";
import { ExerciseResult } from "@/components/ExerciseResult";
import { HistoryTab } from "@/components/HistoryTab";
import { StudyContent, StudyFormData } from "@/types/study";
import { ExerciseContent, ExerciseFormData } from "@/types/exercises";
import { BookOpen, Brain, Sparkles, ArrowLeft, Dumbbell, PenTool, History, Loader2, Languages } from "lucide-react";
import { GeneratingOverlay } from "@/components/GeneratingOverlay";
import learnBuddyLogo from "@/assets/learn-buddy-logo.jpeg";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { UserMenu } from "@/components/UserMenu";
import { SupportChat } from "@/components/SupportChat";
import { LanguageSelector } from "@/components/LanguageSelector";
import { EngineNoticeBanner } from "@/components/EngineNoticeBanner";
import { FloatingActions } from "@/components/FloatingActions";
import { CreditsDisplay } from "@/components/CreditsDisplay";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAchievements } from '@/hooks/useAchievements';

const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -20, scale: 0.98, transition: { duration: 0.3, ease: "easeOut" as const } },
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

interface PlatformSettings {
  exercisesEnabled: boolean;
  studyGenEnabled: boolean;
  rankingEnabled: boolean;
}

const getSettings = (): PlatformSettings => {
  try {
    const stored = localStorage.getItem('lb_platform_settings');
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return { exercisesEnabled: true, studyGenEnabled: true, rankingEnabled: true };
};

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFinishingStudy, setIsFinishingStudy] = useState(false);
  const [studyContent, setStudyContent] = useState<StudyContent | null>(null);
  const [currentTema, setCurrentTema] = useState("");
  
  const [isExerciseLoading, setIsExerciseLoading] = useState(false);
  const [isFinishingExercise, setIsFinishingExercise] = useState(false);
  const [exerciseContent, setExerciseContent] = useState<ExerciseContent | null>(null);

  const [settings, setSettings] = useState<PlatformSettings>(getSettings());
  const [activeTab, setActiveTab] = useState(() => {
    const s = getSettings();
    if (s.studyGenEnabled) return "study";
    if (s.exercisesEnabled) return "exercises";
    return "history";
  });
  
  // Image states
  const [aiImages, setAiImages] = useState<AIImage[]>([]);
  const [webImages, setWebImages] = useState<WebImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);

  const { checkAndUnlock } = useAchievements();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { hasCredits, useCredit } = useCredits();
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

  const fetchImages = useCallback(async (tema: string, nivel: string, passos?: Array<{ titulo: string; conceito: string }>) => {
    setImagesLoading(true);
    setAiImages([]);
    setWebImages([]);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (sessionData.session?.access_token) {
        headers.Authorization = `Bearer ${sessionData.session.access_token}`;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-images`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ tema, nivel, passos }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAiImages(data.aiImages || []);
        setWebImages(data.webImages || []);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setImagesLoading(false);
    }
  }, []);

  const handleSubmit = async (data: StudyFormData) => {
    if (!hasCredits) {
      toast({ title: t('credits.noCredits'), description: user ? t('credits.earnMore') : t('credits.signupForMore'), variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    setCurrentTema(data.tema);
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
            tema: data.tema, nivel: data.nivel, prazo: data.prazo,
            duvidas: data.duvidas, idioma: i18n.language,
            imagemBase64: data.imagemBase64,
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }));
        if (response.status === 429) throw new Error("Limite de requisições excedido. Aguarde alguns instantes.");
        if (response.status === 402) throw new Error("Créditos insuficientes.");
        throw new Error(errorData.error || "Erro ao gerar conteúdo");
      }

      const content = await response.json();
      if (!content || !content.objetivo || !content.resumo) {
        throw new Error("O conteúdo gerado está incompleto. Tente novamente.");
      }

      // Set content first (renders behind overlay), then play finish animation
      setStudyContent(content);
      contentLanguageRef.current = i18n.language;
      await useCredit();
      saveToHistory("study", data.tema, data.nivel, content, { prazo: data.prazo });

      toast({
        title: t('generate.success'),
        description: t('generate.successDesc'),
      });
      // Trigger achievement
      checkAndUnlock('generate_study');
      
      // Trigger finishing animation while content is already rendered behind
      setIsFinishingStudy(true);
      await new Promise(resolve => setTimeout(resolve, 2200));
      
      const passos = content.demonstracoes?.passos?.map((p: any) => ({
        titulo: p.titulo,
        conceito: p.conceito,
      }));
      fetchImages(data.tema, data.nivel, passos);
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
        if (response.status === 429) throw new Error("Limite de requisições excedido. Aguarde alguns instantes.");
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
      await useCredit();
      saveToHistory("exercise", data.tema, data.nivel, content, { quantidade: data.quantidade, dificuldade: data.dificuldade });

      toast({
        title: t('generate.exercisesSuccess'),
        description: t('generate.exercisesSuccessDesc'),
      });
      // Trigger achievement
      checkAndUnlock('generate_quiz');
      
      // Trigger finishing animation while content is already rendered behind
      setIsFinishingExercise(true);
      await new Promise(resolve => setTimeout(resolve, 2200));
      
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

  const handleReset = () => {
    setStudyContent(null);
    setExerciseContent(null);
    setCurrentTema("");
    setAiImages([]);
    setWebImages([]);
  };

  const showingResult = studyContent || exerciseContent;
  const viewKey = showingResult ? (studyContent ? "study-result" : "exercise-result") : "form";

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={learnBuddyLogo} alt="Learn Buddy" className="h-10 w-10 rounded-xl object-cover" loading="eager" fetchPriority="high" />
              <div>
                <h1 className="font-display text-xl font-bold text-foreground">Learn Buddy</h1>
                <p className="text-xs text-muted-foreground">{t('header.subtitle')}</p>
              </div>
            </div>
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
              <SupportChat />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Floating Actions - Study Groups & Install */}
      <FloatingActions />

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
              {/* Engine Notice Banner */}
              <EngineNoticeBanner />

              {/* Hero Section */}
              <div className="text-center space-y-3 md:space-y-4 px-2">
                <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-primary/10 text-primary text-xs md:text-sm font-medium">
                  <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
                  {t('hero.badge')}
                </div>
                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                  {t('hero.title')}{" "}
                  <span className="gradient-text">{t('hero.titleHighlight')}</span>
                </h2>
                <p className="text-sm md:text-lg text-muted-foreground max-w-xl mx-auto">
                  {t('hero.description')}
                </p>
              </div>

              {/* Features */}
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                {[
                  { icon: BookOpen, color: "text-primary", title: t('features.summaries'), desc: t('features.summariesDetailed') },
                  { icon: Brain, color: "text-secondary", title: t('features.mindMaps'), desc: t('features.mindMapsComplete') },
                  { icon: Dumbbell, color: "text-accent", title: t('features.exercises'), desc: t('features.exercisesPremium') },
                ].map((feat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.1, duration: 0.3 }}
                    className="flex items-center gap-3 p-3 md:p-4 rounded-xl bg-card border border-border"
                  >
                    <feat.icon className={`h-6 w-6 md:h-8 md:w-8 ${feat.color} shrink-0`} />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground text-sm md:text-base">{feat.title}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">{feat.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid h-auto gap-3 bg-transparent p-0" style={{ gridTemplateColumns: `repeat(${[settings.studyGenEnabled, settings.exercisesEnabled, true].filter(Boolean).length}, minmax(0, 1fr))` }}>
                  {settings.studyGenEnabled && (
                    <TabsTrigger value="study" className="flex items-center justify-center gap-2 rounded-xl text-sm md:text-base py-3.5 px-4 border-2 border-foreground bg-card text-muted-foreground font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-lg">
                      <BookOpen className="h-4 w-4" />
                      <span className="hidden sm:inline">{t('tabs.study')}</span>
                    </TabsTrigger>
                  )}
                  {settings.exercisesEnabled && (
                    <TabsTrigger value="exercises" className="flex items-center justify-center gap-2 rounded-xl text-sm md:text-base py-3.5 px-4 border-2 border-foreground bg-card text-muted-foreground font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-lg">
                      <PenTool className="h-4 w-4" />
                      <span className="hidden sm:inline">{t('tabs.exercises')}</span>
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="history" className="flex items-center justify-center gap-2 rounded-xl text-sm md:text-base py-3.5 px-4 border-2 border-foreground bg-card text-muted-foreground font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-lg">
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
                      <div className="card-elevated p-6 md:p-8">
                        <StudyForm onSubmit={handleSubmit} isLoading={isLoading} />
                      </div>
                    ) : activeTab === "exercises" ? (
                      <div className="card-elevated p-6 md:p-8">
                        <ExerciseForm onSubmit={handleExerciseSubmit} isLoading={isExerciseLoading} />
                      </div>
                    ) : (
                      <HistoryTab
                        onViewStudy={(content, topic) => {
                          setStudyContent(content);
                          setCurrentTema(topic);
                        }}
                        onViewExercise={(content) => {
                          setExerciseContent(content);
                        }}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </Tabs>
            </motion.div>
          ) : studyContent ? (
            <motion.div
              key="study-result"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mx-auto max-w-4xl relative"
            >
              <StudyResult
                content={studyContent}
                tema={currentTema}
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
            </motion.div>
          ) : exerciseContent ? (
            <motion.div
              key="exercise-result"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mx-auto max-w-4xl relative"
            >
              <ExerciseResult
                content={exerciseContent}
                aiImages={aiImages}
                webImages={webImages}
                imagesLoading={imagesLoading}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Fullscreen generating overlays */}
      <AnimatePresence>
        {isLoading && <GeneratingOverlay type="study" isFinishing={isFinishingStudy} />}
      </AnimatePresence>
      <AnimatePresence>
        {isExerciseLoading && <GeneratingOverlay type="exercise" isFinishing={isFinishingExercise} />}
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

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>{t('footer.developed')}</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
