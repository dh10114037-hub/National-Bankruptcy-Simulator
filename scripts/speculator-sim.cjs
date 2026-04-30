/**
 * 投机者模式 10 回合模拟日志生成器
 * 运行: node scripts/speculator-sim.js
 */
const fs = require('fs');
const path = require('path');

// ── 注入模块路径 ──────────────────────────────────────────────────
const srcPath = path.join(__dirname, '..', 'src');
const distPath = path.join(__dirname, '..', 'dist');

// 手动内联核心逻辑（避免 ESM/TS 编译问题）
const INITIAL_CASH = 1_000_000;
const VICTORY_MULTIPLIER = 3;

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function calcPositionPnl(pos, market) {
  let current_price;
  switch (pos.type) {
    case 'bond': current_price = market.bond_price; break;
    case 'short_currency': current_price = market.exchange_rate; break;
    case 'gold': current_price = market.stock_index / 2.0; break;
    case 'short_bank': current_price = market.stock_index / 35; break;
    default: current_price = pos.current_price;
  }
  const isShort = pos.type === 'short_currency' || pos.type === 'short_bank';
  const price_change_pct = isShort
    ? (pos.buy_price - current_price) / pos.buy_price
    : (current_price - pos.buy_price) / pos.buy_price;
  const pnl = pos.amount * price_change_pct * pos.leverage;
  return { ...pos, current_price, pnl, pnl_pct: price_change_pct * pos.leverage * 100 };
}

function tickMarket(market) {
  const er_delta  = (Math.random() - 0.6) * 0.04;
  const inf_delta = (Math.random() - 0.3) * 3;
  const cr_delta  = (Math.random() - 0.55) * 4;
  const bp_delta  = (Math.random() - 0.5) * 0.015;
  const si_delta  = (Math.random() - 0.6) * 120;
  return {
    exchange_rate:  clamp(market.exchange_rate + er_delta,  0.1, 2.0),
    inflation:      clamp(market.inflation     + inf_delta, 0,   100),
    credit_rating:  clamp(market.credit_rating + cr_delta,  0,   100),
    bond_price:     clamp(market.bond_price    + bp_delta,  0.05, 1.0),
    stock_index:    clamp(market.stock_index   + si_delta,  500, 5000),
  };
}

function calcTotalValue(cash, positions, market) {
  const posValue = positions.reduce((s, p) => {
    const updated = calcPositionPnl(p, market);
    return s + p.amount + updated.pnl;
  }, 0);
  return Math.max(0, cash + posValue);
}

function checkSpecGameOver(state) {
  if (state.cash <= 0 && state.positions.length === 0) {
    return { phase: 'defeat', reason: '资金耗尽，宣告破产' };
  }
  if (state.total_value >= state.initial_cash * VICTORY_MULTIPLIER) {
    return { phase: 'victory', reason: `资产达到初始资金 ${VICTORY_MULTIPLIER} 倍` };
  }
  if (state.turn >= state.maxTurns) {
    const ratio = state.total_value / state.initial_cash;
    if (ratio >= 1.5) return { phase: 'victory', reason: `30个月操作结束，资产增长至 ${(ratio * 100).toFixed(0)}%` };
    return { phase: 'defeat', reason: '30个月内未能完成收割目标' };
  }
  return { phase: 'playing' };
}

function pickGovAction(market) {
  if (market.exchange_rate < 0.85)  return '政府启动外储干预，护盘汇率';
  if (market.inflation > 55)       return '央行宣布紧急加息';
  if (market.credit_rating < 35)   return '政府向IMF紧急求援';
  if (market.stock_index < 1500)   return '证监会暂停股市交易';
  return '政府召开新闻发布会安抚民众';
}

// ── 固定随机种子版 tickMarket（可复现）──
function tickMarketSeeded(market, seed) {
  // 用简单线性同余生成确定性随机数
  let s = seed;
  const rand = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return ((s >>> 0) / 0xffffffff); };
  const er_delta  = (rand() - 0.6) * 0.04;
  const inf_delta = (rand() - 0.2) * 4;   // 期望 1.2%/回合，符合债务危机惯性
  const cr_delta  = (rand() - 0.55) * 4;
  const bp_delta  = (rand() - 0.5) * 0.015;
  const si_delta  = (rand() - 0.6) * 120;
  return {
    exchange_rate:  clamp(market.exchange_rate + er_delta,  0.1, 2.0),
    inflation:      clamp(market.inflation     + inf_delta, 0,   100),
    credit_rating:  clamp(market.credit_rating + cr_delta,  0,   100),
    bond_price:     clamp(market.bond_price    + bp_delta,  0.05, 1.0),
    stock_index:    clamp(market.stock_index   + si_delta,  500, 5000),
  };
}

// ── 固定操控池（用于模拟）──
const FIXED_MANIPULATIONS = [
  { id: 'm1', name: '散布恐慌言论', cost: 80000, effects: { exchange_rate: -0.05 }, cooldown: 3, is_cooling: false, cooldown_left: 0, success_rate: 0.65 },
  { id: 'm2', name: '做空国债市场', cost: 60000, effects: { bond_price: -0.08 }, cooldown: 3, is_cooling: false, cooldown_left: 0, success_rate: 0.70 },
  { id: 'm3', name: '舆论操控',     cost: 50000, effects: { credit_rating: -4 }, cooldown: 4, is_cooling: false, cooldown_left: 0, success_rate: 0.60 },
  { id: 'm4', name: '内幕交易',     cost: 120000, effects: { stock_index: -150 }, cooldown: 4, is_cooling: false, cooldown_left: 0, success_rate: 0.55 },
  { id: 'm5', name: '资本外逃布局', cost: 100000, effects: { exchange_rate: -0.08 }, cooldown: 3, is_cooling: false, cooldown_left: 0, success_rate: 0.68 },
];

function advanceSpecTurn(state, seed) {
  const newMarket = tickMarketSeeded(state.market, seed);
  const newTurn   = state.turn + 1;

  // 持仓结算
  const updatedPositions = state.positions.map(p => calcPositionPnl(p, newMarket));
  const survivingPositions = updatedPositions.filter(p => p.pnl > -p.amount);
  const liqLoss = updatedPositions.filter(p => p.pnl <= -p.amount).reduce((s, p) => s + p.amount, 0);
  const newCash = state.cash - liqLoss;
  const total_value = calcTotalValue(newCash, survivingPositions, newMarket);

  // 冷却
  const manipulations = state.manipulations.map(m =>
    m.is_cooling
      ? { ...m, cooldown_left: m.cooldown_left - 1, is_cooling: m.cooldown_left - 1 > 0 }
      : m
  );

  const govAction = pickGovAction(newMarket);
  const { phase, reason } = checkSpecGameOver({ ...state, turn: newTurn, cash: newCash, positions: survivingPositions, total_value });

  return {
    turn: newTurn,
    phase,
    cash: newCash,
    positions: survivingPositions,
    total_value,
    market: newMarket,
    manipulations,
    gov_log: [govAction, ...state.gov_log.slice(0, 4)],
    defeatReason: reason?.type === 'defeat' ? reason.text : state.defeatReason,
    victoryReason: reason?.type === 'victory' ? reason.text : state.victoryReason,
  };
}

// ── 模拟脚本 ─────────────────────────────────────────────────────
const initialState = {
  turn: 1,
  maxTurns: 30,
  phase: 'playing',
  cash: INITIAL_CASH,
  positions: [],
  total_value: INITIAL_CASH,
  initial_cash: INITIAL_CASH,
  market: {
    exchange_rate: 0.92,
    inflation: 45,
    credit_rating: 38,
    bond_price: 0.18,
    stock_index: 3200,
  },
  manipulations: FIXED_MANIPULATIONS,
  gov_log: [],
};

let state = initialState;
const log = [];
const seeds = [12345, 67890, 11111, 22222, 33333, 44444, 55555, 66666, 77777, 88888];

console.log('='.repeat(80));
console.log('投机者模式 10 回合模拟日志');
console.log('='.repeat(80));
console.log('\n【初始状态】');
console.log(`  资金: ¥${initialState.cash.toLocaleString()}  |  目标: ¥${(initialState.initial_cash * 3).toLocaleString()}`);
console.log(`  汇率: ${initialState.market.exchange_rate}  |  通胀: ${initialState.market.inflation}%`);
console.log(`  信用: ${initialState.market.credit_rating}  |  国债: ${initialState.market.bond_price}`);
console.log(`  股指: ${initialState.market.stock_index}`);
console.log('');

for (let i = 0; i < 10; i++) {
  const seed = seeds[i];

  // 模拟玩家操作（买点情报 + 轻仓做空汇率）
  const playerActions = [];
  if (i < 5) {
    // 前5回合做空汇率，每次投入 200,000
    const pos = {
      id: `pos_${i}`,
      type: 'short_currency',
      label: '做空汇率',
      buy_price: state.market.exchange_rate,
      current_price: state.market.exchange_rate,
      amount: 200000,
      leverage: 1,
      pnl: 0,
      pnl_pct: 0,
    };
    state.positions.push(pos);
    playerActions.push(`开仓: 做空汇率 ¥200,000 @ ${state.market.exchange_rate.toFixed(4)}`);
  } else if (i === 5) {
    // 第6回合：先平仓（按引擎逻辑重算cash和total_value），再推进回合
    if (state.positions.length > 0) {
      const realized = state.positions.reduce((s, p) => s + p.amount + p.pnl, 0);
      const pnl = state.positions.reduce((s, p) => s + p.pnl, 0);
      state.cash += Math.max(0, realized);        // 关键：先更新cash
      state.total_value = state.cash;             // 关键：立刻重算total_value
      playerActions.push(`一键平仓: ${state.positions.length}个持仓，合计盈亏 ¥${pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
      state.positions = [];
    }
  }

  // 推进回合
  const prev = {
    cash: state.cash,
    total_value: state.total_value,
    exchange_rate: state.market.exchange_rate,
    inflation: state.market.inflation,
    credit_rating: state.market.credit_rating,
    bond_price: state.market.bond_price,
    stock_index: state.market.stock_index,
  };

  const next = advanceSpecTurn(state, seed);

  // 计算差值
  const tvDelta = next.total_value - prev.total_value;
  const tvPct   = (tvDelta / prev.total_value * 100).toFixed(2);
  const erDelta  = (next.market.exchange_rate - prev.exchange_rate).toFixed(4);
  const infDelta = (next.market.inflation - prev.inflation).toFixed(1);
  const crDelta  = (next.market.credit_rating - prev.credit_rating).toFixed(1);
  const bpDelta  = (next.market.bond_price - prev.bond_price).toFixed(4);
  const siDelta  = Math.round(next.market.stock_index - prev.stock_index);

  console.log(`${'─'.repeat(80)}`);
  console.log(`【第 ${next.turn - 1} → ${next.turn} 回合】 seed=${seed}`);
  console.log('');
  console.log('  📌 玩家操作:');
  if (playerActions.length === 0) {
    console.log('    (无操作，持仓观望)');
  } else {
    playerActions.forEach(a => console.log(`    ${a}`));
  }
  console.log('');
  console.log('  📊 市场变化:');
  console.log(`    汇率:   ${prev.exchange_rate.toFixed(4)} → ${next.market.exchange_rate.toFixed(4)}  (${erDelta >= 0 ? '+' : ''}${erDelta})`);
  console.log(`    通胀:   ${prev.inflation.toFixed(1)}% → ${next.market.inflation.toFixed(1)}%  (${infDelta >= 0 ? '+' : ''}${infDelta}%)`);
  console.log(`    信用:   ${prev.credit_rating.toFixed(1)} → ${next.market.credit_rating.toFixed(1)}  (${crDelta >= 0 ? '+' : ''}${crDelta})`);
  console.log(`    国债:   ${prev.bond_price.toFixed(4)} → ${next.market.bond_price.toFixed(4)}  (${bpDelta >= 0 ? '+' : ''}${bpDelta})`);
  console.log(`    股指:   ${prev.stock_index} → ${Math.round(next.market.stock_index)}  (${siDelta >= 0 ? '+' : ''}${siDelta})`);
  console.log('');
  console.log('  💰 资产状况:');
  console.log(`    现金:   ¥${prev.cash.toLocaleString()} → ¥${next.cash.toLocaleString()}`);
  console.log(`    持仓:   ${next.positions.length} 个`);
  if (next.positions.length > 0) {
    next.positions.forEach(p => {
      const updated = calcPositionPnl(p, next.market);
      console.log(`      - ${p.label}: ¥${updated.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${updated.pnl_pct >= 0 ? '+' : ''}${updated.pnl_pct.toFixed(2)}%)`);
    });
  }
  console.log(`    总资产: ¥${prev.total_value.toLocaleString()} → ¥${next.total_value.toLocaleString()}`);
  console.log(`    变动:   ${tvDelta >= 0 ? '+' : ''}¥${tvDelta.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${tvPct >= 0 ? '+' : ''}${tvPct}%)`);
  console.log('');
  console.log('  🤖 政府行动: ' + next.gov_log[0]);
  if (next.manipulations.some(m => m.is_cooling)) {
    const cooling = next.manipulations.filter(m => m.is_cooling).map(m => `${m.name}(剩${m.cooldown_left}回合)`).join(', ');
    console.log('  ⏳ 操控冷却中: ' + cooling);
  }
  if (next.phase !== 'playing') {
    console.log('');
    console.log('  🔔 游戏结束: ' + (next.phase === 'victory' ? '胜利!' : '失败!') + ' 原因: ' + (next.victoryReason || next.defeatReason));
  }

  state = { ...state, ...next };
  log.push({ turn: next.turn, prev, next, tvDelta, playerActions });

  if (next.phase !== 'playing') break;
}

console.log('\n' + '='.repeat(80));
console.log('【10回合汇总】');
console.log('='.repeat(80));
const finalState = state;
console.log(`  初始资金: ¥${initialState.cash.toLocaleString()}`);
console.log(`  最终资金: ¥${finalState.cash.toLocaleString()}`);
console.log(`  最终总资产: ¥${finalState.total_value.toLocaleString()}`);
console.log(`  累计盈亏: ${(finalState.total_value >= initialState.cash ? '+' : '')}¥${(finalState.total_value - initialState.cash).toLocaleString(undefined, { maximumFractionDigits: 0 })} (${((finalState.total_value / initialState.cash - 1) * 100).toFixed(2)}%)`);
console.log(`  回合数: ${finalState.turn - 1} / 30`);
console.log(`  最终汇率: ${finalState.market.exchange_rate.toFixed(4)}`);
console.log(`  最终通胀: ${finalState.market.inflation.toFixed(1)}%`);
console.log(`  最终信用: ${finalState.market.credit_rating.toFixed(1)}`);
console.log(`  胜/败状态: ${finalState.phase}`);
