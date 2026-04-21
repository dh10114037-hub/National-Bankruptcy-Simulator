export interface GameState {
  foreign_reserves: number;
  public_support: number;
  credit_rating: number;
  turn: number;
  maxTurns: number;
  phase: 'playing' | 'victory' | 'defeat';
  defeatReason?: string;
  winStreak: number;
  /** 市场状态 */
  market: MarketState;
  /** 投机者现金 */
  specCash?: number;
}

export interface MarketState {
  /** 汇率 (1.0 = 初始汇率) */
  exchange_rate: number;
  /** 波动率 0-1，越高表示市场越不稳定 */
  volatility: number;
  /** 通胀率 0-100 */
  inflation: number;
}

export interface Effects {
  foreign_reserves?: number;
  public_support?: number;
  credit_rating?: number;
  /** 汇率变动 (绝对值) */
  exchange_rate?: number;
  /** 通胀变动 */
  inflation?: number;
  /** 波动率变动 */
  volatility?: number;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  icon: string;
  severity: 'low' | 'medium' | 'high' | 'positive';
  effects: Effects;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  icon: string;
  effects: Effects;
  tradeoff: string;
  /** Possible side effects shown on hover */
  sideEffects?: string[];
  /** 短期效果说明（1句话） */
  shortEffect?: string;
  /** 风险提示（1句话） */
  risk?: string;
  /** 使用建议（1句话） */
  tip?: string;
  /** 推荐标签：survival=紧急救援 | balanced=均衡之选 | growth=长期发展 | negative=高风险 | safe=安全保底 */
  recommendation?: 'survival' | 'balanced' | 'growth' | 'negative' | 'safe';
  /** 额外标签（如"新手推荐"） */
  tag?: string;
}

/** 回合结算总结 */
export interface RoundSummary {
  turn: number;
  policyName: string;
  policyIcon: string;
  eventName: string;
  /** 各指标净变化 */
  delta: {
    foreign_reserves: number;
    public_support: number;
    credit_rating: number;
  };
  /** 连锁影响说明 */
  chainEffects: string[];
  /** 投机者行动说明 */
  speculatorNote?: string;
}

export interface LogEntry {
  turn: number;
  event: string;
  eventIcon: string;
  policy: string;
  policyIcon: string;
  netChange: Effects;
  statsBefore: { foreign_reserves: number; public_support: number; credit_rating: number };
  statsAfter:  { foreign_reserves: number; public_support: number; credit_rating: number };
  speculatorAction?: string;
  speculatorEffect?: Effects;
  /** 本回合执行的辅助操作 */
  auxActions?: string[];
  /** 本回合触发的延迟效果 */
  triggeredDelays?: string[];
}

export interface PostMortemEvent {
  turn: number;
  type: 'decision' | 'crisis' | 'speculator' | 'delayed' | 'game_over';
  icon: string;
  label: string;
  detail: string;
}

/** Single data point for the sparkline trend chart */
export interface TrendPoint {
  turn: number;
  foreign_reserves: number;
  public_support: number;
  credit_rating: number;
}

/** 0-100 composite crisis level */
export type CrisisLevel = number;

/** Phase of each turn from a UX perspective */
export type TurnPhase =
  | 'idle'
  | 'event_reveal'   // event sliding in
  | 'decision'       // player choosing policy
  | 'aux_decision'   // 辅助操作选择
  | 'feedback'       // numbers animating
  | 'ai_action'      // speculator move shown
  | 'next_prompt';   // "next round" button

// ─── 辅助操作（每回合1-2个可选操作）────────────────────────────
export interface AuxAction {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** 资源消耗 */
  cost: {
    foreign_reserves?: number;
    public_support?: number;
    credit_rating?: number;
  };
  /** 立即效果 */
  immediateEffect?: Effects;
  /** 延迟效果（N回合后生效） */
  delayedEffect?: {
    turns: number;
    effect: Effects;
    description: string;
  };
  /** 消耗类型标签 */
  costLabel: string;
}

// ─── 延迟生效队列条目 ─────────────────────────────────────────
export interface DelayedEffect {
  id: string;
  triggerTurn: number;
  effect: Effects;
  sourceName: string;
  description: string;
}

// ─── 失败复盘 ─────────────────────────────────────────────────
export interface PostMortem {
  /** 主因（最先触底的指标） */
  primaryCause: { label: string; icon: string; description: string };
  /** 次因（辅助原因） */
  secondaryCauses: { label: string; icon: string; description: string }[];
  /** 崩溃路径（关键时间节点） */
  timeline: PostMortemEvent[];
  /** 关键错误决策 */
  criticalMistakes: { turn: number; policy: string; icon: string; reason: string }[];
  /** 改进建议 */
  suggestions: string[];
  /** 玩家风格标签 */
  playerStyle: { label: string; icon: string; description: string };
  /** 整体评分 0-100 */
  score: number;
}
