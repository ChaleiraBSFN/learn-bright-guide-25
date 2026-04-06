import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Zap, Flame, Trophy, Brain, Target, Gift, Crown, Star, MapPin } from 'lucide-react';

export const availableIcons = {
  BookOpen, Zap, Flame, Trophy, Brain, Target, Gift, Crown, Star, MapPin
};

export type IconName = keyof typeof availableIcons;

export interface TrailNodeDef {
  id: number;
  title: string;
  type: 'challenge' | 'quiz' | 'milestone' | 'reward';
  creditReward: number;
  iconName: IconName;
  x: number;
  y: number;
  parents: number[];
  objective?: string;
  timeRequiredMinutes?: number;
  triggerType?: 'generate_study' | 'generate_quiz' | 'quiz_score' | 'time_focused' | 'none';
  triggerRequirement?: number;
}

export const defaultTrailNodes: TrailNodeDef[] = [
  // Fase 1 - Início
  { id: 1, title: 'Primeiro Passo', type: 'challenge', creditReward: 1, iconName: 'BookOpen', x: 100, y: 150, parents: [], objective: "Gere seu primeiro resumo ou material de estudo usando a IA.", triggerType: 'generate_study' },
  { id: 2, title: 'Quiz Relâmpago', type: 'quiz', creditReward: 1, iconName: 'Zap', x: 250, y: 70, parents: [1], objective: "Crie seu primeiro exercício inteligente para testar seus conhecimentos.", triggerType: 'generate_quiz' },
  { id: 3, title: 'Estudante Focado', type: 'challenge', creditReward: 2, iconName: 'Flame', x: 250, y: 230, parents: [1], objective: "Permaneça 5 minutos estudando na plataforma sem sair.", timeRequiredMinutes: 5, triggerType: 'time_focused', triggerRequirement: 5 },
  { id: 4, title: 'Primeira Conquista', type: 'milestone', creditReward: 3, iconName: 'Trophy', x: 400, y: 150, parents: [2, 3], objective: "Complete o Quiz Relâmpago e o desafio Estudante Focado para desbloquear." },
  // Fase 2 - Crescimento
  { id: 5, title: 'Mestre do Quiz', type: 'quiz', creditReward: 1, iconName: 'Brain', x: 550, y: 70, parents: [4], objective: "Gere 3 exercícios diferentes para provar sua dedicação.", triggerType: 'generate_quiz' },
  { id: 6, title: 'Maratonista', type: 'challenge', creditReward: 2, iconName: 'Flame', x: 550, y: 230, parents: [4], objective: "Acumule 15 minutos de estudo contínuo na plataforma.", timeRequiredMinutes: 15, triggerType: 'time_focused', triggerRequirement: 15 },
  { id: 7, title: 'Recompensa Bronze', type: 'reward', creditReward: 5, iconName: 'Gift', x: 700, y: 150, parents: [5, 6], objective: "Complete os desafios da Fase 2 para ganhar sua primeira grande recompensa." },
  // Fase 3 - Exploração
  { id: 8, title: 'Explorador', type: 'challenge', creditReward: 2, iconName: 'Target', x: 850, y: 70, parents: [7], objective: "Gere materiais de estudo sobre 2 temas diferentes.", triggerType: 'generate_study' },
  { id: 9, title: 'Pesquisador', type: 'challenge', creditReward: 2, iconName: 'BookOpen', x: 850, y: 230, parents: [7], objective: "Gere um estudo completo e depois exercícios sobre o mesmo tema.", triggerType: 'generate_study' },
  { id: 10, title: 'Desbravador', type: 'milestone', creditReward: 5, iconName: 'MapPin', x: 1000, y: 150, parents: [8, 9], objective: "Explore diferentes temas e métodos de estudo para desbloquear." },
  // Fase 4 - Persistência
  { id: 11, title: 'Mente Afiada', type: 'quiz', creditReward: 3, iconName: 'Zap', x: 1150, y: 70, parents: [10], objective: "Gere 5 exercícios ao longo do seu uso da plataforma.", triggerType: 'generate_quiz' },
  { id: 12, title: 'Foco Total', type: 'challenge', creditReward: 3, iconName: 'Flame', x: 1150, y: 230, parents: [10], objective: "Acumule 30 minutos de estudo focado na plataforma.", timeRequiredMinutes: 30, triggerType: 'time_focused', triggerRequirement: 30 },
  { id: 13, title: 'Recompensa Prata', type: 'reward', creditReward: 8, iconName: 'Gift', x: 1300, y: 150, parents: [11, 12], objective: "Conquiste Mente Afiada e Foco Total para ganhar a recompensa de prata." },
  // Fase 5 - Domínio
  { id: 14, title: 'Estudioso', type: 'challenge', creditReward: 3, iconName: 'BookOpen', x: 1450, y: 70, parents: [13], objective: "Gere 5 materiais de estudo completos sobre temas variados.", triggerType: 'generate_study' },
  { id: 15, title: 'Dedicação', type: 'challenge', creditReward: 4, iconName: 'Flame', x: 1450, y: 230, parents: [13], objective: "Acumule 1 hora de estudo total na plataforma.", timeRequiredMinutes: 60, triggerType: 'time_focused', triggerRequirement: 60 },
  { id: 16, title: 'Mestre Estudante', type: 'milestone', creditReward: 10, iconName: 'Crown', x: 1600, y: 150, parents: [14, 15], objective: "Demonstre domínio completando os desafios de estudo e dedicação." },
  // Fase 6 - Elite
  { id: 17, title: 'Gênio dos Quizzes', type: 'quiz', creditReward: 4, iconName: 'Brain', x: 1750, y: 70, parents: [16], objective: "Gere 10 exercícios inteligentes ao longo da sua jornada.", triggerType: 'generate_quiz' },
  { id: 18, title: 'Ultra Foco', type: 'challenge', creditReward: 5, iconName: 'Flame', x: 1750, y: 230, parents: [16], objective: "Acumule 2 horas de estudo total na plataforma.", timeRequiredMinutes: 120, triggerType: 'time_focused', triggerRequirement: 120 },
  { id: 19, title: 'Recompensa Ouro', type: 'reward', creditReward: 15, iconName: 'Gift', x: 1900, y: 150, parents: [17, 18], objective: "Complete todos os desafios da elite para ganhar a recompensa de ouro." },
  // Fase 7 - Lenda
  { id: 20, title: 'Acadêmico', type: 'challenge', creditReward: 5, iconName: 'BookOpen', x: 2050, y: 70, parents: [19], objective: "Gere 15 materiais de estudo sobre assuntos diferentes.", triggerType: 'generate_study' },
  { id: 21, title: 'Resistência', type: 'challenge', creditReward: 5, iconName: 'Flame', x: 2050, y: 230, parents: [19], objective: "Acumule 3 horas de estudo focado na plataforma.", timeRequiredMinutes: 180, triggerType: 'time_focused', triggerRequirement: 180 },
  { id: 22, title: 'Especialista', type: 'quiz', creditReward: 5, iconName: 'Zap', x: 2200, y: 150, parents: [20, 21], objective: "Gere 15 exercícios ao longo do uso contínuo da plataforma.", triggerType: 'generate_quiz' },
  { id: 23, title: 'Lenda', type: 'milestone', creditReward: 20, iconName: 'Crown', x: 2350, y: 150, parents: [22], objective: "Alcance o status de Lenda completando todos os desafios anteriores." },
  // Fase 8 - Supremo
  { id: 24, title: 'Imparável', type: 'challenge', creditReward: 6, iconName: 'Target', x: 2500, y: 70, parents: [23], objective: "Gere 20 materiais de estudo completos ao longo da jornada.", triggerType: 'generate_study' },
  { id: 25, title: 'Zen Total', type: 'challenge', creditReward: 6, iconName: 'Flame', x: 2500, y: 230, parents: [23], objective: "Acumule 5 horas de estudo focado e contínuo.", timeRequiredMinutes: 300, triggerType: 'time_focused', triggerRequirement: 300 },
  { id: 26, title: 'Recompensa Diamante', type: 'reward', creditReward: 25, iconName: 'Gift', x: 2650, y: 150, parents: [24, 25], objective: "Conquiste a recompensa máxima completando todos os desafios supremos." },
  { id: 27, title: 'Mestre Supremo', type: 'milestone', creditReward: 30, iconName: 'Crown', x: 2800, y: 150, parents: [26], objective: "Torne-se o Mestre Supremo do Learn Buddy. Poucos chegam aqui!" },
  { id: 28, title: 'Estrela Eterna', type: 'reward', creditReward: 50, iconName: 'Star', x: 2950, y: 150, parents: [27], objective: "A conquista final. Você dominou completamente a plataforma!" },
];

export const useAchievementData = () => {
  const [nodes, setNodes] = useState<TrailNodeDef[]>(defaultTrailNodes);

  const loadNodes = () => {
    const stored = localStorage.getItem('lb_custom_achievements');
    if (stored) {
      try {
        setNodes(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse custom achievements", e);
      }
    }
  };

  useEffect(() => {
    loadNodes();
    const handleUpdate = () => loadNodes();
    window.addEventListener('achievements_updated', handleUpdate);
    return () => window.removeEventListener('achievements_updated', handleUpdate);
  }, []);

  const saveNodes = (newNodes: TrailNodeDef[]) => {
    setNodes(newNodes);
    localStorage.setItem('lb_custom_achievements', JSON.stringify(newNodes));
    window.dispatchEvent(new Event('achievements_updated'));
  };

  return { nodes, saveNodes };
};

export const useAchievements = () => {
  const { user } = useAuth();
  const { addCredits } = useCredits();
  const { toast } = useToast();
  const { nodes } = useAchievementData();

  const checkAndUnlock = useCallback(async (actionType?: string, actionValue?: number, explicitNodeId?: number) => {
    if (!user) return;

    let targetNodeIds: number[] = [];
    
    if (explicitNodeId) {
      targetNodeIds.push(explicitNodeId);
    } else if (actionType) {
      const matches = nodes.filter(n => {
         if (n.triggerType === actionType) {
             const req = n.triggerRequirement || n.timeRequiredMinutes || 0;
             if (req > 0 && actionValue !== undefined) {
                 return actionValue >= req;
             }
             return true;
         }
         // Compatibilidade com nós antigos sem triggerType salvo
         if (actionType === 'time_focused' && !n.triggerType && n.timeRequiredMinutes) {
             return actionValue !== undefined && actionValue >= n.timeRequiredMinutes;
         }
         if (actionType === 'generate_study' && n.id === 1 && !n.triggerType) return true;
         if (actionType === 'generate_quiz' && n.id === 2 && !n.triggerType) return true;
         return false;
      });
      targetNodeIds.push(...matches.map(n => n.id));
    }

    if (targetNodeIds.length === 0) return;

    for (const targetNodeId of targetNodeIds) {
      const nodeConf = nodes.find(n => n.id === targetNodeId);
      if (!nodeConf) continue;

      try {
        const { error } = await (supabase.from as any)('user_achievements').insert({ user_id: user.id, achievement_id: targetNodeId });
        if (error && error.code !== '23505') throw error;
        
        if (!error) {
          await addCredits(nodeConf.creditReward);
          toast({ title: "Conquista Desbloqueada! 🏆", description: `Você completou "${nodeConf.title}" e ganhou +${nodeConf.creditReward} créditos!` });
          window.dispatchEvent(new Event('achievement_unlocked'));
        }
      } catch (err) {
        const key = `achievements_v2_${user.id}`;
        const stored = JSON.parse(localStorage.getItem(key) || '[]');
        if (!stored.includes(targetNodeId)) {
          stored.push(targetNodeId);
          localStorage.setItem(key, JSON.stringify(stored));
          await addCredits(nodeConf.creditReward);
          toast({ title: "Conquista Desbloqueada! 🏆", description: `Você completou "${nodeConf.title}" e ganhou +${nodeConf.creditReward} créditos!` });
          window.dispatchEvent(new Event('achievement_unlocked'));
        }
      }
    }
  }, [user, addCredits, toast, nodes]);

  const checkAndUnlockTime = useCallback(async (totalMinutes: number) => {
    if (!user) return;
    await checkAndUnlock('time_focused', totalMinutes);
  }, [user, checkAndUnlock]);

  return { checkAndUnlock, checkAndUnlockTime };
};

export const useTimeTracker = () => {
  const { checkAndUnlockTime } = useAchievements();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      const key = `lb_session_minutes_${user.id}`;
      const current = parseInt(localStorage.getItem(key) || '0', 10);
      const newVal = current + 1;
      localStorage.setItem(key, String(newVal));
      checkAndUnlockTime(newVal);
    }, 60000);

    const current = parseInt(localStorage.getItem(`lb_session_minutes_${user.id}`) || '0', 10);
    checkAndUnlockTime(current);

    return () => clearInterval(interval);
  }, [user, checkAndUnlockTime]);
};
