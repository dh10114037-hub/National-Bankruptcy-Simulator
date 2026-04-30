// ═══════════════════════════════════════════
// 剧情事件链引擎
// ═══════════════════════════════════════════

import type { StoryEvent, StoryState, StoryChoice } from '../types/story';
import type { MarketState } from '../types/speculator';

// ═══════════════════════════════════════════
// 剧情事件库
// ═══════════════════════════════════════════
export const STORY_EVENTS: StoryEvent[] = [
  {
    id: 'bank_run',
    name: '银行挤兑',
    subtitle: '危机爆发',
    description: '一夜之间，数十万市民涌入各大银行网点，恐慌情绪如瘟疫般蔓延。ATM机前排起长龙，网点门口人头攒动。这场挤兑风暴正在撕裂国家的金融根基...',
    triggerCondition: {
      minTurn: 1,
      maxTurn: 8,
      countryThreshold: { public_support: 40 },
      probability: 0.4,
    },
    choices: [
      {
        id: 'freeze_deposits',
        text: '冻结存款',
        theme: 'red',
        successRate: 0.9,
        effects: {
          public_support: -20,
          credit_rating: +10,
          inflation: -5,
          foreign_reserves: +5,
        },
      },
      {
        id: 'emergency_liquidity',
        text: '紧急注资',
        theme: 'blue',
        successRate: 0.8,
        effects: {
          public_support: +5,
          credit_rating: -8,
          inflation: +15,
          foreign_reserves: -20,
        },
      },
      {
        id: 'nationalize_banks',
        text: '宣布银行国有化',
        theme: 'purple',
        successRate: 0.6,
        effects: {
          public_support: -10,
          credit_rating: -15,
          inflation: +8,
          foreign_reserves: +15,
        },
      },
    ],
    duration: 2,
    onceOnly: true,
    branch: 'financial_crisis',
  },
  {
    id: 'protest_wave',
    name: '社会动荡',
    subtitle: '民众抗议',
    description: '数千名示威者聚集在市政广场，要求政府下台。标语牌在人群中挥舞，口号声此起彼伏。警察已经严阵以待，气氛剑拔弩张...',
    triggerCondition: {
      minTurn: 2,
      maxTurn: 12,
      countryThreshold: { public_support: 35 },
      probability: 0.5,
    },
    choices: [
      {
        id: 'crackdown',
        text: '强硬镇压',
        theme: 'red',
        successRate: 0.7,
        effects: {
          public_support: -25,
          credit_rating: +5,
          inflation: +5,
        },
      },
      {
        id: 'dialogue',
        text: '对话协商',
        theme: 'blue',
        successRate: 0.8,
        effects: {
          public_support: +10,
          credit_rating: -5,
          inflation: +3,
        },
      },
      {
        id: 'announce_reform',
        text: '宣布改革计划',
        theme: 'yellow',
        successRate: 0.6,
        effects: {
          public_support: +15,
          credit_rating: +8,
          foreign_reserves: -10,
        },
      },
    ],
    duration: 3,
    onceOnly: true,
    branch: 'political_crisis',
  },
  {
    id: 'currency_attack',
    name: '货币狙击',
    subtitle: '国际炒家',
    description: '国际投机资本联合做空，本币汇率断崖式暴跌。央行外汇储备告急，黑市汇率与官方汇率差距越拉越大。一场针对国家货币的金融战争已经打响...',
    triggerCondition: {
      minTurn: 3,
      maxTurn: 15,
      marketThreshold: { exchange_rate: 0.85 },
      probability: 0.6,
    },
    choices: [
      {
        id: 'defend_currency',
        text: '动用外储护盘',
        theme: 'blue',
        successRate: 0.5,
        effects: {
          exchange_rate: +0.1,
          foreign_reserves: -30,
          credit_rating: +5,
        },
      },
      {
        id: 'float_currency',
        text: '放开汇率管制',
        theme: 'yellow',
        successRate: 0.8,
        effects: {
          exchange_rate: -0.15,
          foreign_reserves: +10,
          credit_rating: -10,
        },
      },
      {
        id: 'capital_controls',
        text: '实施资本管制',
        theme: 'purple',
        successRate: 0.7,
        effects: {
          exchange_rate: +0.05,
          public_support: -10,
          credit_rating: -15,
        },
      },
    ],
    duration: 2,
    onceOnly: true,
    branch: 'financial_crisis',
  },
  {
    id: 'imf_negotiation',
    name: 'IMF谈判',
    subtitle: '求援博弈',
    description: 'IMF代表团抵达首都，准备就救助贷款进行谈判。然而严苛的改革条件引发了内阁激烈争论：是接受外资介入主权，还是独自面对崩溃...',
    triggerCondition: {
      minTurn: 4,
      maxTurn: 18,
      countryThreshold: { foreign_reserves: 30, credit_rating: 40 },
      probability: 0.7,
    },
    choices: [
      {
        id: 'accept_imf',
        text: '接受IMF条件',
        theme: 'blue',
        successRate: 0.9,
        effects: {
          foreign_reserves: +40,
          credit_rating: +20,
          public_support: -15,
          inflation: -10,
        },
      },
      {
        id: 'reject_imf',
        text: '拒绝IMF条件',
        theme: 'red',
        successRate: 0.4,
        effects: {
          foreign_reserves: -15,
          credit_rating: -20,
          public_support: +10,
        },
      },
      {
        id: 'negotiate_better',
        text: '争取更好条件',
        theme: 'yellow',
        successRate: 0.6,
        effects: {
          foreign_reserves: +20,
          credit_rating: +10,
          public_support: -5,
        },
      },
    ],
    duration: 3,
    onceOnly: true,
    branch: 'international',
  },
  {
    id: 'government_crisis',
    name: '政权危机',
    subtitle: '内阁动荡',
    description: '财长愤然辞职，多名部长联名逼宫。执政联盟内部出现严重分裂，关于是否继续执政的争论已经白热化。国家的未来悬于一线...',
    triggerCondition: {
      minTurn: 5,
      maxTurn: 20,
      countryThreshold: { public_support: 25, credit_rating: 30 },
      probability: 0.5,
    },
    choices: [
      {
        id: 'resign',
        text: '总理引咎辞职',
        theme: 'red',
        successRate: 1.0,
        effects: {
          public_support: -5,
          credit_rating: +10,
          inflation: +5,
        },
      },
      {
        id: 'reshuffle',
        text: '紧急内阁改组',
        theme: 'blue',
        successRate: 0.7,
        effects: {
          public_support: +5,
          credit_rating: +5,
          foreign_reserves: -5,
        },
      },
      {
        id: 'early_election',
        text: '提前大选',
        theme: 'yellow',
        successRate: 0.5,
        effects: {
          public_support: +10,
          credit_rating: -10,
          inflation: +8,
        },
      },
    ],
    duration: 2,
    onceOnly: true,
    branch: 'political_crisis',
  },
  {
    id: 'debt_crisis',
    name: '债务风暴',
    subtitle: '主权危机',
    description: '国债收益率飙升到历史高位，主权信用违约掉期(CDS)价格暴涨。国际评级机构发出降级警告，债务违约似乎已不可避免...',
    triggerCondition: {
      minTurn: 6,
      maxTurn: 22,
      marketThreshold: { bond_price: 0.3 },
      countryThreshold: { credit_rating: 35 },
      probability: 0.5,
    },
    choices: [
      {
        id: 'debt_restructuring',
        text: '债务重组',
        theme: 'yellow',
        successRate: 0.8,
        effects: {
          credit_rating: -15,
          bond_price: +0.1,
          inflation: +10,
          public_support: +5,
        },
      },
      {
        id: 'austerity',
        text: '财政紧缩',
        theme: 'red',
        successRate: 0.6,
        effects: {
          public_support: -20,
          credit_rating: +15,
          inflation: -8,
        },
      },
      {
        id: 'print_money',
        text: '印钞还债',
        theme: 'purple',
        successRate: 0.7,
        effects: {
          inflation: +25,
          credit_rating: -20,
          exchange_rate: -0.1,
        },
      },
    ],
    duration: 3,
    onceOnly: true,
    branch: 'financial_crisis',
  },
  {
    id: 'social_media_panic',
    name: '舆论风暴',
    subtitle: '网络恐慌',
    description: '社交媒体上充斥着各种谣言和恐慌言论，虚假消息以惊人的速度传播。恐慌情绪像野火一样蔓延，普通民众陷入深深的不安...',
    triggerCondition: {
      minTurn: 2,
      maxTurn: 25,
      countryThreshold: { public_support: 45 },
      probability: 0.6,
    },
    choices: [
      {
        id: 'censor_media',
        text: '网络管制',
        theme: 'red',
        successRate: 0.7,
        effects: {
          public_support: -15,
          credit_rating: +5,
          stock_index: +50,
        },
      },
      {
        id: 'fact_check',
        text: '官方辟谣',
        theme: 'blue',
        successRate: 0.6,
        effects: {
          public_support: +8,
          credit_rating: +3,
        },
      },
      {
        id: 'ignore_panic',
        text: '不予理会',
        theme: 'yellow',
        successRate: 0.5,
        effects: {
          public_support: -10,
          stock_index: -100,
        },
      },
    ],
    duration: 1,
    onceOnly: false,
    branch: 'social',
  },
  {
    id: 'military_decision',
    name: '军事抉择',
    subtitle: '边境紧张',
    description: '邻国在边境集结军队，局势骤然紧张。军方高层呼吁采取强硬立场，而外交部门则主张克制。国家再次站在历史的十字路口...',
    triggerCondition: {
      minTurn: 10,
      maxTurn: 28,
      countryThreshold: { credit_rating: 30, public_support: 50 },
      probability: 0.3,
    },
    choices: [
      {
        id: 'military_posture',
        text: '加强军事部署',
        theme: 'red',
        successRate: 0.7,
        effects: {
          public_support: +15,
          credit_rating: -10,
          foreign_reserves: -15,
        },
      },
      {
        id: 'diplomatic_peace',
        text: '外交谈判',
        theme: 'blue',
        successRate: 0.8,
        effects: {
          public_support: -5,
          credit_rating: +5,
          foreign_reserves: +5,
        },
      },
      {
        id: 'seek_alliance',
        text: '寻求盟友支持',
        theme: 'yellow',
        successRate: 0.6,
        effects: {
          foreign_reserves: +10,
          credit_rating: +8,
          public_support: +5,
        },
      },
    ],
    duration: 3,
    onceOnly: true,
    branch: 'international',
  },
];

// ═══════════════════════════════════════════
// 剧情状态管理
// ═══════════════════════════════════════════

export function createStoryState(): StoryState {
  return {
    triggeredEvents: [],
    currentEvent: null,
    currentTurn: 1,
    eventRemainingTurns: 0,
    choiceHistory: [],
    currentBranch: 'main',
  };
}

// ═══════════════════════════════════════════
// 条件检测
// ═══════════════════════════════════════════

function checkCondition(
  event: StoryEvent,
  state: StoryState,
  market: MarketState,
  countryMetrics: { public_support: number; credit_rating: number; inflation: number; foreign_reserves: number }
): boolean {
  const cond = event.triggerCondition;

  // 回合数限制
  if (cond.minTurn !== undefined && state.currentTurn < cond.minTurn) return false;
  if (cond.maxTurn !== undefined && state.currentTurn > cond.maxTurn) return false;

  // 只触发一次的事件
  if (event.onceOnly && state.triggeredEvents.includes(event.id)) return false;

  // 已经有进行中的事件
  if (state.currentEvent !== null) return false;

  // 市场指标检测
  if (cond.marketThreshold) {
    for (const [key, value] of Object.entries(cond.marketThreshold)) {
      const marketVal = market[key as keyof MarketState];
      if (marketVal === undefined) continue;
      if (typeof value === 'number' && typeof marketVal === 'number') {
        // 汇率/信用/国债：越低越危险，低到阈值以下才触发（改为 >，避免等于时误拦截）
        if ((key === 'exchange_rate' || key === 'credit_rating' || key === 'bond_price') && marketVal > value) return false;
        // 通胀/股指：越高越危险，高到阈值以上才触发（保持 <=）
        if ((key === 'inflation' || key === 'stock_index') && marketVal <= value) return false;
      }
    }
  }

  // 国家指标检测
  if (cond.countryThreshold) {
    for (const [key, value] of Object.entries(cond.countryThreshold)) {
      const countryVal = countryMetrics[key as keyof typeof countryMetrics];
      if (typeof value === 'number' && typeof countryVal === 'number') {
        if (countryVal >= value) return false;
      }
    }
  }

  // 概率检测
  if (cond.probability !== undefined && Math.random() > cond.probability) return false;

  return true;
}

// ═══════════════════════════════════════════
// 事件触发与处理
// ═══════════════════════════════════════════

/**
 * 检测并触发符合条件的剧情事件
 */
export function checkAndTriggerEvent(
  state: StoryState,
  market: MarketState,
  countryMetrics: { public_support: number; credit_rating: number; inflation: number; foreign_reserves: number }
): StoryState {
  // 如果有进行中的事件，先减少持续回合
  if (state.currentEvent) {
    const remaining = state.eventRemainingTurns - 1;
    if (remaining <= 0) {
      // 事件结束
      return {
        ...state,
        currentEvent: null,
        eventRemainingTurns: 0,
      };
    }
    return {
      ...state,
      eventRemainingTurns: remaining,
    };
  }

  // 检测可触发的事件
  for (const event of STORY_EVENTS) {
    if (checkCondition(event, state, market, countryMetrics)) {
      return {
        ...state,
        currentEvent: event,
        eventRemainingTurns: event.duration,
        triggeredEvents: event.onceOnly
          ? [...state.triggeredEvents, event.id]
          : state.triggeredEvents,
      };
    }
  }

  return state;
}

/**
 * 处理玩家选择
 */
export function makeChoice(
  state: StoryState,
  choice: StoryChoice
): StoryState {
  if (!state.currentEvent) {
    throw new Error('No active event');
  }

  const successRate = choice.successRate ?? 1.0;
  const isSuccess = Math.random() < successRate;

  const newState: StoryState = {
    ...state,
    currentEvent: null,
    eventRemainingTurns: 0,
    choiceHistory: [
      ...state.choiceHistory,
      { turn: state.currentTurn, eventId: state.currentEvent.id, choiceId: choice.id, success: isSuccess },
    ],
    currentBranch: state.currentEvent.branch ?? state.currentBranch,
  };

  return newState;
}

/**
 * 更新剧情回合
 */
export function advanceStoryTurn(state: StoryState): StoryState {
  return {
    ...state,
    currentTurn: state.currentTurn + 1,
  };
}

/**
 * 获取已触发的剧情数量
 */
export function getStoryProgress(state: StoryState): { triggered: number; total: number } {
  const triggeredUnique = new Set([...state.triggeredEvents, state.currentEvent?.id].filter(Boolean));
  return {
    triggered: triggeredUnique.size,
    total: STORY_EVENTS.length,
  };
}
