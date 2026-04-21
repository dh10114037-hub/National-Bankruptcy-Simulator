/**
 * 投机者扩展系统 - 大型内容池 + 动态生成
 * 解决"来来回回就那几个"的问题
 */

// ═══════════════════════════════════════════════════════════════
// 第一层：交易资产池 (20+ 种)
// ═══════════════════════════════════════════════════════════════
// 市场条件类型（用于解锁需求）
export interface MarketCondition {
  turn?: number;
  cash?: number;
  cash_threshold?: number;  // 兼容旧用法
  exchange_rate?: number;
  inflation?: number;
  credit_rating?: number;
  stock_index?: number;
  public_support_dmg?: number;
  foreign_reserves?: number;
}

export interface TradableAsset {
  id: string;
  name: string;                    // 显示名称
  description: string;             // 描述
  explain: string;                 // 大白话解释，让新手能懂
  category: 'bond' | 'currency' | 'stock' | 'commodity' | 'derivative' | 'crypto';
  risk_level: 1 | 2 | 3 | 4 | 5;  // 风险等级 1-5
  volatility: number;              // 波动率 (0-1)
  base_price: number;               // 基准价格
  leverage_available: number[];    // 可用杠杆 [1, 2, 3, 5, 10]
  min_invest: number;               // 最小投资额
  trend: 'bear' | 'bull' | 'neutral' | 'chaos'; // 市场趋势
  unlock_requirement?: Partial<MarketCondition>;
}

export const TRADABLE_ASSET_POOL: TradableAsset[] = [
  // ── 国债系列 ──
  { id: 'gov_bond_1y', name: '1年期国债', description: '政府短期债券，风险最低', explain: '借钱给政府1年，到期还本付息。安全但收益低，国家崩了也赔', category: 'bond', risk_level: 1, volatility: 0.1, base_price: 0.95, leverage_available: [1, 2, 3], min_invest: 10000, trend: 'neutral' },
  { id: 'gov_bond_5y', name: '5年期国债', description: '政府中期债券', explain: '借钱给政府5年，收益更高。但如果国家破产，钱打水漂', category: 'bond', risk_level: 2, volatility: 0.2, base_price: 0.85, leverage_available: [1, 2, 3, 5], min_invest: 20000, trend: 'bear' },
  { id: 'gov_bond_10y', name: '10年期国债', description: '政府长期债券，收益高但风险大', explain: '借钱给政府10年！收益超高，但如果国家破产血本无归', category: 'bond', risk_level: 3, volatility: 0.35, base_price: 0.70, leverage_available: [1, 2, 3, 5, 10], min_invest: 30000, trend: 'bear', unlock_requirement: { turn: 3 } },
  { id: 'corp_bond_hightield', name: '高收益企业债', description: '高利率企业债券，违约风险高', explain: '企业借你的钱，利息很高。但企业可能倒闭跑路', category: 'bond', risk_level: 4, volatility: 0.5, base_price: 0.55, leverage_available: [1, 2, 5, 10], min_invest: 50000, trend: 'chaos', unlock_requirement: { turn: 5 } },

  // ── 货币系列 ──
  { id: 'short_currency', name: '做空本币', description: '做空该国法定货币', explain: '赌这个国家货币会贬值！跌了赚钱，涨了爆亏', category: 'currency', risk_level: 3, volatility: 0.4, base_price: 0.92, leverage_available: [1, 2, 3, 5, 10], min_invest: 50000, trend: 'bear' },
  { id: 'long_forex_usd', name: '做多美元', description: '购入美元外汇', explain: '美元升值你就赚，贬值就亏。美元世界最强货币', category: 'currency', risk_level: 2, volatility: 0.25, base_price: 1.0, leverage_available: [1, 2, 3], min_invest: 30000, trend: 'bull' },
  { id: 'forex_eur', name: '欧元外汇', description: '欧元兑本币', explain: '赌欧元会涨，买入欧元。欧洲第二大货币', category: 'currency', risk_level: 2, volatility: 0.3, base_price: 1.05, leverage_available: [1, 2, 3, 5], min_invest: 25000, trend: 'neutral' },
  { id: 'forex_gold_standard', name: '金本位期货', description: '历史复刻，金价联动', explain: '和金价挂钩的期货合约，乱世买黄金', category: 'currency', risk_level: 3, volatility: 0.35, base_price: 0.88, leverage_available: [1, 2, 3, 5], min_invest: 40000, trend: 'bull', unlock_requirement: { turn: 6 } },

  // ── 股指系列 ──
  { id: 'stock_index', name: '大盘股指', description: '该国主要股票指数', explain: '赌整个股市会涨。买指数就是买国运', category: 'stock', risk_level: 3, volatility: 0.45, base_price: 3200, leverage_available: [1, 2, 3, 5], min_invest: 40000, trend: 'bear' },
  { id: 'short_stock', name: '做空股指', description: '做空整个股市', explain: '赌股市崩盘！国家乱了股市就跌，你能赚大钱', category: 'stock', risk_level: 3, volatility: 0.45, base_price: 3200, leverage_available: [1, 2, 3, 5, 10], min_invest: 40000, trend: 'bull' },
  { id: 'bank_sector', name: '银行板块', description: '金融银行股', explain: '赌银行股价会跌。银行最怕挤兑和国家动荡', category: 'stock', risk_level: 4, volatility: 0.55, base_price: 850, leverage_available: [1, 2, 3, 5], min_invest: 30000, trend: 'bear', unlock_requirement: { credit_rating: 40 } },
  { id: 'tech_sector', name: '科技板块', description: '科技成长股', explain: '高风险高回报！科技股波动大，乱世容易崩', category: 'stock', risk_level: 5, volatility: 0.7, base_price: 1200, leverage_available: [1, 2, 3], min_invest: 50000, trend: 'chaos' },
  { id: 'energy_sector', name: '能源板块', description: '石油天然气股', explain: '赌能源股涨跌。油价波动大，影响整个经济', category: 'stock', risk_level: 4, volatility: 0.6, base_price: 680, leverage_available: [1, 2, 3, 5], min_invest: 35000, trend: 'neutral' },

  // ── 大宗商品 ──
  { id: 'gold', name: '黄金', description: '避险资产', explain: '乱世买黄金！大家都慌的时候黄金最值钱', category: 'commodity', risk_level: 2, volatility: 0.3, base_price: 1600, leverage_available: [1, 2, 3, 5], min_invest: 25000, trend: 'bull' },
  { id: 'oil', name: '原油', description: '国际油价', explain: '赌油价涨跌。油价和经济息息相关，波动剧烈', category: 'commodity', risk_level: 4, volatility: 0.6, base_price: 75, leverage_available: [1, 2, 3, 5], min_invest: 30000, trend: 'chaos' },
  { id: 'wheat', name: '小麦期货', description: '农产品期货', explain: '赌小麦价格。粮食危机时暴涨，丰收时暴跌', category: 'commodity', risk_level: 3, volatility: 0.45, base_price: 620, leverage_available: [1, 2, 3, 5], min_invest: 20000, trend: 'neutral' },
  { id: 'copper', name: '铜期货', description: '工业金属', explain: '铜是经济晴雨表。工业繁荣铜价涨，衰退铜价跌', category: 'commodity', risk_level: 4, volatility: 0.55, base_price: 3.8, leverage_available: [1, 2, 3, 5], min_invest: 25000, trend: 'neutral' },

  // ── 衍生品 ──
  { id: 'vix_options', name: 'VIX期权', description: '波动率指数期权', explain: '买市场恐慌！大家都慌的时候VIX暴涨，能赚大钱', category: 'derivative', risk_level: 5, volatility: 0.8, base_price: 25, leverage_available: [1, 2, 3, 5, 10], min_invest: 100000, trend: 'bull', unlock_requirement: { turn: 8, cash_threshold: 2000000 } },
  { id: 'credit_default_swap', name: 'CDS信用违约互换', description: '信用违约保险', explain: '给国家信用买保险。国家违约你就赚翻', category: 'derivative', risk_level: 5, volatility: 0.75, base_price: 120, leverage_available: [1, 2, 3, 5], min_invest: 150000, trend: 'bull', unlock_requirement: { credit_rating: 35 } },
  { id: 'futures_contango', name: '期货升水策略', description: '跨期套利', explain: '低买高卖的套利策略，风险较低但收益稳定', category: 'derivative', risk_level: 3, volatility: 0.4, base_price: 100, leverage_available: [1, 2, 3], min_invest: 80000, trend: 'neutral', unlock_requirement: { turn: 4 } },

  // ── 加密 / 特殊 ──
  { id: 'crypto_repatriation', name: '资本回流代币', description: '地下钱庄跨境代币', explain: '洗钱专用！高风险高回报，监管打击风险极大', category: 'crypto', risk_level: 5, volatility: 0.9, base_price: 0.5, leverage_available: [1, 2, 3, 5, 10, 20], min_invest: 200000, trend: 'chaos', unlock_requirement: { turn: 10, inflation: 60 } },
  { id: 'short_bank_system', name: '做空银行系统', description: '系统性做空银行股', explain: '联合做空所有银行！银行倒闭潮时赚翻天', category: 'stock', risk_level: 4, volatility: 0.65, base_price: 35, leverage_available: [1, 2, 3, 5, 10], min_invest: 80000, trend: 'bear', unlock_requirement: { credit_rating: 45 } },
];

// ═══════════════════════════════════════════════════════════════
// 第二层：市场操控池 (15+ 种)
// ═══════════════════════════════════════════════════════════════
export interface ManipulationAction {
  id: string;
  name: string;
  description: string;
  explain: string;   // 大白话解释，让新手能懂
  category: 'psychological' | 'market' | 'political' | 'systemic' | 'blackops';
  cost: number;
  effects: Record<string, number>;
  side_effect: string;
  success_rate: number;
  cooldown: number;
  risk_level: 1 | 2 | 3 | 4 | 5;
  unlock_requirement?: Partial<MarketCondition>;
}

export const MANIPULATION_POOL: ManipulationAction[] = [
  // ── 心理战 ──
  { id: 'media_panic', name: '媒体恐慌宣传', description: '向媒体散布恐慌性报道', explain: '花钱让媒体发恐慌新闻。大家都怕了，市场就崩', category: 'psychological', cost: 100000, effects: { public_support_dmg: 10, inflation: 3 }, side_effect: '政府可能审查媒体', success_rate: 0.85, cooldown: 2, risk_level: 2 },
  { id: 'fake_good_news', name: '虚假利好消息', description: '散布政府救市假消息', explain: '放假的救市消息，让大家以为会涨。等他们买入就跑', category: 'psychological', cost: 80000, effects: { exchange_rate: 0.05, stock_index: 200 }, side_effect: '若被揭穿信用崩塌', success_rate: 0.6, cooldown: 3, risk_level: 3 },
  { id: 'influencer_campaign', name: '大V联动', description: '收买社交媒体大V', explain: '买通网红让他们带节奏。大V粉丝多，威力大', category: 'psychological', cost: 150000, effects: { public_support_dmg: 15 }, side_effect: '大V可能反水', success_rate: 0.7, cooldown: 4, risk_level: 3 },
  { id: 'fake_crisis', name: '人造危机', description: '制造虚假危机事件', explain: '编造一个假危机！引发全面恐慌，但容易被查', category: 'psychological', cost: 200000, effects: { stock_index: -400, exchange_rate: -0.1 }, side_effect: '引发市场全面恐慌', success_rate: 0.5, cooldown: 5, risk_level: 4 },

  // ── 市场攻击 ──
  { id: 'short_attack', name: '做空攻击', description: '集中火力做空本币', explain: '大量抛售这个国家的货币，让它贬值！央行会反击', category: 'market', cost: 200000, effects: { exchange_rate: -0.15, credit_rating: -5 }, side_effect: '央行可能干预', success_rate: 0.75, cooldown: 3, risk_level: 3 },
  { id: 'bond_auction_sabotage', name: '国债拍卖破坏', description: '在国债拍卖中做空', explain: '在国债拍卖时故意压价。国债卖不出去政府就缺钱', category: 'market', cost: 300000, effects: { bond_price: -0.1, credit_rating: -8 }, side_effect: '引发国际关注', success_rate: 0.6, cooldown: 5, risk_level: 4, unlock_requirement: { turn: 5 } },
  { id: 'short_squeeze_liquidation', name: '空头挤压', description: '拉高价格逼空头爆仓', explain: '把价格拉高！那些做空的人会亏光被迫平仓', category: 'market', cost: 500000, effects: { stock_index: 300 }, side_effect: '消耗大量资金', success_rate: 0.55, cooldown: 6, risk_level: 5, unlock_requirement: { cash_threshold: 3000000 } },
  { id: 'hft_disruption', name: '高频交易干扰', description: '算法交易干扰', explain: '用技术手段干扰高频交易程序。散户会被收割', category: 'market', cost: 250000, effects: { stock_index: -200 }, side_effect: '可能被监管调查', success_rate: 0.65, cooldown: 4, risk_level: 4, unlock_requirement: { turn: 6 } },

  // ── 政治施压 ──
  { id: 'spread_rumor', name: '散布谣言', description: '匿名散布政府违约消息', explain: '发匿名消息说政府要破产了。成本低效果好', category: 'political', cost: 80000, effects: { credit_rating: -8, inflation: 5 }, side_effect: '评级机构可能跟进', success_rate: 0.8, cooldown: 2, risk_level: 2 },
  { id: 'imf_leak', name: 'IMF报告泄密', description: '提前获取并泄露IMF评估', explain: '花钱买IMF的内部报告，提前知道会不会降级', category: 'political', cost: 400000, effects: { credit_rating: -15, exchange_rate: -0.2 }, side_effect: '国际制裁风险', success_rate: 0.45, cooldown: 8, risk_level: 5, unlock_requirement: { turn: 10 } },
  { id: 'diplomatic_pressure', name: '外交施压', description: '幕后游说对华关系紧张', explain: '搞坏两国外交关系。外资会撤离，汇率崩盘', category: 'political', cost: 350000, effects: { exchange_rate: -0.12, foreign_reserves: -10 }, side_effect: '引发外交抗议', success_rate: 0.55, cooldown: 6, risk_level: 4, unlock_requirement: { turn: 8 } },
  { id: 'credit_downgrade_anticipation', name: '降级预期管理', description: '提前布局降级交易', explain: '在降级之前提前做空。降级后能赚一大笔', category: 'political', cost: 200000, effects: { bond_price: -0.08, credit_rating: -6 }, side_effect: '被评级机构注意', success_rate: 0.7, cooldown: 4, risk_level: 3 },

  // ── 系统性攻击 ──
  { id: 'bank_run_coordination', name: '协调银行挤兑', description: '组织协调的银行挤兑', explain: '组织人去银行排队取钱！银行现金不够就倒闭', category: 'systemic', cost: 150000, effects: { exchange_rate: -0.08, public_support_dmg: 5, credit_rating: -6 }, side_effect: '可能触发资本管控', success_rate: 0.7, cooldown: 3, risk_level: 3 },
  { id: 'payment_system_attack', name: '支付系统攻击', description: '干扰电子支付系统', explain: '黑掉支付系统让大家取不了钱。引发社会恐慌', category: 'systemic', cost: 600000, effects: { stock_index: -500, public_support_dmg: 20 }, side_effect: '引发国家安全调查', success_rate: 0.4, cooldown: 10, risk_level: 5, unlock_requirement: { turn: 15, cash_threshold: 5000000 } },
  { id: 'sovereign_default_swap', name: '主权CDS狙击', description: '大量买入主权CDS', explain: '买主权债务违约保险。国家违约你就赚翻', category: 'systemic', cost: 400000, effects: { credit_rating: -10, bond_price: -0.15 }, side_effect: '引发连锁反应', success_rate: 0.5, cooldown: 7, risk_level: 5, unlock_requirement: { credit_rating: 40 } },

  // ── 黑科技 ──
  { id: 'ai_sentiment_manipulation', name: 'AI情绪操控', description: '使用AI批量制造虚假舆论', explain: '用AI造谣！批量生产假新闻，威力巨大', category: 'blackops', cost: 500000, effects: { public_support_dmg: 25, inflation: 8 }, side_effect: '技术成本极高', success_rate: 0.8, cooldown: 5, risk_level: 4, unlock_requirement: { turn: 12 } },
  { id: 'supply_chain_disruption', name: '供应链扰乱', description: '制造供应链危机假象', explain: '制造供应链要断的假消息。物价会暴涨', category: 'blackops', cost: 350000, effects: { inflation: 15, stock_index: -300 }, side_effect: '引发真实通胀', success_rate: 0.6, cooldown: 6, risk_level: 4, unlock_requirement: { inflation: 50 } },
  { id: 'foreign_debt_trigger', name: '外债违约触发', description: '触发外债提前到期条款', explain: '找借口让国家必须提前还外债。政府会资金链断裂', category: 'blackops', cost: 800000, effects: { credit_rating: -20, exchange_rate: -0.25 }, side_effect: '引发国际诉讼', success_rate: 0.35, cooldown: 12, risk_level: 5, unlock_requirement: { turn: 15, foreign_reserves: 20 } },
];

// ═══════════════════════════════════════════════════════════════
// 第三层：情报网络池 (15+ 种)
// ═══════════════════════════════════════════════════════════════
export interface IntelType {
  id: string;
  source: string;
  source_type: 'government' | 'financial' | 'media' | 'international' | 'underground' | 'insider';
  confidence: number;
  display_confidence_range: [number, number];
  content: string;
  detail: string;
  truth: boolean;
  category: 'policy' | 'market' | 'international' | 'crisis' | 'opportunity';
  impact: 'low' | 'medium' | 'high' | 'critical';
  affects: Record<string, number>;
  unlock_requirement?: Partial<MarketCondition>;
}

export const INTEL_POOL: IntelType[] = [
  // ── 政府政策 ──
  { id: 'tax_increase', source: '财政部内线', source_type: 'insider', confidence: 0.8, display_confidence_range: [0.7, 0.85], content: '政府可能明天加税', detail: '财政赤字扩大，税收政策调整迫在眉睫。', truth: true, category: 'policy', impact: 'high', affects: { credit_rating: 5, inflation: 8 } },
  { id: 'rate_cut_plan', source: '央行顾问', source_type: 'insider', confidence: 0.75, display_confidence_range: [0.65, 0.85], content: '央行考虑降息救市', detail: '通胀压力下央行陷入两难，降息可能加剧通胀。', truth: false, category: 'policy', impact: 'medium', affects: { exchange_rate: -0.08, stock_index: 200 } },
  { id: 'emergency_capital_control', source: '内阁消息', source_type: 'government', confidence: 0.7, display_confidence_range: [0.6, 0.8], content: '紧急资本管控正在讨论', detail: '若实施，所有外汇交易将受限。', truth: true, category: 'policy', impact: 'critical', affects: { exchange_rate: -0.2, credit_rating: -10 } },
  { id: 'fiscal_stimulus', source: '总理办公室', source_type: 'government', confidence: 0.65, display_confidence_range: [0.7, 0.9], content: '大规模财政刺激计划', detail: '政府正在起草紧急刺激方案。', truth: true, category: 'policy', impact: 'high', affects: { stock_index: 400, inflation: 10 } },

  // ── 市场情报 ──
  { id: 'market_panic', source: '交易所数据', source_type: 'financial', confidence: 0.9, display_confidence_range: [0.85, 0.95], content: '市场恐慌情绪持续上升', detail: '社交媒体恐慌指数创新高。', truth: true, category: 'market', impact: 'high', affects: { stock_index: -400, exchange_rate: -0.08 } },
  { id: 'margin_call_wave', source: '券商内线', source_type: 'financial', confidence: 0.85, display_confidence_range: [0.8, 0.9], content: '大量账户触发追加保证金', detail: '散户杠杆率高企，踩踏风险加剧。', truth: true, category: 'market', impact: 'critical', affects: { stock_index: -600, exchange_rate: -0.12 } },
  { id: 'institutional_exodus', source: '托管行数据', source_type: 'financial', confidence: 0.75, display_confidence_range: [0.7, 0.85], content: '机构投资者正在撤离', detail: '外资机构已开始大规模减持。', truth: true, category: 'market', impact: 'high', affects: { stock_index: -300, credit_rating: -5 } },
  { id: 'short_squeeze_opportunity', source: '量化基金', source_type: 'financial', confidence: 0.7, display_confidence_range: [0.6, 0.8], content: '空头仓位极度拥挤', detail: '逼空机会即将来临。', truth: true, category: 'market', impact: 'high', affects: { stock_index: 500 } },

  // ── 国际情报 ──
  { id: 'imf_negotiation_failure', source: 'IMF内部', source_type: 'international', confidence: 0.9, display_confidence_range: [0.85, 0.95], content: 'IMF谈判可能失败', detail: '对该国财政透明度存疑。', truth: true, category: 'international', impact: 'critical', affects: { credit_rating: -12, exchange_rate: -0.1 } },
  { id: 'g7_sanctions', source: '外交渠道', source_type: 'international', confidence: 0.6, display_confidence_range: [0.5, 0.7], content: 'G7可能实施金融制裁', detail: '若制裁实施，跨境支付将受限。', truth: true, category: 'international', impact: 'critical', affects: { exchange_rate: -0.25, foreign_reserves: -15 } },
  { id: 'bilateral_swap_cancel', source: '央行同行', source_type: 'international', confidence: 0.7, display_confidence_range: [0.65, 0.8], content: '双边货币互换可能取消', detail: '外汇流动性将急剧收缩。', truth: true, category: 'international', impact: 'high', affects: { exchange_rate: -0.15, foreign_reserves: -20 } },
  { id: 'debt_restructuring', source: '主权基金', source_type: 'international', confidence: 0.8, display_confidence_range: [0.75, 0.9], content: '债务重组方案讨论中', detail: '国债可能展期或打折。', truth: true, category: 'international', impact: 'critical', affects: { exchange_rate: -0.15, credit_rating: -15 } },

  // ── 危机预警 ──
  { id: 'bank_liquidity_crisis', source: '银行内鬼', source_type: 'insider', confidence: 0.7, display_confidence_range: [0.6, 0.75], content: '大型商业银行存在流动性危机', detail: '内部压力测试显示资不抵债。', truth: true, category: 'market', impact: 'critical', affects: { exchange_rate: -0.12, stock_index: -600 } },
  { id: 'political_instability', source: '反对派', source_type: 'underground', confidence: 0.6, display_confidence_range: [0.5, 0.7], content: '政府内部权力斗争激烈', detail: '总理可能被迫下台。', truth: true, category: 'market', impact: 'high', affects: { credit_rating: -10, stock_index: -400 } },
  { id: 'military_decision', source: '军方消息', source_type: 'government', confidence: 0.5, display_confidence_range: [0.4, 0.65], content: '军队可能介入经济管制', detail: '若戒严，市场将停摆。', truth: false, category: 'market', impact: 'critical', affects: { stock_index: -800, exchange_rate: -0.3 } },
  { id: 'civil_unrest', source: '情报部门', source_type: 'government', confidence: 0.85, display_confidence_range: [0.8, 0.9], content: '全国性抗议活动策划中', detail: '工会号召大规模罢工。', truth: true, category: 'market', impact: 'high', affects: { stock_index: -200, credit_rating: -8 } },

  // ── 机会情报 ──
  { id: 'hidden_assets', source: '审计署', source_type: 'insider', confidence: 0.8, display_confidence_range: [0.7, 0.85], content: '政府有隐藏资产未披露', detail: '若曝光，市场可能反弹。', truth: false, category: 'policy', impact: 'high', affects: { credit_rating: 10, stock_index: 300 } },
  { id: 'bailout_ready', source: '财政部', source_type: 'insider', confidence: 0.75, display_confidence_range: [0.65, 0.8], content: '救市资金已准备就绪', detail: '央行随时准备注入流动性。', truth: false, category: 'policy', impact: 'medium', affects: { exchange_rate: 0.1, stock_index: 400 } },
  { id: 'trade_deal', source: '商务部', source_type: 'government', confidence: 0.7, display_confidence_range: [0.6, 0.8], content: '重大贸易协议即将签署', detail: '出口将大幅增长。', truth: true, category: 'international', impact: 'high', affects: { exchange_rate: 0.15, credit_rating: 8 } },
];

// ═══════════════════════════════════════════════════════════════
// 第四层：动态生成器
// ═══════════════════════════════════════════════════════════════

export interface MarketContext {
  turn: number;
  exchange_rate: number;
  inflation: number;
  credit_rating: number;
  stock_index: number;
  cash: number;
}

/**
 * 根据市场状况动态生成可用资产
 */
export function generateAvailableAssets(ctx: MarketContext, count: number = 6): TradableAsset[] {
  // 过滤已解锁的资产
  const available = TRADABLE_ASSET_POOL.filter(asset => {
    if (asset.unlock_requirement) {
      const req = asset.unlock_requirement;
      if (req.turn && ctx.turn < req.turn) return false;
      if (req.cash_threshold && ctx.cash < req.cash_threshold) return false;
      // 检查其他市场条件
      for (const [key, val] of Object.entries(req)) {
        if (key !== 'turn' && key !== 'cash' && key !== 'cash_threshold' && val !== undefined) {
          if (ctx[key as keyof MarketContext] < val) return false;
        }
      }
    }
    return true;
  });

  // 按市场趋势和风险筛选（市场越差，高风险机会越多）
  let filtered = available;
  if (ctx.credit_rating < 30) {
    // 危机模式：更多做空机会
    filtered = available.filter(a => a.category !== 'stock' || a.id.includes('short'));
  } else if (ctx.inflation > 60) {
    // 高通胀：黄金、实物资产更活跃
    filtered = available.filter(a => ['commodity', 'currency'].includes(a.category) || a.id.includes('gold') || a.id.includes('short'));
  }

  // 随机选择 + 打乱
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * 根据市场状况动态生成可用操控行为
 */
export function generateAvailableManipulations(ctx: MarketContext, count: number = 4): ManipulationAction[] {
  const available = MANIPULATION_POOL.filter(manip => {
    if (manip.unlock_requirement) {
      const req = manip.unlock_requirement;
      if (req.turn && ctx.turn < req.turn) return false;
      if (req.cash_threshold && ctx.cash < req.cash_threshold) return false;
      for (const [key, val] of Object.entries(req)) {
        if (key !== 'turn' && key !== 'cash' && key !== 'cash_threshold' && val !== undefined) {
          if (ctx[key as keyof MarketContext] < val) return false;
        }
      }
    }
    return true;
  });

  // 随机选择
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * 根据市场状况动态生成情报
 */
export function generateAvailableIntels(ctx: MarketContext, count: number = 4): IntelType[] {
  const available = INTEL_POOL.filter(intel => {
    if (intel.unlock_requirement) {
      const { turn, cash_threshold } = intel.unlock_requirement;
      if (turn && ctx.turn < turn) return false;
      if (cash_threshold && ctx.cash < cash_threshold) return false;
    }
    return true;
  });

  // 优先显示与当前危机相关的情报
  let prioritized = available;
  if (ctx.credit_rating < 35) {
    prioritized = available.filter(i => i.category === 'crisis' || i.category === 'international');
  } else if (ctx.inflation > 50) {
    prioritized = available.filter(i => i.affects['inflation']);
  }

  const shuffled = [...prioritized, ...available.filter(i => !prioritized.includes(i))]
    .sort(() => Math.random() - 0.5);

  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * 刷新获得新的选项（消耗资金）
 */
export function calculateRefreshCost(currentTurn: number): number {
  // 刷新成本随回合增加
  return 50000 + currentTurn * 10000;
}
