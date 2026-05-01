/**
 * P2-2: 成就持久化存储
 * 追踪多周目累计数据
 */

const STORAGE_KEY = 'nation_collapse_stats';

export interface GameStats {
  // 通用统计
  totalGamesPlayed: number;
  totalWins: number;
  totalLosses: number;
  modesPlayed: Record<string, number>;       // 各模式游玩次数
  modesWon: Record<string, number>;           // 各模式胜利次数

  // 拯救者特有
  saviorGames: number;
  saviorWins: number;
  saviorBestTurn: number;           // 最短胜利回合
  saviorBestIndicators: {          // 最佳指标结束状态
    foreign_reserves: number;
    public_support: number;
    credit_rating: number;
  } | null;

  // 投机者特有
  speculatorGames: number;
  speculatorWins: number;
  speculatorBestProfit: number;    // 最高收益
  speculatorBestMultiplier: number; // 最高收益倍率

  // 全能选手
  allModesWon: boolean;

  // 解锁信息
  unlockedAchievements: string[];
}

const DEFAULT_STATS: GameStats = {
  totalGamesPlayed: 0,
  totalWins: 0,
  totalLosses: 0,
  modesPlayed: {},
  modesWon: {},
  saviorGames: 0,
  saviorWins: 0,
  saviorBestTurn: Infinity,
  saviorBestIndicators: null,
  speculatorGames: 0,
  speculatorWins: 0,
  speculatorBestProfit: 0,
  speculatorBestMultiplier: 0,
  allModesWon: false,
  unlockedAchievements: [],
};

export function loadStats(): GameStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATS, ...parsed };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

export function saveStats(stats: GameStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // 忽略存储错误
  }
}

export function updateStatsAfterGame(params: {
  mode: 'savior' | 'speculator' | 'versus';
  phase: 'victory' | 'defeat';
  turn: number;
  // 拯救者特有
  saviorIndicators?: {
    foreign_reserves: number;
    public_support: number;
    credit_rating: number;
  };
  // 投机者特有
  specProfit?: number;
  specInitialCash?: number;
}): GameStats {
  const stats = loadStats();

  // 通用统计
  stats.totalGamesPlayed += 1;
  if (params.phase === 'victory') {
    stats.totalWins += 1;
  } else {
    stats.totalLosses += 1;
  }

  // 模式统计
  stats.modesPlayed[params.mode] = (stats.modesPlayed[params.mode] || 0) + 1;
  if (params.phase === 'victory') {
    stats.modesWon[params.mode] = (stats.modesWon[params.mode] || 0) + 1;
  }

  // 拯救者统计
  if (params.mode === 'savior') {
    stats.saviorGames += 1;
    if (params.phase === 'victory') {
      stats.saviorWins += 1;
      if (params.turn < stats.saviorBestTurn) {
        stats.saviorBestTurn = params.turn;
      }
      if (params.saviorIndicators) {
        if (!stats.saviorBestIndicators ||
            params.saviorIndicators.foreign_reserves > stats.saviorBestIndicators.foreign_reserves) {
          stats.saviorBestIndicators = params.saviorIndicators;
        }
      }
    }
  }

  // 投机者统计
  if (params.mode === 'speculator' && params.specProfit !== undefined) {
    stats.speculatorGames += 1;
    if (params.phase === 'victory') {
      stats.speculatorWins += 1;
      if (params.specProfit > stats.speculatorBestProfit) {
        stats.speculatorBestProfit = params.specProfit;
      }
      if (params.specInitialCash && params.specProfit > 0) {
        const multiplier = (params.specProfit + (params.specInitialCash)) / params.specInitialCash;
        if (multiplier > stats.speculatorBestMultiplier) {
          stats.speculatorBestMultiplier = multiplier;
        }
      }
    }
  }

  // 全能选手检查
  const allModes: Array<'savior' | 'speculator' | 'versus'> = ['savior', 'speculator', 'versus'];
  stats.allModesWon = allModes.every(m => (stats.modesWon[m] || 0) > 0);

  saveStats(stats);
  return stats;
}

export function markAchievementUnlocked(achievementId: string): void {
  const stats = loadStats();
  if (!stats.unlockedAchievements.includes(achievementId)) {
    stats.unlockedAchievements.push(achievementId);
    saveStats(stats);
  }
}

export function isAchievementUnlocked(achievementId: string): boolean {
  const stats = loadStats();
  return stats.unlockedAchievements.includes(achievementId);
}

// 动态检查成就条件
export function checkDynamicAchievements(stats: GameStats): string[] {
  const newUnlocked: string[] = [];

  // 全能选手
  if (stats.allModesWon && !isAchievementUnlocked('ng_all_modes')) {
    newUnlocked.push('ng_all_modes');
  }

  // 胜利计数
  if (stats.totalWins >= 10 && !isAchievementUnlocked('ng_10_wins')) {
    newUnlocked.push('ng_10_wins');
  }
  if (stats.totalWins >= 50 && !isAchievementUnlocked('ng_50_wins')) {
    newUnlocked.push('ng_50_wins');
  }

  // 拯救者胜利计数
  if (stats.saviorWins >= 5 && !isAchievementUnlocked('ng_savior_5_wins')) {
    newUnlocked.push('ng_savior_5_wins');
  }

  // 投机者胜利计数
  if (stats.speculatorWins >= 5 && !isAchievementUnlocked('ng_spec_5_wins')) {
    newUnlocked.push('ng_spec_5_wins');
  }

  // 标记新解锁的成就
  newUnlocked.forEach(id => markAchievementUnlocked(id));

  return newUnlocked;
}

// 重置统计（用于测试或用户手动重置）
export function resetStats(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 忽略
  }
}