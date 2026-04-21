/**
 * 双人对抗 - 结算反馈面板（Phase 4+5）
 * 展示：新闻流 + 数值变化 + 投机者盈亏
 */

import type { VersusCountry } from '../../types/versus';

interface Props {
  news:          string[];
  countryDelta:  Partial<VersusCountry> | null;
  specPnl:       number;
  onNextTurn:    () => void;
  turn:          number;
  maxTurns:      number;
}

function DeltaTag({ label, value }: { label: string; value: number }) {
  const isPositive = value > 0;
  const isZero = value === 0;
  if (isZero) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-mono font-bold ${
      isPositive
        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
        : 'bg-red-100 text-red-600 border border-red-200'
    }`}>
      {label} {isPositive ? '+' : ''}{Math.round(value)}
    </span>
  );
}

export function VersusSettlementPanel({ news, countryDelta, specPnl, onNextTurn, turn, maxTurns }: Props) {
  const pnlPositive = specPnl >= 0;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
        📊 <span>回合结算</span>
        <span className="text-xs text-gray-400 font-normal">第 {turn} 月</span>
      </h3>

      {/* 新闻流 */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2 max-h-52 overflow-y-auto hide-scrollbar">
        {news.length === 0 ? (
          <div className="text-xs text-gray-400 italic text-center py-4">市场平静...</div>
        ) : (
          news.map((n, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="shrink-0 text-gray-400">{String(i + 1).padStart(2, '0')}.</span>
              <span className={`leading-snug ${
                n.includes('投机者') ? 'text-amber-700' :
                n.includes('政府') ? 'text-emerald-700' :
                n.includes('崩') || n.includes('暴') ? 'text-red-600' : 'text-gray-700'
              }`}>{n}</span>
            </div>
          ))
        )}
      </div>

      {/* 国家指标变化 */}
      {countryDelta && (
        <div>
          <div className="text-xs text-gray-500 mb-2">🏛 国家指标变化</div>
          <div className="flex flex-wrap gap-2">
            {countryDelta.foreign_reserves !== undefined && (
              <DeltaTag label="外储" value={countryDelta.foreign_reserves} />
            )}
            {countryDelta.public_support !== undefined && (
              <DeltaTag label="民心" value={countryDelta.public_support} />
            )}
            {countryDelta.credit_rating !== undefined && (
              <DeltaTag label="信用" value={countryDelta.credit_rating} />
            )}
            {countryDelta.inflation !== undefined && (
              <DeltaTag label="通胀" value={countryDelta.inflation} />
            )}
          </div>
        </div>
      )}

      {/* 投机者盈亏 */}
      <div className={`rounded-xl border p-3.5 ${
        pnlPositive ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'
      }`}>
        <div className="text-xs text-gray-500 mb-1">💸 投机者本回合盈亏</div>
        <div className={`text-2xl font-mono font-black ${pnlPositive ? 'text-amber-600' : 'text-red-600'}`}>
          {pnlPositive ? '+' : ''}${Math.abs(specPnl).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
        </div>
      </div>

      {/* 下一回合 */}
      <button
        onClick={onNextTurn}
        className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm transition-all shadow-sm"
      >
        {turn >= maxTurns ? '查看最终结算 →' : `进入第 ${turn + 1} 月 →`}
      </button>
    </div>
  );
}
