/**
 * 双人对抗引擎
 * 严格按照「5阶段状态机」执行：
 * intel → spec_action → savior_action → settlement → feedback → (loop / game_over)
 */

import type {
  VersusGameState,
  VersusCountry,
  SpecAction,
  SaviorAction,
  VersusIntel,
  VersusLogEntry,
  VersusResult,
} from '../types/versus';
import type { Policy, Event, Effects } from '../types/game';
import eventsData    from '../data/events.json';
import policiesData  from '../data/policies.json';
import { clamp } from './gameEngine';

const ALL_EVENTS:   Event[]  = eventsData   as Event[];
const ALL_POLICIES: Policy[] = policiesData as Policy[];

// ────────────────────────────────────────────────────────────────
// 常量
// ────────────────────────────────────────────────────────────────
const INITIAL_CASH     = 1_000_000;
const VICTORY_RATIO    = 3.0;   // 投机者：初始资金 × 3
const SHORT_MULTIPLIER = 0.12;  // 做空货币：每 10 万 → 汇率 -0.12, 外储 -8
const RUMOR_COST       = 50_000;
const ATTACK_COST      = 120_000;

// ────────────────────────────────────────────────────────────────
// 情报池（固定 + 随机生成）
// ────────────────────────────────────────────────────────────────
const INTEL_TEMPLATES = [
  { content: '政府内部讨论提高税收，概率约70%',        truth: true,  confidence: 0.7 },
  { content: '财政部将向IMF申请援助',                   truth: true,  confidence: 0.6 },
  { content: '央行考虑大规模增发货币',                  truth: false, confidence: 0.5 },
  { content: '民间抗议活动即将扩大',                    truth: true,  confidence: 0.8 },
  { content: '外资机构正在撤离本国债市',               truth: true,  confidence: 0.65 },
  { content: '政府准备宣布货币汇率管制',               truth: false, confidence: 0.4 },
];

function generateIntels(): VersusIntel[] {
  const shuffled = [...INTEL_TEMPLATES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map((t, i) => ({
    id:         `intel_${Date.now()}_${i}`,
    content:    t.content,
    confidence: t.confidence + (Math.random() - 0.5) * 0.2,
    truth:      t.truth,
    purchased:  false,
    bribed:     false,
  }));
}

// ────────────────────────────────────────────────────────────────
// 初始化
// ────────────────────────────────────────────────────────────────
export function createVersusState(): VersusGameState {
  return {
    turn:     1,
    maxTurns: 30,
    phase:    'intel',

    country: {
      foreign_reserves: 60,
      public_support:   70,
      credit_rating:    55,
      inflation:        20,
    },
    market: {
      exchange_rate: 1.0,
      bond_price:    0.8,
      volatility:    0.3,
    },

    intels:             generateIntels(),
    available_policies: getRandomPolicies(3),
    spec_actions:       [],
    savior_action:      null,

    spec_assets: {
      cash:        INITIAL_CASH,
      positions:   [],
      total_value: INITIAL_CASH,
    },

    manip_cooldown: {},

    current_event: getRandomEvent(),
    log:           [],

    last_country_delta: null,
    last_spec_pnl:      0,
    settlement_news:    [],

    winner:  null,
    result:  null,

    advisor_tip:   null,
    initial_cash:  INITIAL_CASH,
  };
}

function getRandomEvent(): Event {
  return ALL_EVENTS[Math.floor(Math.random() * ALL_EVENTS.length)];
}

function getRandomPolicies(n = 3): Policy[] {
  return [...ALL_POLICIES].sort(() => Math.random() - 0.5).slice(0, n);
}

// ────────────────────────────────────────────────────────────────
// Phase 1 → 情报购买
// ────────────────────────────────────────────────────────────────
export function buyIntelVersus(state: VersusGameState, intelId: string): VersusGameState {
  const cost = 50_000;
  if (state.spec_assets.cash < cost) return state;
  return {
    ...state,
    spec_assets: {
      ...state.spec_assets,
      cash: state.spec_assets.cash - cost,
      total_value: state.spec_assets.total_value - cost,
    },
    intels: state.intels.map((i) =>
      i.id === intelId ? { ...i, purchased: true } : i
    ),
  };
}

export function bribeIntelVersus(state: VersusGameState, intelId: string): VersusGameState {
  const cost = 80_000;
  if (state.spec_assets.cash < cost) return state;
  return {
    ...state,
    spec_assets: {
      ...state.spec_assets,
      cash: state.spec_assets.cash - cost,
      total_value: state.spec_assets.total_value - cost,
    },
    intels: state.intels.map((i) =>
      i.id === intelId ? { ...i, bribed: true, confidence: Math.min(1, i.confidence + 0.25) } : i
    ),
  };
}

// ────────────────────────────────────────────────────────────────
// Phase 1 完成 → 进入 Phase 2
// ────────────────────────────────────────────────────────────────
export function confirmIntelPhase(state: VersusGameState): VersusGameState {
  return { ...state, phase: 'spec_action' };
}

// ────────────────────────────────────────────────────────────────
// Phase 2 → 投机者加入行动队列
// ────────────────────────────────────────────────────────────────
export function addSpecAction(state: VersusGameState, action: SpecAction): VersusGameState {
  // 检查余额（大致检查）
  const cost = action.amount;
  if (state.spec_assets.cash < cost) return state;

  return {
    ...state,
    spec_assets: {
      ...state.spec_assets,
      cash: state.spec_assets.cash - cost,
      total_value: state.spec_assets.total_value - cost,
    },
    spec_actions: [...state.spec_actions, action],
  };
}

export function removeSpecAction(state: VersusGameState, idx: number): VersusGameState {
  const removed = state.spec_actions[idx];
  if (!removed) return state;
  return {
    ...state,
    spec_assets: {
      ...state.spec_assets,
      cash: state.spec_assets.cash + removed.amount,
      total_value: state.spec_assets.total_value + removed.amount,
    },
    spec_actions: state.spec_actions.filter((_, i) => i !== idx),
  };
}

// Phase 2 完成 → 进入 Phase 3
export function confirmSpecPhase(state: VersusGameState): VersusGameState {
  return { ...state, phase: 'savior_action' };
}

// ────────────────────────────────────────────────────────────────
// Phase 3 → 拯救者选政策
// ────────────────────────────────────────────────────────────────
export function chooseSaviorPolicy(state: VersusGameState, action: SaviorAction): VersusGameState {
  return {
    ...state,
    savior_action: action,
    phase: 'settlement',
  };
}

// ────────────────────────────────────────────────────────────────
// Phase 4 → 市场结算（核心引擎）
// 执行顺序：投机者 → 政府政策 → 随机事件 → 联动触发
// ────────────────────────────────────────────────────────────────
export function runSettlement(state: VersusGameState): VersusGameState {
  let country = { ...state.country };
  let market  = { ...state.market };
  let cash    = state.spec_assets.cash;
  let positions = [...state.spec_assets.positions];
  const news: string[] = [];
  let specPnl = 0;

  // ── 1. 执行投机者行动 ──────────────────────────
  for (const action of state.spec_actions) {
    if (action.type === 'short_currency') {
      const impact = (action.amount / 100_000) * SHORT_MULTIPLIER;
      market.exchange_rate  = Math.max(0.3, market.exchange_rate  - impact * 0.08);
      market.volatility     = Math.min(1, market.volatility       + impact * 0.05);
      country.foreign_reserves = clamp(country.foreign_reserves   - impact * 6);
      news.push(`投机者做空货币（$${fmtMoney(action.amount)}），汇率暴跌 -${(impact * 0.08).toFixed(2)}`);

      // 做空盈利：汇率跌，做空方赚
      const pnl = action.amount * impact * (action.leverage ?? 1) * 0.6;
      cash += pnl;
      specPnl += pnl;
      positions.push({
        id:      `pos_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type:    'short_currency',
        label:   '做空货币',
        amount:  action.amount,
        leverage: action.leverage ?? 1,
        pnl,
        pnl_pct: (pnl / action.amount) * 100,
      });
    }

    if (action.type === 'buy_bonds') {
      // 买债：国债下跌时赚，价格涨时亏
      const bondDelta = (Math.random() - 0.5) * 0.1;
      market.bond_price = clamp(market.bond_price + bondDelta, 0, 1);
      const pnl = action.amount * bondDelta * (action.leverage ?? 1) * 2;
      cash += pnl;
      specPnl += pnl;
      news.push(`投机者买入国债（$${fmtMoney(action.amount)}），国债${bondDelta > 0 ? '上涨' : '下跌'}`);
      positions.push({
        id:      `pos_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type:    'buy_bonds',
        label:   '国债',
        amount:  action.amount,
        leverage: action.leverage ?? 1,
        pnl,
        pnl_pct: (pnl / action.amount) * 100,
      });
    }

    if (action.type === 'spread_rumor') {
      // 散布谣言：降低民心 + 信用，有一定失败概率
      if (Math.random() > 0.3) {
        country.public_support = clamp(country.public_support - 8);
        country.credit_rating  = clamp(country.credit_rating  - 5);
        news.push('投机者散布谣言，民众恐慌加剧');
        cash += RUMOR_COST * 0.5; // 谣言本身不直接获利，以负面影响获利
        specPnl += RUMOR_COST * 0.5;
      } else {
        news.push('投机者散布谣言，但被及时辟谣');
      }
    }

    if (action.type === 'attack_market') {
      // 全面攻击：多项指标下降
      country.foreign_reserves = clamp(country.foreign_reserves - 12);
      country.credit_rating    = clamp(country.credit_rating    - 8);
      market.volatility        = Math.min(1, market.volatility  + 0.1);
      const pnl = ATTACK_COST * 0.8 * (action.leverage ?? 1);
      cash += pnl;
      specPnl += pnl;
      news.push('投机者发动全面市场攻击！');
      positions.push({
        id:      `pos_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type:    'attack_market',
        label:   '全面攻击',
        amount:  action.amount,
        leverage: action.leverage ?? 1,
        pnl,
        pnl_pct: (pnl / action.amount) * 100,
      });
    }
  }

  // ── 2. 执行政府政策 ──────────────────────────
  const policy = ALL_POLICIES.find((p) => p.id === state.savior_action?.policy_id);
  if (policy) {
    const fx = policy.effects;
    country.foreign_reserves = clamp(country.foreign_reserves + (fx.foreign_reserves ?? 0));
    country.public_support   = clamp(country.public_support   + (fx.public_support   ?? 0));
    country.credit_rating    = clamp(country.credit_rating    + (fx.credit_rating    ?? 0));
    news.push(`政府执行「${policy.name}」，${buildPolicyDesc(fx)}`);

    // 增发货币 → 通胀上升
    if (policy.id === 'print_money') {
      country.inflation = clamp(country.inflation + 15);
    }
    // 紧缩政策 → 通胀略降
    if (policy.id === 'tax_increase' || policy.id === 'cut_welfare') {
      country.inflation = clamp(country.inflation - 5);
    }
  }

  // ── 3. 执行随机事件 ──────────────────────────
  const evt = state.current_event;
  if (evt) {
    const fx = evt.effects;
    country.foreign_reserves = clamp(country.foreign_reserves + (fx.foreign_reserves ?? 0));
    country.public_support   = clamp(country.public_support   + (fx.public_support   ?? 0));
    country.credit_rating    = clamp(country.credit_rating    + (fx.credit_rating    ?? 0));
    news.push(`突发事件「${evt.name}」冲击市场`);
  }

  // ── 4. 联动触发（Butterfly Effect）────────────
  if (market.exchange_rate < 0.75) {
    country.inflation = clamp(country.inflation + 10);
    news.push('汇率崩跌触发通胀螺旋');
  }
  if (country.inflation > 60) {
    country.public_support   = clamp(country.public_support   - 8);
    country.foreign_reserves = clamp(country.foreign_reserves - 5);
    news.push('恶性通胀侵蚀民心与外储');
  }
  if (country.credit_rating < 30) {
    market.bond_price = Math.max(0.3, market.bond_price - 0.05);
    news.push('信用危机导致国债价格继续下跌');
  }

  // ── 5. 计算 delta ─────────────────────────────
  const countryDelta: Partial<VersusCountry> = {
    foreign_reserves: country.foreign_reserves - state.country.foreign_reserves,
    public_support:   country.public_support   - state.country.public_support,
    credit_rating:    country.credit_rating    - state.country.credit_rating,
    inflation:        country.inflation        - state.country.inflation,
  };

  // ── 6. 更新投机者总资产 ──────────────────────
  const totalValue = cash + positions.reduce((sum, p) => sum + p.amount + p.pnl, 0);

  // ── 7. 构建日志 ───────────────────────────────
  const entry: VersusLogEntry = {
    turn:          state.turn,
    event:         evt?.name ?? '无事件',
    savior_policy: policy?.name ?? '无行动',
    spec_actions:  state.spec_actions.map((a) => a.type),
    country_delta: countryDelta,
    market_delta:  {
      exchange_rate: market.exchange_rate - state.market.exchange_rate,
      bond_price:    market.bond_price    - state.market.bond_price,
      volatility:    market.volatility    - state.market.volatility,
    },
    spec_pnl: specPnl,
  };

  // ── 8. 胜负判断 ───────────────────────────────
  const { winner, result } = checkVersusGameOver({
    ...state,
    country,
    market,
    spec_assets: { cash, positions, total_value: totalValue },
    turn: state.turn + 1,
  });

  return {
    ...state,
    country,
    market,
    spec_assets: {
      cash,
      positions: positions.slice(-10), // 最多保留10个持仓
      total_value: totalValue,
    },
    last_country_delta: countryDelta,
    last_spec_pnl: specPnl,
    settlement_news: news,
    log: [...state.log, entry],
    phase: winner ? 'game_over' : 'feedback',
    winner,
    result,
  };
}

// ────────────────────────────────────────────────────────────────
// Phase 4 → Phase 5：完成反馈，进入下一回合
// ────────────────────────────────────────────────────────────────
export function advanceToNextTurn(state: VersusGameState): VersusGameState {
  if (state.phase === 'game_over') return state;

  return {
    ...state,
    turn:               state.turn + 1,
    phase:              'intel',
    intels:             generateIntels(),
    available_policies: getRandomPolicies(3),
    spec_actions:       [],
    savior_action:      null,
    current_event:      getRandomEvent(),
    settlement_news:    [],
    last_country_delta: null,
    last_spec_pnl:      0,
    // 清空持仓（简化：每回合结算完毕）
    spec_assets: {
      ...state.spec_assets,
      positions: [],
    },
    // 冷却倒计时
    manip_cooldown: Object.fromEntries(
      Object.entries(state.manip_cooldown)
        .map(([k, v]) => [k, Math.max(0, (v as number) - 1)])
        .filter(([, v]) => (v as number) > 0)
    ),
  };
}

// ────────────────────────────────────────────────────────────────
// 胜负判断
// ────────────────────────────────────────────────────────────────
function checkVersusGameOver(
  state: VersusGameState
): { winner: 'savior' | 'speculator' | null; result: VersusResult | null } {
  const { country, spec_assets, turn, maxTurns, initial_cash } = state;

  // 拯救者失败条件
  if (country.foreign_reserves <= 0) {
    return {
      winner: 'speculator',
      result: {
        winner: 'speculator',
        reason: '外汇储备耗尽，国家宣告破产',
        turns: turn,
        savior_final: country,
        spec_final: spec_assets.total_value,
      },
    };
  }
  if (country.public_support <= 0) {
    return {
      winner: 'speculator',
      result: {
        winner: 'speculator',
        reason: '民众支持归零，政府垮台',
        turns: turn,
        savior_final: country,
        spec_final: spec_assets.total_value,
      },
    };
  }

  // 投机者破产
  if (spec_assets.total_value <= 0) {
    return {
      winner: 'savior',
      result: {
        winner: 'savior',
        reason: '投机者资金耗尽，宣告破产',
        turns: turn,
        savior_final: country,
        spec_final: 0,
      },
    };
  }

  // 投机者胜利：总资产达到3倍
  if (spec_assets.total_value >= initial_cash * VICTORY_RATIO) {
    return {
      winner: 'speculator',
      result: {
        winner: 'speculator',
        reason: `投机者将资产扩大至 ${(spec_assets.total_value / initial_cash).toFixed(1)}x，收割成功`,
        turns: turn,
        savior_final: country,
        spec_final: spec_assets.total_value,
      },
    };
  }

  // 30回合结束
  if (turn > maxTurns) {
    const saviorWon =
      country.foreign_reserves > 60 &&
      country.public_support   > 60 &&
      country.credit_rating    > 60;
    return {
      winner: saviorWon ? 'savior' : 'speculator',
      result: {
        winner: saviorWon ? 'savior' : 'speculator',
        reason: saviorWon
          ? '坚持30个月，国家安然度过危机'
          : '30个月后国家未能稳定，投机者获得最终胜利',
        turns: maxTurns,
        savior_final: country,
        spec_final: spec_assets.total_value,
      },
    };
  }

  return { winner: null, result: null };
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────
function fmtMoney(n: number): string {
  return (n / 10000).toFixed(0) + '万';
}

function buildPolicyDesc(fx: Effects): string {
  const parts: string[] = [];
  if (fx.foreign_reserves) parts.push(`外储${fx.foreign_reserves > 0 ? '+' : ''}${fx.foreign_reserves}`);
  if (fx.public_support)   parts.push(`民心${fx.public_support   > 0 ? '+' : ''}${fx.public_support}`);
  if (fx.credit_rating)    parts.push(`信用${fx.credit_rating    > 0 ? '+' : ''}${fx.credit_rating}`);
  return parts.join('，');
}

// ────────────────────────────────────────────────────────────────
// 危机等级（供UI使用）
// ────────────────────────────────────────────────────────────────
export function calcVersusCrisis(country: VersusCountry): number {
  const riskFR = Math.max(0, (50 - country.foreign_reserves) / 50);
  const riskPS = Math.max(0, (50 - country.public_support)   / 50);
  const riskCR = Math.max(0, (40 - country.credit_rating)    / 40);
  return clamp(Math.round((riskFR * 0.45 + riskPS * 0.35 + riskCR * 0.20) * 100));
}
