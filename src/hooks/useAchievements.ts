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
  description: string;
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
  // Fase 1 — Início
  { id: 1, title: 'Primeiro Passo', type: 'challenge', creditReward: 1, iconName: 'BookOpen', x: 100, y: 150, parents: [], objective: "Gere seu primeiro resumo, mapa mental ou material (Ação: Gerar Estudo).", triggerType: 'generate_study' },
  { id: 2, title: 'Quiz Relâmpago', type: 'quiz', creditReward: 1, iconName: 'Zap', x: 300, y: 70, parents: [1], objective: "Gere o seu primeiro exercício inteligente (Ação: Gerar Exercício).", triggerType: 'generate_quiz' },
  { id: 3, title: 'Estudante Focado', type: 'challenge', creditReward: 2, iconName: 'Flame', x: 300, y: 230, parents: [1], objective: "Fique 5 minutos focado estudando pela plataforma.", timeRequiredMinutes: 5, triggerType: 'time_focused', triggerRequirement: 5 },
  { id: 4, title: 'Conquista!', type: 'milestone', creditReward: 3, iconName: 'Trophy', x: 500, y: 150, parents: [2, 3] },
  { id: 5, title: 'Mestre do Quiz', type: 'quiz', creditReward: 1, iconName: 'Brain', x: 700, y: 70, parents: [4] },
  { id: 6, title: 'Sequência Fogo', type: 'challenge', creditReward: 2, iconName: 'Flame', x: 700, y: 230, parents: [4] },
  { id: 7, title: 'Recompensa', type: 'reward', creditReward: 5, iconName: 'Gift', x: 900, y: 150, parents: [5, 6] },
  { id: 8, title: 'Explorador', type: 'challenge', creditReward: 1, iconName: 'Target', x: 1100, y: 150, parents: [7] },
  { id: 9, title: 'Campeão', type: 'milestone', creditReward: 10, iconName: 'Crown', x: 1300, y: 150, parents: [8] },
  // Fase 2 — Aprofundamento
  { id: 10, title: 'Segundo Estudo', type: 'challenge', creditReward: 2, iconName: 'BookOpen', x: 1500, y: 70, parents: [9], objective: "Gere mais um material de estudo.", triggerType: 'generate_study' },
  { id: 11, title: 'Persistente', type: 'challenge', creditReward: 3, iconName: 'Flame', x: 1500, y: 230, parents: [9], objective: "Fique 10 minutos focado estudando.", timeRequiredMinutes: 10, triggerType: 'time_focused', triggerRequirement: 10 },
  { id: 12, title: 'Quiz Duplo', type: 'quiz', creditReward: 2, iconName: 'Zap', x: 1700, y: 150, parents: [10, 11], objective: "Gere mais um exercício inteligente.", triggerType: 'generate_quiz' },
  { id: 13, title: 'Recompensa Dupla', type: 'reward', creditReward: 5, iconName: 'Gift', x: 1900, y: 150, parents: [12] },
  // Fase 3 — Maratona
  { id: 14, title: 'Maratonista', type: 'challenge', creditReward: 3, iconName: 'Flame', x: 2100, y: 70, parents: [13], objective: "Fique 20 minutos focado estudando.", timeRequiredMinutes: 20, triggerType: 'time_focused', triggerRequirement: 20 },
  { id: 15, title: 'Estudioso', type: 'challenge', creditReward: 2, iconName: 'BookOpen', x: 2100, y: 230, parents: [13], objective: "Gere mais um material de estudo.", triggerType: 'generate_study' },
  { id: 16, title: 'Troféu de Prata', type: 'milestone', creditReward: 5, iconName: 'Trophy', x: 2300, y: 150, parents: [14, 15] },
  // Fase 4 — Especialista
  { id: 17, title: 'Quiz Expert', type: 'quiz', creditReward: 3, iconName: 'Brain', x: 2500, y: 70, parents: [16], objective: "Gere mais um exercício.", triggerType: 'generate_quiz' },
  { id: 18, title: 'Hora Focada', type: 'challenge', creditReward: 4, iconName: 'Flame', x: 2500, y: 230, parents: [16], objective: "Fique 30 minutos focado.", timeRequiredMinutes: 30, triggerType: 'time_focused', triggerRequirement: 30 },
  { id: 19, title: 'Presente Especial', type: 'reward', creditReward: 8, iconName: 'Gift', x: 2700, y: 150, parents: [17, 18] },
  // Fase 5 — Mestre
  { id: 20, title: 'Pesquisador', type: 'challenge', creditReward: 3, iconName: 'Target', x: 2900, y: 70, parents: [19], objective: "Gere mais um estudo completo.", triggerType: 'generate_study' },
  { id: 21, title: 'Incansável', type: 'challenge', creditReward: 5, iconName: 'Flame', x: 2900, y: 230, parents: [19], objective: "Fique 45 minutos focado.", timeRequiredMinutes: 45, triggerType: 'time_focused', triggerRequirement: 45 },
  { id: 22, title: 'Troféu de Ouro', type: 'milestone', creditReward: 8, iconName: 'Trophy', x: 3100, y: 150, parents: [20, 21] },
  // Fase 6 — Lenda
  { id: 23, title: 'Quiz Ninja', type: 'quiz', creditReward: 4, iconName: 'Zap', x: 3300, y: 70, parents: [22], objective: "Gere mais um exercício.", triggerType: 'generate_quiz' },
  { id: 24, title: 'Ultra Focado', type: 'challenge', creditReward: 5, iconName: 'Flame', x: 3300, y: 230, parents: [22], objective: "Fique 60 minutos focado.", timeRequiredMinutes: 60, triggerType: 'time_focused', triggerRequirement: 60 },
  { id: 25, title: 'Estudante 5 Estrelas', type: 'reward', creditReward: 10, iconName: 'Star', x: 3500, y: 150, parents: [23, 24] },
  { id: 26, title: 'Explorador Máximo', type: 'challenge', creditReward: 4, iconName: 'MapPin', x: 3700, y: 70, parents: [25], objective: "Gere mais um material.", triggerType: 'generate_study' },
  { id: 27, title: 'Dedicação Total', type: 'challenge', creditReward: 6, iconName: 'Flame', x: 3700, y: 230, parents: [25], objective: "Fique 90 minutos focado.", timeRequiredMinutes: 90, triggerType: 'time_focused', triggerRequirement: 90 },
  { id: 28, title: 'Troféu Diamante', type: 'milestone', creditReward: 15, iconName: 'Crown', x: 3900, y: 150, parents: [26, 27] },
  { id: 29, title: 'Lenda Suprema', type: 'reward', creditReward: 20, iconName: 'Crown', x: 4100, y: 150, parents: [28], objective: "A conquista final! Parabéns, você é uma lenda!" },
  // Fase 7 — Ascensão
  { id: 30, title: 'Retomada Brilhante', type: 'challenge', creditReward: 4, iconName: 'BookOpen', x: 4300, y: 70, parents: [29], objective: 'Gere mais um conteúdo de estudo para seguir sua jornada.', triggerType: 'generate_study' },
  { id: 31, title: 'Quiz Turbo', type: 'quiz', creditReward: 4, iconName: 'Zap', x: 4300, y: 230, parents: [29], objective: 'Gere mais um exercício para treinar ainda mais.', triggerType: 'generate_quiz' },
  { id: 32, title: 'Foco de Titã', type: 'challenge', creditReward: 6, iconName: 'Flame', x: 4500, y: 150, parents: [30, 31], objective: 'Fique 105 minutos focado estudando.', timeRequiredMinutes: 105, triggerType: 'time_focused', triggerRequirement: 105 },
  { id: 33, title: 'Marco Celestial', type: 'milestone', creditReward: 8, iconName: 'Trophy', x: 4700, y: 150, parents: [32] },
  { id: 34, title: 'Baú Astral', type: 'reward', creditReward: 10, iconName: 'Gift', x: 4900, y: 150, parents: [33], objective: 'Você desbloqueou uma recompensa extra na trilha!' },
  // Fase 8 — Órbita
  { id: 35, title: 'Rota do Conhecimento', type: 'challenge', creditReward: 5, iconName: 'Target', x: 5100, y: 70, parents: [34], objective: 'Gere um novo material completo para avançar.', triggerType: 'generate_study' },
  { id: 36, title: 'Especial Quiz Master', type: 'quiz', creditReward: 5, iconName: 'Brain', x: 5100, y: 230, parents: [34], objective: 'Gere um novo exercício especial.', triggerType: 'generate_quiz' },
  { id: 37, title: 'Sequência Diária Pro', type: 'challenge', creditReward: 7, iconName: 'Flame', x: 5300, y: 150, parents: [35, 36], objective: 'Fique 120 minutos focado estudando.', timeRequiredMinutes: 120, triggerType: 'time_focused', triggerRequirement: 120 },
  { id: 38, title: 'Troféu Galáctico', type: 'milestone', creditReward: 10, iconName: 'Crown', x: 5500, y: 150, parents: [37] },
  { id: 39, title: 'Recompensa Prisma', type: 'reward', creditReward: 12, iconName: 'Star', x: 5700, y: 150, parents: [38], objective: 'Uma recompensa rara para quem mantém o ritmo.' },
  // Fase 9 — Constelação
  { id: 40, title: 'Nova Expedição', type: 'challenge', creditReward: 5, iconName: 'MapPin', x: 5900, y: 70, parents: [39], objective: 'Gere outro conteúdo de estudo e continue explorando.', triggerType: 'generate_study' },
  { id: 41, title: 'Quiz Estelar', type: 'quiz', creditReward: 6, iconName: 'Zap', x: 5900, y: 230, parents: [39], objective: 'Gere mais um exercício avançado.', triggerType: 'generate_quiz' },
  { id: 42, title: 'Mente Inabalável', type: 'challenge', creditReward: 8, iconName: 'Flame', x: 6100, y: 150, parents: [40, 41], objective: 'Fique 135 minutos focado estudando.', timeRequiredMinutes: 135, triggerType: 'time_focused', triggerRequirement: 135 },
  { id: 43, title: 'Pódio Supremo', type: 'milestone', creditReward: 12, iconName: 'Trophy', x: 6300, y: 150, parents: [42] },
  { id: 44, title: 'Tesouro Lendário', type: 'reward', creditReward: 14, iconName: 'Gift', x: 6500, y: 150, parents: [43], objective: 'Você alcançou um prêmio lendário na trilha.' },
  // Fase 10 — Infinito
  { id: 45, title: 'Biblioteca Infinita', type: 'challenge', creditReward: 6, iconName: 'BookOpen', x: 6700, y: 70, parents: [44], objective: 'Gere mais um estudo de alto nível.', triggerType: 'generate_study' },
  { id: 46, title: 'Desafio Final Quiz', type: 'quiz', creditReward: 6, iconName: 'Brain', x: 6700, y: 230, parents: [44], objective: 'Gere o quiz final desta trilha expandida.', triggerType: 'generate_quiz' },
  { id: 47, title: 'Foco do Infinito', type: 'challenge', creditReward: 10, iconName: 'Flame', x: 6900, y: 150, parents: [45, 46], objective: 'Fique 150 minutos focado estudando.', timeRequiredMinutes: 150, triggerType: 'time_focused', triggerRequirement: 150 },
  { id: 48, title: 'Imperador da Trilha', type: 'milestone', creditReward: 15, iconName: 'Crown', x: 7100, y: 150, parents: [47] },
  { id: 49, title: 'Universo Dominado', type: 'reward', creditReward: 25, iconName: 'Crown', x: 7300, y: 150, parents: [48], objective: 'A trilha completa agora é sua. Você dominou todo o mapa!' },
];

const mergeTrailNodes = (storedNodes: TrailNodeDef[]) => {
  const defaultMap = new Map(defaultTrailNodes.map((node) => [node.id, node]));
  const mergedStored = storedNodes.map((node) => ({
    ...defaultMap.get(node.id),
    ...node,
  }));
  const missingDefaults = defaultTrailNodes.filter((node) => !storedNodes.some((stored) => stored.id === node.id));

  return [...mergedStored, ...missingDefaults].sort((a, b) => a.id - b.id);
};

export const useAchievementData = () => {
  const [nodes, setNodes] = useState<TrailNodeDef[]>(defaultTrailNodes);

  const loadNodes = () => {
    const stored = localStorage.getItem('lb_custom_achievements');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as TrailNodeDef[];
        const merged = mergeTrailNodes(parsed);
        setNodes(merged);
        localStorage.setItem('lb_custom_achievements', JSON.stringify(merged));
      } catch (e) {
        console.error("Failed to parse custom achievements", e);
        setNodes(defaultTrailNodes);
      }
      return;
    }

    setNodes(defaultTrailNodes);
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
        }
      } catch (err) {
        const key = `achievements_v2_${user.id}`;
        const stored = JSON.parse(localStorage.getItem(key) || '[]');
        if (!stored.includes(targetNodeId)) {
          stored.push(targetNodeId);
          localStorage.setItem(key, JSON.stringify(stored));
          await addCredits(nodeConf.creditReward);
          toast({ title: "Conquista Desbloqueada! 🏆", description: `Você completou "${nodeConf.title}" e ganhou +${nodeConf.creditReward} créditos!` });
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
