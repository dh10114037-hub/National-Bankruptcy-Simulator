/**
 * 拯救者模式专用 AI 顾问引擎
 * - 分析当前最危险指标
 * - 明确推荐哪个政策 + 推荐理由
 */

import type { GameState, Policy } from '../types/game';

// ── 风险来源分析 ──────────────────────────────────────────────────

export interface RiskSource {
  label: string;
  level: 'critical' | 'warning' | 'ok';
  value: number;
  description: string;
  icon: string;
}

export function analyzeRiskSources(state: GameState): RiskSource[] {
  const { foreign_reserves, public_support, credit_rating, market } = state;
  const sources: RiskSource[] = [];

  // 外储
  sources.push({
    label: '外汇储备',
    icon: '💰',
    value: foreign_reserves,
    level: foreign_reserves < 25 ? 'critical' : foreign_reserves < 45 ? 'warning' : 'ok',
    description:
      foreign_reserves < 25
        ? '极度危险！外储不足将直接导致国家破产'
        : foreign_reserves < 45
        ? '储备偏低，需要尽快补充'
        : '储备充足，暂时安全',
  });

  // 民众支持
  sources.push({
    label: '民众支持',
    icon: '👥',
    value: public_support,
    level: public_support < 20 ? 'critical' : public_support < 40 ? 'warning' : 'ok',
    description:
      public_support < 20
        ? '民心崩溃边缘！再跌就是社会动乱'
        : public_support < 40
        ? '民心不稳，避免再有削减福利类政策'
        : '民众基本满意',
  });

  // 国家信用
  sources.push({
    label: '国家信用',
    icon: '🏦',
    value: credit_rating,
    level: credit_rating < 25 ? 'critical' : credit_rating < 40 ? 'warning' : 'ok',
    description:
      credit_rating < 25
        ? '信用崩盘！国际融资渠道已关闭，投机者将猛攻'
        : credit_rating < 40
        ? '信用偏低，增发货币和资本管制会继续恶化'
        : '信用正常',
  });

  // 通胀
  if (market) {
    sources.push({
      label: '通货膨胀',
      icon: '🔥',
      value: market.inflation,
      level: market.inflation > 65 ? 'critical' : market.inflation > 45 ? 'warning' : 'ok',
      description:
        market.inflation > 65
          ? '通胀失控！民众购买力暴跌，信用和民心双双受损'
          : market.inflation > 45
          ? '通胀偏高，避免印钞类政策'
          : '通胀可控',
    });
  }

  // 汇率
  if (market) {
    const er = market.exchange_rate;
    sources.push({
      label: '汇率稳定',
      icon: '💱',
      value: Math.round(er * 100),
      level: er < 0.65 ? 'critical' : er < 0.85 ? 'warning' : 'ok',
      description:
        er < 0.65
          ? '汇率崩溃！本币大幅贬值，进口成本飙升'
          : er < 0.85
          ? '汇率承压，市场恐慌情绪上升'
          : '汇率基本稳定',
    });
  }

  // 按危险程度排序：critical > warning > ok，同级按 value 升序
  const levelOrder = { critical: 0, warning: 1, ok: 2 };
  sources.sort((a, b) => {
    const lo = levelOrder[a.level] - levelOrder[b.level];
    if (lo !== 0) return lo;
    return a.value - b.value;
  });

  return sources;
}

// ── 推荐政策 ─────────────────────────────────────────────────────

export interface PolicyRecommendation {
  policyId: string;
  reason: string;
}

/**
 * 根据当前游戏状态，从提供的 policies 中推荐最优选项
 * 返回推荐的 policy.id（用于高亮显示）
 */
export function generateRecommendedPolicy(
  state: GameState,
  policies: Policy[]
): string | null {
  if (!policies.length) return null;

  const { foreign_reserves, public_support, credit_rating, market } = state;

  // 计算每个政策的"效用分"
  const scored = policies.map((p) => {
    let score = 0;
    const e = p.effects;

    // 根据当前最紧迫指标，给对应 effect 加权
    // 外储紧急（<35）：外储提升权重大
    if (foreign_reserves < 35) {
      score += (e.foreign_reserves ?? 0) * 3;
    } else if (foreign_reserves < 55) {
      score += (e.foreign_reserves ?? 0) * 1.5;
    } else {
      score += (e.foreign_reserves ?? 0) * 0.8;
    }

    // 民心紧急（<30）：民心提升权重最大
    if (public_support < 30) {
      score += (e.public_support ?? 0) * 3.5;
    } else if (public_support < 45) {
      score += (e.public_support ?? 0) * 2;
    } else {
      score += (e.public_support ?? 0) * 1;
    }

    // 信用紧急（<30）：避免信用再降，信用改善加权
    if (credit_rating < 30) {
      score += (e.credit_rating ?? 0) * 3;
      // 惩罚：信用已低还要降信用的政策
      if ((e.credit_rating ?? 0) < -5) score -= 15;
    } else if (credit_rating < 45) {
      score += (e.credit_rating ?? 0) * 2;
    } else {
      score += (e.credit_rating ?? 0) * 1;
    }

    // 通胀高（>55）：惩罚印钞类（增加通胀）的政策
    if (market && market.inflation > 55) {
      if (p.id === 'print_money') score -= 20;
      if (p.id === 'emergency_bond') score -= 5;
    }

    // 民心已低（<35）：惩罚继续降民心的政策
    if (public_support < 35) {
      if ((e.public_support ?? 0) < -8) score -= 15;
    }

    // 加分改造：信用<40 时优先提升信用评级
    if (credit_rating < 40) {
      if (p.id === 'economic_reform') score += 12;
      if (p.id === 'raise_interest') score += 8;
    }

    // 加分改造：三线全部偏低时，稳住基本盘额外加分（安全托底）
    const allLow =
      foreign_reserves < 40 && public_support < 40 && credit_rating < 40;
    if (allLow && p.id === 'stabilize') {
      score += 10;
    }

    // 如果指标总体尚好：偏好均衡型政策
    const isBalanced =
      foreign_reserves > 50 && public_support > 50 && credit_rating > 50;
    if (isBalanced) {
      if (p.id === 'economic_reform') score += 8;
      if (p.id === 'raise_interest') score += 5;
    }

    return { policy: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  // 如果最高分和第二高分差距太小（<3），认为无明显推荐
  if (scored.length > 1 && best.score - scored[1].score < 2) {
    // 仍推荐，但用"较好"标记
  }

  return best.policy.id;
}

/**
 * 生成推荐政策的文字理由（用于 AdvisorPanel 展示）
 */
export function generateRecommendReason(
  state: GameState,
  recommendedPolicy: Policy | undefined
): string {
  if (!recommendedPolicy) return '当前局势请综合判断，谨慎决策。';

  const { foreign_reserves, public_support, credit_rating, market } = state;

  // 根据政策ID和当前状态生成原因
  const reasons: Record<string, () => string> = {
    tax_increase: () =>
      `外储当前 ${foreign_reserves.toFixed(0)}，加税是代价最小的补充方式，民心损耗（-8）可承受`,
    print_money: () =>
      `外储告急（${foreign_reserves.toFixed(0)}），印钞是快速续命的手段，但信用仅剩 ${credit_rating.toFixed(0)}，需谨慎`,
    cut_welfare: () =>
      `外储极度紧张，削减福利是最后手段；民心当前 ${public_support.toFixed(0)}，有空间牺牲`,
    imf_bailout: () =>
      `外储 ${foreign_reserves.toFixed(0)} 已不安全，IMF 援助是性价比最高的大规模补充方式`,
    raise_interest: () =>
      `信用（${credit_rating.toFixed(0)}）和外储（${foreign_reserves.toFixed(0)}）都需修复，加息两者兼顾，民心代价可控`,
    capital_control: () =>
      `汇率承压（${market?.exchange_rate.toFixed(2) ?? '?'}），资本管制可暂时止血`,
    emergency_bond: () =>
      `外储低位（${foreign_reserves.toFixed(0)}），发债性价比高且不影响民心`,
    economic_reform: () =>
      `信用已跌至 ${credit_rating.toFixed(0)}，结构改革是最快修复信用的方式`,
    public_speech: () =>
      `民心仅 ${public_support.toFixed(0)}，必须立刻稳住，演讲是代价最小的民心回升手段`,
    sell_assets: () =>
      `外储紧急，出售资产快速获取 +20，且比削减福利对民心影响更小`,
    stabilize: () =>
      `当前局势复杂，稳住基本盘（+3/+3/+3）是最低风险选择，适合在不确定时保命`,
  };

  const fn = reasons[recommendedPolicy.id];
  return fn ? fn() : `综合当前指标，${recommendedPolicy.name}是当前最优选择`;
}
