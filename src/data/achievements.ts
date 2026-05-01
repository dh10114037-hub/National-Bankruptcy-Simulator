/**
 * 成就系统 — 数据定义
 *
 * 支持游戏模式：savior / speculator
 *
 * 成就结构：
 * - id: 唯一标识
 * - mode: 所属模式
 * - name: 显示名称
 * - description: 描述
 * - icon: 图标
 * - condition: 触发条件函数
 * - rarity: rare | epic | legendary
 */

export type AchievementMode = 'speculator' | 'savior' | 'versus' | 'all';
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  mode: AchievementMode;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  // 检查是否满足条件（传入当前游戏状态）
  check: (ctx: AchievementContext) => boolean;
}

export interface AchievementContext {
  // 通用
  mode: 'speculator' | 'savior' | 'versus';
  turn: number;
  phase: string;

  // 投机者特有
  spec?: {
    totalValue: number;
    initialCash: number;
    cash: number;
    positionsCount: number;
    intelsBought: number;
    manipulationsTriggered: number;
    manipulationsSucceeded: number;
    largestPnl: number;
    pnlHistory: number[];
    // P1-3: 策略流派
    strategy?: string;
  };

  // 拯救者特有
  savior?: {
    foreign_reserves: number;
    public_support: number;
    credit_rating: number;
    crisisLevel: number;
    crisisHistory: number[];
  };
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string; // ISO 时间
}

export const ACHIEVEMENTS: Achievement[] = [
  // ── 通用 ───────────────────────────────────────────────────
  {
    id: 'first_victory',
    mode: 'all',
    name: '初战告捷',
    description: '首次赢得任何一场游戏',
    icon: '🏆',
    rarity: 'common',
    check: (ctx) => ctx.phase === 'victory' && ctx.turn > 0,
  },
  {
    id: 'survivor_10',
    mode: 'all',
    name: '十回合生存者',
    description: '在任意模式下存活超过10回合',
    icon: '🗿',
    rarity: 'common',
    check: (ctx) => ctx.turn >= 10,
  },
  {
    id: 'survivor_30',
    mode: 'all',
    name: '三十回合坚持',
    description: '在任意模式下存活满30回合',
    icon: '⏳',
    rarity: 'rare',
    check: (ctx) => ctx.turn >= 30,
  },

  // ── 投机者 ─────────────────────────────────────────────────
  {
    id: 'spec_first_profit',
    mode: 'speculator',
    name: '初次收割',
    description: '第一次从交易中获利',
    icon: '💵',
    rarity: 'common',
    check: (ctx) =>
      ctx.spec !== undefined &&
      ctx.spec.pnlHistory.length > 0 &&
      ctx.spec.pnlHistory.some(p => p > 0),
  },
  {
    id: 'spec_millionaire',
    mode: 'speculator',
    name: '百万富翁',
    description: '资产首次突破 ¥1,000,000',
    icon: '💰',
    rarity: 'rare',
    check: (ctx) =>
      ctx.spec !== undefined &&
      ctx.spec.totalValue >= 1_000_000,
  },
  {
    id: 'spec_triple_victory',
    mode: 'speculator',
    name: '三倍收割',
    description: '以3倍收益获胜（资产达 $3,000,000）',
    icon: '🦅',
    rarity: 'legendary',
    check: (ctx) =>
      ctx.phase === 'victory' &&
      ctx.spec !== undefined &&
      ctx.spec.totalValue >= ctx.spec.initialCash * 3,
  },
  {
    id: 'spec_intel_collector',
    mode: 'speculator',
    name: '情报大师',
    description: '累计购买 5 次情报',
    icon: '🕵️',
    rarity: 'rare',
    check: (ctx) =>
      ctx.spec !== undefined &&
      ctx.spec.intelsBought >= 5,
  },
  {
    id: 'spec_manipulator',
    mode: 'speculator',
    name: '操控大师',
    description: '成功操控市场 5 次',
    icon: '⚡',
    rarity: 'epic',
    check: (ctx) =>
      ctx.spec !== undefined &&
      ctx.spec.manipulationsSucceeded >= 5,
  },
  {
    id: 'spec_whale',
    mode: 'speculator',
    name: '大空头',
    description: '单笔交易盈利超过 $500,000',
    icon: '🐋',
    rarity: 'epic',
    check: (ctx) =>
      ctx.spec !== undefined &&
      ctx.spec.largestPnl > 500_000,
  },
  {
    id: 'spec_clean_hands',
    mode: 'speculator',
    name: '干净的手',
    description: '不使用任何操控手段，纯靠交易获胜',
    icon: '🤲',
    rarity: 'epic',
    check: (ctx) =>
      ctx.phase === 'victory' &&
      ctx.spec !== undefined &&
      ctx.spec.manipulationsTriggered === 0 &&
      ctx.spec.totalValue >= ctx.spec.initialCash,
  },
  {
    id: 'spec_multi_position',
    mode: 'speculator',
    name: '组合玩家',
    description: '同时持有 3 笔以上仓位',
    icon: '🎯',
    rarity: 'rare',
    check: (ctx) =>
      ctx.spec !== undefined &&
      ctx.spec.positionsCount >= 3,
  },

  // ── P1-3: 策略流派成就 ──────────────────────
  {
    id: 'spec_macro_hedge',
    mode: 'speculator',
    name: '宏观对冲',
    description: '同时使用多头和空头策略，完美对冲风险',
    icon: '⚖️',
    rarity: 'epic',
    check: (ctx) =>
      ctx.spec !== undefined &&
      ctx.spec.strategy === 'macro_hedge',
  },
  {
    id: 'spec_aggressive',
    mode: 'speculator',
    name: '激进猎手',
    description: '使用高杠杆（≥5倍）做空策略获利',
    icon: '🎯',
    rarity: 'epic',
    check: (ctx) =>
      ctx.spec !== undefined &&
      ctx.spec.strategy === 'aggressive_short',
  },
  {
    id: 'spec_insider',
    mode: 'speculator',
    name: '内幕交易师',
    description: '利用高准确率情报（>80%）成功获利',
    icon: '🕵️',
    rarity: 'rare',
    check: (ctx) =>
      ctx.spec !== undefined &&
      ctx.spec.strategy === 'insider_trade',
  },
  {
    id: 'spec_conservative',
    mode: 'speculator',
    name: '稳健投资者',
    description: '现金占比超过60%的保守策略',
    icon: '🛡️',
    rarity: 'rare',
    check: (ctx) =>
      ctx.spec !== undefined &&
      ctx.spec.strategy === 'conservative',
  },

  // ── 拯救者 ─────────────────────────────────────────────────
  {
    id: 'savior_first_win',
    mode: 'savior',
    name: '国家救星',
    description: '首次拯救国家免于破产',
    icon: '🏛',
    rarity: 'common',
    check: (ctx) => ctx.phase === 'victory' && ctx.mode === 'savior',
  },
  {
    id: 'savior_steady',
    mode: 'savior',
    name: '稳如泰山',
    description: '30回合内危机等级从未超过 50',
    icon: '🛡',
    rarity: 'epic',
    check: (ctx) =>
      ctx.savior !== undefined &&
      ctx.turn >= 30 &&
      Math.max(...ctx.savior.crisisHistory, 0) <= 50,
  },
  {
    id: 'savior_comeback',
    mode: 'savior',
    name: '绝地反击',
    description: '从危机等级 > 70 的绝境中翻盘获胜',
    icon: '🔥',
    rarity: 'legendary',
    check: (ctx) =>
      ctx.phase === 'victory' &&
      ctx.savior !== undefined &&
      ctx.savior.crisisHistory.some(c => c > 70),
  },
];

// ─── rarity 颜色配置 ──────────────────────────────────────────
export const RARITY_COLORS: Record<AchievementRarity, { bg: string; border: string; text: string; label: string }> = {
  common:    { bg: 'bg-gray-50',  border: 'border-gray-200', text: 'text-gray-600', label: '普通' },
  rare:      { bg: 'bg-blue-50',  border: 'border-blue-200', text: 'text-blue-600', label: '稀有' },
  epic:      { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', label: '史诗' },
  legendary: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', label: '传说' },
};
