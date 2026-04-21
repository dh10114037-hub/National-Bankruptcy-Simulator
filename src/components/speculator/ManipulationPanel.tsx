/**
 * 投机者模式 — 操控市场（放大危机中心）
 *
 * 重构思路：
 *  - 每个操控行为明确标注「放大哪种危机」
 *  - 突出「成功率 + 危机影响效果」
 *  - 高危操作显示警告说明
 *  - 根据当前危机类型，推荐最合适的操控手段
 *
 * 响应式布局：
 *  - PC: 2列 grid（卡片不被压缩）
 *  - 平板: 2列
 *  - 手机: 1列
 *  - 卡片 min-width: 200px 防止被压缩
 */

import { useMemo } from 'react';
import { MANIPULATION_POOL } from '../../data/expandablePool';
import type { MarketState } from '../../types/speculator';

interface Props {
  manipulations: ManipulationAction[];
  cash: number;
  turn: number;
  market: MarketState;
  onTrigger: (id: string) => void;
}

interface ManipulationAction {
  id: string;
  name: string;
  description: string;
  cost: number;
  effects: Record<string, number>;
  side_effect: string;
  success_rate: number;
  cooldown: number;
  is_cooling?: boolean;
  cooldown_left?: number;
}

// ─── 危机放大器标签 ────────────────────────────────────────
function getCrisisAmplifierTags(action: { effects: Record<string, number> }): string[] {
  const tags: string[] = [];
  const e = action.effects;

  if ((e['exchange_rate'] ?? 0) < 0) tags.push('📉 压低汇率');
  if ((e['exchange_rate'] ?? 0) > 0) tags.push('📈 推高汇率');
  if ((e['inflation'] ?? 0) > 0) tags.push('🔥 加剧通胀');
  if ((e['credit_rating'] ?? 0) < 0) tags.push('⬇️ 拉低信用');
  if ((e['bond_price'] ?? 0) < 0) tags.push('🏚 打压国债');
  if ((e['stock_index'] ?? 0) < 0) tags.push('📊 砸盘股市');
  if ((e['public_support_dmg'] ?? 0) > 0) tags.push('😡 引发民怨');

  return tags;
}

// ─── 成功率颜色 ────────────────────────────────────────────
function SuccessRateBadge({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100);
  const color =
    pct >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
    pct >= 60 ? 'text-amber-700 bg-amber-50 border-amber-200' :
    'text-red-600 bg-red-50 border-red-200';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-mono font-bold ${color}`}>
      {pct}%成功
    </span>
  );
}

// ─── 是否为当前危机推荐操控 ────────────────────────────────
function isRecommendedForMarket(actionId: string, market: MarketState): boolean {
  const currencyLow = market.exchange_rate < 0.8;
  const inflationHigh = market.inflation > 30;
  const creditLow = market.credit_rating < 50;
  const bondLow = market.bond_price < 0.6;
  const stockLow = market.stock_index < 1800;

  const currencyActions = ['media_panic', 'fake_crisis', 'offshore_capital', 'rumor_bank_run'];
  const inflationActions = ['media_panic', 'influencer_campaign', 'supply_chain_disruption'];
  const creditActions = ['credit_downgrade_leak', 'fake_crisis', 'fake_good_news'];
  const bondActions = ['bond_dump', 'credit_downgrade_leak', 'media_panic'];
  const stockActions = ['short_sell_bomb', 'fake_crisis', 'media_panic', 'influencer_campaign'];

  if (currencyLow && currencyActions.includes(actionId)) return true;
  if (inflationHigh && inflationActions.includes(actionId)) return true;
  if (creditLow && creditActions.includes(actionId)) return true;
  if (bondLow && bondActions.includes(actionId)) return true;
  if (stockLow && stockActions.includes(actionId)) return true;
  return false;
}

export function ManipulationPanel({ manipulations, cash, turn, market, onTrigger }: Props) {
  // 每回合随机生成4个操控行为
  const availableActions = useMemo(() => {
    const seed = turn * 1000 + Math.floor(turn / 3);
    const shuffled = [...MANIPULATION_POOL].sort((a, b) => {
      const aScore = (a.id.charCodeAt(0) + a.id.charCodeAt(2)) * (seed % 100);
      const bScore = (b.id.charCodeAt(0) + b.id.charCodeAt(2)) * (seed % 100);
      return aScore - bScore;
    });
    return shuffled.slice(0, 4);
  }, [turn]);

  // 推荐操控行为（当前危机最匹配的）
  const recommendedIds = useMemo(
    () => new Set(availableActions.filter(a => isRecommendedForMarket(a.id, market)).map(a => a.id)),
    [availableActions, market]
  );

  return (
    <div>
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 shrink-0">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
        <span className="font-bold text-sm text-gray-800 tracking-wide">放大危机</span>
        <span className="ml-auto text-[11px] text-red-400 italic">高风险 · 高收益窗口</span>
      </div>

      {/* 说明 */}
      <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed">
        💥 通过操控市场放大危机强度，你的做空仓位收益会成倍增加。但操作失败有副作用。
      </div>

      {/* 
        ── 卡片网格布局 ──
        PC: 2列 (auto-fit + minmax 防止压缩)
        H5: 1列
        每个卡片 min-width: 200px
      */}
      <div className="grid gap-3"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        }}
      >
        {availableActions.map((action) => {
          const canAfford = cash >= action.cost;
          const manipData = manipulations.find(m => m.id === action.id);
          const isCooling = manipData?.is_cooling ?? false;
          const cooldownLeft = manipData?.cooldown_left ?? 0;
          const disabled = !canAfford || isCooling;
          const isRecommended = recommendedIds.has(action.id);
          const amplifierTags = getCrisisAmplifierTags({ effects: action.effects });

          return (
            <button
              key={action.id}
              disabled={disabled}
              onClick={() => onTrigger(action.id)}
              className={`relative p-3 rounded-xl border text-left transition-all group ${
                disabled
                  ? 'border-gray-200 bg-gray-50 opacity-40 cursor-not-allowed'
                  : isRecommended
                    ? 'border-red-400 bg-red-50 cursor-pointer shadow-sm ring-1 ring-red-200'
                    : 'border-red-200 bg-white cursor-pointer'
              }`}
              style={{ minWidth: '200px', wordBreak: 'break-word' }}
            >
              {/* 推荐标签 */}
              {isRecommended && !disabled && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10 shadow-sm">
                  推荐
                </div>
              )}

              {/* 冷却遮罩 */}
              {isCooling && (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white/80 z-10">
                  <div className="text-red-500 font-mono text-lg font-bold">{cooldownLeft}</div>
                  <div className="text-xs text-gray-400">回合冷却</div>
                </div>
              )}

              {/* 行动名 */}
              <div className="font-semibold text-sm text-red-800 leading-tight mb-1.5" style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
                {action.name}
              </div>

              {/* 危机放大标签 */}
              {amplifierTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {amplifierTags.slice(0, 2).map((tag, i) => (
                    <span key={i} className="text-[10px] text-red-600 bg-red-50 border border-red-100 px-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 大白话解释（始终可见，不再隐藏） */}
              <div className="text-xs text-gray-500 leading-relaxed mb-1.5" style={{ wordBreak: 'break-word' }}>
                {(action as { explain?: string }).explain ?? action.description}
              </div>

              {/* 底部：成本 + 成功率 */}
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-mono text-red-600 font-bold shrink-0">
                  −${action.cost.toLocaleString()}
                </span>
                <SuccessRateBadge rate={action.success_rate} />
              </div>

              {/* 副作用（始终可见） */}
              <div className="text-[10px] text-orange-500 mt-1 leading-tight" style={{ wordBreak: 'break-word' }}>
                ⚠️ {action.side_effect}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
