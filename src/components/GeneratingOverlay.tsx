import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { BookOpen, Dumbbell, Sparkles, Brain, Lightbulb, Star, Zap, Rocket, CheckCircle2 } from "lucide-react";
import { useMemo } from "react";

interface GeneratingOverlayProps {
  type: "study" | "exercise";
  isFinishing?: boolean;
}

// Generate random particles for the explosion effect
function useParticles(count: number) {
  return useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (360 / count) * i + Math.random() * 20,
      distance: 150 + Math.random() * 300,
      size: 4 + Math.random() * 12,
      delay: Math.random() * 0.3,
      duration: 1.2 + Math.random() * 0.8,
      icon: [Sparkles, Star, Zap, Brain, Lightbulb, Rocket][Math.floor(Math.random() * 6)],
    }));
  }, [count]);
}

// Generate confetti-like shapes
function useConfetti(count: number) {
  return useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: -50 + Math.random() * 100,
      endX: -200 + Math.random() * 400,
      endY: -300 - Math.random() * 200,
      rotation: Math.random() * 720 - 360,
      scale: 0.3 + Math.random() * 0.7,
      delay: Math.random() * 0.4,
      color: ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(217, 91%, 60%)', 'hsl(168, 76%, 50%)', 'hsl(38, 92%, 55%)'][Math.floor(Math.random() * 6)],
    }));
  }, [count]);
}

export function GeneratingOverlay({ type, isFinishing }: GeneratingOverlayProps) {
  const { t } = useTranslation();
  const isStudy = type === "study";
  const Icon = isStudy ? BookOpen : Dumbbell;
  const particles = useParticles(24);
  const confetti = useConfetti(30);

  const tips = isStudy
    ? [
        t('generating.tipStudy1', 'Analisando o tema solicitado...'),
        t('generating.tipStudy2', 'Criando resumos e explicações...'),
        t('generating.tipStudy3', 'Montando mapa mental e plano de estudos...'),
      ]
    : [
        t('generating.tipExercise1', 'Analisando o tema e nível...'),
        t('generating.tipExercise2', 'Criando questões variadas...'),
        t('generating.tipExercise3', 'Preparando gabaritos e explicações...'),
      ];

  return (
    <motion.div
      key="generating-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: isFinishing ? 1.2 : 0.3, delay: isFinishing ? 1.0 : 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, hsl(var(--background) / 0.97) 0%, hsl(var(--background) / 0.85) 60%, hsl(var(--background) / 0.7) 100%)',
      }}
    >
      {/* Background pulse rings on finishing */}
      <AnimatePresence>
        {isFinishing && (
          <>
            {[0, 0.15, 0.3].map((delay, i) => (
              <motion.div
                key={`ring-${i}`}
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ scale: 8, opacity: 0 }}
                transition={{ duration: 1.8, delay, ease: "easeOut" }}
                className="absolute rounded-full border-2"
                style={{
                  width: 100,
                  height: 100,
                  borderColor: i === 0 ? 'hsl(var(--primary) / 0.4)' : i === 1 ? 'hsl(var(--secondary) / 0.3)' : 'hsl(var(--accent) / 0.3)',
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Exploding particles on finishing */}
      <AnimatePresence>
        {isFinishing &&
          particles.map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            const endX = Math.cos(rad) * p.distance;
            const endY = Math.sin(rad) * p.distance;
            const ParticleIcon = p.icon;
            return (
              <motion.div
                key={`particle-${p.id}`}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: endX,
                  y: endY,
                  scale: [0, 1.5, 0.5],
                  opacity: [1, 0.9, 0],
                  rotate: [0, 180 + Math.random() * 180],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="absolute"
                style={{ zIndex: 110 }}
              >
                <ParticleIcon
                  style={{ width: p.size, height: p.size }}
                  className="text-primary"
                />
              </motion.div>
            );
          })}
      </AnimatePresence>

      {/* Confetti burst on finishing */}
      <AnimatePresence>
        {isFinishing &&
          confetti.map((c) => (
            <motion.div
              key={`confetti-${c.id}`}
              initial={{ x: c.x, y: 0, scale: 0, rotate: 0, opacity: 1 }}
              animate={{
                x: c.endX,
                y: c.endY,
                scale: [0, c.scale, c.scale * 0.5],
                rotate: c.rotation,
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 1.5,
                delay: 0.1 + c.delay,
                ease: [0.2, 0.8, 0.2, 1],
              }}
              className="absolute rounded-sm"
              style={{
                width: 6 + Math.random() * 6,
                height: 6 + Math.random() * 6,
                backgroundColor: c.color,
                zIndex: 110,
              }}
            />
          ))}
      </AnimatePresence>

      {/* Main content container */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={
          isFinishing
            ? { scale: [1, 1.3, 20], opacity: [1, 1, 0] }
            : { scale: 1, opacity: 1 }
        }
        transition={
          isFinishing
            ? {
                duration: 2.0,
                times: [0, 0.3, 1],
                ease: [0.16, 1, 0.3, 1],
              }
            : { type: "spring", stiffness: 180, damping: 18 }
        }
        className="flex flex-col items-center gap-8"
      >
        {/* Animated rings */}
        <div className="relative flex items-center justify-center">
          {/* Glow */}
          <motion.div
            animate={
              isFinishing
                ? { scale: 3, opacity: 0 }
                : { scale: [1, 1.15, 1], opacity: [0.3, 0.15, 0.3] }
            }
            transition={
              isFinishing
                ? { duration: 0.8 }
                : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
            }
            className="absolute h-36 w-36 rounded-full bg-primary/20 blur-xl"
          />

          {/* Outer ring */}
          <motion.div
            animate={
              isFinishing
                ? { rotate: 720, scale: 2, opacity: 0 }
                : { rotate: 360 }
            }
            transition={
              isFinishing
                ? { duration: 1.2, ease: "easeOut" }
                : { duration: 4, repeat: Infinity, ease: "linear" }
            }
            className="absolute h-28 w-28 rounded-full border-[3px] border-transparent border-t-primary border-r-primary/30"
          />

          {/* Middle ring */}
          <motion.div
            animate={
              isFinishing
                ? { rotate: -720, scale: 2.5, opacity: 0 }
                : { rotate: -360 }
            }
            transition={
              isFinishing
                ? { duration: 1.0, ease: "easeOut" }
                : { duration: 2.5, repeat: Infinity, ease: "linear" }
            }
            className="absolute h-20 w-20 rounded-full border-[3px] border-transparent border-b-secondary border-l-secondary/30"
          />

          {/* Inner ring */}
          <motion.div
            animate={
              isFinishing
                ? { rotate: 1080, scale: 3, opacity: 0 }
                : { rotate: 360 }
            }
            transition={
              isFinishing
                ? { duration: 0.8, ease: "easeOut" }
                : { duration: 1.8, repeat: Infinity, ease: "linear" }
            }
            className="absolute h-12 w-12 rounded-full border-2 border-transparent border-t-accent border-r-accent/30"
          />

          {/* Center icon */}
          <motion.div
            animate={
              isFinishing
                ? { scale: [1, 1.8, 2.5], rotate: [0, 360] }
                : { scale: [1, 1.25, 1], rotate: [0, 10, -10, 0] }
            }
            transition={
              isFinishing
                ? { duration: 1.0, ease: [0.16, 1, 0.3, 1] }
                : { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }
            className="relative h-10 w-10 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg"
          >
            <AnimatePresence mode="wait">
              {isFinishing ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                >
                  <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                </motion.div>
              ) : (
                <motion.div key="icon">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Floating particles during loading */}
          {!isFinishing &&
            [Sparkles, Brain, Lightbulb].map((ParticleIcon, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -20, 0],
                  x: [0, (i - 1) * 15, 0],
                  opacity: [0, 0.7, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: i * 0.8,
                  ease: "easeInOut",
                }}
                className="absolute"
                style={{
                  top: `${-10 + i * 5}px`,
                  left: `${50 + (i - 1) * 30}px`,
                }}
              >
                <ParticleIcon className="h-4 w-4 text-primary/50" />
              </motion.div>
            ))}
        </div>

        {/* Title with dots */}
        <AnimatePresence mode="wait">
          {isFinishing ? (
            <motion.div
              key="done-text"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 2 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-lg font-bold text-foreground">
                {isStudy
                  ? t('generating.studyDone', 'Pronto! 🎉')
                  : t('generating.exerciseDone', 'Pronto! 🎉')}
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="loading-text"
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="flex items-baseline gap-1">
                <motion.span
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="text-lg font-bold text-foreground"
                >
                  {isStudy
                    ? t('generating.studyTitle', 'Gerando material de estudo')
                    : t('generating.exerciseTitle', 'Gerando exercícios')}
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

              {/* Rotating tips */}
              <div className="h-5 overflow-hidden">
                {tips.map((tip, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      y: [20, 0, 0, -20],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 3,
                      times: [0, 0.1, 0.9, 1],
                    }}
                    className="text-xs text-muted-foreground text-center absolute"
                    style={{ position: i === 0 ? 'relative' : 'absolute' }}
                  >
                    {tip}
                  </motion.p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Flash overlay on finishing */}
      <AnimatePresence>
        {isFinishing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 1.0, delay: 0.8, times: [0, 0.3, 1] }}
            className="absolute inset-0 bg-primary/10 pointer-events-none"
            style={{ zIndex: 120 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
