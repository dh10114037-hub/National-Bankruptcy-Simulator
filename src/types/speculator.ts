// ═══════════════════════════════════════════
// 投机者模式 — 类型定义
// ═══════════════════════════════════════════

/** 市场状态（动态） */
export interface MarketState {
  exchange_rate: number;   // 汇率  0.1 ~ 2.0，正常≈1.0
  inflation: number;       // 通胀  0 ~ 100
  credit_rating: number;   // 信用  0 ~ 100
  bond_price: number;      // 国债价格  0.05 ~ 1.0（面值=1）
  stock_index: number;     // 股市指数  500 ~ 5000
}

/** 持仓类型 */
export type PositionType = 'bond' | 'short_currency' | 'gold' | 'short_bank';

/** 单笔持仓 */
export interface Position {
  id: string;
  type: PositionType;
  label: string;
  buy_price: number;       // 买入/开仓价格
  current_price: number;   // 当前价格
  amount: number;          // 投入金额（美元）
  leverage: number;        // 杠杆倍数 1-5
  pnl: number;             // 当前盈亏
  pnl_pct: number;         // 盈亏百分比
}

/** 玩家资产 */
export interface SpeculatorAssets {
  cash: number;
  positions: Position[];
  total_value: number;     // cash + 所有持仓当前价值
  pnl_today: number;       // 本回合盈亏
}

/** 情报条目 */
export type IntelSource = '财政部内线' | '媒体记者' | '国际机构' | '银行内鬼' | '政府顾问';
export type IntelCategory = 'policy' | 'market' | 'social' | 'international';

export interface Intel {
  id: string;
  source: IntelSource;
  confidence: number;      // 0~1，实际准确率
  display_confidence: number; // 展示给玩家（有偏差）
  content: string;
  detail: string;
  truth: boolean;          // 实际是否会发生
  category: IntelCategory;
  impact: 'high' | 'medium' | 'low';
  /** 影响的市场指标 */
  affects: Partial<MarketState>;
  purchased: boolean;
  bribed: boolean;         // 是否已贿赂（准确率提升）
  revealed: boolean;       // 回合结算后揭晓
  expired: boolean;        // 是否已过期
}

/** 市场操控行为 */
export interface ManipulationAction {
  id: string;
  name: string;
  description: string;
  cost: number;
  effects: Partial<MarketState & { public_support_dmg: number }>;
  /** 触发政府事件的副作用文案 */
  side_effect: string;
  success_rate: number;    // 0~1
  cooldown: number;        // 冷却回合数
  cooldown_left: number;   // 剩余冷却
  is_cooling: boolean;
}

/** 交易订单类型 */
export type TradeType = 'long' | 'short';

/** 交易请求（弹窗确认） */
export interface TradeOrder {
  position_type: PositionType;
  label: string;
  trade_type: TradeType;
  amount: number;
  leverage: number;
  current_price: number;
  expected_profit_pct: number;
  risk_note: string;
}

/** 回合结算总结 */
export interface TurnSummary {
  exchange_rate_delta: number;
  inflation_delta: number;
  credit_rating_delta: number;
  stock_index_delta: number;
  bond_price_delta: number;
  cash_delta: number;
  total_value_delta: number;
  turn: number;
}

/** 通知消息（暴利/爆仓/操控成功） */
export type NotifType = 'profit' | 'loss' | 'liquidation' | 'manipulation_success' | 'manipulation_fail' | 'intel' | 'turn_summary';

export interface SpecNotif {
  id: string;
  type: NotifType;
  message: string;
  amount?: number;
  timestamp: number;
}

/** 游戏阶段 */
export type SpecPhase = 'playing' | 'victory' | 'defeat';

/** 整体投机者游戏状态 */
export interface SpeculatorGameState {
  phase: SpecPhase;
  turn: number;
  maxTurns: number;
  assets: SpeculatorAssets;
  market: MarketState;
  intels: Intel[];
  manipulations: ManipulationAction[];
  notifications: SpecNotif[];
  /** 本回合已购情报数 */
  intels_bought_this_turn: number;
  /** 胜利条件：资金达初始3倍 */
  initial_cash: number;
  defeatReason?: string;
  victoryReason?: string;
  /** 政府（拯救者AI）动向日志 */
  gov_log: string[];
  /** 市场波动动画 flag（用于前端 flash） */
  market_flash: Partial<Record<keyof MarketState, 'up' | 'down'>>;
  /** 本回合结算总结（点击结束本月后显示，供 UI 展示） */
  turn_summary: TurnSummary | null;
}
