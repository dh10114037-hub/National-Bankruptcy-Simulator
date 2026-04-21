#!/usr/bin/env node

/**
 * 游戏分析数据包生成器
 * 生成完整的游戏数据用于外部分析与优化
 */

const fs = require('fs');
const path = require('path');

// ──────────────────────────────────────────────
// 核心类型定义
// ──────────────────────────────────────────────

const ALL_POLICIES = [
  { id: 'tax_increase', name: '提高税收', effects: { foreign_reserves: 10, public_support: -8 }, tip: '当外储低于40且民心还在60+时', recommendation: 'balanced' },
  { id: 'print_money', name: '增发货币', effects: { foreign_reserves: 15, credit_rating: -10 }, tip: '仅在外储极度紧张时使用', recommendation: 'negative' },
  { id: 'cut_welfare', name: '削减福利', effects: { foreign_reserves: 12, public_support: -8 }, tip: '仅在外储告急且民心仍在50+时', recommendation: 'negative' },
  { id: 'imf_bailout', name: 'IMF援助', effects: { foreign_reserves: 25, credit_rating: 5, public_support: -6 }, tip: '外储危急时最佳续命选择', recommendation: 'survival' },
  { id: 'raise_interest', name: '紧急加息', effects: { foreign_reserves: 8, credit_rating: 8, public_support: -4 }, tip: '信用和外储都偏低时的优质选择', recommendation: 'balanced' },
  { id: 'capital_control', name: '资本管制', effects: { foreign_reserves: 12, credit_rating: -8, public_support: -3 }, tip: '汇率暴跌危机中短期使用有效', recommendation: 'survival' },
  { id: 'emergency_bond', name: '紧急国债', effects: { foreign_reserves: 18, credit_rating: -6 }, tip: '外储告急但民心脆弱时的好选择', recommendation: 'balanced' },
  { id: 'economic_reform', name: '结构改革', effects: { credit_rating: 15, public_support: 5, foreign_reserves: -8 }, tip: '信用低于40时的最佳修复手段', recommendation: 'growth' },
  { id: 'public_speech', name: '鼓舞演讲', effects: { public_support: 12, credit_rating: -2 }, tip: '民心低于40时必须使用', recommendation: 'survival' },
  { id: 'sell_assets', name: '出售资产', effects: { foreign_reserves: 20, public_support: -7, credit_rating: -4 }, tip: '外储急需补充但信用已低时', recommendation: 'survival' },
  { id: 'welfare_spending', name: '发放民生补贴', effects: { public_support: 8, foreign_reserves: -6, credit_rating: -2 }, tip: '民心低于50且外储充足时首选', recommendation: 'survival' },
  { id: 'welfare_reform', name: '推进福利改革', effects: { public_support: 6, foreign_reserves: 5, credit_rating: 3 }, tip: '局势稳定期使用', recommendation: 'growth' },
  { id: 'national_celebration', name: '举行国庆庆典', effects: { public_support: 10, credit_rating: -1 }, tip: '紧急稳定民心时的快速选项', recommendation: 'survival' },
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

function getRandomItems(arr, count = 3) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
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
  const { exchange_rate, volatility } = market;

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

  if (consecutiveAttacks >= 2) return { name: '获利了结', effects: {}, type: 'wait' };

  if (market.exchange_rate < 0.75 && market.volatility > 0.45) {
    return { name: '做空货币', effects: { exchange_rate: -0.07 * mult, inflation: 5 * mult, volatility: 0.07 * mult }, type: 'short_currency' };
  }
  if (credit_rating < 35) {
    return { name: '攻击债市', effects: { credit_rating: -5 * mult, inflation: 3 * mult }, type: 'attack_bonds' };
  }
  if (public_support < 40) {
    return { name: '散布恐慌', effects: { public_support: Math.round(-5 * mult), volatility: 0.04 * mult }, type: 'spread_rumor' };
  }
  if (foreign_reserves < 20 && credit_rating < 45) {
    return { name: '高杠杆做空', effects: { exchange_rate: -0.10 * mult, credit_rating: -4 * mult, volatility: 0.10 * mult }, type: 'leverage_short' };
  }
  if (market.inflation > 55) {
    return { name: '做空货币(通胀)', effects: { exchange_rate: -0.05 * mult, inflation: 3 * mult }, type: 'short_currency' };
  }
  if (foreign_reserves < 30 && credit_rating < 40 && public_support < 40) {
    return { name: '协同猎杀', effects: { exchange_rate: -0.08 * mult, credit_rating: -4 * mult, public_support: -3 * mult, volatility: 0.08 * mult }, type: 'leverage_short' };
  }
  if (market.volatility < 0.3) {
    return { name: '观望待机', effects: {}, type: 'wait' };
  }
  return { name: '小幅做空', effects: { exchange_rate: -0.02 * mult, volatility: 0.01 * mult }, type: 'short_currency' };
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

function createInitialState() {
  return {
    foreign_reserves: 100,
    public_support: 75,
    credit_rating: 65,
    turn: 1,
    maxTurns: 30,
    phase: 'playing',
    winStreak: 0,
    market: { exchange_rate: 1.0, volatility: 0.15, inflation: 18 },
  };
}

// ──────────────────────────────────────────────
// 玩家策略
// ──────────────────────────────────────────────

function strategyNovice(policies) {
  return policies[Math.floor(Math.random() * policies.length)];
}

function strategyNormal(state, policies) {
  const withTips = policies.filter(p => p.tip);
  if (withTips.length > 0 && Math.random() > 0.3) {
    return withTips[Math.floor(Math.random() * withTips.length)];
  }
  return policies[Math.floor(Math.random() * policies.length)];
}

function strategyRational(state, policies) {
  const { foreign_reserves, public_support, credit_rating } = state;

  if (public_support < 40) {
    const welfare = policies.find(p => p.effects && p.effects.public_support && p.effects.public_support > 8);
    if (welfare) return welfare;
  }
  if (public_support < 50) {
    const welfare = policies.find(p => ['welfare_spending', 'national_celebration', 'public_speech'].includes(p.id));
    if (welfare) return welfare;
  }
  if (foreign_reserves < 30) {
    const rescue = policies.find(p => p.effects && p.effects.foreign_reserves && p.effects.foreign_reserves > 15);
    if (rescue) return rescue;
  }
  if (credit_rating < 40) {
    const repair = policies.find(p => p.effects && p.effects.credit_rating && p.effects.credit_rating > 10);
    if (repair) return repair;
  }
  const interest = policies.find(p => p.id === 'raise_interest');
  if (interest) return interest;
  return policies[0];
}

// 激进策略
function strategyAggressive(state, policies) {
  const { foreign_reserves } = state;
  const highReserves = policies.filter(p => p.effects && p.effects.foreign_reserves && p.effects.foreign_reserves > 15);
  if (highReserves.length > 0) return highReserves[0];
  return policies[0];
}

// 保守策略
function strategyConservative(state, policies) {
  const balanced = policies.find(p => p.recommendation === 'balanced');
  if (balanced) return balanced;
  const growth = policies.find(p => p.recommendation === 'growth');
  if (growth) return growth;
  return policies[0];
}

// ──────────────────────────────────────────────
// 游戏模拟
// ──────────────────────────────────────────────

function simulateGame(gameId, strategyFn, strategyName) {
  let consecutiveAttacks = 0;
  let state = createInitialState();
  const log = [];

  while (state.phase === 'playing') {
    const turn = state.turn;
    const stateBefore = {
      foreign_reserves: state.foreign_reserves,
      public_support: state.public_support,
      credit_rating: state.credit_rating,
      market: { ...state.market }
    };

    // 随机事件
    const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    state = applyEffects(state, event.effects);

    // 随机政策
    const policies = getRandomItems(ALL_POLICIES, 3);
    let chosen = strategyFn(state, policies);
    if (!chosen) chosen = policies[0]; // 防御：确保有政策可选

    // 应用政策
    state = applyEffects(state, chosen.effects);

    // 市场Tick
    state.market = tickMarket(state.market);
    state = applyExchangeRateCoupling(state);

    // 投机者AI
    const specAction = runSpeculatorAI(state, turn, consecutiveAttacks);
    consecutiveAttacks = specAction.type !== 'wait' ? consecutiveAttacks + 1 : 0;
    state = applyEffects(state, specAction.effects);
    state = applyExchangeRateCoupling(state);

    // 检查胜负
    const result = checkGameOver(state);
    state.phase = result.phase;

    if (state.foreign_reserves > 60 && state.public_support > 60 && state.credit_rating > 60) {
      state.winStreak++;
    } else {
      state.winStreak = 0;
    }

    const stateAfter = {
      foreign_reserves: state.foreign_reserves,
      public_support: state.public_support,
      credit_rating: state.credit_rating,
      market: { ...state.market }
    };

    const netChange = {
      foreign_reserves: stateAfter.foreign_reserves - stateBefore.foreign_reserves,
      public_support: stateAfter.public_support - stateBefore.public_support,
      credit_rating: stateAfter.credit_rating - stateBefore.credit_rating,
    };

    log.push({
      turn,
      event: { id: event.id, name: event.name, severity: event.severity },
      policy: { id: chosen.id, name: chosen.name },
      stateBefore,
      stateAfter,
      netChange,
      speculator: { name: specAction.name, type: specAction.type }
    });

    if (result.phase !== 'playing') {
      return {
        gameId,
        strategy: strategyName,
        totalTurns: turn,
        result: result.phase,
        reason: result.reason,
        finalState: stateAfter,
        log
      };
    }

    state.turn++;
  }
}

// ──────────────────────────────────────────────
// 主程序：生成分析数据包
// ──────────────────────────────────────────────

function generateAnalysisPackage() {
  console.log('🎮 生成游戏分析数据包...\n');

  const packageData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      description: '破产边缘游戏系统分析数据包'
    },

    // 模块结构
    moduleStructure: {
      savior: {
        name: '拯救者模式',
        description: '扮演政府决策者，对抗投机者AI',
        pc: {
          layout: '三栏网格布局',
          modules: ['Header', 'EventPanel', 'DecisionPanel', 'DataPanel', 'AdvisorPanel', 'RiskSourcePanel']
        },
        h5: {
          layout: '入口模式 + BottomSheet详情',
          modules: ['MobileTopStatus', 'SaviorActionHub', 'StatusCard', 'RiskAlerts', 'BottomSheet']
        }
      },
      speculator: {
        name: '投机者模式',
        description: '操控市场，从危机中获利',
        pc: {
          layout: '三栏网格布局',
          modules: ['SpecHeader', 'OpportunityPanel', 'IntelPanel', 'TradePanel', 'ManipulationPanel']
        },
        h5: {
          layout: '单列布局',
          modules: ['SpecHeader', 'OpportunityPanel', 'IntelPanel', 'TradePanel']
        }
      },
      versus: {
        name: '对抗模式',
        description: '双人博弈',
        pc: {
          layout: '双栏布局',
          modules: ['VersusHeader', 'MainArena', 'VersusAdvisor', 'VersusAssets']
        },
        h5: {
          layout: '单列布局',
          modules: ['VersusHeader', 'MainArena', 'VersusAdvisor']
        }
      }
    },

    // 游戏配置数据
    gameConfig: {
      initialState: {
        foreign_reserves: 100,
        public_support: 75,
        credit_rating: 65,
        maxTurns: 30,
        market: {
          exchange_rate: 1.0,
          volatility: 0.15,
          inflation: 18
        }
      },
      victoryConditions: [
        '坚持30个月且三指标均>60 → 胜利',
        '连续3个月三指标均>60 → 胜利'
      ],
      defeatConditions: [
        '外汇储备≤0 → 破产',
        '民众支持≤0 → 社会崩溃',
        '国家信用≤0 → 经济崩溃',
        '汇率<0.3 → 本币崩溃',
        '30回合后未达标 → 衰退'
      ]
    },

    // 政策数据
    policies: ALL_POLICIES.map(p => ({
      id: p.id,
      name: p.name,
      effects: p.effects,
      recommendation: p.recommendation,
      tip: p.tip
    })),

    // 事件数据
    events: EVENTS.map(e => ({
      id: e.id,
      name: e.name,
      severity: e.severity,
      effects: e.effects
    })),

    // 游戏日志（10+局）
    gameLogs: [],

    // 统计摘要
    statistics: {}
  };

  // 生成多种策略的游戏日志
  const strategies = [
    { fn: strategyNovice, name: '新手玩家(随机)' },
    { fn: strategyNormal, name: '普通玩家(参考提示)' },
    { fn: strategyRational, name: '理性玩家(优化指标)' },
    { fn: strategyAggressive, name: '激进玩家(追求外储)' },
    { fn: strategyConservative, name: '保守玩家(均衡发展)' },
  ];

  // 每个策略模拟3局，共15局
  for (let s = 0; s < strategies.length; s++) {
    for (let i = 1; i <= 3; i++) {
      const gameId = `game_${String(s * 3 + i).padStart(3, '0')}`;
      const result = simulateGame(gameId, strategies[s].fn, strategies[s].name);
      packageData.gameLogs.push(result);
    }
  }

  // 统计摘要
  const stats = {
    totalGames: packageData.gameLogs.length,
    byStrategy: {},
    overall: { victories: 0, defeats: 0, avgTurns: 0 }
  };

  for (const s of strategies) {
    const games = packageData.gameLogs.filter(g => g.strategy === s.name);
    const victories = games.filter(g => g.result === 'victory').length;
    stats.byStrategy[s.name] = {
      total: games.length,
      victories,
      defeats: games.length - victories,
      winRate: (victories / games.length * 100).toFixed(1) + '%',
      avgTurns: (games.reduce((sum, g) => sum + g.totalTurns, 0) / games.length).toFixed(1)
    };
  }

  stats.overall.victories = packageData.gameLogs.filter(g => g.result === 'victory').length;
  stats.overall.defeats = packageData.gameLogs.filter(g => g.result === 'defeat').length;
  stats.overall.avgTurns = (packageData.gameLogs.reduce((sum, g) => sum + g.totalTurns, 0) / packageData.gameLogs.length).toFixed(1);

  packageData.statistics = stats;

  // 输出结果
  const outputDir = path.join(__dirname, '..', 'export');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'game-analysis-package.json');
  fs.writeFileSync(outputPath, JSON.stringify(packageData, null, 2), 'utf-8');

  console.log('✅ 分析数据包生成完成！');
  console.log(`📁 文件位置: ${outputPath}`);
  console.log(`\n📊 统计摘要:`);
  console.log(`   总游戏局数: ${stats.totalGames}`);
  console.log(`   总胜利: ${stats.overall.victories} | 总失败: ${stats.overall.defeats}`);
  console.log(`   平均存活回合: ${stats.overall.avgTurns}`);
  console.log('\n各策略表现:');
  for (const [name, data] of Object.entries(stats.byStrategy)) {
    console.log(`   ${name}: 胜率${data.winRate} | 平均${data.avgTurns}回合`);
  }

  return packageData;
}

generateAnalysisPackage();
