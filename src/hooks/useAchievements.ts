import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Zap, Flame, Trophy, Brain, Target, Gift, Crown, Star, MapPin } from 'lucide-react';

export const availableIcons = {
  BookOpen, Zap, Flame, Trophy, Brain, Target, Gift, Crown, Star, MapPin,
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
    iconName: rawNode.iconName && rawNode.iconName in availableIcons ? rawNode.iconName : fallback.iconName,
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
      await Promise.all(missingInCloud.map((achievementId) => (supabase.from as any)('user_achievements').insert({ user_id: userId, achievement_id: achievementId }).then(() => null).catch(() => null)));
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
