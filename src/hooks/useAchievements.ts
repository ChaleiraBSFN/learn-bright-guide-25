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
  description?: string;
  timeRequiredMinutes?: number;
  triggerType?: 'generate_study' | 'generate_quiz' | 'quiz_score' | 'time_focused' | 'none';
  triggerRequirement?: number;
}

export const defaultTrailNodes: TrailNodeDef[] = [
  { id: 1, title: 'Primeiro Passo', type: 'challenge', creditReward: 1, iconName: 'BookOpen', x: 100, y: 150, parents: [], objective: "Gere seu primeiro resumo, mapa mental ou material (Ação: Gerar Estudo).", description: "O comecinho de uma grande jornada! Gere seu primeiro material de estudo via inteligência artificial para destravar essa recompensa.", triggerType: 'generate_study' },
  { id: 2, title: 'Quiz Relâmpago', type: 'quiz', creditReward: 1, iconName: 'Zap', x: 300, y: 70, parents: [1], objective: "Gere o seu primeiro exercício inteligente (Ação: Gerar Exercício).", description: "Coloque seu cérebro à prova. Complete seu primeiro Quiz gerado via IA e receba os espólios da vitória rápida.", triggerType: 'generate_quiz' },
  { id: 3, title: 'Estudante Focado', type: 'challenge', creditReward: 2, iconName: 'Flame', x: 300, y: 230, parents: [1], objective: "Fique 5 minutos focado estudando pela plataforma.", description: "Mantenha o foco! 5 minutos de uso consecutivo na plataforma provam que você veio para alcançar fluência.", timeRequiredMinutes: 5, triggerType: 'time_focused', triggerRequirement: 5 },
  { id: 4, title: 'Conquista!', type: 'milestone', creditReward: 3, iconName: 'Trophy', x: 500, y: 150, parents: [2, 3], description: "Você completou as tarefas iniciais! Use seus novos créditos para aprender ainda mais coisas legais." },
  { id: 5, title: 'Mestre do Quiz', type: 'quiz', creditReward: 1, iconName: 'Brain', x: 700, y: 70, parents: [4], description: "Os quizzes não são mais surpresas para você. Este desafio mostrará suas habilidades analíticas contínuas." },
  { id: 6, title: 'Sequência Fogo', type: 'challenge', creditReward: 2, iconName: 'Flame', x: 700, y: 230, parents: [4], description: "A consistência é chave! Sua chama do aprendizado está ardendo e você está na sua melhor sequência." },
  { id: 7, title: 'Recompensa', type: 'reward', creditReward: 5, iconName: 'Gift', x: 900, y: 150, parents: [5, 6], description: "Um baú de recompensas por seus esforços ininterruptos. Desfrute destes créditos bônus para aprimorar as próximas etapas." },
  { id: 8, title: 'Explorador', type: 'challenge', creditReward: 1, iconName: 'Target', x: 1100, y: 150, parents: [7], description: "Você navegou por territórios inexplorados do aprendizado. Desafio concedido aos que vão além do básico." },
  { id: 9, title: 'Campeão', type: 'milestone', creditReward: 10, iconName: 'Crown', x: 1300, y: 150, parents: [8], description: "O troféu dourado do nosso mapa! Uma lenda da plataforma Learn Buddy. Seus resultados te colocam no topo do mundo educacional!" },
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
    
    // Respeitar as configurações da plataforma
    try {
      const storedSettings = localStorage.getItem('lb_platform_settings');
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        if (parsed.trailEnabled === false) return;
      }
    } catch(e) {}

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
