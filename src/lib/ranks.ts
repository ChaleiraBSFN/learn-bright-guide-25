// Rank tier system inspired by competitive games
// Each rank has 3 sub-tiers (I, II, III) except the top two (Elite, Lenda, Surreal)

export interface RankTier {
  key: string;
  name: string; // i18n key
  minAchievements: number;
  color: string; // tailwind gradient
  textColor: string;
  bgColor: string;
  borderColor: string;
  emoji: string;
  subTier?: number; // 1, 2, 3
}

const RANK_DEFINITIONS: { key: string; name: string; color: string; textColor: string; bgColor: string; borderColor: string; emoji: string; thresholds: [number, number, number] }[] = [
  { key: 'bronze', name: 'ranks.bronze', color: 'from-orange-700 to-orange-500', textColor: 'text-orange-500 font-bold drop-shadow-[0_0_6px_rgba(249,115,22,0.6)]', bgColor: 'bg-orange-500/15', borderColor: 'border-orange-500/40', emoji: '🥉', thresholds: [0, 3, 6] },
  { key: 'silver', name: 'ranks.silver', color: 'from-zinc-400 to-zinc-300', textColor: 'text-slate-300 font-bold drop-shadow-[0_0_6px_rgba(203,213,225,0.6)]', bgColor: 'bg-zinc-400/15', borderColor: 'border-zinc-400/40', emoji: '🥈', thresholds: [9, 12, 15] },
  { key: 'gold', name: 'ranks.gold', color: 'from-yellow-500 to-amber-400', textColor: 'text-yellow-400 font-bold drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]', bgColor: 'bg-yellow-500/15', borderColor: 'border-yellow-500/40', emoji: '🏆', thresholds: [18, 21, 24] },
  { key: 'platinum', name: 'ranks.platinum', color: 'from-cyan-400 to-teal-300', textColor: 'text-cyan-400 font-bold drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]', bgColor: 'bg-cyan-400/15', borderColor: 'border-cyan-400/40', emoji: '💎', thresholds: [27, 30, 33] },
  { key: 'diamond', name: 'ranks.diamond', color: 'from-blue-400 to-indigo-400', textColor: 'text-blue-400 font-bold drop-shadow-[0_0_6px_rgba(96,165,250,0.6)]', bgColor: 'bg-blue-400/15', borderColor: 'border-blue-400/40', emoji: '💠', thresholds: [36, 39, 42] },
  { key: 'elite', name: 'ranks.elite', color: 'from-emerald-400 to-green-500', textColor: 'text-emerald-400 font-bold drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]', bgColor: 'bg-emerald-400/15', borderColor: 'border-emerald-400/40', emoji: '⚡', thresholds: [44, -1, -1] },
  { key: 'legend', name: 'ranks.legend', color: 'from-red-500 to-orange-500', textColor: 'text-red-500 font-bold drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]', bgColor: 'bg-red-500/15', borderColor: 'border-red-500/40', emoji: '🔥', thresholds: [46, -1, -1] },
  { key: 'surreal', name: 'ranks.surreal', color: 'from-purple-500 to-pink-500', textColor: 'text-purple-400 font-bold drop-shadow-[0_0_10px_rgba(192,132,252,0.8)]', bgColor: 'bg-purple-400/15', borderColor: 'border-purple-400/40', emoji: '👑', thresholds: [49, -1, -1] },
];

// Build all rank tiers in order
export const ALL_RANK_TIERS: RankTier[] = [];

RANK_DEFINITIONS.forEach((def) => {
  def.thresholds.forEach((threshold, idx) => {
    if (threshold < 0) return;
    ALL_RANK_TIERS.push({
      key: def.key,
      name: def.name,
      minAchievements: threshold,
      color: def.color,
      textColor: def.textColor,
      bgColor: def.bgColor,
      borderColor: def.borderColor,
      emoji: def.emoji,
      subTier: idx + 1,
    });
  });
});

// Sort by minAchievements ascending
ALL_RANK_TIERS.sort((a, b) => a.minAchievements - b.minAchievements);

export const getRankForAchievements = (achievementCount: number): RankTier => {
  let rank = ALL_RANK_TIERS[0];
  for (const tier of ALL_RANK_TIERS) {
    if (achievementCount >= tier.minAchievements) {
      rank = tier;
    } else {
      break;
    }
  }
  return rank;
};

export const getNextRank = (currentRank: RankTier): RankTier | null => {
  const idx = ALL_RANK_TIERS.indexOf(currentRank);
  if (idx < 0 || idx >= ALL_RANK_TIERS.length - 1) return null;
  return ALL_RANK_TIERS[idx + 1];
};

export const getRankDisplayName = (rank: RankTier, t: (key: string) => string): string => {
  const baseName = t(rank.name);
  // For ranks with sub-tiers, show Roman numeral
  const hasSubTiers = ALL_RANK_TIERS.filter(r => r.key === rank.key).length > 1;
  if (!hasSubTiers || !rank.subTier) return baseName;
  const roman = ['I', 'II', 'III'][rank.subTier - 1];
  return `${baseName} ${roman}`;
};

// Get which rank a trail node index roughly corresponds to
export const getRankForNodeIndex = (nodeIndex: number, totalNodes: number): RankTier => {
  return getRankForAchievements(nodeIndex);
};

export const isTopRank = (rank: RankTier): boolean => {
  return rank.key === 'surreal';
};
