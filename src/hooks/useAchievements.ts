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
  { id: 1, title: 'Primeiro Passo', description: 'Comece sua jornada gerando seu primeiro material de estudo completo!', type: 'challenge', creditReward: 1, iconName: 'BookOpen', x: 100, y: 150, parents: [], objective: "Gere seu primeiro resumo, mapa mental ou material.", triggerType: 'generate_study' },
  { id: 2, title: 'Quiz Relâmpago', description: 'Teste seus conhecimentos com um exercício gerado pela IA.', type: 'quiz', creditReward: 1, iconName: 'Zap', x: 300, y: 70, parents: [1], objective: "Gere o seu primeiro exercício inteligente.", triggerType: 'generate_quiz' },
  { id: 3, title: 'Estudante Focado', description: 'Prove sua dedicação ficando 5 minutos estudando na plataforma.', type: 'challenge', creditReward: 2, iconName: 'Flame', x: 300, y: 230, parents: [1], objective: "Fique 5 minutos focado estudando.", timeRequiredMinutes: 5, triggerType: 'time_focused', triggerRequirement: 5 },
  { id: 4, title: 'Conquista!', description: 'Primeiro marco alcançado! Você já domina o básico da plataforma.', type: 'milestone', creditReward: 3, iconName: 'Trophy', x: 500, y: 150, parents: [2, 3] },
  { id: 5, title: 'Mestre do Quiz', description: 'Gere mais um exercício e mostre que você é fera em quizzes.', type: 'quiz', creditReward: 1, iconName: 'Brain', x: 700, y: 70, parents: [4], objective: "Gere mais um exercício.", triggerType: 'generate_quiz' },
  { id: 6, title: 'Sequência Fogo', description: 'Mantenha o ritmo gerando mais conteúdo e mantendo a sequência.', type: 'challenge', creditReward: 2, iconName: 'Flame', x: 700, y: 230, parents: [4], objective: "Gere mais um estudo.", triggerType: 'generate_study' },
  { id: 7, title: 'Recompensa', description: 'Parabéns! Você desbloqueou sua primeira grande recompensa de créditos.', type: 'reward', creditReward: 5, iconName: 'Gift', x: 900, y: 150, parents: [5, 6] },
  { id: 8, title: 'Explorador', description: 'Continue explorando novos temas e expandindo seus conhecimentos.', type: 'challenge', creditReward: 1, iconName: 'Target', x: 1100, y: 150, parents: [7], objective: "Gere mais um estudo sobre um tema novo.", triggerType: 'generate_study' },
  { id: 9, title: 'Campeão', description: 'Você é um campeão da Fase 1! Continue para desafios maiores.', type: 'milestone', creditReward: 10, iconName: 'Crown', x: 1300, y: 150, parents: [8] },
  // Fase 2 — Aprofundamento
  { id: 10, title: 'Segundo Estudo', description: 'Aprofunde-se gerando mais um material de estudo completo.', type: 'challenge', creditReward: 2, iconName: 'BookOpen', x: 1500, y: 70, parents: [9], objective: "Gere mais um material de estudo.", triggerType: 'generate_study' },
  { id: 11, title: 'Persistente', description: 'Mostre persistência ficando 10 minutos focado estudando.', type: 'challenge', creditReward: 3, iconName: 'Flame', x: 1500, y: 230, parents: [9], objective: "Fique 10 minutos focado.", timeRequiredMinutes: 10, triggerType: 'time_focused', triggerRequirement: 10 },
  { id: 12, title: 'Quiz Duplo', description: 'Desafie-se com mais exercícios e consolide seu aprendizado.', type: 'quiz', creditReward: 2, iconName: 'Zap', x: 1700, y: 150, parents: [10, 11], objective: "Gere mais um exercício.", triggerType: 'generate_quiz' },
  { id: 13, title: 'Recompensa Dupla', description: 'Créditos extras por completar a Fase 2! Você está evoluindo.', type: 'reward', creditReward: 5, iconName: 'Gift', x: 1900, y: 150, parents: [12] },
  // Fase 3 — Maratona
  { id: 14, title: 'Maratonista', description: 'Encare uma sessão de 20 minutos de estudo focado.', type: 'challenge', creditReward: 3, iconName: 'Flame', x: 2100, y: 70, parents: [13], objective: "Fique 20 minutos focado.", timeRequiredMinutes: 20, triggerType: 'time_focused', triggerRequirement: 20 },
  { id: 15, title: 'Estudioso', description: 'Gere mais um material e continue ampliando sua base de conhecimento.', type: 'challenge', creditReward: 2, iconName: 'BookOpen', x: 2100, y: 230, parents: [13], objective: "Gere mais um material de estudo.", triggerType: 'generate_study' },
  { id: 16, title: 'Troféu de Prata', description: 'Marco de prata! Metade da trilha já foi conquistada.', type: 'milestone', creditReward: 5, iconName: 'Trophy', x: 2300, y: 150, parents: [14, 15] },
  // Fase 4 — Especialista
  { id: 17, title: 'Quiz Expert', description: 'Exercícios cada vez mais difíceis para testar sua evolução.', type: 'quiz', creditReward: 3, iconName: 'Brain', x: 2500, y: 70, parents: [16], objective: "Gere mais um exercício.", triggerType: 'generate_quiz' },
  { id: 18, title: 'Hora Focada', description: 'Meia hora de foco total! Prove que você tem disciplina.', type: 'challenge', creditReward: 4, iconName: 'Flame', x: 2500, y: 230, parents: [16], objective: "Fique 30 minutos focado.", timeRequiredMinutes: 30, triggerType: 'time_focused', triggerRequirement: 30 },
  { id: 19, title: 'Presente Especial', description: 'Uma recompensa especial para quem chegou até aqui!', type: 'reward', creditReward: 8, iconName: 'Gift', x: 2700, y: 150, parents: [17, 18] },
  // Fase 5 — Mestre
  { id: 20, title: 'Pesquisador', description: 'Explore temas avançados gerando conteúdo de alto nível.', type: 'challenge', creditReward: 3, iconName: 'Target', x: 2900, y: 70, parents: [19], objective: "Gere mais um estudo completo.", triggerType: 'generate_study' },
  { id: 21, title: 'Incansável', description: 'Sessão de 45 minutos! Poucos chegam tão longe.', type: 'challenge', creditReward: 5, iconName: 'Flame', x: 2900, y: 230, parents: [19], objective: "Fique 45 minutos focado.", timeRequiredMinutes: 45, triggerType: 'time_focused', triggerRequirement: 45 },
  { id: 22, title: 'Troféu de Ouro', description: 'Troféu de ouro desbloqueado! Você é um verdadeiro mestre.', type: 'milestone', creditReward: 8, iconName: 'Trophy', x: 3100, y: 150, parents: [20, 21] },
  // Fase 6 — Lenda
  { id: 23, title: 'Quiz Ninja', description: 'Velocidade e precisão nos quizzes! Mostre suas habilidades.', type: 'quiz', creditReward: 4, iconName: 'Zap', x: 3300, y: 70, parents: [22], objective: "Gere mais um exercício.", triggerType: 'generate_quiz' },
  { id: 24, title: 'Ultra Focado', description: 'Uma hora inteira de foco! Você está no nível lendário.', type: 'challenge', creditReward: 5, iconName: 'Flame', x: 3300, y: 230, parents: [22], objective: "Fique 60 minutos focado.", timeRequiredMinutes: 60, triggerType: 'time_focused', triggerRequirement: 60 },
  { id: 25, title: 'Estudante 5 Estrelas', description: 'Avaliação máxima! Você é um estudante 5 estrelas.', type: 'reward', creditReward: 10, iconName: 'Star', x: 3500, y: 150, parents: [23, 24] },
  { id: 26, title: 'Explorador Máximo', description: 'Explore ao máximo gerando materiais sobre temas variados.', type: 'challenge', creditReward: 4, iconName: 'MapPin', x: 3700, y: 70, parents: [25], objective: "Gere mais um material.", triggerType: 'generate_study' },
  { id: 27, title: 'Dedicação Total', description: 'Uma hora e meia de dedicação! Pouquíssimos alcançam isso.', type: 'challenge', creditReward: 6, iconName: 'Flame', x: 3700, y: 230, parents: [25], objective: "Fique 90 minutos focado.", timeRequiredMinutes: 90, triggerType: 'time_focused', triggerRequirement: 90 },
  { id: 28, title: 'Troféu Diamante', description: 'O troféu mais raro da trilha principal! Diamante puro.', type: 'milestone', creditReward: 15, iconName: 'Crown', x: 3900, y: 150, parents: [26, 27] },
  { id: 29, title: 'Lenda Suprema', description: 'A conquista suprema da primeira era! Você é uma lenda.', type: 'reward', creditReward: 20, iconName: 'Crown', x: 4100, y: 150, parents: [28], objective: "A conquista final! Parabéns, você é uma lenda!" },
  // Fase 7 — Ascensão
  { id: 30, title: 'Retomada Brilhante', description: 'Nova era, novos desafios! Gere mais conteúdo para ascender.', type: 'challenge', creditReward: 4, iconName: 'BookOpen', x: 4300, y: 70, parents: [29], objective: 'Gere mais um conteúdo de estudo.', triggerType: 'generate_study' },
  { id: 31, title: 'Quiz Turbo', description: 'Exercícios em alta velocidade para aquecer o cérebro.', type: 'quiz', creditReward: 4, iconName: 'Zap', x: 4300, y: 230, parents: [29], objective: 'Gere mais um exercício.', triggerType: 'generate_quiz' },
  { id: 32, title: 'Foco de Titã', description: 'Quase 2 horas de foco! Você tem resistência de titã.', type: 'challenge', creditReward: 6, iconName: 'Flame', x: 4500, y: 150, parents: [30, 31], objective: 'Fique 105 minutos focado.', timeRequiredMinutes: 105, triggerType: 'time_focused', triggerRequirement: 105 },
  { id: 33, title: 'Marco Celestial', description: 'Você transcendeu os limites comuns. Marco celestial atingido!', type: 'milestone', creditReward: 8, iconName: 'Trophy', x: 4700, y: 150, parents: [32] },
  { id: 34, title: 'Baú Astral', description: 'Um baú cheio de créditos caiu dos céus para você!', type: 'reward', creditReward: 10, iconName: 'Gift', x: 4900, y: 150, parents: [33] },
  // Fase 8 — Órbita
  { id: 35, title: 'Rota do Conhecimento', description: 'Trace novas rotas de aprendizado com mais estudos.', type: 'challenge', creditReward: 5, iconName: 'Target', x: 5100, y: 70, parents: [34], objective: 'Gere um novo material completo.', triggerType: 'generate_study' },
  { id: 36, title: 'Especial Quiz Master', description: 'O quiz master voltou! Gere exercícios de nível avançado.', type: 'quiz', creditReward: 5, iconName: 'Brain', x: 5100, y: 230, parents: [34], objective: 'Gere um novo exercício especial.', triggerType: 'generate_quiz' },
  { id: 37, title: 'Sequência Diária Pro', description: 'Duas horas de estudo contínuo! Você é profissional.', type: 'challenge', creditReward: 7, iconName: 'Flame', x: 5300, y: 150, parents: [35, 36], objective: 'Fique 120 minutos focado.', timeRequiredMinutes: 120, triggerType: 'time_focused', triggerRequirement: 120 },
  { id: 38, title: 'Troféu Galáctico', description: 'Conquista galáctica desbloqueada! Você orbita entre os melhores.', type: 'milestone', creditReward: 10, iconName: 'Crown', x: 5500, y: 150, parents: [37] },
  { id: 39, title: 'Recompensa Prisma', description: 'Recompensa rara e multicolorida para os mais dedicados.', type: 'reward', creditReward: 12, iconName: 'Star', x: 5700, y: 150, parents: [38] },
  // Fase 9 — Constelação
  { id: 40, title: 'Nova Expedição', description: 'Embarque em mais uma expedição de conhecimento profundo.', type: 'challenge', creditReward: 5, iconName: 'MapPin', x: 5900, y: 70, parents: [39], objective: 'Gere outro conteúdo de estudo.', triggerType: 'generate_study' },
  { id: 41, title: 'Quiz Estelar', description: 'Exercícios que brilham como estrelas para desafiar sua mente.', type: 'quiz', creditReward: 6, iconName: 'Zap', x: 5900, y: 230, parents: [39], objective: 'Gere mais um exercício avançado.', triggerType: 'generate_quiz' },
  { id: 42, title: 'Mente Inabalável', description: 'Mais de 2 horas de foco. Sua mente é inabalável!', type: 'challenge', creditReward: 8, iconName: 'Flame', x: 6100, y: 150, parents: [40, 41], objective: 'Fique 135 minutos focado.', timeRequiredMinutes: 135, triggerType: 'time_focused', triggerRequirement: 135 },
  { id: 43, title: 'Pódio Supremo', description: 'Você está no pódio dos maiores estudantes da plataforma!', type: 'milestone', creditReward: 12, iconName: 'Trophy', x: 6300, y: 150, parents: [42] },
  { id: 44, title: 'Tesouro Lendário', description: 'Um tesouro raro que poucos desbloqueiam na trilha.', type: 'reward', creditReward: 14, iconName: 'Gift', x: 6500, y: 150, parents: [43] },
  // Fase 10 — Infinito
  { id: 45, title: 'Biblioteca Infinita', description: 'Sua biblioteca de estudos é praticamente infinita!', type: 'challenge', creditReward: 6, iconName: 'BookOpen', x: 6700, y: 70, parents: [44], objective: 'Gere mais um estudo de alto nível.', triggerType: 'generate_study' },
  { id: 46, title: 'Desafio Final Quiz', description: 'O quiz definitivo que separa os bons dos excepcionais.', type: 'quiz', creditReward: 6, iconName: 'Brain', x: 6700, y: 230, parents: [44], objective: 'Gere o quiz final desta trilha.', triggerType: 'generate_quiz' },
  { id: 47, title: 'Foco do Infinito', description: 'Duas horas e meia de foco absoluto. Praticamente sobre-humano!', type: 'challenge', creditReward: 10, iconName: 'Flame', x: 6900, y: 150, parents: [45, 46], objective: 'Fique 150 minutos focado.', timeRequiredMinutes: 150, triggerType: 'time_focused', triggerRequirement: 150 },
  { id: 48, title: 'Imperador da Trilha', description: 'Você é o imperador supremo de toda a trilha de progresso!', type: 'milestone', creditReward: 15, iconName: 'Crown', x: 7100, y: 150, parents: [47] },
  { id: 49, title: 'Universo Dominado', description: 'Você dominou todo o universo do conhecimento. Conquista máxima!', type: 'reward', creditReward: 25, iconName: 'Crown', x: 7300, y: 150, parents: [48], objective: 'A trilha completa agora é sua. Você dominou todo o mapa!' },
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

const getAchievementStorageKey = (userId: string) => `achievements_v2_${userId}`;

const normalizeAchievementIds = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => Number(item)).filter((item) => Number.isFinite(item)))].sort((a, b) => a - b);
};

const readLocalAchievementIds = (userId: string): number[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(getAchievementStorageKey(userId)) || '[]');
    return normalizeAchievementIds(raw);
  } catch {
    return [];
  }
};

const writeLocalAchievementIds = (userId: string, ids: number[]) => {
  const normalized = [...new Set(ids)].sort((a, b) => a - b);
  localStorage.setItem(getAchievementStorageKey(userId), JSON.stringify(normalized));
  window.dispatchEvent(new Event('achievements_changed'));
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
        console.error('Failed to parse custom achievements', e);
        setNodes(defaultTrailNodes);
      }
      return;
    }

    setNodes(defaultTrailNodes);
  };

  useEffect(() => {
    loadNodes();
    const handleUpdate = () => loadNodes();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'lb_custom_achievements') loadNodes();
    };
    window.addEventListener('achievements_updated', handleUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('achievements_updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
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

  const syncCompletedIds = useCallback(async (): Promise<Set<number>> => {
    if (!user) return new Set();

    const localIds = readLocalAchievementIds(user.id);

    try {
      const { data, error } = await (supabase.from as any)('user_achievements')
        .select('achievement_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const cloudIds = normalizeAchievementIds((data || []).map((item: any) => item.achievement_id));
      const merged = normalizeAchievementIds([...cloudIds, ...localIds]);
      writeLocalAchievementIds(user.id, merged);
      return new Set(merged);
    } catch {
      return new Set(localIds);
    }
  }, [user]);

  const checkAndUnlock = useCallback(async (actionType?: string, actionValue?: number, explicitNodeId?: number) => {
    if (!user) return;

    const completed = await syncCompletedIds();
    const queue: number[] = [];
    const queued = new Set<number>();

    const canUnlock = (node: TrailNodeDef) => node.parents.every((parentId) => completed.has(parentId));

    const enqueue = (nodeId: number) => {
      const node = nodes.find((item) => item.id === nodeId);
      if (!node || completed.has(nodeId) || queued.has(nodeId) || !canUnlock(node)) return;
      queued.add(nodeId);
      queue.push(nodeId);
    };

    if (explicitNodeId) {
      enqueue(explicitNodeId);
    } else if (actionType) {
      nodes.forEach((node) => {
        const requirement = node.triggerRequirement || node.timeRequiredMinutes || 0;
        const meetsRequirement = requirement > 0 ? actionValue !== undefined && actionValue >= requirement : true;

        if (node.triggerType === actionType && meetsRequirement) {
          enqueue(node.id);
          return;
        }

        if (actionType === 'time_focused' && !node.triggerType && node.timeRequiredMinutes && actionValue !== undefined && actionValue >= node.timeRequiredMinutes) {
          enqueue(node.id);
          return;
        }

        if (actionType === 'generate_study' && node.id === 1 && !node.triggerType) enqueue(node.id);
        if (actionType === 'generate_quiz' && node.id === 2 && !node.triggerType) enqueue(node.id);
      });
    }

    const queueAutoUnlocks = () => {
      nodes.forEach((node) => {
        if (node.parents.length === 0) return;
        if (node.triggerType && node.triggerType !== 'none') return;
        enqueue(node.id);
      });
    };

    while (queue.length > 0) {
      const targetNodeId = queue.shift()!;
      const nodeConf = nodes.find((node) => node.id === targetNodeId);
      if (!nodeConf || completed.has(targetNodeId)) continue;

      try {
        const { error } = await (supabase.from as any)('user_achievements').insert({ user_id: user.id, achievement_id: targetNodeId });
        if (error && error.code !== '23505') throw error;
      } catch (error) {
        console.warn('Achievement sync fallback to local storage:', error);
      }

      completed.add(targetNodeId);
      writeLocalAchievementIds(user.id, [...completed]);
      await addCredits(nodeConf.creditReward);
      toast({
        title: 'Conquista Desbloqueada! 🏆',
        description: `Você completou "${nodeConf.title}" e ganhou +${nodeConf.creditReward} créditos!`,
      });

      queueAutoUnlocks();
    }
  }, [user, syncCompletedIds, nodes, addCredits, toast]);

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

    const key = `lb_session_minutes_${user.id}`;
    const interval = setInterval(() => {
      const current = parseInt(localStorage.getItem(key) || '0', 10);
      const newVal = current + 1;
      localStorage.setItem(key, String(newVal));
      checkAndUnlockTime(newVal);
    }, 60000);

    const current = parseInt(localStorage.getItem(key) || '0', 10);
    checkAndUnlockTime(current);

    return () => clearInterval(interval);
  }, [user, checkAndUnlockTime]);
};
