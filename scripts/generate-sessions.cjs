#!/usr/bin/env node

/**
 * 模拟游戏运行日志生成器
 * 用于分析游戏平衡性
 */

const fs = require('fs');
const path = require('path');

// ──────────────────────────────────────────────
// 核心数据（与游戏引擎保持一致）
// ──────────────────────────────────────────────

const ALL_POLICIES = [
  { id: 'tax_increase', name: '提高税收', effects: { foreign_reserves: 10, public_support: -8 }, recommendation: 'balanced' },
  { id: 'print_money', name: '增发货币', effects: { foreign_reserves: 15, credit_rating: -10 }, recommendation: 'negative' },
  { id: 'cut_welfare', name: '削减福利', effects: { foreign_reserves: 12, public_support: -8 }, recommendation: 'negative' },
  { id: 'imf_bailout', name: 'IMF援助', effects: { foreign_reserves: 25, credit_rating: 5, public_support: -6 }, recommendation: 'survival' },
  { id: 'raise_interest', name: '紧急加息', effects: { foreign_reserves: 8, credit_rating: 8, public_support: -4 }, recommendation: 'balanced' },
  { id: 'capital_control', name: '资本管制', effects: { foreign_reserves: 12, credit_rating: -8, public_support: -3 }, recommendation: 'survival' },
  { id: 'emergency_bond', name: '紧急国债', effects: { foreign_reserves: 18, credit_rating: -6 }, recommendation: 'balanced' },
  { id: 'economic_reform', name: '结构改革', effects: { credit_rating: 15, public_support: 5, foreign_reserves: -8 }, recommendation: 'growth' },
  { id: 'public_speech', name: '鼓舞演讲', effects: { public_support: 12, credit_rating: -2 }, recommendation: 'survival' },
  { id: 'sell_assets', name: '出售资产', effects: { foreign_reserves: 20, public_support: -7, credit_rating: -4 }, recommendation: 'survival' },
  { id: 'welfare_spending', name: '发放民生补贴', effects: { public_support: 8, foreign_reserves: -6, credit_rating: -2 }, recommendation: 'survival' },
  { id: 'welfare_reform', name: '推进福利改革', effects: { public_support: 6, foreign_reserves: 5, credit_rating: 3 }, recommendation: 'growth' },
  { id: 'national_celebration', name: '举行国庆庆典', effects: { public_support: 10, credit_rating: -1 }, recommendation: 'survival' },
];

const EVENTS = [
  { id: 'bank_run', name: '银行挤兑', severity: 'high', effects: { foreign_reserves: -15, public_support: -10 } },
  { id: 'protest', name: '全国抗议', severity: 'medium', effects: { public_support: -15 } },
  { id: 'currency_crash', name: '货币暴跌', severity: 'high', effects: { credit_rating: -12, foreign_reserves: -10 } },
  { id: 'debt_downgrade', name: '评级下调', severity: 'medium', effects: { credit_rating: -8, foreign_reserves: -5 } },
  { id: 'food_shortage', name: '粮食短缺', severity: 'medium', effects: { public_support: -12, foreign_reserves: -8 } },
  { id: 'foreign_pressure', name: '外部施压', severity: 'high', effects: { foreign_reserves: -18, credit_rating: -5 } },
  { id: 'corruption_scandal', name: '腐败丑闻', severity: 'medium', effects: { public_support: -8, credit_rating: -6 } },
  { id: 'trade_deficit', name: '贸易逆差扩大', severity: 'low', effects: { foreign_reserves: -8 } },
  { id: 'minor_recovery', name: '短暂喘息', severity: 'positive', effects: { foreign_reserves: 5, public_support: 3 } },
  { id: 'tech_crisis', name: '科技企业倒闭潮', severity: 'medium', effects: { public_support: -10, credit_rating: -5 } },
];

// ──────────────────────────────────────────────
// 工具函数
// ──────────────────────────────────────────────

function clamp(val, min = 0, max = 100) {
  return Math.max(min, Math.min(max, val));
}

function getRandomPolicies(count = 3) {
  const shuffled = [...ALL_POLICIES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function applyEffects(state, effects) {
  const newMarket = { ...state.market };
  if (effects.exchange_rate !== undefined) {
    newMarket.exchange_rate = Math.max(0.1, Math.min(2.0, newMarket.exchange_rate + effects.exchange_rate));
  }
  if (effects.inflation !== undefined) {
    newMarket.inflation = clamp(newMarket.inflation + effects.inflation, 0, 100);
  }
  if (effects.volatility !== undefined) {
    newMarket.volatility = clamp(newMarket.volatility + effects.volatility, 0, 1);
  }
  return {
    ...state,
    foreign_reserves: clamp(state.foreign_reserves + (effects.foreign_reserves ?? 0)),
    public_support: clamp(state.public_support + (effects.public_support ?? 0)),
    credit_rating: clamp(state.credit_rating + (effects.credit_rating ?? 0)),
    market: newMarket,
  };
}

function applyExchangeRateCoupling(state) {
  let { foreign_reserves, public_support, credit_rating, market } = state;
  let { exchange_rate, volatility } = market;

  if (exchange_rate < 0.9) { credit_rating -= 2; public_support -= 1; volatility += 0.03; }
  if (exchange_rate < 0.8) { credit_rating -= 4; public_support -= 3; volatility += 0.05; }
  if (exchange_rate < 0.6) { credit_rating -= 6; public_support -= 4; foreign_reserves -= 3; volatility += 0.07; }
  if (market.inflation > 55) { public_support -= 2; credit_rating -= 1; }
  if (market.inflation > 75) { public_support -= 3; credit_rating -= 3; exchange_rate -= 0.03; }
  if (volatility > 0.75) { credit_rating -= 3; }

  return {
    ...state,
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

function tickMarket(market) {
  const er_delta = (Math.random() - 0.52) * 0.025;
  const inf_delta = (Math.random() - 0.42) * 2.5;
  const vol_delta = (Math.random() - 0.5) * 0.04;

  return {
    exchange_rate: Math.max(0.1, Math.min(2.0, market.exchange_rate + er_delta)),
    volatility: clamp(market.volatility + vol_delta, 0, 1),
    inflation: clamp(market.inflation + inf_delta, 0, 100),
  };
}

// 投机者AI
function runSpeculatorAI(state, turn, consecutiveAttacks) {
  const { foreign_reserves, public_support, credit_rating, market } = state;
  const fatigue = public_support < 20 ? 0.4 : public_support < 30 ? 0.6 : public_support < 40 ? 0.8 : 1.0;
  const novice = turn <= 3 ? 0.5 : turn <= 5 ? 0.75 : 1.0;
  const mult = fatigue * novice;

  if (consecutiveAttacks >= 2) return { name: '获利了结', effects: {}, type: 'wait', consecutiveAttacks: 0 };

  let nextConsecutive = consecutiveAttacks;

  if (market.exchange_rate < 0.75 && market.volatility > 0.45) {
    nextConsecutive++;
    return { name: '做空货币', effects: { exchange_rate: -0.07 * mult, inflation: 5 * mult, volatility: 0.07 * mult }, type: 'short_currency', consecutiveAttacks: nextConsecutive };
  }
  if (credit_rating < 35) {
    nextConsecutive++;
    return { name: '攻击债市', effects: { credit_rating: -5 * mult, inflation: 3 * mult }, type: 'attack_bonds', consecutiveAttacks: nextConsecutive };
  }
  if (public_support < 40) {
    nextConsecutive++;
    return { name: '散布恐慌', effects: { public_support: Math.round(-5 * mult), volatility: 0.04 * mult }, type: 'spread_rumor', consecutiveAttacks: nextConsecutive };
  }
  if (foreign_reserves < 20 && credit_rating < 45) {
    nextConsecutive++;
    return { name: '高杠杆做空', effects: { exchange_rate: -0.10 * mult, credit_rating: -4 * mult, volatility: 0.10 * mult }, type: 'leverage_short', consecutiveAttacks: nextConsecutive };
  }
  if (market.inflation > 55) {
    nextConsecutive++;
    return { name: '做空货币(通胀)', effects: { exchange_rate: -0.05 * mult, inflation: 3 * mult }, type: 'short_currency', consecutiveAttacks: nextConsecutive };
  }
  if (foreign_reserves < 30 && credit_rating < 40 && public_support < 40) {
    nextConsecutive++;
    return { name: '协同猎杀', effects: { exchange_rate: -0.08 * mult, credit_rating: -4 * mult, public_support: -3 * mult, volatility: 0.08 * mult }, type: 'leverage_short', consecutiveAttacks: nextConsecutive };
  }
  if (market.volatility < 0.3) {
    return { name: '观望待机', effects: {}, type: 'wait', consecutiveAttacks: 0 };
  }
  nextConsecutive++;
  return { name: '小幅做空', effects: { exchange_rate: -0.02 * mult, volatility: 0.01 * mult }, type: 'short_currency', consecutiveAttacks: nextConsecutive };
}

function checkGameOver(state) {
  if (state.foreign_reserves <= 0) return { phase: 'defeat', reason: '外汇储备耗尽 — 国家宣告破产' };
  if (state.public_support <= 0) return { phase: 'defeat', reason: '民众支持归零 — 社会秩序彻底崩溃' };
  if (state.credit_rating <= 0) return { phase: 'defeat', reason: '国家信用归零 — 无法融资，经济彻底崩溃' };
  if (state.market.exchange_rate < 0.3) return { phase: 'defeat', reason: '汇率崩溃 — 本币沦为废纸' };
  if (state.turn > state.maxTurns) {
    const allGood = state.foreign_reserves > 60 && state.public_support > 60 && state.credit_rating > 60;
    return allGood ? { phase: 'victory', reason: '坚持30个月，国家走出危机' } : { phase: 'defeat', reason: '30个月后国家未能稳定，最终步入衰退' };
  }
  if (state.winStreak >= 3) return { phase: 'victory', reason: '连续3个月指标全部达标，国家重回稳定轨道' };
  return { phase: 'playing' };
}

// ──────────────────────────────────────────────
// 策略定义
// ──────────────────────────────────────────────

// 策略1：随机选择
function strategyRandom(state, policies) {
  return policies[Math.floor(Math.random() * policies.length)];
}

// 策略2：稳健策略（优先保命）
function strategySteady(state, policies) {
  const { foreign_reserves, public_support, credit_rating } = state;

  // 民心<40时优先恢复民心
  if (public_support < 40) {
    const speech = policies.find(p => p.id === 'public_speech');
    if (speech) return speech;
    const celebration = policies.find(p => p.id === 'national_celebration');
    if (celebration) return celebration;
  }

  // 民心<50时使用民生政策
  if (public_support < 50) {
    const welfare = policies.find(p => p.id === 'welfare_spending');
    if (welfare) return welfare;
  }

  // 外储告急
  if (foreign_reserves < 30) {
    const imf = policies.find(p => p.id === 'imf_bailout');
    if (imf) return imf;
    const bond = policies.find(p => p.id === 'emergency_bond');
    if (bond) return bond;
  }

  // 信用危机
  if (credit_rating < 40) {
    const reform = policies.find(p => p.id === 'economic_reform');
    if (reform) return reform;
    const interest = policies.find(p => p.id === 'raise_interest');
    if (interest) return interest;
  }

  // 均衡选择
  const balanced = policies.find(p => p.recommendation === 'balanced');
  if (balanced) return balanced;

  // 保守选择
  const survival = policies.find(p => p.recommendation === 'survival');
  if (survival) return survival;

  return policies[0];
}

// 策略3：激进策略（优先增长）
function strategyAggressive(state, policies) {
  const { foreign_reserves, public_support, credit_rating } = state;

  // 优先积累外储
  if (foreign_reserves < 60) {
    const highIncome = policies.filter(p => p.effects && p.effects.foreign_reserves && p.effects.foreign_reserves > 12);
    if (highIncome.length > 0) return highIncome[0];
  }

  // 推进改革
  if (credit_rating > 50 && public_support > 50) {
    const reform = policies.find(p => p.id === 'economic_reform');
    if (reform) return reform;
  }

  // 高收入政策优先
  const imf = policies.find(p => p.id === 'imf_bailout');
  if (imf) return imf;

  const bond = policies.find(p => p.id === 'emergency_bond');
  if (bond) return bond;

  const sell = policies.find(p => p.id === 'sell_assets');
  if (sell) return sell;

  return policies[0];
}

// ──────────────────────────────────────────────
// 模拟单局游戏
// ──────────────────────────────────────────────

function simulateSession(sessionId, strategyFn, strategyName) {
  let state = {
    foreign_reserves: 100,
    public_support: 75,
    credit_rating: 65,
    turn: 1,
    maxTurns: 30,
    phase: 'playing',
    winStreak: 0,
    market: { exchange_rate: 1.0, volatility: 0.15, inflation: 18 },
  };

  const days = [];
  let consecutiveAttacks = 0;

  while (state.phase === 'playing') {
    const turn = state.turn;

    // 记录回合开始状态
    const startState = {
      foreign_reserves: state.foreign_reserves,
      public_support: state.public_support,
      credit_rating: state.credit_rating,
      market: { ...state.market }
    };

    // 随机事件
    const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];

    // 随机政策池
    const policies = getRandomPolicies(3);
    const chosenPolicy = strategyFn(state, policies) || policies[0];

    // ── 执行回合 ──

    // 1. 事件影响
    const eventEffects = { ...event.effects };
    state = applyEffects(state, eventEffects);

    // 2. 政策影响
    state = applyEffects(state, chosenPolicy.effects);

    // 3. 市场Tick
    state.market = tickMarket(state.market);
    state = applyExchangeRateCoupling(state);

    // 4. 投机者AI
    const specResult = runSpeculatorAI(state, turn, consecutiveAttacks);
    consecutiveAttacks = specResult.consecutiveAttacks;
    state = applyEffects(state, specResult.effects);
    state = applyExchangeRateCoupling(state);

    // 5. 数值联动
    state = applyExchangeRateCoupling(state);

    // ── 计算变化 ──
    const changes = {
      foreign_reserves: state.foreign_reserves - startState.foreign_reserves,
      public_support: state.public_support - startState.public_support,
      credit_rating: state.credit_rating - startState.credit_rating,
    };

    // 检查胜负
    const result = checkGameOver(state);
    state.phase = result.phase;

    // 连胜计数
    if (state.foreign_reserves > 60 && state.public_support > 60 && state.credit_rating > 60) {
      state.winStreak++;
    } else {
      state.winStreak = 0;
    }

    // 记录本回合
    days.push({
      day: turn,
      startState: {
        foreign_reserves: startState.foreign_reserves,
        public_support: startState.public_support,
        credit_rating: startState.credit_rating,
        exchange_rate: parseFloat(startState.market.exchange_rate.toFixed(3)),
        inflation: parseFloat(startState.market.inflation.toFixed(1)),
        volatility: parseFloat(startState.market.volatility.toFixed(3)),
      },
      event: { id: event.id, name: event.name, severity: event.severity },
      policy: { id: chosenPolicy.id, name: chosenPolicy.name },
      changes,
      endState: {
        foreign_reserves: state.foreign_reserves,
        public_support: state.public_support,
        credit_rating: state.credit_rating,
        exchange_rate: parseFloat(state.market.exchange_rate.toFixed(3)),
        inflation: parseFloat(state.market.inflation.toFixed(1)),
        volatility: parseFloat(state.market.volatility.toFixed(3)),
      },
      speculatorAction: { name: specResult.name, type: specResult.type },
    });

    if (result.phase !== 'playing') {
      return {
        sessionId,
        strategy: strategyName,
        initialState: {
          foreign_reserves: 100,
          public_support: 75,
          credit_rating: 65,
          exchange_rate: 1.0,
          inflation: 18,
          volatility: 0.15,
        },
        days,
        finalResult: {
          outcome: result.phase,
          survivalDays: turn,
          finalState: {
            foreign_reserves: state.foreign_reserves,
            public_support: state.public_support,
            credit_rating: state.credit_rating,
            exchange_rate: parseFloat(state.market.exchange_rate.toFixed(3)),
          },
          reason: result.reason,
        }
      };
    }

    state.turn++;
  }
}

// ──────────────────────────────────────────────
// 主程序
// ──────────────────────────────────────────────

function main() {
  console.log('🎮 生成模拟游戏运行日志...\n');

  const sessions = [];

  // 每种策略4局，共12局
  const strategies = [
    { fn: strategyRandom, name: '随机选择' },
    { fn: strategySteady, name: '稳健策略' },
    { fn: strategyAggressive, name: '激进策略' },
  ];

  for (const strategy of strategies) {
    for (let i = 1; i <= 4; i++) {
      const sessionId = `${strategy.name}_${i}`;
      console.log(`  模拟: ${sessionId}`);
      const session = simulateSession(sessionId, strategy.fn, strategy.name);
      sessions.push(session);
    }
  }

  // 统计摘要
  const summary = {
    totalSessions: sessions.length,
    byStrategy: {},
    overall: {
      victories: 0,
      defeats: 0,
      avgSurvival: 0,
      survivalDays: sessions.map(s => s.finalResult.survivalDays),
    }
  };

  for (const strategy of strategies) {
    const strategySessions = sessions.filter(s => s.strategy === strategy.name);
    const victories = strategySessions.filter(s => s.finalResult.outcome === 'victory').length;
    const defeats = strategySessions.filter(s => s.finalResult.outcome === 'defeat').length;
    const survivalDays = strategySessions.map(s => s.finalResult.survivalDays);
    const totalSurvival = survivalDays.reduce((a, b) => a + b, 0);
    const avgSurvival = totalSurvival / survivalDays.length;

    summary.byStrategy[strategy.name] = {
      total: strategySessions.length,
      victories,
      defeats,
      winRate: ((victories / strategySessions.length) * 100).toFixed(1) + '%',
      avgSurvival: Number(avgSurvival.toFixed(1)),
      minSurvival: Math.min(...survivalDays),
      maxSurvival: Math.max(...survivalDays),
    };
  }

  summary.overall.victories = sessions.filter(s => s.finalResult.outcome === 'victory').length;
  summary.overall.defeats = sessions.filter(s => s.finalResult.outcome === 'defeat').length;
  summary.overall.avgSurvival = (summary.overall.survivalDays.reduce((a, b) => a + b, 0) / sessions.length).toFixed(1);

  // 输出
  const output = { sessions, summary };

  const outputPath = path.join(__dirname, '..', 'export', 'game-sessions.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

  console.log('\n✅ 生成完成！');
  console.log(`📁 文件: ${outputPath}`);
  console.log(`\n📊 统计摘要:`);
  console.log(`   总局数: ${summary.totalSessions}`);
  console.log(`   胜利: ${summary.overall.victories} | 失败: ${summary.overall.defeats}`);
  console.log(`   平均存活: ${summary.overall.avgSurvival} 天`);

  for (const [name, stats] of Object.entries(summary.byStrategy)) {
    console.log(`\n   ${name}:`);
    console.log(`     胜率: ${stats.winRate} | 平均存活: ${stats.day}天`);
    console.log(`     存活范围: ${stats.minSurvival}-${stats.maxSurvival}天`);
  }

  return output;
}

main();
