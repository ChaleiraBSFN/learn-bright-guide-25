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
}

export const defaultTrailNodes: TrailNodeDef[] = [
  { id: 1, title: 'Primeiro Passo', type: 'challenge', creditReward: 1, iconName: 'BookOpen', x: 100, y: 150, parents: [], objective: "Gere seu primeiro resumo, mapa mental ou material (Ação: Gerar Estudo)." },
  { id: 2, title: 'Quiz Relâmpago', type: 'quiz', creditReward: 1, iconName: 'Zap', x: 300, y: 70, parents: [1], objective: "Gere o seu primeiro exercício inteligente (Ação: Gerar Exercício)." },
  { id: 3, title: 'Estudante Focado', type: 'challenge', creditReward: 2, iconName: 'Flame', x: 300, y: 230, parents: [1], objective: "Fique 5 minutos focado estudando pela plataforma.", timeRequiredMinutes: 5 },
  { id: 4, title: 'Conquista!', type: 'milestone', creditReward: 3, iconName: 'Trophy', x: 500, y: 150, parents: [2, 3] },
  { id: 5, title: 'Mestre do Quiz', type: 'quiz', creditReward: 1, iconName: 'Brain', x: 700, y: 70, parents: [4] },
  { id: 6, title: 'Sequência Fogo', type: 'challenge', creditReward: 2, iconName: 'Flame', x: 700, y: 230, parents: [4] },
  { id: 7, title: 'Recompensa', type: 'reward', creditReward: 5, iconName: 'Gift', x: 900, y: 150, parents: [5, 6] },
  { id: 8, title: 'Explorador', type: 'challenge', creditReward: 1, iconName: 'Target', x: 1100, y: 150, parents: [7] },
  { id: 9, title: 'Campeão', type: 'milestone', creditReward: 10, iconName: 'Crown', x: 1300, y: 150, parents: [8] },
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

  const checkAndUnlock = useCallback(async (actionType?: string, explicitNodeId?: number) => {
    if (!user) return;

    let targetNodeId: number | null = null;
    if (actionType === 'generate_study') targetNodeId = 1;
    else if (actionType === 'generate_quiz') targetNodeId = 2;
    else if (explicitNodeId) targetNodeId = explicitNodeId;

    if (!targetNodeId) return;

    const nodeConf = nodes.find(n => n.id === targetNodeId);
    if (!nodeConf) return;

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
  }, [user, addCredits, toast, nodes]);

  const checkAndUnlockTime = useCallback(async (totalMinutes: number) => {
    if (!user) return;
    const timeNodes = nodes.filter(n => n.timeRequiredMinutes && n.timeRequiredMinutes > 0 && n.timeRequiredMinutes <= totalMinutes);
    if (timeNodes.length === 0) return;
    
    const key = `achievements_v2_${user.id}`;
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    
    for (const node of timeNodes) {
      if (!stored.includes(node.id)) {
        await checkAndUnlock(undefined, node.id);
      }
    }
  }, [user, nodes, checkAndUnlock]);

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
