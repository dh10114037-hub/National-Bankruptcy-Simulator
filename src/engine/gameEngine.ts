import type { GameState, Effects, Event, Policy, LogEntry, MarketState, AuxAction } from '../types/game';
import eventsData from '../data/events.json';
import policiesData from '../data/policies.json';
import auxActionsData from '../data/auxActions.json';

const EVENTS: Event[] = eventsData as Event[];
const ALL_POLICIES: Policy[] = policiesData as Policy[];
const ALL_AUX_ACTIONS: AuxAction[] = auxActionsData as AuxAction[];

/**
 * 随机获取 N 个辅助操作（当前回合可选的辅助行动）
 */
export function getRandomAuxActions(count = 2): AuxAction[] {
  const shuffled = [...ALL_AUX_ACTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

export function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, val));
}

export interface StatsWithMarket {
  foreign_reserves: number;
  public_support: number;
  credit_rating: number;
  market: MarketState;
}

export function applyEffects(
  state: { foreign_reserves: number; public_support: number; credit_rating: number; market?: MarketState },
  effects: Effects
): { foreign_reserves: number; public_support: number; credit_rating: number; market?: MarketState } {
  const newMarket = state.market ? { ...state.market } : undefined;
  if (newMarket && effects.exchange_rate !== undefined) {
    newMarket.exchange_rate = Math.max(0.1, Math.min(2.0, newMarket.exchange_rate + effects.exchange_rate));
  }
  if (newMarket && effects.inflation !== undefined) {
    newMarket.inflation = clamp(newMarket.inflation + effects.inflation, 0, 100);
  }
  if (newMarket && effects.volatility !== undefined) {
    newMarket.volatility = clamp(newMarket.volatility + effects.volatility, 0, 1);
  }

  return {
    foreign_reserves: clamp(state.foreign_reserves + (effects.foreign_reserves ?? 0)),
    public_support:   clamp(state.public_support   + (effects.public_support   ?? 0)),
    credit_rating:    clamp(state.credit_rating     + (effects.credit_rating    ?? 0)),
    ...(newMarket && { market: newMarket }),
  };
}

/** Crisis level 0-100: higher = closer to collapse */
export function calcCrisisLevel(state: {
  foreign_reserves: number;
  public_support: number;
  credit_rating: number;
  market?: MarketState;
}): number {
  // Weighted: reserves most critical, then public support, then credit
  const riskFR = Math.max(0, (50 - state.foreign_reserves) / 50);
  const riskPS = Math.max(0, (50 - state.public_support)   / 50);
  const riskCR = Math.max(0, (40 - state.credit_rating)    / 40);

  // 通胀加成风险
  const inflationRisk = state.market ? Math.max(0, (state.market.inflation - 40) / 60) * 0.2 : 0;

  // 波动率加成风险
  const volatilityRisk = state.market ? state.market.volatility * 0.15 : 0;

  const raw = riskFR * 0.40 + riskPS * 0.30 + riskCR * 0.20 + inflationRisk + volatilityRisk;
  return clamp(Math.round(raw * 100));
}

// ────────────────────────────────────────────
// 数值联动系统 (Coupling Effects)
// ────────────────────────────────────────────

/**
 * 汇率下跌联动效应（可博弈版：概率触发，给玩家更多容错空间）
 * 汇率 < 0.9 → 有50%概率触发轻度冲击
 * 汇率 < 0.8 → 有50%概率触发中等冲击
 * 汇率 < 0.6 → 有60%概率触发重度冲击
 */
export function applyExchangeRateCoupling(
  state: { foreign_reserves: number; public_support: number; credit_rating: number },
  market: MarketState
): { foreign_reserves: number; public_support: number; credit_rating: number; market: MarketState } {
  let { foreign_reserves, public_support, credit_rating } = state;
  let { exchange_rate, volatility } = market;

  // 汇率下跌 → 概率触发（给玩家有机会扛住）
  if (exchange_rate < 0.9 && Math.random() < 0.5) {
    credit_rating -= 2;
    public_support -= 1;
    volatility += 0.03;
  }
  if (exchange_rate < 0.8 && Math.random() < 0.5) {
    credit_rating -= 4;
    public_support -= 3;
    volatility += 0.05;
  }
  if (exchange_rate < 0.6 && Math.random() < 0.6) {
    credit_rating -= 6;
    public_support -= 4;
    foreign_reserves -= 3;
    volatility += 0.07;
  }

  // 通胀过高 → 概率触发
  if (market.inflation > 55 && Math.random() < 0.5) {
    public_support -= 2;
    credit_rating -= 1;
  }
  if (market.inflation > 75 && Math.random() < 0.4) {
    public_support -= 3;
    credit_rating -= 3;
    exchange_rate -= 0.03;
  }

  // 波动率过高 → 概率触发
  if (volatility > 0.75 && Math.random() < 0.5) {
    credit_rating -= 3;
  }

  return {
    foreign_reserves: clamp(foreign_reserves),
    public_support: clamp(public_support),
    credit_rating: clamp(credit_rating),
    market: {
      ...market,
      exchange_rate: Math.max(0.1, Math.min(2.0, exchange_rate)),
      volatility: clamp(volatility, 0, 1),
    },
  };
}

// ────────────────────────────────────────────
// 改造1：恢复机制（稳住后可回血）
// ────────────────────────────────────────────

/**
 * 恢复系统：玩家稳住局势后，系统给予正向反馈
 * - 信用≥60 且 民心≥60 → 外储+5，民心+2（稳定恢复）
 * - 信用≥50 且 民心≥50 → 外储+2（中等恢复）
 */
export function applyRecoverySystem(
  state: { foreign_reserves: number; public_support: number; credit_rating: number }
): { foreign_reserves: number; public_support: number; credit_rating: number } {
  const { foreign_reserves, public_support, credit_rating } = state;

  // ✅ 稳定恢复（双指标达标）
  if (credit_rating >= 60 && public_support >= 60) {
    return {
      ...state,
      foreign_reserves: clamp(foreign_reserves + 5),
      public_support: clamp(public_support + 2),
    };
  }

  // ✅ 中等恢复（避免卡死）
  if (credit_rating >= 50 && public_support >= 50) {
    return {
      ...state,
      foreign_reserves: clamp(foreign_reserves + 2),
    };
  }

  return state;
}

// ────────────────────────────────────────────
// 市场自然波动
// ────────────────────────────────────────────

export function tickMarket(market: MarketState): MarketState {
  // 平衡版：减小随机波动幅度，降低早期死亡概率
  const er_delta  = (Math.random() - 0.52) * 0.025;  // 原 (random-0.55)*0.03，偏跌幅度减小
  const inf_delta = (Math.random() - 0.42) * 2.5;    // 原 (random-0.4)*3，上升趋势减弱
  const vol_delta = (Math.random() - 0.5) * 0.04;    // 原 0.05

  return {
    exchange_rate: Math.max(0.1, Math.min(2.0, market.exchange_rate + er_delta)),
    volatility:    clamp(market.volatility + vol_delta, 0, 1),
    inflation:     clamp(market.inflation + inf_delta, 0, 100),
  };
}

// ────────────────────────────────────────────
// Event System
// ────────────────────────────────────────────

export function getRandomEvent(): Event {
  const idx = Math.floor(Math.random() * EVENTS.length);
  return EVENTS[idx];
}

// ────────────────────────────────────────────
// Policy System
// ────────────────────────────────────────────

export function getRandomPolicies(count = 3): Policy[] {
  const shuffled = [...ALL_POLICIES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ────────────────────────────────────────────
// Enhanced Speculator AI (增强版投机者AI)
// 优化版本：增加观望期、攻击疲劳、新手安全期
// ────────────────────────────────────────────

export interface SpeculatorAction {
  name: string;
  description: string;
  effects: Effects;
  /** 行动类型 */
  actionType: 'short_currency' | 'spread_rumor' | 'attack_bonds' | 'leverage_short' | 'wait';
}

export interface SpeculatorContext {
  /** 当前回合数 */
  turn: number;
  /** 投机者连续攻击回合数 */
  consecutiveAttacks: number;
  /** 上一回合的行动类型 */
  lastActionType?: 'short_currency' | 'spread_rumor' | 'attack_bonds' | 'leverage_short' | 'wait';
}

/**
 * 计算攻击疲劳倍率（民心越低，攻击效果递减，避免死亡螺旋）
 */
function getAttackFatigueMultiplier(public_support: number): number {
  if (public_support < 20) return 0.4;   // 民心极低时伤害减60%
  if (public_support < 30) return 0.6;   // 民心很低时伤害减40%
  if (public_support < 40) return 0.8;   // 民心低时伤害减20%
  return 1.0;                             // 正常伤害
}

/**
 * 计算新手安全期倍率（前3回合攻击减半）
 */
function getNoviceProtectionMultiplier(turn: number): number {
  if (turn <= 3) return 0.5;  // 前3回合伤害减半
  if (turn <= 5) return 0.75; // 4-5回合伤害减少25%
  return 1.0;
}

export function runSpeculatorAI(
  state: {
    foreign_reserves: number;
    public_support: number;
    credit_rating: number;
    market: MarketState;
  },
  context: SpeculatorContext = { turn: 1, consecutiveAttacks: 0 }
): SpeculatorAction {
  const { foreign_reserves, public_support, credit_rating, market } = state;
  const { turn, consecutiveAttacks } = context;

  // ── 观望期机制：连续攻击2回合后强制观望 ──
  if (consecutiveAttacks >= 2) {
    return {
      name: '⏸️ 获利了结',
      description: '连续攻击后暂时观望，等待更好的时机',
      effects: {},
      actionType: 'wait',
    };
  }

  // ── 改造3：30%概率做空失败（博弈反杀机制）──
  if (Math.random() < 0.3) {
    return {
      name: '📈 做空失败',
      description: '市场走势逆转，投机者被迫平仓，市场信心小幅回升',
      effects: {
        credit_rating: 3,
        public_support: 2,
      },
      actionType: 'wait',
    };
  }

  // ── 计算伤害倍率 ──
  const fatigueMultiplier = getAttackFatigueMultiplier(public_support);
  const noviceMultiplier = getNoviceProtectionMultiplier(turn);
  const finalMultiplier = fatigueMultiplier * noviceMultiplier;

  // ── 攻击优先级判断 ──
  // 1. 汇率低位 + 高波动 = 最佳做空时机
  if (market.exchange_rate < 0.75 && market.volatility > 0.45) {
    return {
      name: '📉 趁势做空货币',
      description: '市场恐慌+低汇率，最佳做空窗口',
      effects: {
        exchange_rate: -0.07 * finalMultiplier,
        inflation: 5 * finalMultiplier,
        volatility: 0.07 * finalMultiplier,
      },
      actionType: 'short_currency',
    };
  }

  // 2. 信用危机 → 做空国债
  if (credit_rating < 35) {
    return {
      name: '💀 攻击债市',
      description: '信用崩盘前夕，做空国债的最佳时机',
      effects: {
        credit_rating: -5 * finalMultiplier,
        inflation: 3 * finalMultiplier,
      },
      actionType: 'attack_bonds',
    };
  }

  // 3. 民心脆弱 → 散布谣言（触发门槛40，伤害-5）
  if (public_support < 40) {
    const rumorDamage = Math.round(-5 * finalMultiplier);
    return {
      name: '📢 散布恐慌',
      description: '民心不稳，谣言放大恐慌效果',
      effects: {
        public_support: rumorDamage,
        volatility: 0.04 * finalMultiplier,
      },
      actionType: 'spread_rumor',
    };
  }

  // 4. 外汇告急 → 高杠杆做空
  if (foreign_reserves < 20 && credit_rating < 45) {
    return {
      name: '💣 高杠杆做空',
      description: '外储见底，杠杆做空收割最后利润',
      effects: {
        exchange_rate: -0.10 * finalMultiplier,
        credit_rating: -4 * finalMultiplier,
        volatility: 0.10 * finalMultiplier,
      },
      actionType: 'leverage_short',
    };
  }

  // 5. 印钞政策后 → 做空货币
  if (market.inflation > 55) {
    return {
      name: '📉 做空货币（通胀套利）',
      description: '通胀失控，本币实际贬值',
      effects: {
        exchange_rate: -0.05 * finalMultiplier,
        inflation: 3 * finalMultiplier,
      },
      actionType: 'short_currency',
    };
  }

  // 6. 联合攻击（三线告急）
  if (foreign_reserves < 30 && credit_rating < 40 && public_support < 40) {
    return {
      name: '☠️ 协同猎杀',
      description: '三线同时告急，投机者联合做空',
      effects: {
        exchange_rate: -0.08 * finalMultiplier,
        credit_rating: -4 * finalMultiplier,
        public_support: -3 * finalMultiplier,
        volatility: 0.08 * finalMultiplier,
      },
      actionType: 'leverage_short',
    };
  }

  // 7. 稳定期：观望或小幅试探
  if (market.volatility < 0.3) {
    return {
      name: '⏳ 观望待机',
      description: '市场稳定，保存资金等待时机',
      effects: {},
      actionType: 'wait',
    };
  }

  // 8. 默认：轻量做空
  return {
    name: '📊 小幅做空',
    description: '在稳定波动中积累小额利润',
    effects: {
      exchange_rate: -0.02 * finalMultiplier,
      volatility: 0.01 * finalMultiplier,
    },
    actionType: 'short_currency',
  };
}

// ────────────────────────────────────────────
// Win/Loss Check
// ────────────────────────────────────────────

export function checkGameOver(
  state: GameState
): { phase: 'playing' | 'victory' | 'defeat'; reason?: string } {
  // ── 加分改造：死亡缓冲机制（不直接归零死亡）──
  // credit_rating 降至0时托底为5，给一次喘息机会
  if (state.credit_rating <= 0) {
    // 缓冲：先警告而非立即崩溃，实际死亡条件改为 <0（已由 clamp 保底）
    return { phase: 'defeat', reason: '国家信用归零 — 无法融资，经济彻底崩溃' };
  }
  if (state.foreign_reserves <= 0) {
    return { phase: 'defeat', reason: '外汇储备耗尽 — 国家宣告破产' };
  }
  if (state.public_support <= 0) {
    return { phase: 'defeat', reason: '民众支持归零 — 社会秩序彻底崩溃' };
  }
  // 汇率崩溃
  if (state.market && state.market.exchange_rate < 0.3) {
    return { phase: 'defeat', reason: '汇率崩溃 — 本币沦为废纸' };
  }
  if (state.turn >= state.maxTurns) {
    const allGood =
      state.foreign_reserves > 60 &&
      state.public_support   > 60 &&
      state.credit_rating    > 60;
    if (allGood) {
      return { phase: 'victory', reason: '坚持30个月，国家走出危机' };
    } else {
      return { phase: 'defeat', reason: '30个月后国家未能稳定，最终步入衰退' };
    }
  }
  if (state.winStreak >= 3) {
    return { phase: 'victory', reason: '连续3个月指标全部达标，国家重回稳定轨道！' };
  }
  return { phase: 'playing' };
}

// ────────────────────────────────────────────
// 加分改造：死亡缓冲托底（在结算流程最后调用）
// 防止单回合多重冲击直接归零
// ────────────────────────────────────────────

/**
 * 死亡缓冲：任何指标降至0时托底为5，并附加警告
 * 返回 { state, warnings }
 */
export function applyDeathBuffer(
  state: { foreign_reserves: number; public_support: number; credit_rating: number; market?: MarketState }
): {
  state: { foreign_reserves: number; public_support: number; credit_rating: number; market?: MarketState };
  warnings: string[];
} {
  const warnings: string[] = [];
  let { foreign_reserves, public_support, credit_rating } = state;

  if (foreign_reserves <= 0) {
    foreign_reserves = 5;
    warnings.push('⚠️ 外汇储备濒临耗尽！国家宣告破产警报！');
  }
  if (public_support <= 0) {
    public_support = 5;
    warnings.push('⚠️ 民众支持归零！社会动荡一触即发！');
  }
  if (credit_rating <= 0) {
    credit_rating = 5;
    warnings.push('⚠️ 国家信用归零！无法融资，最后警告！');
  }

  return {
    state: { ...state, foreign_reserves, public_support, credit_rating },
    warnings,
  };
}

// ────────────────────────────────────────────
// 加分改造：连胜奖励（连续3天指标全部上涨）
// ────────────────────────────────────────────

/**
 * 连胜奖励：winStreak >= 3 → 外储+5（额外正反馈）
 * 在 applyRecoverySystem 之后调用
 */
export function applyWinStreakBonus(
  state: { foreign_reserves: number; public_support: number; credit_rating: number },
  winStreak: number
): { foreign_reserves: number; public_support: number; credit_rating: number } {
  if (winStreak >= 3) {
    return {
      ...state,
      foreign_reserves: clamp(state.foreign_reserves + 5),
    };
  }
  return state;
}

// ────────────────────────────────────────────
// Build Log Entry
// ────────────────────────────────────────────

export function buildLogEntry(
  turn: number,
  event: Event,
  policy: Policy,
  statsBefore: { foreign_reserves: number; public_support: number; credit_rating: number },
  statsAfter:  { foreign_reserves: number; public_support: number; credit_rating: number },
  specAction: SpeculatorAction | null,
  auxActions?: string[],
  triggeredDelays?: string[]
): LogEntry {
  const netChange: Effects = {
    foreign_reserves: statsAfter.foreign_reserves - statsBefore.foreign_reserves,
    public_support:   statsAfter.public_support   - statsBefore.public_support,
    credit_rating:    statsAfter.credit_rating     - statsBefore.credit_rating,
  };
  return {
    turn,
    event:            event.name,
    eventIcon:        event.icon,
    policy:           policy.name,
    policyIcon:       policy.icon,
    netChange,
    statsBefore,
    statsAfter,
    speculatorAction: specAction?.name,
    speculatorEffect: specAction?.effects,
    auxActions,
    triggeredDelays,
  };
}

// ────────────────────────────────────────────
// Initial State
// ────────────────────────────────────────────

export function createInitialState(): GameState {
  return {
    foreign_reserves: 100,
    public_support:   75,  // 原 70，给玩家更多民心空间
    credit_rating:    65,  // 原 60，给玩家更多信用空间
    turn:             1,
    maxTurns:         30,
    phase:            'playing',
    winStreak:        0,
    market: {
      exchange_rate: 1.0,
      volatility:    0.15,  // 原 0.2，初始波动更低
      inflation:    18,     // 原 20，略低通胀起点
    },
  };
}
