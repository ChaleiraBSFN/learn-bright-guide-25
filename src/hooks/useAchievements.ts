import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { useToast } from '@/hooks/use-toast';
import {
  BookOpen, Zap, Flame, Trophy, Brain, Target, Gift, Crown, Star, MapPin,
  Rocket, Heart, Shield, Sword, Gem, Medal, Award, Flag, Mountain, Compass,
  Lightbulb, Puzzle, Clock, Timer, Eye, Headphones, Mic, Pencil, Pen, PenTool,
  GraduationCap, School, Library, FileText, BookMarked, Bookmark, Search,
  MessageCircle, Users, UserCheck, Sparkles, Wand2, Palette, Music, Camera,
  Globe, Map, Navigation, Sunrise, Moon, Sun, CloudLightning, Snowflake,
  TreePine, Leaf, Flower2, Apple, Coffee, Pizza, Candy, IceCream2,
  Dumbbell, Bike, Gamepad2, Dice5, Joystick, CircleDot, Hexagon, Diamond,
  BadgeCheck, BadgeAlert, Infinity, Hash, AtSign, Link, Anchor, Key, Lock,
  Unlock, Bell, Megaphone, PartyPopper, Fingerprint, Cpu, Wifi, Battery, Plug
} from 'lucide-react';

export const availableIcons = {
  BookOpen, Zap, Flame, Trophy, Brain, Target, Gift, Crown, Star, MapPin,
  Rocket, Heart, Shield, Sword, Gem, Medal, Award, Flag, Mountain, Compass,
  Lightbulb, Puzzle, Clock, Timer, Eye, Headphones, Mic, Pencil, Pen, PenTool,
  GraduationCap, School, Library, FileText, BookMarked, Bookmark, Search,
  MessageCircle, Users, UserCheck, Sparkles, Wand2, Palette, Music, Camera,
  Globe, Map, Navigation, Sunrise, Moon, Sun, CloudLightning, Snowflake,
  TreePine, Leaf, Flower2, Apple, Coffee, Pizza, Candy, IceCream2,
  Dumbbell, Bike, Gamepad2, Dice5, Joystick, CircleDot, Hexagon, Diamond,
  BadgeCheck, BadgeAlert, Infinity, Hash, AtSign, Link, Anchor, Key, Lock,
  Unlock, Bell, Megaphone, PartyPopper, Fingerprint, Cpu, Wifi, Battery, Plug,
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

type TrailBlueprint = Omit<TrailNodeDef, 'id' | 'x' | 'y' | 'parents'> & {
  objective: string;
};

const TRAIL_STORAGE_KEY = 'lb_custom_achievements_v2';
const LEGACY_TRAIL_STORAGE_KEY = 'lb_custom_achievements';
const TRAIL_VERSION = 'trail-visual-editor-v2';

const MANUAL_POSITIONS: [number, number][] = [
  [140, 60], [280, 100], [430, 70], [570, 130], [700, 90], [830, 160], [900, 280],
  [820, 380], [680, 430], [530, 390], [380, 450], [240, 410], [130, 490], [100, 620],
  [190, 720], [340, 680], [490, 730], [640, 690], [800, 740], [920, 660], [960, 790],
  [880, 900], [730, 860], [580, 920], [420, 870], [270, 930], [140, 880], [80, 1010],
  [180, 1110], [330, 1060], [490, 1110], [650, 1050], [810, 1100], [940, 1040], [980, 1170],
  [870, 1260], [710, 1220], [550, 1270], [390, 1230], [240, 1290], [120, 1240], [70, 1370],
  [190, 1460], [350, 1420], [520, 1470], [690, 1430], [840, 1490], [720, 1570], [520, 1610],
];

const trailBlueprints: TrailBlueprint[] = [
  { title: 'Primeiro Resumo', type: 'challenge', creditReward: 1, iconName: 'BookOpen', objective: 'Gere seu primeiro conteúdo de estudo para iniciar a trilha.', triggerType: 'generate_study', triggerRequirement: 1 },
  { title: 'Primeiros Exercícios', type: 'quiz', creditReward: 1, iconName: 'Zap', objective: 'Gere sua primeira lista de exercícios para testar o aprendizado.', triggerType: 'generate_quiz', triggerRequirement: 1 },
  { title: 'Foco Inicial', type: 'challenge', creditReward: 2, iconName: 'Flame', objective: 'Permaneça 5 minutos estudando com atenção para liberar o próximo passo.', triggerType: 'time_focused', timeRequiredMinutes: 5, triggerRequirement: 5 },
  { title: 'Revisão de Partida', type: 'challenge', creditReward: 2, iconName: 'Target', objective: 'Gere 2 materiais de estudo para consolidar sua base.', triggerType: 'generate_study', triggerRequirement: 2 },
  { title: 'Treino Duplo', type: 'quiz', creditReward: 2, iconName: 'Brain', objective: 'Crie 2 conjuntos de exercícios para começar a praticar com constância.', triggerType: 'generate_quiz', triggerRequirement: 2 },
  { title: 'Ritmo Constante', type: 'challenge', creditReward: 2, iconName: 'Flame', objective: 'Acumule 10 minutos totais de estudo focado.', triggerType: 'time_focused', timeRequiredMinutes: 10, triggerRequirement: 10 },
  { title: 'Selo Iniciante', type: 'reward', creditReward: 4, iconName: 'Gift', objective: 'Complete a sequência inicial da trilha para resgatar seu primeiro selo.', triggerType: 'none' },
  { title: 'Explorador de Temas', type: 'challenge', creditReward: 2, iconName: 'MapPin', objective: 'Gere 3 estudos para explorar novos assuntos na plataforma.', triggerType: 'generate_study', triggerRequirement: 3 },
  { title: 'Prática Frequente', type: 'quiz', creditReward: 2, iconName: 'Zap', objective: 'Gere 3 listas de exercícios para manter a prática ativa.', triggerType: 'generate_quiz', triggerRequirement: 3 },
  { title: 'Foco de 15 Minutos', type: 'challenge', creditReward: 2, iconName: 'Flame', objective: 'Chegue a 15 minutos acumulados de estudo focado.', triggerType: 'time_focused', timeRequiredMinutes: 15, triggerRequirement: 15 },
  { title: 'Resumo Consistente', type: 'challenge', creditReward: 3, iconName: 'BookOpen', objective: 'Gere 4 conteúdos de estudo completos para avançar.', triggerType: 'generate_study', triggerRequirement: 4 },
  { title: 'Desafio Resolvido', type: 'quiz', creditReward: 3, iconName: 'Brain', objective: 'Crie 4 listas de exercícios e mostre evolução na prática.', triggerType: 'generate_quiz', triggerRequirement: 4 },
  { title: 'Foco de 20 Minutos', type: 'challenge', creditReward: 3, iconName: 'Flame', objective: 'Acumule 20 minutos estudando sem perder o ritmo.', triggerType: 'time_focused', timeRequiredMinutes: 20, triggerRequirement: 20 },
  { title: 'Selo Aprendiz', type: 'milestone', creditReward: 5, iconName: 'Trophy', objective: 'Feche o primeiro ciclo da trilha para ganhar o selo de aprendiz.', triggerType: 'none' },
  { title: 'Plano em Ação', type: 'challenge', creditReward: 3, iconName: 'Target', objective: 'Gere 5 estudos para mostrar consistência no planejamento.', triggerType: 'generate_study', triggerRequirement: 5 },
  { title: 'Quinteto de Exercícios', type: 'quiz', creditReward: 3, iconName: 'Zap', objective: 'Gere 5 listas de exercícios e fortaleça sua rotina.', triggerType: 'generate_quiz', triggerRequirement: 5 },
  { title: 'Meia Hora de Foco', type: 'challenge', creditReward: 4, iconName: 'Flame', objective: 'Acumule 30 minutos totais de estudo concentrado.', triggerType: 'time_focused', timeRequiredMinutes: 30, triggerRequirement: 30 },
  { title: 'Estudo Estruturado', type: 'challenge', creditReward: 4, iconName: 'BookOpen', objective: 'Gere 6 materiais para construir uma base de revisão sólida.', triggerType: 'generate_study', triggerRequirement: 6 },
  { title: 'Prática Inteligente', type: 'quiz', creditReward: 4, iconName: 'Brain', objective: 'Crie 6 listas de exercícios e mantenha o treino em alta.', triggerType: 'generate_quiz', triggerRequirement: 6 },
  { title: 'Foco de 45 Minutos', type: 'challenge', creditReward: 4, iconName: 'Flame', objective: 'Chegue a 45 minutos acumulados de dedicação na plataforma.', triggerType: 'time_focused', timeRequiredMinutes: 45, triggerRequirement: 45 },
  { title: 'Selo Persistente', type: 'reward', creditReward: 6, iconName: 'Gift', objective: 'Complete este bloco da trilha para provar sua persistência.', triggerType: 'none' },
  { title: 'Biblioteca Pessoal', type: 'challenge', creditReward: 4, iconName: 'BookOpen', objective: 'Gere 7 estudos e comece a montar sua própria biblioteca.', triggerType: 'generate_study', triggerRequirement: 7 },
  { title: 'Teste em Série', type: 'quiz', creditReward: 4, iconName: 'Zap', objective: 'Crie 7 listas de exercícios para ampliar sua prática contínua.', triggerType: 'generate_quiz', triggerRequirement: 7 },
  { title: 'Uma Hora de Foco', type: 'challenge', creditReward: 5, iconName: 'Flame', objective: 'Acumule 60 minutos de estudo focado para destravar a próxima etapa.', triggerType: 'time_focused', timeRequiredMinutes: 60, triggerRequirement: 60 },
  { title: 'Estudo Profundo', type: 'challenge', creditReward: 5, iconName: 'Target', objective: 'Gere 8 conteúdos de estudo com profundidade e clareza.', triggerType: 'generate_study', triggerRequirement: 8 },
  { title: 'Resolução Ágil', type: 'quiz', creditReward: 5, iconName: 'Brain', objective: 'Crie 8 listas de exercícios e mantenha respostas rápidas.', triggerType: 'generate_quiz', triggerRequirement: 8 },
  { title: 'Foco de 75 Minutos', type: 'challenge', creditReward: 5, iconName: 'Flame', objective: 'Chegue a 75 minutos acumulados de estudo ativo.', triggerType: 'time_focused', timeRequiredMinutes: 75, triggerRequirement: 75 },
  { title: 'Selo Avançado', type: 'milestone', creditReward: 7, iconName: 'Trophy', objective: 'Conclua a sequência intermediária para receber o selo avançado.', triggerType: 'none' },
  { title: 'Mapa Mental Vivo', type: 'challenge', creditReward: 5, iconName: 'MapPin', objective: 'Gere 9 materiais de estudo e amplie seu repertório mental.', triggerType: 'generate_study', triggerRequirement: 9 },
  { title: 'Desempenho Estável', type: 'quiz', creditReward: 5, iconName: 'Zap', objective: 'Crie 9 conjuntos de exercícios e mantenha um ritmo estável.', triggerType: 'generate_quiz', triggerRequirement: 9 },
  { title: 'Foco de 90 Minutos', type: 'challenge', creditReward: 6, iconName: 'Flame', objective: 'Acumule 90 minutos totais estudando com consistência.', triggerType: 'time_focused', timeRequiredMinutes: 90, triggerRequirement: 90 },
  { title: 'Fonte Confiável', type: 'challenge', creditReward: 6, iconName: 'BookOpen', objective: 'Gere 10 estudos e fortaleça sua base de consulta.', triggerType: 'generate_study', triggerRequirement: 10 },
  { title: 'Exercícios Sem Pausa', type: 'quiz', creditReward: 6, iconName: 'Brain', objective: 'Crie 10 listas de exercícios para manter sua evolução constante.', triggerType: 'generate_quiz', triggerRequirement: 10 },
  { title: 'Duas Horas de Foco', type: 'challenge', creditReward: 6, iconName: 'Flame', objective: 'Chegue a 120 minutos acumulados de estudo concentrado.', triggerType: 'time_focused', timeRequiredMinutes: 120, triggerRequirement: 120 },
  { title: 'Selo Especialista', type: 'reward', creditReward: 8, iconName: 'Gift', objective: 'Finalize este conjunto para receber o selo de especialista.', triggerType: 'none' },
  { title: 'Mestre dos Resumos', type: 'challenge', creditReward: 7, iconName: 'BookOpen', objective: 'Gere 12 conteúdos de estudo e prove domínio na revisão.', triggerType: 'generate_study', triggerRequirement: 12 },
  { title: 'Mestre dos Exercícios', type: 'quiz', creditReward: 7, iconName: 'Zap', objective: 'Crie 12 listas de exercícios e eleve o nível da prática.', triggerType: 'generate_quiz', triggerRequirement: 12 },
  { title: 'Foco de 150 Minutos', type: 'challenge', creditReward: 7, iconName: 'Flame', objective: 'Acumule 150 minutos estudando para manter a chama acesa.', triggerType: 'time_focused', timeRequiredMinutes: 150, triggerRequirement: 150 },
  { title: 'Explicação Clara', type: 'challenge', creditReward: 7, iconName: 'Target', objective: 'Gere 14 estudos bem explicados para avançar com segurança.', triggerType: 'generate_study', triggerRequirement: 14 },
  { title: 'Correção Completa', type: 'quiz', creditReward: 7, iconName: 'Brain', objective: 'Crie 14 listas de exercícios e mantenha a prática completa.', triggerType: 'generate_quiz', triggerRequirement: 14 },
  { title: 'Foco de 180 Minutos', type: 'challenge', creditReward: 8, iconName: 'Flame', objective: 'Chegue a 180 minutos acumulados de estudo real.', triggerType: 'time_focused', timeRequiredMinutes: 180, triggerRequirement: 180 },
  { title: 'Selo Mestre', type: 'milestone', creditReward: 10, iconName: 'Crown', objective: 'Conclua esta etapa para conquistar o selo de mestre.', triggerType: 'none' },
  { title: 'Maratona de Estudos', type: 'challenge', creditReward: 8, iconName: 'BookOpen', objective: 'Gere 16 conteúdos de estudo e consolide uma maratona de aprendizado.', triggerType: 'generate_study', triggerRequirement: 16 },
  { title: 'Coleção de Exercícios', type: 'quiz', creditReward: 8, iconName: 'Zap', objective: 'Crie 16 listas de exercícios e monte uma grande coleção de prática.', triggerType: 'generate_quiz', triggerRequirement: 16 },
  { title: 'Foco de 240 Minutos', type: 'challenge', creditReward: 9, iconName: 'Flame', objective: 'Acumule 240 minutos totais e mantenha uma rotina de alto nível.', triggerType: 'time_focused', timeRequiredMinutes: 240, triggerRequirement: 240 },
  { title: 'Domínio do Conteúdo', type: 'challenge', creditReward: 9, iconName: 'Star', objective: 'Gere 18 materiais de estudo e domine a construção de conteúdo.', triggerType: 'generate_study', triggerRequirement: 18 },
  { title: 'Precisão Total', type: 'quiz', creditReward: 9, iconName: 'Brain', objective: 'Crie 18 listas de exercícios para alcançar precisão máxima na prática.', triggerType: 'generate_quiz', triggerRequirement: 18 },
  { title: 'Foco Supremo', type: 'challenge', creditReward: 10, iconName: 'Flame', objective: 'Acumule 300 minutos de estudo focado e prove resistência total.', triggerType: 'time_focused', timeRequiredMinutes: 300, triggerRequirement: 300 },
  { title: 'Lenda Learn Buddy', type: 'reward', creditReward: 20, iconName: 'Crown', objective: 'Complete todos os desafios da trilha para se tornar uma verdadeira lenda.', triggerType: 'none' },
];

const normalizeIds = (ids: unknown[]) => Array.from(new Set(ids.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))).sort((a, b) => a - b);
const getAchievementStorageKey = (userId: string) => `achievements_v2_${userId}`;

export const sortTrailNodes = (nodes: TrailNodeDef[]) => [...nodes].sort((a, b) => a.id - b.id);

export const createDraftTrailNode = (id: number, x: number, y: number, parentId?: number): TrailNodeDef => ({
  id,
  title: `Novo Desafio ${id}`,
  type: 'challenge',
  creditReward: 1,
  iconName: 'Star',
  x,
  y,
  parents: parentId ? [parentId] : [],
  objective: 'Descreva aqui o que o aluno precisa fazer para concluir este desafio.',
  triggerType: 'none',
  triggerRequirement: 0,
});

const isTrailType = (value: unknown): value is TrailNodeDef['type'] =>
  value === 'challenge' || value === 'quiz' || value === 'milestone' || value === 'reward';

const isTriggerType = (value: unknown): value is TrailNodeDef['triggerType'] =>
  value === 'generate_study' || value === 'generate_quiz' || value === 'quiz_score' || value === 'time_focused' || value === 'none';

const createTrailNodes = (blueprints: TrailBlueprint[]): TrailNodeDef[] => {
  return blueprints.map((node, index) => {
    const pos = MANUAL_POSITIONS[index] || [120 + (index % 5) * 160, 80 + Math.floor(index / 5) * 140];
    return {
      ...node,
      id: index + 1,
      x: pos[0],
      y: pos[1],
      parents: index === 0 ? [] : [index],
    };
  });
};

export const defaultTrailNodes: TrailNodeDef[] = createTrailNodes(trailBlueprints);

const defaultNodeMap = new Map(defaultTrailNodes.map((node) => [node.id, node]));

const sanitizeTrailNode = (rawNode: Partial<TrailNodeDef>, index: number): TrailNodeDef => {
  const fallbackPosition = MANUAL_POSITIONS[index] || [140 + (index % 4) * 180, 100 + Math.floor(index / 4) * 160];
  const fallback = defaultNodeMap.get(Number(rawNode.id)) || createDraftTrailNode(index + 1, fallbackPosition[0], fallbackPosition[1], index > 0 ? index : undefined);
  const safeId = Number(rawNode.id);
  const safeReward = Number(rawNode.creditReward);
  const safeTriggerRequirement = Number(rawNode.triggerRequirement);
  const safeTime = Number(rawNode.timeRequiredMinutes);

  return {
    ...fallback,
    ...rawNode,
    id: Number.isFinite(safeId) && safeId > 0 ? safeId : fallback.id,
    title: rawNode.title?.trim() || fallback.title,
    type: isTrailType(rawNode.type) ? rawNode.type : fallback.type,
    creditReward: Number.isFinite(safeReward) ? Math.max(0, safeReward) : fallback.creditReward,
    iconName: rawNode.iconName && rawNode.iconName in availableIcons ? (rawNode.iconName as IconName) : fallback.iconName,
    x: Number.isFinite(Number(rawNode.x)) ? Number(rawNode.x) : fallback.x,
    y: Number.isFinite(Number(rawNode.y)) ? Number(rawNode.y) : fallback.y,
    parents: normalizeIds(Array.isArray(rawNode.parents) ? rawNode.parents : fallback.parents),
    objective: rawNode.objective?.trim() || fallback.objective,
    triggerType: isTriggerType(rawNode.triggerType) ? rawNode.triggerType : fallback.triggerType,
    triggerRequirement: Number.isFinite(safeTriggerRequirement) ? safeTriggerRequirement : fallback.triggerRequirement,
    timeRequiredMinutes: Number.isFinite(safeTime) ? safeTime : fallback.timeRequiredMinutes,
  };
};

const normalizeStoredNodes = (storedNodes: TrailNodeDef[]) => {
  const sourceNodes = storedNodes.length > 0 ? storedNodes : defaultTrailNodes;
  const uniqueNodes = new Map<number, TrailNodeDef>();

  sourceNodes.forEach((node, index) => {
    const sanitized = sanitizeTrailNode(node, index);
    uniqueNodes.set(sanitized.id, sanitized);
  });

  return sortTrailNodes(Array.from(uniqueNodes.values()));
};

const persistTrailNodes = (nodes: TrailNodeDef[]) => {
  const normalized = normalizeStoredNodes(nodes.length > 0 ? nodes : defaultTrailNodes);
  localStorage.setItem(TRAIL_STORAGE_KEY, JSON.stringify({ version: TRAIL_VERSION, nodes: normalized }));
  localStorage.removeItem(LEGACY_TRAIL_STORAGE_KEY);
  return normalized;
};

const readStoredTrailNodes = () => {
  try {
    const raw = localStorage.getItem(TRAIL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== TRAIL_VERSION || !Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
      return null;
    }
    return normalizeStoredNodes(parsed.nodes);
  } catch {
    return null;
  }
};

const readLocalAchievementIds = (userId: string) => {
  try {
    const raw = localStorage.getItem(getAchievementStorageKey(userId));
    return normalizeIds(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
};

const writeLocalAchievementIds = (userId: string, ids: number[]) => {
  localStorage.setItem(getAchievementStorageKey(userId), JSON.stringify(normalizeIds(ids)));
};

export const loadUserCompletedAchievements = async (userId: string) => {
  const localIds = readLocalAchievementIds(userId);

  try {
    const { data, error } = await (supabase.from as any)('user_achievements').select('achievement_id').eq('user_id', userId);
    if (error) throw error;

    const cloudIds = normalizeIds((data || []).map((row: any) => row.achievement_id));
    const merged = normalizeIds([...cloudIds, ...localIds]);
    writeLocalAchievementIds(userId, merged);

    const missingInCloud = localIds.filter((id) => !cloudIds.includes(id));
    if (missingInCloud.length > 0) {
      await Promise.all(
        missingInCloud.map((achievementId) =>
          (supabase.from as any)('user_achievements')
            .insert({ user_id: userId, achievement_id: achievementId })
            .then(() => null)
            .catch(() => null),
        ),
      );
    }

    return merged;
  } catch {
    return localIds;
  }
};

export const useAchievementData = () => {
  const [nodes, setNodes] = useState<TrailNodeDef[]>(defaultTrailNodes);

  useEffect(() => {
    const loadNodes = () => {
      const stored = readStoredTrailNodes();
      setNodes(stored ?? persistTrailNodes(defaultTrailNodes));
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadNodes();
    };

    loadNodes();
    window.addEventListener('achievements_updated', loadNodes);
    window.addEventListener('storage', loadNodes);
    window.addEventListener('focus', loadNodes);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('achievements_updated', loadNodes);
      window.removeEventListener('storage', loadNodes);
      window.removeEventListener('focus', loadNodes);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const saveNodes = (newNodes: TrailNodeDef[]) => {
    const normalized = persistTrailNodes(newNodes);
    setNodes(normalized);
    window.dispatchEvent(new Event('achievements_updated'));
  };

  return { nodes, saveNodes };
};

export const useAchievements = () => {
  const { user } = useAuth();
  const { addCredits } = useCredits();
  const { toast } = useToast();
  const { nodes } = useAchievementData();

  const getActionProgress = useCallback(async (actionType?: string, actionValue?: number) => {
    if (!user) return 0;
    if (typeof actionValue === 'number') return actionValue;

    if (actionType === 'generate_study') {
      const { count } = await supabase.from('user_history').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('type', 'study');
      return count ?? 0;
    }

    if (actionType === 'generate_quiz') {
      const { count } = await supabase.from('user_history').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('type', 'exercise');
      return count ?? 0;
    }

    return 0;
  }, [user]);

  const checkAndUnlock = useCallback(async (actionType?: string, actionValue?: number, explicitNodeId?: number) => {
    if (!user) return;

    const completedSet = new Set(await loadUserCompletedAchievements(user.id));

    const unlockNode = async (node: TrailNodeDef) => {
      if (completedSet.has(node.id)) return false;
      if (node.parents.length > 0 && !node.parents.every((parentId) => completedSet.has(parentId))) return false;

      try {
        const { error } = await (supabase.from as any)('user_achievements').insert({ user_id: user.id, achievement_id: node.id });
        if (error && error.code !== '23505') throw error;
        if (error?.code === '23505') return false;

        completedSet.add(node.id);
        writeLocalAchievementIds(user.id, [...completedSet]);
        await addCredits(node.creditReward);
        toast({ title: 'Conquista desbloqueada! 🏆', description: `Você completou "${node.title}" e ganhou +${node.creditReward} créditos.` });
        return true;
      } catch {
        const localIds = readLocalAchievementIds(user.id);
        if (localIds.includes(node.id)) return false;
        const merged = normalizeIds([...localIds, node.id]);
        writeLocalAchievementIds(user.id, merged);
        completedSet.add(node.id);
        await addCredits(node.creditReward);
        toast({ title: 'Conquista desbloqueada! 🏆', description: `Você completou "${node.title}" e ganhou +${node.creditReward} créditos.` });
        return true;
      }
    };

    const targetIds: number[] = [];
    if (explicitNodeId) {
      targetIds.push(explicitNodeId);
    } else if (actionType) {
      const progress = await getActionProgress(actionType, actionValue);
      nodes.filter((node) => node.triggerType === actionType).forEach((node) => {
        const requirement = node.triggerRequirement ?? node.timeRequiredMinutes ?? 1;
        if (progress >= requirement) targetIds.push(node.id);
      });
    }

    let changed = false;
    for (const id of normalizeIds(targetIds)) {
      const node = nodes.find((item) => item.id === id);
      if (node) changed = (await unlockNode(node)) || changed;
    }

    let unlockedAuto = true;
    while (unlockedAuto) {
      unlockedAuto = false;
      for (const node of nodes) {
        if (node.triggerType && node.triggerType !== 'none') continue;
        if (completedSet.has(node.id) || node.parents.length === 0) continue;
        if (node.parents.every((parentId) => completedSet.has(parentId))) {
          const unlocked = await unlockNode(node);
          unlockedAuto = unlocked || unlockedAuto;
          changed = unlocked || changed;
        }
      }
    }

    if (changed) {
      window.dispatchEvent(new Event('achievement_unlocked'));
      window.dispatchEvent(new Event('achievements_updated'));
    }
  }, [user, addCredits, toast, nodes, getActionProgress]);

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
      const next = current + 1;
      localStorage.setItem(key, String(next));
      checkAndUnlockTime(next);
    }, 60000);

    const current = parseInt(localStorage.getItem(`lb_session_minutes_${user.id}`) || '0', 10);
    checkAndUnlockTime(current);

    return () => clearInterval(interval);
  }, [user, checkAndUnlockTime]);
};
