/**
 * TurnSummaryCard - 回合结算总结卡片
 * 每次点击"结束本月"后显示，清晰告知玩家这个月发生了什么
 */
import { motion } from 'framer-motion';
import { useSpeculatorStore } from '../../store/speculatorStore';
import type { TurnSummary } from '../../types/speculator';

interface Props {
  summary: TurnSummary;
  onDismiss: () => void;
}

function DeltaChip({ value, suffix = '', colorize = true }: { value: number; suffix?: string; colorize?: boolean }) {
  if (value === 0) {
    return <span className="text-gray-400 font-mono text-sm">0{suffix}</span>;
  }
  const isPos = value > 0;
  const cls = colorize ? (isPos ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50') : '';
  const sign = isPos ? '+' : '';
  return (
    <span className={`font-mono text-sm px-1.5 py-0.5 rounded ${cls}`}>
      {sign}{typeof value === 'number' && Math.abs(value) < 1 ? value.toFixed(4) : value}{suffix}
    </span>
  );
}

function MarketRow({ label, delta, format }: { label: string; delta: number; format: (v: number) => string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <DeltaChip value={delta} colorize={true} />
      </div>
    </div>
  );
}

export function TurnSummaryCard({ summary, onDismiss }: Props) {
  const profitColor = summary.total_value_delta >= 0 ? 'text-red-600' : 'text-green-600';
  const profitSign = summary.total_value_delta >= 0 ? '+' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-x-0 top-16 z-50 px-4 py-0 pointer-events-none"
    >
      <div className="max-w-lg mx-auto pointer-events-auto">
        <div className="bg-white border-2 border-yellow-400 rounded-2xl shadow-2xl shadow-yellow-900/20 overflow-hidden">
          {/* 标题栏 */}
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <span className="font-bold text-sm text-gray-800">第 {summary.turn} 月结算</span>
            </div>
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* 本月盈亏（最突出） */}
          <div className={`px-4 py-3 text-center border-b-2 border-gray-100 ${profitColor}`}>
            <div className="text-xs text-gray-400 mb-0.5">资产变动</div>
            <div className="text-2xl font-bold font-mono">
              {profitSign}¥{Math.abs(summary.total_value_delta).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              资金 {profitSign}¥{Math.abs(summary.cash_delta).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* 市场指标变化 */}
          <div className="px-4 py-2">
            <div className="text-xs text-gray-400 mb-1 font-semibold tracking-wider">市场月变化</div>
            <MarketRow label="汇率" delta={summary.exchange_rate_delta} format={(v) => v.toFixed(4)} />
            <MarketRow label="通胀" delta={summary.inflation_delta} format={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`} />
            <MarketRow label="信用评级" delta={summary.credit_rating_delta} format={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`} />
            <MarketRow label="股指" delta={summary.stock_index_delta} format={(v) => `${v > 0 ? '+' : ''}${v}`} />
            <MarketRow label="国债价格" delta={summary.bond_price_delta} format={(v) => v.toFixed(4)} />
          </div>

          {/* 关闭按钮 */}
          <div className="px-4 pb-3 pt-1">
            <button
              onClick={onDismiss}
              className="w-full py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm transition-colors"
            >
              继续 →
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
