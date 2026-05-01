import type {
  SpeculatorGameState,
  MarketState,
  SpeculatorAssets,
  Position,
  Intel,
  SpecNotif,
  NotifType,
  TradeOrder,
  SpecPhase,
  RiskScore,
  StrategyType,
  MegaOpportunity,
} from '../types/speculator';
import {
  generateAvailableAssets,
  generateAvailableManipulations,
  generateAvailableIntels,
  INTEL_POOL,
} from '../data/expandablePool';

// ═══════════════════════════════════════════
// 常量
// ═══════════════════════════════════════════
export const INITIAL_CASH = 1_000_000;
export const VICTORY_MULTIPLIER = 3;       // 资金达初始3倍胜利

// ═══════════════════════════════════════════
// 初始化
// ═══════════════════════════════════════════
export function createSpeculatorState(): SpeculatorGameState {
  const initialMarket = {
    exchange_rate: 0.92,
    inflation: 45,
    credit_rating: 38,
    bond_price: 0.18,
    stock_index: 3200,
  };

  // 动态生成初始选项
  const ctx = { turn: 1, cash: INITIAL_CASH, ...initialMarket };
  const manipulations = generateAvailableManipulations(ctx, 5).map((m) => ({
    ...m,
    cooldown_left: 0,
    is_cooling: false,
  }));

  const initialAssets: SpeculatorAssets = {
    cash: INITIAL_CASH,
    positions: [],
    total_value: INITIAL_CASH,
    pnl_today: 0,
  };

  return {
    phase: 'playing',
    turn: 1,
    maxTurns: 30,
    assets: initialAssets,
    market: initialMarket,
    intels: generateIntelsFromPool(ctx),
    manipulations,
    notifications: [],
    intels_bought_this_turn: 0,
    initial_cash: INITIAL_CASH,
    gov_log: [],
    market_flash: {},
    turn_summary: null,
    // P1-3: 风险评分与策略检测
    riskScore: calcSpeculatorRisk(initialAssets, initialMarket),
    strategyType: 'balanced',
    activeOpportunity: null,
    opportunityRemainingTurns: 0,
    // P2-3: 政府人格系统
    govPersona: 'balanced',
  };
}

// ═══════════════════════════════════════════
// 情报生成（基于扩展池）
// ═══════════════════════════════════════════
interface MarketContext {
  turn: number;
  exchange_rate: number;
  inflation: number;
  credit_rating: number;
  stock_index: number;
  cash: number;
}

function generateIntelsFromPool(ctx: MarketContext): Intel[] {
  // 使用扩展系统动态生成
  const availableIntels = generateAvailableIntels(ctx, 4);
  return availableIntels.map((t) => ({
    // 保留原始情报池的 ID，确保与购买逻辑匹配
    id: t.id,
    purchased: false,
    bribed: false,
    revealed: false,
    expired: false,
    source: t.source as Intel['source'],
    confidence: t.confidence,
    display_confidence: t.display_confidence_range[0] + Math.random() * (t.display_confidence_range[1] - t.display_confidence_range[0]),
    content: t.content,
    detail: t.detail,
    truth: t.truth,
    category: t.category as Intel['category'],
    impact: t.impact as Intel['impact'],
    affects: t.affects,
  }));
}

// 生成新的可交易资产（用于交易终端）
export function generateTradableAssets(ctx: MarketContext) {
  return generateAvailableAssets(ctx, 6);
}

// ═══════════════════════════════════════════
// 市场波动
// ═══════════════════════════════════════════
export function tickMarket(
  market: MarketState,
  _govAction?: string
): { newMarket: MarketState; flash: Partial<Record<keyof MarketState, 'up' | 'down'>> } {
  const flash: Partial<Record<keyof MarketState, 'up' | 'down'>> = {};

  // 自然衰减：每回合汇率微跌，通胀微升
  const er_delta  = (Math.random() - 0.6) * 0.04;          // 偏向下跌
  // 期望值 = (0.5-0.2)*4 = 1.2，通胀每回合平均上升 1.2%，符合债务危机惯性
  const inf_delta = (Math.random() - 0.2) * 4;
  const cr_delta  = (Math.random() - 0.55) * 4;            // 偏向下跌
  const bp_delta  = (Math.random() - 0.5) * 0.015;
  const si_delta  = (Math.random() - 0.6) * 120;           // 偏向下跌

  const newMarket: MarketState = {
    exchange_rate: Math.max(0.1, Math.min(2.0, market.exchange_rate + er_delta)),
    inflation:     Math.max(0,   Math.min(100, market.inflation     + inf_delta)),
    credit_rating: Math.max(0,   Math.min(100, market.credit_rating + cr_delta)),
    bond_price:    Math.max(0.05, Math.min(1.0, market.bond_price   + bp_delta)),
    stock_index:   Math.max(500, Math.min(5000, market.stock_index  + si_delta)),
  };

  // flash
  if (newMarket.exchange_rate > market.exchange_rate) flash.exchange_rate = 'up';
  else if (newMarket.exchange_rate < market.exchange_rate) flash.exchange_rate = 'down';
  if (newMarket.credit_rating > market.credit_rating) flash.credit_rating = 'up';
  else if (newMarket.credit_rating < market.credit_rating) flash.credit_rating = 'down';
  if (newMarket.inflation > market.inflation) flash.inflation = 'up';
  else if (newMarket.inflation < market.inflation) flash.inflation = 'down';

  return { newMarket, flash };
}

// ═══════════════════════════════════════════
// 计算持仓盈亏
// ═══════════════════════════════════════════
export function calcPositionPnl(pos: Position, market: MarketState): Position {
  let current_price = pos.current_price;

  switch (pos.type) {
    case 'bond':           current_price = market.bond_price;    break;
    case 'short_currency': current_price = market.exchange_rate; break;
    case 'gold':           current_price = market.stock_index / 2.0; break; // 简化：黄金与股指反相关
    case 'short_bank':     current_price = market.stock_index / 35;  break;
  }

  // 做空：价格越跌越赚
  const isShort = pos.type === 'short_currency' || pos.type === 'short_bank';
  const price_change_pct = isShort
    ? (pos.buy_price - current_price) / pos.buy_price  // 做空：跌赚
    : (current_price - pos.buy_price) / pos.buy_price; // 做多：涨赚

  const pnl = pos.amount * price_change_pct * pos.leverage;
  const pnl_pct = price_change_pct * pos.leverage * 100;

  return { ...pos, current_price, pnl, pnl_pct };
}

// ═══════════════════════════════════════════
// 执行交易
// ═══════════════════════════════════════════
export function executeTrade(
  state: SpeculatorGameState,
  order: TradeOrder,
): { newState: SpeculatorGameState; notif: SpecNotif } {
  const id = `pos_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const newPos: Position = {
    id,
    type: order.position_type,
    label: order.label,
    buy_price: order.current_price,
    current_price: order.current_price,
    amount: order.amount,
    leverage: order.leverage,
    pnl: 0,
    pnl_pct: 0,
  };

  const newCash = state.assets.cash - order.amount;
  const newAssets: SpeculatorAssets = {
    ...state.assets,
    cash: newCash,
    positions: [...state.assets.positions, newPos],
    total_value: calcTotalValue(newCash, [...state.assets.positions, newPos], state.market),
    pnl_today: state.assets.pnl_today,
  };

  const notif: SpecNotif = {
    id: `notif_${Date.now()}`,
    type: 'intel',
    message: `已开仓：${order.label}，投入 $${order.amount.toLocaleString()}，杠杆 x${order.leverage}`,
    timestamp: Date.now(),
  };

  return {
    newState: { ...state, assets: newAssets },
    notif,
  };
}

// ═══════════════════════════════════════════
// 市场结算（每回合结束）
// ═══════════════════════════════════════════
export function settlePositions(
  state: SpeculatorGameState
): { newState: SpeculatorGameState; notifs: SpecNotif[] } {
  const notifs: SpecNotif[] = [];
  const updatedPositions: Position[] = [];
  let totalPnl = 0;

  for (const pos of state.assets.positions) {
    const updated = calcPositionPnl(pos, state.market);
    updatedPositions.push(updated);
    totalPnl += updated.pnl;

    // 爆仓检测：亏损超过本金
    if (updated.pnl <= -updated.amount) {
      notifs.push({
        id: `notif_liq_${pos.id}`,
        type: 'liquidation',
        message: `⚠ ${pos.label} 强制平仓！损失：-$${Math.abs(updated.pnl).toLocaleString()}`,
        amount: updated.pnl,
        timestamp: Date.now(),
      });
    }
  }

  // 过滤掉已爆仓的
  const survivingPositions = updatedPositions.filter((p) => p.pnl > -p.amount);

  const newCash = state.assets.cash;
  const newTotalValue = calcTotalValue(newCash, survivingPositions, state.market);

  const newAssets: SpeculatorAssets = {
    cash: newCash,
    positions: survivingPositions,
    total_value: newTotalValue,
    pnl_today: totalPnl,
  };

  return {
    newState: { ...state, assets: newAssets },
    notifs,
  };
}

/** 一键平仓所有或单个持仓 */
export function closePosition(
  state: SpeculatorGameState,
  posId: string
): { newState: SpeculatorGameState; notif: SpecNotif } {
  const pos = state.assets.positions.find((p) => p.id === posId);
  if (!pos) return { newState: state, notif: makeNotif('intel', '找不到该持仓') };

  const realized = pos.amount + pos.pnl;
  const newCash = state.assets.cash + Math.max(0, realized);
  const newPositions = state.assets.positions.filter((p) => p.id !== posId);
  const newAssets: SpeculatorAssets = {
    ...state.assets,
    cash: newCash,
    positions: newPositions,
    total_value: calcTotalValue(newCash, newPositions, state.market),
    pnl_today: state.assets.pnl_today + pos.pnl,
  };

  const notifType: NotifType = pos.pnl >= 0 ? 'profit' : 'loss';
  const notif: SpecNotif = {
    id: `notif_close_${Date.now()}`,
    type: notifType,
    message: pos.pnl >= 0
      ? `💰 ${pos.label} 平仓，收益 +$${pos.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      : `📉 ${pos.label} 平仓，损失 -$${Math.abs(pos.pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    amount: pos.pnl,
    timestamp: Date.now(),
  };

  return {
    newState: { ...state, assets: newAssets },
    notif,
  };
}

// ═══════════════════════════════════════════
// 情报购买 / 贿赂
// ═══════════════════════════════════════════
export const INTEL_BUY_COST   = 50_000;
export const INTEL_BRIBE_COST = 80_000;

export function buyIntel(state: SpeculatorGameState, intelId: string): SpeculatorGameState {
  if (state.assets.cash < INTEL_BUY_COST) return state;
  // 修复：如果情报不在 state.intels 里（初始为空），从 INTEL_POOL 查出来再加入
  const existing = state.intels.find((i) => i.id === intelId);
  const intels = existing
    ? state.intels.map((i) => i.id === intelId ? { ...i, purchased: true } : i)
    : [
        ...state.intels,
        {
          ...(INTEL_POOL.find((p) => p.id === intelId) ?? {
            id: intelId,
            name: intelId,
            source: 'unknown',
            source_type: 'underground' as const,
            impact: 'medium' as const,
            content: '',
            detail: '',
            confidence: 0.5,
            display_confidence: 0.5,
            affects: {},
            purchased: true,
            bribed: false,
            expired: false,
            revealed: false,
          }),
          purchased: true,
        },
      ];
  return {
    ...state,
    assets: { ...state.assets, cash: state.assets.cash - INTEL_BUY_COST },
    intels,
    intels_bought_this_turn: state.intels_bought_this_turn + 1,
  };
}

export function bribeIntel(state: SpeculatorGameState, intelId: string): SpeculatorGameState {
  if (state.assets.cash < INTEL_BRIBE_COST) return state;
  const existing = state.intels.find((i) => i.id === intelId);
  if (!existing) return state; // 必须先购买才能贿赂
  const intels = state.intels.map((i) =>
    i.id === intelId
      ? { ...i, bribed: true, display_confidence: Math.min(0.98, i.confidence + 0.15) }
      : i
  );
  return {
    ...state,
    assets: { ...state.assets, cash: state.assets.cash - INTEL_BRIBE_COST },
    intels,
  };
}

// ═══════════════════════════════════════════
// 市场操控
// ═══════════════════════════════════════════
export function executeManipulation(
  state: SpeculatorGameState,
  actionId: string
): { newState: SpeculatorGameState; notif: SpecNotif } {
  const action = state.manipulations.find((m) => m.id === actionId);
  if (!action || action.is_cooling) {
    return { newState: state, notif: makeNotif('manipulation_fail', '操控行动冷却中') };
  }
  if (state.assets.cash < action.cost) {
    return { newState: state, notif: makeNotif('manipulation_fail', '资金不足，无法执行') };
  }

  const success = Math.random() < action.success_rate;
  const newCash  = state.assets.cash - action.cost;

  // 应用市场效果
  let newMarket = { ...state.market };
  if (success) {
    if (action.effects.exchange_rate)    newMarket.exchange_rate    = Math.max(0.1, newMarket.exchange_rate + action.effects.exchange_rate);
    if (action.effects.credit_rating)    newMarket.credit_rating    = Math.max(0,   newMarket.credit_rating  + action.effects.credit_rating);
    if (action.effects.inflation)        newMarket.inflation        = Math.min(100, newMarket.inflation       + action.effects.inflation);
  }

  const newManipulations = state.manipulations.map((m) =>
    m.id === actionId
      ? { ...m, cooldown_left: m.cooldown, is_cooling: true }
      : m
  );

  const notif: SpecNotif = {
    id: `notif_manip_${Date.now()}`,
    type: success ? 'manipulation_success' : 'manipulation_fail',
    message: success
      ? `✔ ${action.name} 成功！进入 ${action.cooldown} 回合冷却。${action.side_effect}`
      : `✘ ${action.name} 失败，被反情报部门察觉`,
    timestamp: Date.now(),
  };

  return {
    newState: {
      ...state,
      assets: { ...state.assets, cash: newCash },
      market: newMarket,
      manipulations: newManipulations,
    },
    notif,
  };
}

// ═══════════════════════════════════════════
// 回合推进（Next Turn）
// ═══════════════════════════════════════════
export function advanceSpecTurn(
  state: SpeculatorGameState
): { newState: SpeculatorGameState; notifs: SpecNotif[] } {
  const { newMarket, flash } = tickMarket(state.market);
  const newTurn = state.turn + 1;

  // 更新持仓盈亏
  const updatedPositions = state.assets.positions.map((p) =>
    calcPositionPnl(p, newMarket)
  );

  // 爆仓检测
  const liqNotifs: SpecNotif[] = [];
  const survivingPositions: Position[] = [];
  let liqLoss = 0;

  for (const pos of updatedPositions) {
    if (pos.pnl <= -pos.amount) {
      liqNotifs.push({
        id: `notif_liq_${pos.id}_${Date.now()}`,
        type: 'liquidation',
        message: `⚠ 强制平仓！${pos.label} 损失 -$${Math.abs(pos.pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        amount: pos.pnl,
        timestamp: Date.now(),
      });
      liqLoss += pos.amount; // 本金损失
    } else {
      survivingPositions.push(pos);
    }
  }

  const totalPnl = survivingPositions.reduce((s, p) => s + p.pnl, 0);
  const newTotalValue = calcTotalValue(state.assets.cash - liqLoss, survivingPositions, newMarket);

  const newAssets: SpeculatorAssets = {
    cash: state.assets.cash - liqLoss,
    positions: survivingPositions,
    total_value: newTotalValue,
    pnl_today: totalPnl,
  };

  // 冷却倒计时 + 动态刷新部分操控行为
  const cooldownManipulations = state.manipulations.map((m) =>
    m.is_cooling
      ? {
          ...m,
          cooldown_left: m.cooldown_left - 1,
          is_cooling: m.cooldown_left - 1 > 0, // 用递减后的值判断
        }
      : m
  );

  // 每3回合随机替换1个操控行为，保持新鲜感
  let newManipulations = cooldownManipulations;
  if (newTurn % 3 === 0) {
    const freshManipulations = generateAvailableManipulations(
      { turn: newTurn, cash: state.assets.cash, ...newMarket },
      1
    );
    if (freshManipulations.length > 0) {
      const idxToReplace = cooldownManipulations.findIndex(m => !m.is_cooling);
      if (idxToReplace >= 0) {
        newManipulations = [...cooldownManipulations];
        newManipulations[idxToReplace] = { ...freshManipulations[0], cooldown_left: 0, is_cooling: false };
      }
    }
  }

  // 情报过期 + 动态生成新情报（需合并：旧情报标记过期后仍保留显示，新情报追加）
  const expiredIntels = state.intels.map((i) => ({ ...i, expired: true, revealed: true }));
  const freshIntels = generateIntelsFromPool({
    turn: newTurn,
    exchange_rate: newMarket.exchange_rate,
    inflation: newMarket.inflation,
    credit_rating: newMarket.credit_rating,
    stock_index: newMarket.stock_index,
    cash: state.assets.cash,
  });

  // 政府AI行动日志（使用政府人格）
  const govAction = pickGovAction(newMarket, state.govPersona);

  // 胜负检测
  const { phase, reason } = checkSpecGameOver({
    ...state,
    assets: newAssets,
    turn: newTurn,
    market: newMarket,
  });

  const newState: SpeculatorGameState = {
    ...state,
    turn: newTurn,
    phase,
    assets: newAssets,
    market: newMarket,
    manipulations: newManipulations,
    intels: [...expiredIntels, ...freshIntels].slice(0, 6), // 过期情报保留显示，新情报追加，最多保留6条
    intels_bought_this_turn: 0,
    market_flash: flash,
    gov_log: [govAction, ...state.gov_log.slice(0, 4)],
    defeatReason: reason?.type === 'defeat' ? reason.text : state.defeatReason,
    victoryReason: reason?.type === 'victory' ? reason.text : state.victoryReason,
    notifications: [],  // 清空旧通知，外部会 push 新的
  };

  return { newState, notifs: liqNotifs };
}

// ═══════════════════════════════════════════
// 胜负判定
// ═══════════════════════════════════════════
export function checkSpecGameOver(
  state: SpeculatorGameState
): { phase: SpecPhase; reason?: { type: 'victory' | 'defeat'; text: string } } {
  if (state.assets.cash <= 0 && state.assets.positions.length === 0) {
    return { phase: 'defeat', reason: { type: 'defeat', text: '资金耗尽，宣告破产' } };
  }
  if (state.assets.total_value >= state.initial_cash * VICTORY_MULTIPLIER) {
    return {
      phase: 'victory',
      reason: { type: 'victory', text: `资产达到初始资金 ${VICTORY_MULTIPLIER} 倍，成功收割国家危机！` },
    };
  }
  if (state.turn >= state.maxTurns) {
    const ratio = state.assets.total_value / state.initial_cash;
    if (ratio >= 1.5) {
      return { phase: 'victory', reason: { type: 'victory', text: `30个月操作结束，资产增长至 ${(ratio * 100).toFixed(0)}%，安全撤离！` } };
    }
    return { phase: 'defeat', reason: { type: 'defeat', text: '30个月内未能完成收割目标，错失窗口期' } };
  }
  return { phase: 'playing' };
}

// ═══════════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════════
function calcTotalValue(cash: number, positions: Position[], market: MarketState): number {
  const posValue = positions.reduce((s, p) => {
    const updated = calcPositionPnl(p, market);
    return s + p.amount + updated.pnl;
  }, 0);
  return Math.max(0, cash + posValue);
}

// ─── P2-3: 政府AI人格系统 ──────────────────────────────

export type GovPersonaType = 'conservative' | 'aggressive' | 'balanced' | 'populist';

/**
 * 政府人格配置
 */
export interface GovPersona {
  type: GovPersonaType;
  name: string;
  icon: string;
  description: string;
  // 反应阈值调整（相对于基准值）
  exchange_rate_threshold: number;  // 基准 0.85
  inflation_threshold: number;     // 基准 55
  credit_rating_threshold: number;  // 基准 35
  stock_index_threshold: number;   // 基准 1500
  // 行动偏好
  preferred_actions: string[];      // 更倾向于的行动类型
}

export const GOV_PERSONAS: Record<GovPersonaType, GovPersona> = {
  // 保守型：晚介入，给投机者更多机会
  conservative: {
    type: 'conservative',
    name: '保守型政府',
    icon: '🏦',
    description: '谨慎决策，延迟干预，给市场自我修复的机会',
    exchange_rate_threshold: 0.75,   // 更低阈值
    inflation_threshold: 65,        // 更高阈值
    credit_rating_threshold: 30,     // 更低阈值
    stock_index_threshold: 1000,    // 更低阈值
    preferred_actions: ['安抚', '观望'],
  },
  // 激进型：早干预，快速响应
  aggressive: {
    type: 'aggressive',
    name: '激进型政府',
    icon: '⚡',
    description: '快速响应，提前干预，主动控制危机',
    exchange_rate_threshold: 0.95,   // 更高阈值
    inflation_threshold: 45,         // 更低阈值
    credit_rating_threshold: 45,     // 更高阈值
    stock_index_threshold: 2000,    // 更高阈值
    preferred_actions: ['干预', '加息'],
  },
  // 平衡型：标准响应
  balanced: {
    type: 'balanced',
    name: '平衡型政府',
    icon: '⚖️',
    description: '权衡利弊，在干预成本和市场压力间寻求平衡',
    exchange_rate_threshold: 0.85,
    inflation_threshold: 55,
    credit_rating_threshold: 35,
    stock_index_threshold: 1500,
    preferred_actions: ['发布会', '评估'],
  },
  // 民粹型：优先民心
  populist: {
    type: 'populist',
    name: '民粹型政府',
    icon: '🗳️',
    description: '优先维护民众支持，可能牺牲长期经济健康',
    exchange_rate_threshold: 0.80,
    inflation_threshold: 50,          // 更低，通胀影响民心
    credit_rating_threshold: 40,     // 更高，信用影响国际形象
    stock_index_threshold: 1800,
    preferred_actions: ['安抚', '福利'],
  },
};

/**
 * 根据市场状态选择政府行动（支持不同人格）
 */
export function pickGovAction(market: MarketState, persona: GovPersonaType = 'balanced'): string {
  const cfg = GOV_PERSONAS[persona];

  // 汇率干预
  if (market.exchange_rate < cfg.exchange_rate_threshold) {
    const intensity = Math.floor((cfg.exchange_rate_threshold - market.exchange_rate) / 0.1);
    if (intensity >= 2) return '政府启动外储干预，护盘汇率';
    if (intensity >= 1) return '政府警告投机者，暗示将干预市场';
    return '政府召开紧急会议讨论汇率';
  }

  // 紧急加息
  if (market.inflation > cfg.inflation_threshold) {
    return persona === 'populist'
      ? '政府讨论加息，但担心影响民心'
      : persona === 'aggressive'
        ? '央行紧急宣布大幅加息'
        : '央行宣布提高基准利率';
  }

  // IMF 求援
  if (market.credit_rating < cfg.credit_rating_threshold) {
    return persona === 'conservative'
      ? '政府犹豫是否求援IMF，内部分歧严重'
      : '政府向IMF紧急求援';
  }

  // 股指暴跌
  if (market.stock_index < cfg.stock_index_threshold) {
    return persona === 'aggressive'
      ? '证监会启动市场稳定基金'
      : persona === 'conservative'
        ? '政府表示不会干预股市'
        : '证监会暂停股市交易';
  }

  // 日常安抚
  return persona === 'populist'
    ? '总理发表讲话，强调人民利益至上'
    : persona === 'aggressive'
      ? '政府公布经济改革计划'
      : '政府召开新闻发布会安抚民众';
}

function makeNotif(type: NotifType, message: string): SpecNotif {
  return { id: `notif_${Date.now()}`, type, message, timestamp: Date.now() };
}

// ─── P1-3: 风险评分系统 ──────────────────────────────


/**
 * 计算投机者风险评分
 */
export function calcSpeculatorRisk(
  assets: SpeculatorAssets,
  market: MarketState
): RiskScore {
  const positions = assets.positions;

  // 1. 波动率风险：持仓数量越多，风险越分散
  const volatility_risk = positions.length === 0 ? 0 :
    Math.min(100, positions.length * 15);

  // 2. 集中风险：单一持仓占比过高
  const totalInvested = positions.reduce((s, p) => s + p.amount, 0);
  const maxPositionRatio = positions.length > 0 ?
    Math.max(...positions.map(p => p.amount / (assets.cash + totalInvested))) : 0;
  const concentration_risk = Math.round(maxPositionRatio * 100);

  // 3. 流动性风险：现金占比过低
  const liquidity_risk = assets.cash < assets.total_value * 0.2 ? 80 :
    assets.cash < assets.total_value * 0.5 ? 40 : 10;

  const total_risk = Math.round(
    volatility_risk * 0.3 +
    concentration_risk * 0.4 +
    liquidity_risk * 0.3
  );

  const risk_level = total_risk > 70 ? 'high' :
    total_risk > 40 ? 'medium' : 'low';

  return {
    volatility_risk,
    concentration_risk,
    liquidity_risk,
    total_risk,
    risk_level,
  };
}

// ─── P1-3: 策略流派检测 ──────────────────────────────

/**
 * 检测当前策略流派
 */
export function detectStrategy(
  assets: SpeculatorAssets,
  intels: { accuracy: number }[]
): StrategyType {
  const positions = assets.positions;

  // 宏观对冲：同时有多头和空头
  const hasLong = positions.some(p => p.type === 'gold');
  const hasShort = positions.some(p => p.type === 'short_currency' || p.type === 'short_bank');
  if (hasLong && hasShort) return 'macro_hedge';

  // 激进做空：有做空仓位且杠杆>=5
  const hasHighLeverageShort = positions.some(
    p => (p.type === 'short_currency' || p.type === 'short_bank') && p.leverage >= 5
  );
  if (hasHighLeverageShort) return 'aggressive_short';

  // 内幕交易：情报准确率>0.8
  const avgAccuracy = intels.filter(i => i.accuracy).length > 0 ?
    intels.reduce((s, i) => s + i.accuracy, 0) / intels.filter(i => i.accuracy).length : 0;
  if (avgAccuracy > 0.8) return 'insider_trade';

  // 保守策略：现金占比>60%
  if (assets.cash / assets.total_value > 0.6) return 'conservative';

  return 'balanced';
}

// ─── P1-3: 大机会事件池 ──────────────────────────────

export const MEGA_OPPORTUNITIES = [
  {
    id: 'currency_attack',
    name: '货币攻击机会',
    icon: '💥',
    description: '市场出现极端恐慌，做空货币收益×3！',
    trigger_probability: 0.05,
    profit_multiplier: 3,
    duration: 3,
    market_effect: { exchange_rate: -0.15 },
  },
  {
    id: 'bank_run',
    name: '银行挤兑危机',
    icon: '🏦',
    description: '市场传言银行将破产，做空银行股收益×5！',
    trigger_probability: 0.03,
    profit_multiplier: 5,
    duration: 2,
    market_effect: { stock_index: -500 },
  },
  {
    id: 'default_speculation',
    name: '主权违约危机',
    icon: '📉',
    description: '国家即将违约，做空国债收益爆炸！',
    trigger_probability: 0.02,
    profit_multiplier: 8,
    duration: 2,
    market_effect: { bond_price: -0.3 },
  },
];

/**
 * 检测并触发大机会事件
 * 返回 null 或 MegaOpportunity
 */
export function checkMegaOpportunity(market: MarketState, turn: number): typeof MEGA_OPPORTUNITIES[0] | null {
  // 只在回合开始时检测
  for (const op of MEGA_OPPORTUNITIES) {
    if (Math.random() < op.trigger_probability) {
      return op;
    }
  }
  return null;
}
