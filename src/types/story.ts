// ═══════════════════════════════════════════
// 剧情事件链 — 类型定义
// ═══════════════════════════════════════════

import type { MarketState } from './speculator';

/** 剧情阶段 */
export type StoryPhase = 'dormant' | 'active' | 'resolved';

/** 选择效果 */
export interface StoryChoice {
  id: string;
  text: string;
  /** 执行后对国家和市场的影响 */
  effects: StoryEffects;
  /** 成功/失败概率，默认1.0 */
  successRate?: number;
  /** 失败时的效果（可选） */
  failureEffects?: StoryEffects;
  /** 背景色 */
  theme?: 'red' | 'blue' | 'yellow' | 'purple';
}

/** 剧情效果 */
export interface StoryEffects {
  /** 民心变化 */
  public_support?: number;
  /** 信用变化 */
  credit_rating?: number;
  /** 通胀变化 */
  inflation?: number;
  /** 外汇储备变化 */
  foreign_reserves?: number;
  /** 汇率变化 */
  exchange_rate?: number;
  /** 国债价格变化 */
  bond_price?: number;
  /** 股指变化 */
  stock_index?: number;
  /** 投机者资金变化 */
  spec_cash?: number;
  /** 触发其他事件 */
  trigger_event?: string;
}

/** 剧情事件 */
export interface StoryEvent {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  /** 触发条件 */
  triggerCondition: {
    /** 最小回合数 */
    minTurn?: number;
    /** 最大回合数 */
    maxTurn?: number;
    /** 特定市场指标阈值 */
    marketThreshold?: Partial<MarketState>;
    /** 特定国家指标阈值 */
    countryThreshold?: {
      public_support?: number;
      credit_rating?: number;
      inflation?: number;
      foreign_reserves?: number;
    };
    /** 概率触发（0-1） */
    probability?: number;
  };
  choices: StoryChoice[];
  /** 事件持续回合数 */
  duration: number;
  /** 是否只触发一次 */
  onceOnly: boolean;
  /** 剧情分支标记 */
  branch?: string;
}

/** 剧情状态 */
export interface StoryState {
  /** 已触发过的事件ID */
  triggeredEvents: string[];
  /** 当前进行中的事件 */
  currentEvent: StoryEvent | null;
  /** 当前回合数 */
  currentTurn: number;
  /** 剩余持续回合 */
  eventRemainingTurns: number;
  /** 历史选择记录 */
  choiceHistory: Array<{
    turn: number;
    eventId: string;
    choiceId: string;
    success: boolean;
  }>;
  /** 分支路径 */
  currentBranch: string;
}

/** 剧情结果（选择后） */
export interface StoryResult {
  event: StoryEvent;
  choice: StoryChoice;
  success: boolean;
  appliedEffects: StoryEffects;
  message: string;
}

/** ============================================
 * 影响建模层（Influence Modeling Layer）
 * 这是决策生成的核心：先建模事件影响，再生成针对性决策
 * ============================================ */

/** 影响建模结果 */
export interface ImpactModel {
  /** 事件名称 */
  event: string;
  /** 核心问题描述（多个问题用 + 连接） */
  coreProblem: string;
  /** 具体影响指标 */
  impacts: {
    /** 民心/支持率 */
    public_support?: number;
    /** 国家信用 */
    credit_rating?: number;
    /** 外资信心 */
    foreign_confidence?: number;
    /** 通胀压力 */
    inflation?: number;
    /** 外汇储备 */
    foreign_reserves?: number;
    /** 汇率 */
    exchange_rate?: number;
    /** 国债市场 */
    bond_market?: number;
    /** 股指/股市 */
    stock_market?: number;
  };
  /** 紧迫程度（1-5，5最高） */
  urgency: number;
  /** 持续时间（回合数） */
  duration: number;
}

/** 基于影响建模的决策 */
export interface ModeledDecision {
  /** 决策ID */
  id: string;
  /** 决策名称 */
  name: string;
  /** 针对的核心问题 */
  targetProblem: string;
  /** 决策解释（大白话） */
  explain: string;
  /** 预期效果（基于影响建模） */
  expectedEffect: {
    public_support?: number;
    credit_rating?: number;
    foreign_confidence?: number;
    inflation?: number;
    foreign_reserves?: number;
    exchange_rate?: number;
    bond_market?: number;
    stock_market?: number;
  };
  /** 副作用 */
  sideEffects?: {
    public_support?: number;
    credit_rating?: number;
    inflation?: number;
    foreign_reserves?: number;
    exchange_rate?: number;
    bond_market?: number;
    stock_market?: number;
    foreign_confidence?: number;
    sovereignty?: number; // 主权受限程度
  };
  /** 成本（资金消耗） */
  cost?: number;
  /** 风险等级（1-5） */
  riskLevel: number;
  /** 成功率（0-1） */
  successRate: number;
}

/** 影响建模上下文 */
export interface ImpactContext {
  /** 当前回合 */
  turn: number;
  /** 当前国家状态 */
  country: {
    public_support: number;
    credit_rating: number;
    inflation: number;
    foreign_reserves: number;
  };
  /** 当前市场状态 */
  market: {
    exchange_rate: number;
    bond_price: number;
    stock_index: number;
  };
}
