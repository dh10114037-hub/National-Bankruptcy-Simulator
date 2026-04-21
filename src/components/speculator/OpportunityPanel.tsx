/**
 * 投机者模式 — 当前机会面板（核心引导模块）
 *
 * 根据市场状态自动分析最佳机会，给出：
 *  1. 危机类型 + 强度
 *  2. 推荐操作（明确指引）
 *  3. 风险信号雷达
 *  4. 标准玩法流程提示
 */

import { useMemo } from 'react';
import type { MarketState } from '../../types/speculator';

interface Props {
  market: MarketState;
  turn: number;
  cash: number;
  maxTurns: number;
}

// ─── 危机类型定义 ────────────────────────────────────────────
type CrisisType =
  | 'currency_collapse'   // 汇率崩溃
  | 'credit_meltdown'     // 信用熔断
  | 'inflation_spiral'    // 通胀失控
  | 'bond_crisis'         // 国债危机
  | 'stock_crash'         // 股市崩溃
  | 'stability'           // 稳定期（观察期）
  | 'multi_crisis';       // 复合危机

interface CrisisInfo {
  type: CrisisType;
  label: string;
  emoji: string;
  intensity: number;     // 1-5
  color: string;
  bgColor: string;
  borderColor: string;
  recommend: RecommendItem[];
  warning: string;
}

interface RecommendItem {
  action: string;
  reason: string;
  asset?: string;
  confidence: 'high' | 'medium' | 'low';
  isMain: boolean;
}

// ─── 信号维度 ────────────────────────────────────────────────
interface RiskSignal {
  label: string;
  emoji: string;
  value: number;       // 0-100，危险程度
  detail: string;
  trend: 'rising' | 'falling' | 'stable';
}

// ─── 分析逻辑 ────────────────────────────────────────────────
function analyzeCrisis(market: MarketState, turn: number): CrisisInfo {
  const { exchange_rate, inflation, credit_rating, bond_price, stock_index } = market;

  // 各维度危险分数（0-100）
  const currencyDanger = Math.max(0, (1.0 - exchange_rate) * 120);         // 汇率越低越危险
  const inflationDanger = Math.min(100, inflation * 1.5);                   // 通胀越高越危险
  const creditDanger = Math.max(0, (70 - credit_rating) * 2);              // 信用低于70开始危险
  const bondDanger = Math.max(0, (0.7 - bond_price) * 200);                // 国债价格低于0.7危险
  const stockDanger = Math.max(0, (2000 - stock_index) / 15);              // 股指低于2000危险

  const maxDanger = Math.max(currencyDanger, inflationDanger, creditDanger, bondDanger, stockDanger);

  // 复合危机判断（超过2个维度高危）
  const highDangerCount = [currencyDanger > 60, inflationDanger > 60, creditDanger > 60, bondDanger > 60, stockDanger > 60].filter(Boolean).length;

  let type: CrisisType;
  let intensity: number;

  if (highDangerCount >= 2) {
    type = 'multi_crisis';
    intensity = Math.min(5, Math.ceil(maxDanger / 20));
  } else if (currencyDanger === maxDanger && currencyDanger > 30) {
    type = 'currency_collapse';
    intensity = Math.min(5, Math.ceil(currencyDanger / 20));
  } else if (inflationDanger === maxDanger && inflationDanger > 30) {
    type = 'inflation_spiral';
    intensity = Math.min(5, Math.ceil(inflationDanger / 20));
  } else if (creditDanger === maxDanger && creditDanger > 30) {
    type = 'credit_meltdown';
    intensity = Math.min(5, Math.ceil(creditDanger / 20));
  } else if (bondDanger === maxDanger && bondDanger > 30) {
    type = 'bond_crisis';
    intensity = Math.min(5, Math.ceil(bondDanger / 20));
  } else if (stockDanger === maxDanger && stockDanger > 30) {
    type = 'stock_crash';
    intensity = Math.min(5, Math.ceil(stockDanger / 20));
  } else {
    type = 'stability';
    intensity = 1;
  }

  const CRISIS_MAP: Record<CrisisType, Omit<CrisisInfo, 'intensity' | 'recommend'>> = {
    currency_collapse: {
      type: 'currency_collapse',
      label: '汇率崩溃危机',
      emoji: '💱',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-300',
      warning: '本币正在贬值，资本正在外逃',
    },
    credit_meltdown: {
      type: 'credit_meltdown',
      label: '信用熔断危机',
      emoji: '📉',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      warning: '国家信用急剧恶化，违约风险上升',
    },
    inflation_spiral: {
      type: 'inflation_spiral',
      label: '通胀失控危机',
      emoji: '🔥',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-300',
      warning: '物价飞涨失控，民众购买力崩溃',
    },
    bond_crisis: {
      type: 'bond_crisis',
      label: '国债违约危机',
      emoji: '🏚',
      color: 'text-purple-700',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-300',
      warning: '国债价格暴跌，政府借贷能力枯竭',
    },
    stock_crash: {
      type: 'stock_crash',
      label: '股市崩盘危机',
      emoji: '📊',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      warning: '股市恐慌性抛售，信心全面崩溃',
    },
    multi_crisis: {
      type: 'multi_crisis',
      label: '系统性金融危机',
      emoji: '🌋',
      color: 'text-red-800',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-400',
      warning: '多个市场同时崩溃，万劫不复之兆',
    },
    stability: {
      type: 'stability',
      label: '市场相对稳定',
      emoji: '🔍',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      warning: '当前无明显危机，提前布局等待机会',
    },
  };

  // 生成推荐操作
  const recommend = buildRecommendations(type, market, turn);

  return {
    ...CRISIS_MAP[type],
    intensity,
    recommend,
  };
}

function buildRecommendations(type: CrisisType, market: MarketState, turn: number): RecommendItem[] {
  const recs: RecommendItem[] = [];

  switch (type) {
    case 'currency_collapse':
      recs.push({
        action: '做空本币 / 买入外汇',
        reason: `汇率已跌至 ${market.exchange_rate.toFixed(2)}，本币仍在贬值`,
        asset: '做空本币 或 长期外汇美元',
        confidence: market.exchange_rate < 0.7 ? 'high' : 'medium',
        isMain: true,
      });
      recs.push({
        action: '买入黄金避险',
        reason: '货币危机期间黄金是最佳避险资产',
        asset: '黄金 / 外汇黄金标准',
        confidence: 'medium',
        isMain: false,
      });
      break;

    case 'credit_meltdown':
      recs.push({
        action: '购买信用违约互换（CDS）',
        reason: `信用评级仅 ${market.credit_rating.toFixed(0)}，违约概率飙升`,
        asset: '信用违约互换',
        confidence: market.credit_rating < 40 ? 'high' : 'medium',
        isMain: true,
      });
      recs.push({
        action: '做空银行板块',
        reason: '信用危机首先冲击银行系统',
        asset: '做空银行系统',
        confidence: 'medium',
        isMain: false,
      });
      break;

    case 'inflation_spiral':
      recs.push({
        action: '买入大宗商品（黄金/石油）',
        reason: `通胀 ${market.inflation.toFixed(1)}%，实物资产保值`,
        asset: '黄金 / 石油',
        confidence: market.inflation > 40 ? 'high' : 'medium',
        isMain: true,
      });
      recs.push({
        action: '购买VIX恐慌期权',
        reason: '高通胀往往引发市场恐慌波动',
        asset: 'VIX恐慌期权',
        confidence: 'medium',
        isMain: false,
      });
      break;

    case 'bond_crisis':
      recs.push({
        action: '做空长期国债',
        reason: `国债价格已跌至 ${market.bond_price.toFixed(3)}，仍有下行空间`,
        asset: '10年期国债（反向）',
        confidence: market.bond_price < 0.5 ? 'high' : 'medium',
        isMain: true,
      });
      recs.push({
        action: '信用违约互换套利',
        reason: '国债危机会触发大规模违约保险赔付',
        asset: '信用违约互换',
        confidence: 'high',
        isMain: false,
      });
      break;

    case 'stock_crash':
      recs.push({
        action: '做空股市 / 买入恐慌期权',
        reason: `股指 ${market.stock_index.toFixed(0)}，下跌趋势明显`,
        asset: '做空股市 / VIX期权',
        confidence: market.stock_index < 1500 ? 'high' : 'medium',
        isMain: true,
      });
      recs.push({
        action: '买入黄金对冲',
        reason: '股市崩盘时资金流向避险资产',
        asset: '黄金',
        confidence: 'medium',
        isMain: false,
      });
      break;

    case 'multi_crisis':
      recs.push({
        action: '全面做空 + 买入黄金',
        reason: '系统性危机 — 一切都在下跌，做空所有头寸',
        asset: '做空本币 + 做空银行 + 黄金',
        confidence: 'high',
        isMain: true,
      });
      recs.push({
        action: '放大危机：传播恐慌',
        reason: '多重危机叠加时，恐慌蔓延最快，操控效果最强',
        confidence: 'high',
        isMain: false,
      });
      break;

    case 'stability':
    default:
      recs.push({
        action: '购买情报，提前埋伏',
        reason: '稳定期是布局的最好时机，先买情报锁定方向',
        confidence: 'medium',
        isMain: true,
      });
      if (turn < 5) {
        recs.push({
          action: '小仓试水国债',
          reason: '低风险建仓，等待危机到来再加仓',
          asset: '1年期国债',
          confidence: 'low',
          isMain: false,
        });
      }
      break;
  }

  return recs;
}

function buildRiskSignals(market: MarketState): RiskSignal[] {
  return [
    {
      label: '汇率风险',
      emoji: '💱',
      value: Math.min(100, Math.max(0, (1.0 - market.exchange_rate) * 120)),
      detail: `当前 ${market.exchange_rate.toFixed(2)}（正常=1.0）`,
      trend: market.exchange_rate < 0.85 ? 'rising' : 'stable',
    },
    {
      label: '通胀压力',
      emoji: '🔥',
      value: Math.min(100, market.inflation * 1.5),
      detail: `通胀率 ${market.inflation.toFixed(1)}%（警戒=30%）`,
      trend: market.inflation > 25 ? 'rising' : 'stable',
    },
    {
      label: '信用危机',
      emoji: '📉',
      value: Math.min(100, Math.max(0, (70 - market.credit_rating) * 2)),
      detail: `评级 ${market.credit_rating.toFixed(0)}（安全线=70）`,
      trend: market.credit_rating < 50 ? 'rising' : 'stable',
    },
    {
      label: '国债压力',
      emoji: '🏚',
      value: Math.min(100, Math.max(0, (0.7 - market.bond_price) * 200)),
      detail: `国债 ${market.bond_price.toFixed(3)}（面值=1.0）`,
      trend: market.bond_price < 0.5 ? 'rising' : 'stable',
    },
    {
      label: '市场恐慌',
      emoji: '📊',
      value: Math.min(100, Math.max(0, (2000 - market.stock_index) / 15)),
      detail: `股指 ${market.stock_index.toFixed(0)}（基准=2000）`,
      trend: market.stock_index < 1500 ? 'rising' : 'stable',
    },
  ];
}

// ─── 强度指示点 ────────────────────────────────────────────
function IntensityDots({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            i < value
              ? value >= 4 ? 'bg-red-500' : value >= 3 ? 'bg-orange-500' : 'bg-amber-400'
              : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

// ─── 风险信号条 ────────────────────────────────────────────
function SignalBar({ signal }: { signal: RiskSignal }) {
  const danger = signal.value;
  const barColor =
    danger >= 75 ? 'bg-red-500' :
    danger >= 50 ? 'bg-orange-400' :
    danger >= 25 ? 'bg-amber-400' :
    'bg-emerald-400';

  const textColor =
    danger >= 75 ? 'text-red-600' :
    danger >= 50 ? 'text-orange-600' :
    danger >= 25 ? 'text-amber-600' :
    'text-emerald-600';

  const trendIcon =
    signal.trend === 'rising' ? '↑' :
    signal.trend === 'falling' ? '↓' : '→';

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm w-4 shrink-0">{signal.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs text-gray-600 font-medium">{signal.label}</span>
          <span className={`text-xs font-mono font-bold ${textColor}`}>
            {trendIcon} {danger.toFixed(0)}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-700 rounded-full`}
            style={{ width: `${Math.min(100, danger)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── 推荐操作卡 ────────────────────────────────────────────
function RecommendCard({ item }: { item: RecommendItem }) {
  const confColor =
    item.confidence === 'high' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
    item.confidence === 'medium' ? 'text-amber-600 bg-amber-50 border-amber-200' :
    'text-gray-500 bg-gray-50 border-gray-200';

  const confLabel =
    item.confidence === 'high' ? '强烈推荐' :
    item.confidence === 'medium' ? '建议操作' : '可选尝试';

  return (
    <div className={`rounded-xl border p-3 transition-all ${
      item.isMain
        ? 'border-amber-300 bg-amber-50/80 shadow-sm'
        : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <span className="text-base mt-0.5 shrink-0">{item.isMain ? '⭐' : '💡'}</span>
          <div className="min-w-0">
            <div className={`font-semibold text-sm ${item.isMain ? 'text-gray-900' : 'text-gray-700'}`}>
              {item.action}
            </div>
            <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.reason}</div>
            {item.asset && (
              <div className="text-xs text-amber-700 mt-1 font-medium">
                → {item.asset}
              </div>
            )}
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${confColor}`}>
          {confLabel}
        </span>
      </div>
    </div>
  );
}

// ─── 步骤引导 ────────────────────────────────────────────────
const TURN_STEPS = [
  { step: 1, label: '查机会', icon: '🎯', desc: '看本回合危机类型' },
  { step: 2, label: '读信号', icon: '📡', desc: '判断哪个风险最高' },
  { step: 3, label: '选交易', icon: '💰', desc: '进入推荐资产建仓' },
  { step: 4, label: '放大器', icon: '💥', desc: '可选：操控加速危机' },
  { step: 5, label: '等收益', icon: '⏳', desc: '结束本月等市场波动' },
];

// ─── 主组件 ────────────────────────────────────────────────
export function OpportunityPanel({ market, turn, cash, maxTurns }: Props) {
  const crisis = useMemo(() => analyzeCrisis(market, turn), [market, turn]);
  const signals = useMemo(() => buildRiskSignals(market), [market]);

  const turnsLeft = maxTurns - turn;
  const urgencyNote =
    turnsLeft <= 3 ? '⚠️ 最后3回合！必须立即行动' :
    turnsLeft <= 6 ? '⏰ 时间不多，加快节奏' :
    null;

  return (
    <div className="space-y-4">

      {/* ── 紧迫度提醒 */}
      {urgencyNote && (
        <div className="px-3 py-2 rounded-lg bg-red-100 border border-red-300 text-red-700 text-xs font-semibold flex items-center gap-2">
          <span>{urgencyNote}</span>
          <span className="ml-auto font-mono">剩余 {turnsLeft} 回合</span>
        </div>
      )}

      {/* ── 危机标题卡 */}
      <div className={`rounded-xl border-2 ${crisis.borderColor} ${crisis.bgColor} p-4`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-3xl leading-none mt-0.5">{crisis.emoji}</span>
            <div>
              <div className={`font-bold text-base ${crisis.color}`}>{crisis.label}</div>
              <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{crisis.warning}</div>
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1">
            <div className="text-xs text-gray-400 font-mono">危机强度</div>
            <IntensityDots value={crisis.intensity} />
          </div>
        </div>
      </div>

      {/* ── 推荐操作 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-gray-700 tracking-wide uppercase">⭐ 本回合推荐操作</span>
        </div>
        <div className="space-y-2">
          {crisis.recommend.map((item, i) => (
            <RecommendCard key={i} item={item} />
          ))}
        </div>
      </div>

      {/* ── 风险信号 */}
      <div>
        <div className="text-xs font-bold text-gray-700 tracking-wide uppercase mb-2">
          📡 风险信号雷达
        </div>
        <div className={`rounded-xl border p-3 space-y-2.5 bg-white`}>
          {signals.map((sig) => (
            <SignalBar key={sig.label} signal={sig} />
          ))}
        </div>
      </div>

      {/* ── 本回合流程（移动端：改为2行横滑提示条） */}
      <div>
        <div className="text-xs font-bold text-gray-700 tracking-wide uppercase mb-2">
          🎮 本回合操作流程
        </div>
        {/* PC: 5列均分 | H5: 紧凑横排，只显示图标+标签 */}
        <div className="flex items-center gap-0 rounded-xl overflow-hidden border border-gray-200 bg-white">
          {TURN_STEPS.map((s, idx) => (
            <div
              key={s.step}
              className={`flex-1 flex flex-col items-center py-2 px-1 text-center border-r last:border-r-0 border-gray-100 transition-colors ${
                idx === 0 ? 'bg-amber-50' : 'hover:bg-gray-50'
              }`}
            >
              <span className="text-base leading-none">{s.icon}</span>
              <span className="text-[10px] font-bold text-gray-700 mt-0.5 whitespace-nowrap">{s.label}</span>
              {/* PC: 显示描述 | H5: 隐藏 */}
              <span className="text-[9px] text-gray-400 leading-tight mt-0.5 hidden md:block">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
