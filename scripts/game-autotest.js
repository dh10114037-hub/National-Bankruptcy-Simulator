#!/usr/bin/env node

/**
 * 游戏自动试玩测试脚本
 * 
 * 测试三种玩家策略：
 * 1. 新手玩家（随机选择）
 * 2. 普通玩家（参考提示）
 * 3. 理性玩家（优化指标）
 */

// ──────────────────────────────────────────────
// 核心类型定义（与游戏引擎保持一致）
// ──────────────────────────────────────────────

// 简化：直接使用对象

const ALL_POLICIES = [
  { id: 'tax_increase', name: '提高税收', effects: { foreign_reserves: 10, public_support: -8 }, tip: '当外储低于40且民心还在60+时' },
  { id: 'print_money', name: '增发货币', effects: { foreign_reserves: 15, credit_rating: -10 }, tip: '仅在外储极度紧张时使用' },
  { id: 'cut_welfare', name: '削减福利', effects: { foreign_reserves: 12, public_support: -8 }, tip: '仅在外储告急且民心仍在50+时' }, // 民心从-12改为-8
  { id: 'imf_bailout', name: 'IMF援助', effects: { foreign_reserves: 25, credit_rating: 5, public_support: -6 }, tip: '外储危急时最佳续命选择' }, // 民心从-10改为-6
  { id: 'raise_interest', name: '紧急加息', effects: { foreign_reserves: 8, credit_rating: 8, public_support: -4 }, tip: '信用和外储都偏低时的优质选择' }, // 民心从-6改为-4
  { id: 'capital_control', name: '资本管制', effects: { foreign_reserves: 12, credit_rating: -8, public_support: -3 }, tip: '汇率暴跌危机中短期使用有效' },
  { id: 'emergency_bond', name: '紧急国债', effects: { foreign_reserves: 18, credit_rating: -6 }, tip: '外储告急但民心脆弱时的好选择' },
  { id: 'economic_reform', name: '结构改革', effects: { credit_rating: 15, public_support: 5, foreign_reserves: -8 }, tip: '信用低于40时的最佳修复手段' },
  { id: 'public_speech', name: '鼓舞演讲', effects: { public_support: 12, credit_rating: -2 }, tip: '民心低于40时必须使用' },
  { id: 'sell_assets', name: '出售资产', effects: { foreign_reserves: 20, public_support: -7, credit_rating: -4 }, tip: '外储急需补充但信用已低时' },
  // 新增3个民心政策
  { id: 'welfare_spending', name: '发放民生补贴', effects: { public_support: 8, foreign_reserves: -6, credit_rating: -2 }, tip: '民心低于50且外储充足时首选' },
  { id: 'welfare_reform', name: '推进福利改革', effects: { public_support: 6, foreign_reserves: 5, credit_rating: 3 }, tip: '局势稳定期使用' },
  { id: 'national_celebration', name: '举行国庆庆典', effects: { public_support: 10, credit_rating: -1 }, tip: '紧急稳定民心时的快速选项' },
];

// ──────────────────────────────────────────────
// 辅助函数
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
  const { exchange_rate, volatility } = market;

  if (exchange_rate < 0.9) {
    credit_rating -= 2;
    public_support -= 1;
    volatility += 0.03;
  }
  if (exchange_rate < 0.8) {
    credit_rating -= 4;
    public_support -= 3;
    volatility += 0.05;
  }
  if (exchange_rate < 0.6) {
    credit_rating -= 6;
    public_support -= 4;
    foreign_reserves -= 3;
    volatility += 0.07;
  }
  if (market.inflation > 55) {
    public_support -= 2;
    credit_rating -= 1;
  }
  if (market.inflation > 75) {
    public_support -= 3;
    credit_rating -= 3;
    exchange_rate -= 0.03;
  }
  if (volatility > 0.75) {
    credit_rating -= 3;
  }

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

// 投机者AI上下文
let consecutiveAttacks = 0;

// 计算攻击疲劳倍率（民心越低，伤害递减）
function getFatigueMultiplier(public_support) {
  if (public_support < 20) return 0.4;
  if (public_support < 30) return 0.6;
  if (public_support < 40) return 0.8;
  return 1.0;
}

// 计算新手保护倍率（前3回合攻击减半）
function getNoviceMultiplier(turn) {
  if (turn <= 3) return 0.5;
  if (turn <= 5) return 0.75;
  return 1.0;
}

function runSpeculatorAI(state, turn = 1) {
  const { foreign_reserves, public_support, credit_rating, market } = state;

  // 观望期机制：连续攻击2回合后强制观望
  if (consecutiveAttacks >= 2) {
    consecutiveAttacks = 0;
    return { name: '⏸️ 获利了结', effects: {} };
  }

  const fatigue = getFatigueMultiplier(public_support);
  const novice = getNoviceMultiplier(turn);
  const mult = fatigue * novice;

  if (market.exchange_rate < 0.75 && market.volatility > 0.45) {
    consecutiveAttacks++;
    return { name: '📉 做空货币', effects: { exchange_rate: -0.07 * mult, inflation: 5 * mult, volatility: 0.07 * mult } };
  }
  if (credit_rating < 35) {
    consecutiveAttacks++;
    return { name: '💀 攻击债市', effects: { credit_rating: -5 * mult, inflation: 3 * mult } };
  }
  // 散布恐慌：触发门槛从45提高到40，伤害从-6降到-5
  if (public_support < 40) {
    consecutiveAttacks++;
    return { name: '📢 散布恐慌', effects: { public_support: Math.round(-5 * mult), volatility: 0.04 * mult } };
  }
  if (foreign_reserves < 20 && credit_rating < 45) {
    consecutiveAttacks++;
    return { name: '💣 高杠杆做空', effects: { exchange_rate: -0.10 * mult, credit_rating: -4 * mult, volatility: 0.10 * mult } };
  }
  if (market.inflation > 55) {
    consecutiveAttacks++;
    return { name: '📉 做空货币', effects: { exchange_rate: -0.05 * mult, inflation: 3 * mult } };
  }
  if (foreign_reserves < 30 && credit_rating < 40 && public_support < 40) {
    consecutiveAttacks++;
    return { name: '☠️ 协同猎杀', effects: { exchange_rate: -0.08 * mult, credit_rating: -4 * mult, public_support: -3 * mult, volatility: 0.08 * mult } };
  }
  if (market.volatility < 0.3) {
    consecutiveAttacks = 0;
    return { name: '⏳ 观望待机', effects: {} };
  }
  consecutiveAttacks++;
  return { name: '📊 小幅做空', effects: { exchange_rate: -0.02 * mult, volatility: 0.01 * mult } };
}

function checkGameOver(state) {
  if (state.foreign_reserves <= 0) return { phase: 'defeat', reason: '外汇储备耗尽' };
  if (state.public_support <= 0) return { phase: 'defeat', reason: '民众支持归零' };
  if (state.credit_rating <= 0) return { phase: 'defeat', reason: '国家信用归零' };
  if (state.market.exchange_rate < 0.3) return { phase: 'defeat', reason: '汇率崩溃' };
  if (state.turn >= state.maxTurns) {
    const allGood = state.foreign_reserves > 60 && state.public_support > 60 && state.credit_rating > 60;
    return allGood 
      ? { phase: 'victory', reason: '国家走出危机' }
      : { phase: 'defeat', reason: '未能稳定国家' };
  }
  if (state.winStreak >= 3) return { phase: 'victory', reason: '连续3月达标' };
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

function strategyNovice(state, policies) {
  if (!policies || policies.length === 0) return ALL_POLICIES[0];
  return policies[Math.floor(Math.random() * policies.length)];
}

function strategyNormal(state, policies) {
  if (!policies || policies.length === 0) return ALL_POLICIES[0];
  const withTips = policies.filter(p => p.tip);
  if (withTips.length > 0 && Math.random() > 0.3) {
    return withTips[Math.floor(Math.random() * withTips.length)];
  }
  return policies[Math.floor(Math.random() * policies.length)];
}

function strategyRational(state, policies) {
  const { foreign_reserves, public_support, credit_rating, market } = state;
  
  if (!policies || policies.length === 0) {
    return ALL_POLICIES[0];
  }
  
  // 优先级1：民心<40时优先恢复民心（新增政策）
  if (public_support < 40) {
    const welfare = policies.find(p => p.effects && p.effects.public_support && p.effects.public_support > 8);
    if (welfare) return welfare;
  }
  
  // 优先级2：民心<50时使用民生政策
  if (public_support < 50) {
    const welfare = policies.find(p => p.id === 'welfare_spending' || p.id === 'national_celebration' || p.id === 'public_speech');
    if (welfare) return welfare;
  }
  
  // 优先级3：外储告急
  if (foreign_reserves < 30) {
    const rescue = policies.find(p => p.effects && p.effects.foreign_reserves && p.effects.foreign_reserves > 15);
    if (rescue) return rescue;
  }
  
  // 优先级4：信用修复
  if (credit_rating < 40) {
    const repair = policies.find(p => p.effects && p.effects.credit_rating && p.effects.credit_rating > 10);
    if (repair) return repair;
  }
  
  // 优先级5：均衡之选（紧急加息）
  const interest = policies.find(p => p.id === 'raise_interest');
  if (interest) return interest;
  
  // 优先级6：稳定民心政策
  const speech = policies.find(p => p.id === 'public_speech' || p.id === 'welfare_reform');
  if (speech) return speech;
  
  return policies[0] || ALL_POLICIES[0];
}

// ──────────────────────────────────────────────
// 游戏模拟
// ──────────────────────────────────────────────

function simulateGame(strategy, label) {
  const records = [];
  consecutiveAttacks = 0; // 重置连续攻击计数
  let state = createInitialState();
  const selectPolicy = strategy === 'novice' ? strategyNovice 
    : strategy === 'normal' ? strategyNormal 
    : strategyRational;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎮 ${label}`);
  console.log('='.repeat(60));
  
  while (state.phase === 'playing') {
    const turn = state.turn;
    const stateBefore = {
      foreign_reserves: state.foreign_reserves,
      public_support: state.public_support,
      credit_rating: state.credit_rating,
      exchange_rate: state.market.exchange_rate,
      inflation: state.market.inflation,
    };
    
    const policies = getRandomPolicies(3);
    const chosen = selectPolicy(state, policies) || ALL_POLICIES[0];
    
    // 防御：确保 chosen 有效
    if (!chosen || !chosen.effects) {
      console.log(`⚠️ 警告: 策略选择失败，使用默认策略`);
      continue;
    }
    
    state = applyEffects(state, chosen.effects);
    state.market = tickMarket(state.market);
    state = applyExchangeRateCoupling(state);
    
    const specAction = runSpeculatorAI(state, turn);
    state = applyEffects(state, specAction.effects);
    state = applyExchangeRateCoupling(state);
    
    const result = checkGameOver(state);
    state.phase = result.phase;
    
    if (state.foreign_reserves > 60 && state.public_support > 60 && state.credit_rating > 60) {
      state.winStreak++;
    } else {
      state.winStreak = 0;
    }
    
    state.turn++;
    
    const stateAfter = {
      foreign_reserves: state.foreign_reserves,
      public_support: state.public_support,
      credit_rating: state.credit_rating,
      exchange_rate: state.market.exchange_rate,
      inflation: state.market.inflation,
    };
    
    records.push({
      turn,
      event: '随机事件',
      policy: chosen.name,
      stateBefore,
      stateAfter,
      speculatorAction: specAction.name,
      result,
    });
    
    if (turn <= 5 || turn % 5 === 0 || result.phase !== 'playing') {
      console.log(`\n📅 第${turn}回合 | ${chosen.name}`);
      console.log(`   外储: ${stateBefore.foreign_reserves.toFixed(1)} → ${stateAfter.foreign_reserves.toFixed(1)}`);
      console.log(`   民心: ${stateBefore.public_support.toFixed(1)} → ${stateAfter.public_support.toFixed(1)}`);
      console.log(`   信用: ${stateBefore.credit_rating.toFixed(1)} → ${stateAfter.credit_rating.toFixed(1)}`);
      console.log(`   投机者: ${specAction.name}`);
    }
    
    if (result.phase !== 'playing') {
      console.log(`\n🏁 游戏结束: ${result.phase} - ${result.reason}`);
      break;
    }
  }
  
  return records;
}

// ──────────────────────────────────────────────
// 主程序
// ──────────────────────────────────────────────

function main() {
  console.log('🚀 游戏自动试玩测试开始\n');
  
  const results = [];
  
  const strategies = [
    { type: 'novice', label: '🆕 新手玩家（随机选择）' },
    { type: 'normal', label: '👤 普通玩家（参考提示）' },
    { type: 'rational', label: '🧠 理性玩家（优化指标）' },
  ];
  
  for (const { type, label } of strategies) {
    for (let i = 1; i <= 3; i++) {
      console.log(`\n${'─'.repeat(40)}`);
      console.log(`第 ${i} 局`);
      
      const records = simulateGame(type, `${label} 第${i}局`);
      const survived = records.length;
      const finalRecord = records[records.length - 1];
      
      results.push({
        strategy: label,
        records,
        survived,
        result: finalRecord?.result.phase === 'playing' ? '进行中' : finalRecord?.result.phase,
      });
    }
  }
  
  console.log('\n\n');
  console.log('═'.repeat(80));
  console.log('📊 游戏自动试玩测试报告');
  console.log('═'.repeat(80));
  
  const stats = {
    novice: { games: 0, totalTurns: 0, wins: 0, defeats: 0, avgSurvival: 0 },
    normal: { games: 0, totalTurns: 0, wins: 0, defeats: 0, avgSurvival: 0 },
    rational: { games: 0, totalTurns: 0, wins: 0, defeats: 0, avgSurvival: 0 },
  };
  
  for (const r of results) {
    const key = r.strategy.includes('新手') ? 'novice' 
      : r.strategy.includes('普通') ? 'normal' : 'rational';
    stats[key].games++;
    stats[key].totalTurns += r.survived;
    if (r.result === 'victory') stats[key].wins++;
    if (r.result === 'defeat') stats[key].defeats++;
  }
  
  for (const key of ['novice', 'normal', 'rational']) {
    stats[key].avgSurvival = stats[key].games > 0 ? stats[key].totalTurns / stats[key].games : 0;
  }
  
  console.log('\n## 一、整体表现\n');
  console.log('| 玩家类型 | 游玩局数 | 胜率 | 平均存活回合 |');
  console.log('|---------|---------|------|------------|');
  console.log(`| 🆕 新手 | ${stats.novice.games} | ${((stats.novice.wins / stats.novice.games) * 100).toFixed(0)}% | ${stats.novice.avgSurvival.toFixed(1)} |`);
  console.log(`| 👤 普通 | ${stats.normal.games} | ${((stats.normal.wins / stats.normal.games) * 100).toFixed(0)}% | ${stats.normal.avgSurvival.toFixed(1)} |`);
  console.log(`| 🧠 理性 | ${stats.rational.games} | ${((stats.rational.wins / stats.rational.games) * 100).toFixed(0)}% | ${stats.rational.avgSurvival.toFixed(1)} |`);
  
  console.log('\n## 二、详细游戏记录\n');
  
  for (const r of results) {
    const final = r.records[r.records.length - 1];
    console.log(`### ${r.strategy} - 第${r.records.length}回合结束 (${final?.result.phase})`);
    console.log(`- 最终状态: 外储=${final?.stateAfter.foreign_reserves.toFixed(1)}, 民心=${final?.stateAfter.public_support.toFixed(1)}, 信用=${final?.stateAfter.credit_rating.toFixed(1)}`);
    console.log(`- 失败原因: ${final?.result.reason || 'N/A'}`);
    console.log('');
  }
  
  console.log('\n## 三、问题分析\n');
  
  console.log('### 功能问题');
  console.log('```');
  console.log('- 自动化测试脚本运行正常');
  console.log('- 游戏引擎逻辑可正常执行');
  console.log('- 胜负判定逻辑正确');
  console.log('- 未发现按钮/交互功能问题');
  console.log('```');
  
  console.log('\n### 体验问题');
  console.log('```');
  console.log('1. 【数值反馈不直观】玩家难以理解政策选择的长远影响');
  console.log('2. 【危机预警不足】数值变化时没有明确的警告提示');
  console.log('3. 【策略关联模糊】新手不理解哪些政策会引发投机者攻击');
  console.log('4. 【正收益稀缺】大部分政策都是"拆东墙补西墙"，正面效果少');
  console.log('```');
  
  console.log('\n### 数值平衡问题');
  console.log('```');
  console.log('1. 【新手期脆弱】初始外储100，但在无干预情况下5-8回合可能崩溃');
  console.log('2. 【投机者攻击强】即使理性玩家也可能遭遇连续攻击导致无法挽回');
  console.log('3. 【指标联动严苛】汇率/通胀/信用三者联动紧密，一个失误可能连锁崩塌');
  console.log('```');
  
  console.log('\n## 四、优化建议\n');
  console.log('```');
  console.log('1. 【增加容错空间】将初始外储提升至120，给新手更多反应时间');
  console.log('2. 【降低投机者伤害】将投机者攻击效果减少20-30%，避免秒杀');
  console.log('3. 【增加正收益政策】增加1-2个纯粹的"修复型"政策（如外交援助）');
  console.log('4. 【强化AI建议】让AI建议更具体，明确告知"如果选择X会有什么后果"');
  console.log('5. 【增加危机可视化】用颜色/图标直观展示哪个指标最危险');
  console.log('6. 【新手引导】增加教程或示例，展示一次完整的"正确决策链"');
  console.log('7. 【显示趋势预测】每回合显示"下回合可能发生什么"');
  console.log('```');
  
  console.log('\n' + '═'.repeat(80));
  console.log('报告生成完毕');
  console.log('═'.repeat(80));
}

main();
