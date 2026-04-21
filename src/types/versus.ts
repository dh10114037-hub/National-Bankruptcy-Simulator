/**
 * 双人对抗模式 - 类型定义
 * 基于《双人对抗完整交互流程图》设计
 */

// ── 国家状态 ──────────────────────────────────────
export interface VersusCountry {
  foreign_reserves: number;  // 0-100
  public_support:   number;  // 0-100
  credit_rating:    number;  // 0-100
  inflation:        number;  // 0-100
}

// ── 市场状态 ──────────────────────────────────────
export interface VersusMarket {
  exchange_rate: number;   // 1.0 = 正常
  bond_price:    number;   // 0-1
  volatility:    number;   // 0-1
}

// ── 投机者资产 ────────────────────────────────────
export interface VersusSpecAssets {
  cash:       number;
  positions:  VersusPosition[];
  total_value: number;
}

export interface VersusPosition {
  id:        string;
  type:      'short_currency' | 'buy_bonds' | 'spread_rumor' | 'attack_market';
  label:     string;
  amount:    number;
  leverage:  number;
  pnl:       number;
  pnl_pct:   number;
}

// ── 投机者行动 ────────────────────────────────────
export type SpecActionType = 'short_currency' | 'buy_bonds' | 'spread_rumor' | 'attack_market';

export interface SpecAction {
  type:    SpecActionType;
  amount:  number;
  leverage?: number;
}

// ── 拯救者行动 ────────────────────────────────────
export interface SaviorAction {
  policy_id: string;
}

// ── 回合阶段（5阶段状态机）──────────────────────
export type VersusPhase =
  | 'intel'          // Phase 1: 情报阶段（投机者优先）
  | 'spec_action'    // Phase 2: 投机者行动（可多次操作）
  | 'savior_action'  // Phase 3: 拯救者决策（单次）
  | 'settlement'     // Phase 4: 市场结算
  | 'feedback'       // Phase 5: 反馈展示
  | 'game_over';     // 胜负结算

// ── 情报卡 ───────────────────────────────────────
export interface VersusIntel {
  id:         string;
  content:    string;
  confidence: number;  // 0-1
  truth:      boolean;
  purchased:  boolean;
  bribed:     boolean;
}

// ── 回合日志 ──────────────────────────────────────
export interface VersusLogEntry {
  turn:          number;
  event:         string;
  savior_policy: string;
  spec_actions:  string[];
  country_delta: Partial<VersusCountry>;
  market_delta:  Partial<VersusMarket>;
  spec_pnl:      number;
}

// ── 胜负结果 ──────────────────────────────────────
export type VersusWinner = 'savior' | 'speculator' | null;

export interface VersusResult {
  winner:  VersusWinner;
  reason:  string;
  turns:   number;
  savior_final:  VersusCountry;
  spec_final:    number; // 最终总资产
}

// ── 全局对抗状态 ──────────────────────────────────
export interface VersusGameState {
  turn:     number;
  maxTurns: number;
  phase:    VersusPhase;

  country:  VersusCountry;
  market:   VersusMarket;

  // 当前回合情报
  intels: VersusIntel[];

  // 当前回合可选政策（拯救者）
  available_policies: import('./game').Policy[];

  // 当前回合动作队列
  spec_actions:  SpecAction[];
  savior_action: SaviorAction | null;

  // 投机者资产
  spec_assets: VersusSpecAssets;

  // 操控冷却（map: actionType -> cooldown turns left）
  manip_cooldown: Record<string, number>;

  // 当前随机事件
  current_event: import('./game').Event | null;

  // 结算日志
  log: VersusLogEntry[];

  // 结算动画用：上一回合变化量
  last_country_delta: Partial<VersusCountry> | null;
  last_spec_pnl: number;

  // 结算通知（临时）
  settlement_news: string[];

  // 胜负
  winner:  VersusWinner;
  result:  VersusResult | null;

  // AI顾问（可选）
  advisor_tip: AdvisorTip | null;

  // 初始资金（用于计算倍率）
  initial_cash: number;
}

// ── AI顾问提示 ───────────────────────────────────
export interface AdvisorTip {
  role:         'savior' | 'speculator';
  summary:      string;
  advice:       string;
  risk_warning: string;
  explanation:  string;   // 金融知识点
  knowledge_topic: KnowledgeTopic;
}

export type KnowledgeTopic = 'inflation' | 'credit' | 'exchange_rate' | 'debt' | 'bank_run';
