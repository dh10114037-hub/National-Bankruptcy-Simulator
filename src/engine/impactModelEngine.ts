/**
 * 影响建模引擎
 *
 * 核心设计理念：
 * 1. 事件 → 先建模影响 → 再生成决策
 * 2. 决策必须与事件影响相关联
 * 3. 通过影响差值来衡量决策的有效性
 */

import type { ImpactModel, ModeledDecision, ImpactContext, StoryEvent } from '../types/story';

// ============================================
// 影响建模模板库
// ============================================

/** 事件 → 影响模型映射 */
const IMPACT_TEMPLATES: Record<string, Omit<ImpactModel, 'event' | 'urgency' | 'duration'>> = {
  // ─── 社会危机类 ───
  'protest_wave': {
    coreProblem: '社会信任危机 + 民生压力激化',
    impacts: {
      public_support: -20,
      credit_rating: -10,
      foreign_confidence: -8,
    },
  },
  'bank_run': {
    coreProblem: '金融信心崩溃 + 银行流动性危机',
    impacts: {
      public_support: -15,
      credit_rating: -18,
      foreign_confidence: -12,
      bond_market: -10,
    },
  },
  'social_media_panic': {
    coreProblem: '舆论失控 + 信息危机',
    impacts: {
      public_support: -12,
      credit_rating: -8,
      foreign_confidence: -5,
    },
  },

  // ─── 经济危机类 ───
  'currency_attack': {
    coreProblem: '货币信用危机 + 汇率崩盘',
    impacts: {
      credit_rating: -15,
      foreign_confidence: -20,
      exchange_rate: -25,
      inflation: 15,
    },
  },
  'debt_crisis': {
    coreProblem: '债务违约风险 + 主权信用危机',
    impacts: {
      credit_rating: -20,
      foreign_confidence: -15,
      bond_market: -20,
      foreign_reserves: -10,
    },
  },
  'inflation_spiral': {
    coreProblem: '通胀失控 + 购买力崩溃',
    impacts: {
      public_support: -18,
      inflation: 25,
      credit_rating: -10,
      foreign_confidence: -8,
    },
  },

  // ─── 政治危机类 ───
  'government_crisis': {
    coreProblem: '政权合法性危机 + 政策失灵',
    impacts: {
      public_support: -25,
      credit_rating: -15,
      foreign_confidence: -12,
    },
  },
  'corruption_scandal': {
    coreProblem: '政府信任危机 + 国际形象受损',
    impacts: {
      public_support: -18,
      credit_rating: -12,
      foreign_confidence: -15,
    },
  },
  'military_decision': {
    coreProblem: '地缘政治危机 + 国际制裁风险',
    impacts: {
      public_support: -10,
      credit_rating: -20,
      foreign_confidence: -25,
      foreign_reserves: -8,
    },
  },

  // ─── 国际关系类 ───
  'imf_negotiation': {
    coreProblem: '融资困境 + 主权受限',
    impacts: {
      credit_rating: -8,
      foreign_confidence: -5,
      foreign_reserves: -5,
    },
  },
  'trade_war': {
    coreProblem: '出口萎缩 + 经济放缓',
    impacts: {
      public_support: -10,
      credit_rating: -8,
      foreign_reserves: -12,
      stock_market: -15,
    },
  },
  'sanctions': {
    coreProblem: '国际制裁 + 资金冻结',
    impacts: {
      foreign_confidence: -30,
      credit_rating: -15,
      foreign_reserves: -20,
      exchange_rate: -10,
    },
  },

  // ─── 复合危机类 ───
  'full_crisis': {
    coreProblem: '系统性崩溃风险 + 多重危机叠加',
    impacts: {
      public_support: -25,
      credit_rating: -25,
      foreign_confidence: -25,
      inflation: 20,
      foreign_reserves: -15,
    },
  },
};

// ============================================
// 决策模板库（基于影响建模生成）
// ============================================

/** 问题类型 → 对应决策映射 */
const DECISION_TEMPLATES: Record<string, ModeledDecision[]> = {
  '社会信任危机': [
    {
      id: 'transparency_measure',
      name: '政务公开透明化',
      targetProblem: '社会信任危机',
      explain: '公开政府收支、官员财产，让大家看到钱花在哪了',
      expectedEffect: { public_support: 15, credit_rating: 8 },
      sideEffects: { credit_rating: -3 }, // 可能牵出更多问题
      riskLevel: 2,
      successRate: 0.75,
    },
    {
      id: 'social_welfare',
      name: '民生保障加码',
      targetProblem: '社会信任危机',
      explain: '发补贴、降税，让大家感受到政府的诚意',
      expectedEffect: { public_support: 18 },
      sideEffects: { foreign_reserves: -8 },
      cost: 50000,
      riskLevel: 2,
      successRate: 0.85,
    },
    {
      id: 'dialogue_mechanism',
      name: '建立对话机制',
      targetProblem: '社会信任危机',
      explain: '组织官民对话会，听取民间声音',
      expectedEffect: { public_support: 12, credit_rating: 5 },
      riskLevel: 1,
      successRate: 0.8,
    },
  ],

  '民生压力激化': [
    {
      id: 'price_control',
      name: '物价管控',
      targetProblem: '民生压力激化',
      explain: '限制必需品涨价，稳定民心',
      expectedEffect: { public_support: 10, inflation: -8 },
      sideEffects: { inflation: 5 }, // 黑市出现
      riskLevel: 3,
      successRate: 0.6,
    },
    {
      id: 'subsidy_program',
      name: '困难群体补贴',
      targetProblem: '民生压力激化',
      explain: '给低收入家庭发购物券、减免水电费',
      expectedEffect: { public_support: 12 },
      sideEffects: { foreign_reserves: -5 },
      cost: 30000,
      riskLevel: 1,
      successRate: 0.9,
    },
    {
      id: 'employment_plan',
      name: '就业促进计划',
      targetProblem: '民生压力激化',
      explain: '创造就业岗位，让大家有事做有钱赚',
      expectedEffect: { public_support: 15, inflation: -5 },
      sideEffects: { credit_rating: -2 },
      cost: 80000,
      riskLevel: 2,
      successRate: 0.7,
    },
  ],

  '金融信心危机': [
    {
      id: 'bank_guarantee',
      name: '银行存款保险',
      targetProblem: '金融信心危机',
      explain: '承诺存款安全，让大家不要急着取钱',
      expectedEffect: { public_support: 8, credit_rating: 12 },
      sideEffects: { foreign_reserves: -10 },
      cost: 100000,
      riskLevel: 2,
      successRate: 0.8,
    },
    {
      id: 'emergency_liquidity',
      name: '紧急流动性注入',
      targetProblem: '金融信心危机',
      explain: '央行印钱借给银行，解决流动性危机',
      expectedEffect: { bond_market: 15, stock_market: 10 },
      sideEffects: { inflation: 8 },
      riskLevel: 3,
      successRate: 0.7,
    },
    {
      id: 'bank_inspection',
      name: '银行业大检查',
      targetProblem: '金融信心危机',
      explain: '查账、抓坏人，让大家看到政府在管',
      expectedEffect: { credit_rating: 15, public_support: 5 },
      sideEffects: { stock_market: -5 }, // 查出问题
      riskLevel: 2,
      successRate: 0.65,
    },
  ],

  '货币信用危机': [
    {
      id: 'rate_intervention',
      name: '外汇市场干预',
      targetProblem: '货币信用危机',
      explain: '动用外储买入本国货币，稳住汇率',
      expectedEffect: { exchange_rate: 12, credit_rating: 8 },
      sideEffects: { foreign_reserves: -20 },
      cost: 150000,
      riskLevel: 3,
      successRate: 0.6,
    },
    {
      id: 'capital_controls',
      name: '资本管制',
      targetProblem: '货币信用危机',
      explain: '限制钱往外跑，防止汇率进一步下跌',
      expectedEffect: { exchange_rate: 8, foreign_confidence: -10 },
      sideEffects: { foreign_confidence: -15 },
      riskLevel: 4,
      successRate: 0.75,
    },
    {
      id: 'currency_reform',
      name: '货币改革',
      targetProblem: '货币信用危机',
      explain: '发行新货币，换掉旧货币，重建信心',
      expectedEffect: { exchange_rate: 20, inflation: -15, credit_rating: 10 },
      sideEffects: { public_support: -8 }, // 换钞麻烦
      riskLevel: 5,
      successRate: 0.5,
    },
  ],

  '债务违约风险': [
    {
      id: 'debt_restructuring',
      name: '债务重组',
      targetProblem: '债务违约风险',
      explain: '和债主商量展期、降息，大家一起扛',
      expectedEffect: { credit_rating: 10, bond_market: 15 },
      sideEffects: { foreign_confidence: -8 },
      riskLevel: 3,
      successRate: 0.65,
    },
    {
      id: 'austerity_measures',
      name: '财政紧缩',
      targetProblem: '债务违约风险',
      explain: '削减开支、减少赤字，让账本好看',
      expectedEffect: { credit_rating: 15, bond_market: 12 },
      sideEffects: { public_support: -15, inflation: -5 },
      riskLevel: 4,
      successRate: 0.6,
    },
    {
      id: 'new_debt_issuance',
      name: '发行新国债',
      targetProblem: '债务违约风险',
      explain: '借新还旧，用新债填旧债的坑',
      expectedEffect: { foreign_reserves: 10 },
      sideEffects: { credit_rating: -5, inflation: 5 },
      riskLevel: 3,
      successRate: 0.55,
    },
  ],

  '通胀失控': [
    {
      id: 'rate_hike',
      name: '大幅加息',
      targetProblem: '通胀失控',
      explain: '提高利率，让大家存钱不花钱，抑制通胀',
      expectedEffect: { inflation: -15, exchange_rate: 10 },
      sideEffects: { stock_market: -12, bond_market: -8, public_support: -5 },
      riskLevel: 4,
      successRate: 0.7,
    },
    {
      id: 'supply_stabilization',
      name: '供应链稳定',
      targetProblem: '通胀失控',
      explain: '打通物流、保证物资供应，从源头压价',
      expectedEffect: { inflation: -12, public_support: 8 },
      sideEffects: { foreign_reserves: -8 },
      cost: 50000,
      riskLevel: 2,
      successRate: 0.75,
    },
    {
      id: 'price_freeze',
      name: '物价冻结',
      targetProblem: '通胀失控',
      explain: '强行冻结物价，不让涨',
      expectedEffect: { inflation: -8, public_support: 5 },
      sideEffects: { stock_market: -10, inflation: 10 }, // 黑市价格更高
      riskLevel: 5,
      successRate: 0.4,
    },
  ],

  '外资信心下降': [
    {
      id: 'investment_forum',
      name: '国际投资推介会',
      targetProblem: '外资信心下降',
      explain: '办大会、给优惠，邀请外资来投资',
      expectedEffect: { foreign_confidence: 18, foreign_reserves: 15 },
      sideEffects: { credit_rating: -3 }, // 让步太多
      cost: 30000,
      riskLevel: 2,
      successRate: 0.7,
    },
    {
      id: 'trade_agreement',
      name: '签署贸易协定',
      targetProblem: '外资信心下降',
      explain: '和友好国家签协议，互相开放市场',
      expectedEffect: { foreign_confidence: 20, credit_rating: 10, stock_market: 15 },
      riskLevel: 3,
      successRate: 0.65,
    },
    {
      id: 'reform_roadmap',
      name: '改革路线图',
      targetProblem: '外资信心下降',
      explain: '公布详细的改革计划，让世界看到未来',
      expectedEffect: { foreign_confidence: 15, credit_rating: 12 },
      riskLevel: 2,
      successRate: 0.8,
    },
  ],

  '政权合法性危机': [
    {
      id: 'early_election',
      name: '提前大选',
      targetProblem: '政权合法性危机',
      explain: '重新选举，获得人民授权',
      expectedEffect: { public_support: 20 },
      sideEffects: { credit_rating: -5 }, // 政局不稳
      riskLevel: 3,
      successRate: 0.6,
    },
    {
      id: 'cabinet_reshuffle',
      name: '内阁重组',
      targetProblem: '政权合法性危机',
      explain: '换掉不得人心的官员，重建信任',
      expectedEffect: { public_support: 15, credit_rating: 8 },
      riskLevel: 2,
      successRate: 0.75,
    },
    {
      id: 'rally_support',
      name: '民族主义动员',
      targetProblem: '政权合法性危机',
      explain: '制造外部敌人，转移内部矛盾',
      expectedEffect: { public_support: 18 },
      sideEffects: { foreign_confidence: -15, credit_rating: -10 },
      riskLevel: 4,
      successRate: 0.55,
    },
  ],

  '政府信任危机': [
    {
      id: 'anti_corruption',
      name: '反腐专项行动',
      targetProblem: '政府信任危机',
      explain: '抓大老虎、公示财产，重建廉洁形象',
      expectedEffect: { public_support: 15, credit_rating: 12 },
      sideEffects: { public_support: -5 }, // 牵出更多腐败
      riskLevel: 3,
      successRate: 0.7,
    },
    {
      id: 'victory_propaganda',
      name: '正面宣传攻势',
      targetProblem: '政府信任危机',
      explain: '讲好故事、树立典型，修复形象',
      expectedEffect: { public_support: 10 },
      sideEffects: { credit_rating: -3 },
      cost: 10000,
      riskLevel: 1,
      successRate: 0.65,
    },
  ],

  '国际形象受损': [
    {
      id: 'diplomatic_tour',
      name: '元首外交出访',
      targetProblem: '国际形象受损',
      explain: '领导人出访、会见外国元首，展示正面形象',
      expectedEffect: { foreign_confidence: 15, credit_rating: 10 },
      sideEffects: { foreign_reserves: -5 }, // 外交费用
      cost: 20000,
      riskLevel: 2,
      successRate: 0.75,
    },
    {
      id: 'international_cooperation',
      name: '国际合作项目',
      targetProblem: '国际形象受损',
      explain: '参与国际援助、联合项目，刷存在感',
      expectedEffect: { foreign_confidence: 18, credit_rating: 12 },
      riskLevel: 2,
      successRate: 0.7,
    },
  ],

  '系统性崩溃风险': [
    {
      id: 'emergency_measures',
      name: '紧急状态法',
      targetProblem: '系统性崩溃风险',
      explain: '宣布紧急状态，赋予政府特殊权力',
      expectedEffect: { credit_rating: 5, public_support: 8 },
      sideEffects: { foreign_confidence: -20, credit_rating: -10 },
      riskLevel: 5,
      successRate: 0.5,
    },
    {
      id: 'coalition_government',
      name: '联合政府',
      targetProblem: '系统性崩溃风险',
      explain: '让反对派加入，共度难关',
      expectedEffect: { public_support: 15, credit_rating: 12 },
      sideEffects: { public_support: -8 }, // 反对派带来负面
      riskLevel: 4,
      successRate: 0.55,
    },
    {
      id: 'international_rescue',
      name: '请求国际救援',
      targetProblem: '系统性崩溃风险',
      explain: '向IMF、国际组织求援，让外国专家来帮忙',
      expectedEffect: { foreign_reserves: 25, credit_rating: 15, inflation: -10 },
      sideEffects: { foreign_confidence: -15, sovereignty: -20 }, // 主权受限
      riskLevel: 5,
      successRate: 0.6,
    },
  ],
};

// ============================================
// 影响建模核心函数
// ============================================

/**
 * 从 StoryEvent 生成 ImpactModel
 */
export function generateImpactModel(
  event: StoryEvent,
  _ctx: ImpactContext
): ImpactModel {
  // 查找对应模板
  const template = IMPACT_TEMPLATES[event.id];

  if (template) {
    // 使用模板，但根据上下文调整紧迫程度
    const avgImpact = Object.values(template.impacts)
      .filter(v => v !== undefined)
      .reduce((a, b) => a + Math.abs(b), 0) / Object.keys(template.impacts).length;

    return {
      event: event.name,
      coreProblem: template.coreProblem,
      impacts: { ...template.impacts },
      urgency: Math.min(5, Math.max(1, Math.floor(avgImpact / 5))),
      duration: event.duration,
    };
  }

  // 没有模板？基于 choices 推断影响
  const avgEffects = {
    public_support: 0,
    credit_rating: 0,
  };
  let count = 0;

  for (const choice of event.choices) {
    if (choice.effects.public_support) {
      avgEffects.public_support += choice.effects.public_support;
      count++;
    }
    if (choice.effects.credit_rating) {
      avgEffects.credit_rating += choice.effects.credit_rating;
      count++;
    }
  }

  if (count > 0) {
    avgEffects.public_support /= count;
    avgEffects.credit_rating /= count;
  }

  return {
    event: event.name,
    coreProblem: `综合危机`,
    impacts: {
      public_support: avgEffects.public_support,
      credit_rating: avgEffects.credit_rating,
    },
    urgency: 3,
    duration: event.duration,
  };
}

/**
 * 基于 ImpactModel 生成 ModeledDecision
 */
export function generateDecisionsFromImpact(
  impact: ImpactModel,
  ctx: ImpactContext,
  count: number = 4
): ModeledDecision[] {
  const decisions: ModeledDecision[] = [];

  // 解析核心问题，提取关键词
  const problems = impact.coreProblem.split(' + ');

  // 为每个问题找对应的决策
  for (const problem of problems) {
    const templates = DECISION_TEMPLATES[problem];
    if (templates) {
      decisions.push(...templates);
    }
  }

  // 如果找不到足够决策，添加通用决策
  if (decisions.length < count) {
    decisions.push(...getGenericDecisions(ctx, impact));
  }

  // 根据当前状态调整风险和成功率
  const adjustedDecisions = decisions.map(d => ({
    ...d,
    riskLevel: adjustRiskLevel(d, ctx, impact),
    successRate: adjustSuccessRate(d, ctx, impact),
  }));

  // 去重并随机选择
  const unique = adjustedDecisions.filter(
    (d, i, arr) => arr.findIndex(x => x.id === d.id) === i
  );

  // 打乱顺序
  const shuffled = [...unique].sort(() => Math.random() - 0.5);

  return shuffled.slice(0, count);
}

/**
 * 调整风险等级
 */
function adjustRiskLevel(decision: ModeledDecision, ctx: ImpactContext, impact: ImpactModel): number {
  let risk = decision.riskLevel;

  // 紧迫程度高时，高风险决策更容易失败
  if (impact.urgency >= 4 && risk >= 4) {
    risk += 1;
  }

  // 国家状态差时，所有风险都更高
  if (ctx.country.public_support < 30 || ctx.country.credit_rating < 30) {
    risk += 1;
  }

  return Math.min(5, risk);
}

/**
 * 调整成功率
 */
function adjustSuccessRate(decision: ModeledDecision, ctx: ImpactContext, impact: ImpactModel): number {
  let rate = decision.successRate;

  // 紧迫程度高时，成功率降低
  rate -= (impact.urgency - 1) * 0.05;

  // 国家状态差时，成功率降低
  if (ctx.country.public_support < 30) {
    rate -= 0.1;
  }
  if (ctx.country.credit_rating < 30) {
    rate -= 0.1;
  }

  // 回合早，成功率更高（有更多时间纠错）
  if (ctx.turn <= 5) {
    rate += 0.1;
  }

  return Math.max(0.2, Math.min(0.95, rate));
}

/**
 * 获取通用决策（兜底）
 */
function getGenericDecisions(_ctx: ImpactContext, _impact: ImpactModel): ModeledDecision[] {
  return [
    {
      id: 'wait_and_see',
      name: '静观其变',
      targetProblem: '待观察',
      explain: '暂时不行动，看看事态如何发展',
      expectedEffect: {},
      riskLevel: 1,
      successRate: 0.9,
    },
    {
      id: 'emergency_fund',
      name: '设立应急基金',
      targetProblem: '预防性措施',
      explain: '预留资金应对可能的风险',
      expectedEffect: { credit_rating: 3 },
      sideEffects: { foreign_reserves: -10 },
      cost: 50000,
      riskLevel: 1,
      successRate: 0.95,
    },
  ];
}

/**
 * 计算决策的有效性得分（用于排序）
 */
export function calculateEffectiveness(
  decision: ModeledDecision,
  impact: ImpactModel
): number {
  let score = 0;

  // 正面影响加分
  for (const [key, value] of Object.entries(decision.expectedEffect)) {
    const impactValue = impact.impacts[key as keyof typeof impact.impacts];
    if (impactValue && value) {
      // 如果决策能中和事件影响，得高分
      if (impactValue < 0 && value > 0) {
        score += Math.min(Math.abs(value), Math.abs(impactValue)) * 2;
      }
    }
  }

  // 成本惩罚
  if (decision.cost && decision.cost > 100000) {
    score -= 5;
  }

  // 风险惩罚
  score -= (decision.riskLevel - 1) * 2;

  // 成功率奖励
  score += decision.successRate * 3;

  return score;
}

/**
 * 生成决策摘要（用于AI分析）
 */
export function generateImpactSummary(impact: ImpactModel): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(impact.impacts)) {
    if (value !== undefined && value !== 0) {
      const label = getImpactLabel(key);
      const direction = value > 0 ? '上升' : '下降';
      parts.push(`${label}${direction} ${Math.abs(value)}`);
    }
  }

  return `【${impact.event}】核心问题：${impact.coreProblem}\n影响：${parts.join('、')}\n紧迫程度：${'🔴'.repeat(impact.urgency)}${'⚪'.repeat(5 - impact.urgency)}`;
}

function getImpactLabel(key: string): string {
  const labels: Record<string, string> = {
    public_support: '民心',
    credit_rating: '信用',
    foreign_confidence: '外资信心',
    inflation: '通胀',
    foreign_reserves: '外储',
    exchange_rate: '汇率',
    bond_market: '债市',
    stock_market: '股市',
  };
  return labels[key] || key;
}
