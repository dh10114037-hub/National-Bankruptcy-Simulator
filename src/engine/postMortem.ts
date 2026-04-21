/**
 * 失败复盘分析引擎
 * 分析日志和最终状态，生成完整复盘报告
 */

import type { GameState, LogEntry, PostMortem, PostMortemEvent } from '../types/game';

// ── 主因分析 ─────────────────────────────────────────────────

function analyzePrimaryCause(state: GameState): PostMortem['primaryCause'] {
  const defeatReason = state.defeatReason ?? '';

  if (defeatReason.includes('外汇') || state.foreign_reserves <= 2) {
    return {
      label: '外汇储备耗尽',
      icon: '💰',
      description: '外汇储备跌至零点，国家失去偿还外债和进口必需品的能力，宣告破产。',
    };
  }
  if (defeatReason.includes('民众') || state.public_support <= 2) {
    return {
      label: '民众支持崩溃',
      icon: '✊',
      description: '民众支持归零，社会秩序彻底崩溃，政府失去执政合法性。',
    };
  }
  if (defeatReason.includes('信用') || state.credit_rating <= 2) {
    return {
      label: '国家信用归零',
      icon: '🏦',
      description: '国家信用评级跌至最低，国际融资渠道全部关闭，经济陷入死局。',
    };
  }
  if (defeatReason.includes('汇率')) {
    return {
      label: '汇率崩溃',
      icon: '📉',
      description: '本币汇率暴跌至危机水平，进口成本飙升，通胀失控，经济瓦解。',
    };
  }
  // 30回合未达标
  return {
    label: '长期积贫',
    icon: '🕰️',
    description: '30个月内未能将三项核心指标稳定在60以上，国家缓慢走向衰退。',
  };
}

// ── 次因分析 ─────────────────────────────────────────────────

function analyzeSecondaryCauses(
  state: GameState,
  log: LogEntry[]
): PostMortem['secondaryCauses'] {
  const causes: PostMortem['secondaryCauses'] = [];

  // 通胀失控
  if (state.market.inflation > 60) {
    causes.push({
      label: '通胀长期失控',
      icon: '🔥',
      description: `最终通胀率高达 ${state.market.inflation.toFixed(0)}%，长期侵蚀购买力和国家信用。`,
    });
  }

  // 汇率承压
  if (state.market.exchange_rate < 0.75) {
    causes.push({
      label: '汇率持续贬值',
      icon: '💱',
      description: `汇率跌至 ${state.market.exchange_rate.toFixed(2)}，进口成本大幅上升，外储消耗加速。`,
    });
  }

  // 投机者多次出手
  const specCount = log.filter((e) => e.speculatorAction && !e.speculatorAction.includes('观望')).length;
  if (specCount >= 5) {
    causes.push({
      label: `投机者多次攻击（${specCount}次）`,
      icon: '🐺',
      description: '指标长期偏低为投机者提供了反复做空机会，造成累积伤害。',
    });
  }

  // 连续损耗某指标
  const lastFive = log.slice(0, 5);
  const frDrops = lastFive.filter((e) => (e.netChange.foreign_reserves ?? 0) < -5).length;
  if (frDrops >= 4) {
    causes.push({
      label: '外储连续失血',
      icon: '⚠️',
      description: '最后5回合中有4回合外储净下降，未能及时止血。',
    });
  }

  return causes.slice(0, 3);
}

// ── 崩溃路径时间线 ─────────────────────────────────────────

function buildTimeline(log: LogEntry[], state: GameState): PostMortemEvent[] {
  const events: PostMortemEvent[] = [];
  const reversed = [...log].reverse(); // log 是倒序存的，reversed = 正序

  // 挑选关键节点
  for (const entry of reversed) {
    const frAfter = entry.statsAfter.foreign_reserves;
    const psAfter = entry.statsAfter.public_support;
    const crAfter = entry.statsAfter.credit_rating;
    const frBefore = entry.statsBefore.foreign_reserves;
    const psBefore = entry.statsBefore.public_support;
    const crBefore = entry.statsBefore.credit_rating;

    // 外储首次进入危险区
    if (frBefore >= 30 && frAfter < 30) {
      events.push({
        turn: entry.turn,
        type: 'crisis',
        icon: '⚠️',
        label: `第${entry.turn}月：外储跌破安全线`,
        detail: `外汇储备从 ${frBefore.toFixed(0)} 降至 ${frAfter.toFixed(0)}，进入危险区域`,
      });
    }

    // 信用首次跌破40
    if (crBefore >= 40 && crAfter < 40) {
      events.push({
        turn: entry.turn,
        type: 'crisis',
        icon: '📉',
        label: `第${entry.turn}月：信用跌破警戒线`,
        detail: `信用评级降至 ${crAfter.toFixed(0)}，投机者开始更频繁攻击`,
      });
    }

    // 民心首次跌破40
    if (psBefore >= 40 && psAfter < 40) {
      events.push({
        turn: entry.turn,
        type: 'crisis',
        icon: '✊',
        label: `第${entry.turn}月：民心进入危险区`,
        detail: `民众支持降至 ${psAfter.toFixed(0)}，社会不稳定信号出现`,
      });
    }

    // 重大单回合损耗
    const frDelta = frAfter - frBefore;
    if (frDelta <= -20) {
      events.push({
        turn: entry.turn,
        type: 'decision',
        icon: entry.policyIcon,
        label: `第${entry.turn}月：执行【${entry.policy}】`,
        detail: `外储单月暴跌 ${Math.abs(frDelta).toFixed(0)}，触发${entry.event}`,
      });
    }

    // 投机者大规模攻击
    if (entry.speculatorAction && entry.speculatorAction.includes('杠杆') || entry.speculatorAction?.includes('协同')) {
      events.push({
        turn: entry.turn,
        type: 'speculator',
        icon: '🐺',
        label: `第${entry.turn}月：投机者发动猛攻`,
        detail: entry.speculatorAction ?? '',
      });
    }
  }

  // 添加终局节点
  events.push({
    turn: state.turn,
    type: 'game_over',
    icon: '💀',
    label: `第${state.turn}月：游戏结束`,
    detail: state.defeatReason ?? '国家陷入不可逆危机',
  });

  // 去重 + 排序（按 turn 升序），最多8条
  const seen = new Set<string>();
  const deduped = events.filter((e) => {
    const key = `${e.turn}-${e.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped.sort((a, b) => a.turn - b.turn).slice(-8);
}

// ── 关键错误决策 ─────────────────────────────────────────────

function analyzeMistakes(
  log: LogEntry[],
  state: GameState
): PostMortem['criticalMistakes'] {
  const mistakes: PostMortem['criticalMistakes'] = [];
  const reversed = [...log].reverse();

  for (const entry of reversed) {
    const { policy, policyIcon, turn, statsBefore, netChange } = entry;

    // 错误1：外储已低，仍选削减民心的政策
    if (
      statsBefore.foreign_reserves < 35 &&
      statsBefore.public_support < 40 &&
      (netChange.public_support ?? 0) < -8
    ) {
      mistakes.push({
        turn,
        policy,
        icon: policyIcon,
        reason: `外储（${statsBefore.foreign_reserves.toFixed(0)}）和民心（${statsBefore.public_support.toFixed(0)}）同时偏低时，选择继续损耗民心是双重危机的导火索`,
      });
    }

    // 错误2：信用已很低，仍选增发货币
    if (statsBefore.credit_rating < 30 && policy.includes('增发货币')) {
      mistakes.push({
        turn,
        policy,
        icon: policyIcon,
        reason: `信用已跌至 ${statsBefore.credit_rating.toFixed(0)}，此时增发货币会进一步摧毁信用，导致融资渠道关闭和投机者集中攻击`,
      });
    }

    // 错误3：通胀高时仍选增发货币
    if (state.market.inflation > 55 && policy.includes('增发货币')) {
      mistakes.push({
        turn,
        policy,
        icon: policyIcon,
        reason: `通胀超过55%时增发货币，直接推升通胀加剧民心流失，形成恶性循环`,
      });
    }

    // 错误4：连续削减福利（3回合内超过2次）
    const recentCuts = reversed
      .filter((e) => e.turn >= turn - 2 && e.turn <= turn && e.policy.includes('削减福利'))
      .length;
    if (recentCuts >= 2 && policy.includes('削减福利')) {
      mistakes.push({
        turn,
        policy,
        icon: policyIcon,
        reason: '短期内连续两次削减福利，民心累计损耗超过20点，超出玩家预期',
      });
    }
  }

  // 去重，最多显示4个
  const seen = new Set<number>();
  return mistakes
    .filter((m) => {
      if (seen.has(m.turn)) return false;
      seen.add(m.turn);
      return true;
    })
    .slice(0, 4);
}

// ── 改进建议 ─────────────────────────────────────────────────

function generateSuggestions(state: GameState, log: LogEntry[]): string[] {
  const suggestions: string[] = [];
  const reversed = [...log].reverse();

  // 分析最终状态给出针对性建议
  const finalFR = state.foreign_reserves;
  const finalPS = state.public_support;
  const finalCR = state.credit_rating;
  const finalInf = state.market.inflation;

  // 外储相关
  if (finalFR < 20) {
    suggestions.push(
      '💰 优先保外储：前期多用【紧急加息】和【申请IMF援助】补充外储，将外储维持在40以上再考虑其他操作'
    );
  }

  // 民心相关
  if (finalPS < 25) {
    suggestions.push(
      '👥 保护民心：连续两回合使用损耗民心的政策前，先用【公开演讲】回血5-10点，避免民心螺旋下降'
    );
  }

  // 信用相关
  if (finalCR < 25) {
    suggestions.push(
      '🏦 信用护盾：信用低于40时，绝对不要选【增发货币】和【资本管制】，应用【经济改革】修复信用'
    );
  }

  // 通胀相关
  if (finalInf > 60) {
    suggestions.push(
      '🔥 控制通胀：通胀超过50时，优先选【紧急加息】而非【增发货币】，避免通胀叠加带来的民心和信用双重损失'
    );
  }

  // 投机者相关
  const specHits = reversed.filter(
    (e) => e.speculatorAction && !e.speculatorAction.includes('观望')
  ).length;
  if (specHits > 6) {
    suggestions.push(
      '🐺 防范投机者：保持信用在45以上、外储在35以上可以显著减少投机者攻击频率和强度'
    );
  }

  // 通用策略
  if (suggestions.length < 3) {
    suggestions.push(
      '⚖️ 均衡策略：三项指标都要维持在50以上才能触发胜利，不要单独堆某个指标而忽视其他'
    );
  }
  if (suggestions.length < 3) {
    suggestions.push(
      '📊 使用顾问推荐：AI顾问的推荐基于当前指标计算，在危急时刻跟随推荐能显著提高存活率'
    );
  }

  return suggestions.slice(0, 3);
}

// ── 玩家风格分析 ──────────────────────────────────────────────

function analyzePlayerStyle(log: LogEntry[]): PostMortem['playerStyle'] {
  const policyCounts: Record<string, number> = {};
  log.forEach((e) => {
    policyCounts[e.policy] = (policyCounts[e.policy] ?? 0) + 1;
  });

  const total = log.length;
  const printMoneyCount = policyCounts['增发货币'] ?? 0;
  const taxCount = policyCounts['提高税收'] ?? 0;
  const welfareCount = policyCounts['削减福利'] ?? 0;
  const imfCount = policyCounts['申请IMF援助'] ?? 0;
  const reformCount = policyCounts['经济改革'] ?? 0;
  const speechCount = policyCounts['公开演讲'] ?? 0;

  // 风格判断
  if (printMoneyCount >= 3) {
    return {
      label: '激进印钞派',
      icon: '🖨️',
      description: `本局使用了 ${printMoneyCount} 次增发货币。这种策略短期续命有效，但会快速摧毁信用，建议与加息类政策交替使用。`,
    };
  }
  if (welfareCount + taxCount >= Math.floor(total * 0.5)) {
    return {
      label: '财政紧缩派',
      icon: '✂️',
      description: '超过一半的决策都是增收或削支，优先外储而忽略民心，导致民心在后期成为最大软肋。',
    };
  }
  if (imfCount >= 3) {
    return {
      label: '外援依赖型',
      icon: '🏛️',
      description: `多次依赖IMF援助（${imfCount}次），虽然解了外储燃眉之急，但每次都损耗10点民心，需注意长期民心健康。`,
    };
  }
  if (reformCount >= 2) {
    return {
      label: '改革先行者',
      icon: '🔧',
      description: '多次尝试经济改革，是正确的长期思路，但改革效果需要时间发酵，建议与短期救急手段搭配使用。',
    };
  }
  if (speechCount >= 3) {
    return {
      label: '民心维护型',
      icon: '🎤',
      description: '频繁使用公开演讲维持民心，民众满意度相对稳定，但可能疏于补充外储和信用。',
    };
  }
  return {
    label: '均衡决策者',
    icon: '⚖️',
    description: '决策类型较为分散，没有明显偏好。下次可以尝试根据最危险指标动态调整决策权重。',
  };
}

// ── 综合评分 ─────────────────────────────────────────────────

function calcScore(state: GameState, log: LogEntry[]): number {
  // 基础分：回合数（活得越久越高）
  let score = Math.min(state.turn * 2, 50);

  // 最终指标分
  score += Math.min(state.foreign_reserves * 0.15, 15);
  score += Math.min(state.public_support * 0.15, 15);
  score += Math.min(state.credit_rating * 0.15, 15);

  // 扣分：投机者命中次数
  const specHits = log.filter(
    (e) => e.speculatorAction && !e.speculatorAction.includes('观望')
  ).length;
  score -= specHits * 2;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ── 主函数 ────────────────────────────────────────────────────

export function buildPostMortem(state: GameState, log: LogEntry[]): PostMortem {
  return {
    primaryCause: analyzePrimaryCause(state),
    secondaryCauses: analyzeSecondaryCauses(state, log),
    timeline: buildTimeline(log, state),
    criticalMistakes: analyzeMistakes(log, state),
    suggestions: generateSuggestions(state, log),
    playerStyle: analyzePlayerStyle(log),
    score: calcScore(state, log),
  };
}
