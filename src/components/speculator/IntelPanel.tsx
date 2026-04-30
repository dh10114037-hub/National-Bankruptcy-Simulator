import { useState, useMemo } from 'react';
import type { Intel } from '../../types/speculator';
import { INTEL_BUY_COST, INTEL_BRIBE_COST } from '../../engine/speculatorEngine';
import { INTEL_POOL } from '../../data/expandablePool';

interface Props {
  intels: Intel[];
  cash: number;
  turn: number;
  onBuy: (id: string) => void;
  onBribe: (id: string) => void;
}

const SOURCE_COLORS: Record<string, string> = {
  'government': 'text-amber-700 border-amber-200 bg-amber-50',
  'financial': 'text-blue-600 border-blue-200 bg-blue-50',
  'media': 'text-purple-600 border-purple-200 bg-purple-50',
  'international': 'text-purple-600 border-purple-200 bg-purple-50',
  'underground': 'text-orange-600 border-orange-200 bg-orange-50',
  'insider': 'text-emerald-600 border-emerald-200 bg-emerald-50',
};

const SOURCE_LABELS: Record<string, string> = {
  'government': '政府内部',
  'financial': '金融机构',
  'media': '媒体记者',
  'international': '国际渠道',
  'underground': '地下网络',
  'insider': '内线人士',
};

const IMPACT_LABEL: Record<string, { label: string; color: string }> = {
  high:     { label: '高影响',   color: 'text-red-600 bg-red-50' },
  medium:   { label: '中等',     color: 'text-amber-600 bg-amber-50' },
  low:      { label: '低影响',   color: 'text-gray-500 bg-gray-100' },
  critical: { label: '极端影响', color: 'text-red-700 bg-red-100 border border-red-300' },
};

function ConfidenceBar({ value }: { value: number }) {
  const pct = value * 100;
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-500 w-8">{pct.toFixed(0)}%</span>
    </div>
  );
}

export function IntelPanel({ intels, cash, turn, onBuy, onBribe }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  // 每回合随机生成4条情报
  const availableIntels = useMemo(() => {
    const seed = turn * 1000 + Math.floor(turn / 2);
    const shuffled = [...INTEL_POOL].sort((a, b) => {
      const aScore = (a.id.charCodeAt(0) + a.id.charCodeAt(1)) * (seed % 100);
      const bScore = (b.id.charCodeAt(0) + b.id.charCodeAt(1)) * (seed % 100);
      return aScore - bScore;
    });
    return shuffled.slice(0, 4);
  }, [turn]);

  return (
    <div className="flex flex-col h-full">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/>
          </svg>
          <span className="font-bold text-sm text-gray-800 tracking-wide">情报网络</span>
        </div>
        <span className="text-xs text-amber-600">每回合刷新</span>
      </div>

      {/* 情报列表 */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {availableIntels.map((intelPool) => {
          // 查找已购情报
          const intel = intels.find(i => i.id === intelPool.id);
          const isPurchased = !!intel;
          const sourceStyle = SOURCE_COLORS[intelPool.source_type] ?? 'text-gray-500 border-gray-200 bg-gray-50';
          const sourceLabel = SOURCE_LABELS[intelPool.source_type] ?? intelPool.source;
          const impactInfo = IMPACT_LABEL[intelPool.impact] ?? IMPACT_LABEL.medium;
          const isExpanded = expanded === intelPool.id;

          return (
            <div
              key={intelPool.id}
              className={`rounded-xl border transition-all duration-300 cursor-pointer ${
                isPurchased
                  ? 'border-gray-200 bg-white'
                  : 'border-gray-200 bg-gray-50 opacity-80 hover:opacity-100'
              } ${isExpanded ? 'ring-1 ring-amber-300' : ''}`}
              onClick={() => setExpanded(isExpanded ? null : intelPool.id)}
            >
              {/* 顶部：来源 + 影响力 */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${sourceStyle}`}>
                    🕵️ {sourceLabel}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${impactInfo.color}`}>
                    {impactInfo.label}
                  </span>
                </div>

                {/* 购买前：显示情报类型提示（不泄露内容） */}
                {!isPurchased && (
                  <div className="mt-2 mb-1">
                    <div className="text-sm text-gray-400 italic flex items-center gap-2">
                      <span>🔒</span>
                      <span>情报内容（购买后查看）</span>
                    </div>
                    {/* 👉 情报来源提示 */}
                    <div className="mt-2 px-2 py-1.5 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="text-xs text-amber-700 flex items-start gap-1.5">
                        <span className="shrink-0 mt-0.5">💡</span>
                        <span className="leading-relaxed">
                          {intelPool.source} | 影响力：{impactInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 购买后：显示完整内容和效果 */}
                {isPurchased && intel && (
                  <>
                    <ConfidenceBar value={intel.display_confidence} />
                    <div className="text-xs text-gray-400 mt-1">
                      可信度：{(intel.display_confidence * 100).toFixed(0)}%
                    </div>
                    <div className="mt-2 text-sm text-gray-800">
                      {intel.content}
                    </div>
                  </>
                )}
              </div>

              {/* 展开详情 */}
              {isExpanded && isPurchased && intel && (
                <div className="px-3 pb-3 space-y-2 border-t border-gray-100 pt-2">
                  <p className="text-xs text-gray-500 leading-relaxed">{intel.detail}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(intel.affects).map(([k, v]) => {
                      const isPositive = (v ?? 0) > 0;
                      return (
                        <span
                          key={k}
                          className={`text-xs px-2 py-0.5 rounded font-mono ${
                            isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {k} {isPositive ? '+' : ''}{v}
                        </span>
                      );
                    })}
                  </div>
                  {/* 贿赂按钮 */}
                  {!intel.bribed && (
                    <button
                      disabled={cash < INTEL_BRIBE_COST}
                      onClick={(e) => { e.stopPropagation(); onBribe(intel.id); }}
                      className="w-full mt-2 py-1.5 text-xs rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      高级贿赂 (¥{INTEL_BRIBE_COST.toLocaleString()})
                    </button>
                  )}
                  {intel.bribed && (
                    <div className="text-xs text-orange-600 mt-1">✓ 已贿赂，准确率已提升</div>
                  )}
                </div>
              )}

              {/* 购买按钮 */}
              {!isPurchased && (
                <div className="px-3 pb-3">
                  <button
                    disabled={cash < INTEL_BUY_COST}
                    onClick={(e) => { e.stopPropagation(); onBuy(intelPool.id); }}
                    className="w-full py-2 text-xs rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
                  >
                    购买情报 (¥{INTEL_BUY_COST.toLocaleString()})
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 底部：情报说明 */}
      <div className="mt-3 p-2 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-500 leading-relaxed">
        💡 每回合情报会刷新！购买前先看💡解释，了解这条情报值不值得买
      </div>
    </div>
  );
}
