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

  return {
    phase: 'playing',
    turn: 1,
    maxTurns: 30,
    assets: {
      cash: INITIAL_CASH,
      positions: [],
      total_value: INITIAL_CASH,
      pnl_today: 0,
    },
    market: initialMarket,
    intels: generateIntelsFromPool(ctx),
    manipulations,
    notifications: [],
    intels_bought_this_turn: 0,
    initial_cash: INITIAL_CASH,
    gov_log: [],
    market_flash: {},
    turn_summary: null,
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

  // 政府AI行动日志
  const govAction = pickGovAction(newMarket);

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

function pickGovAction(market: MarketState): string {
  // 汇率干预：初始 0.92 已在危机边缘，提前到 0.85 介入
  if (market.exchange_rate < 0.85) return '政府启动外储干预，护盘汇率';
  // 紧急加息：通胀 45% 已是高危，提前到 >55 介入
  if (market.inflation > 55)       return '央行宣布紧急加息';
  // IMF 求援：信用 38 已是危险区，提前到 <35 介入
  if (market.credit_rating < 35)   return '政府向IMF紧急求援';
  // 股指暴跌：初始 3200 尚可，保留 1500 阈值
  if (market.stock_index < 1500)   return '证监会暂停股市交易';
  return '政府召开新闻发布会安抚民众';
}

function makeNotif(type: NotifType, message: string): SpecNotif {
  return { id: `notif_${Date.now()}`, type, message, timestamp: Date.now() };
}
