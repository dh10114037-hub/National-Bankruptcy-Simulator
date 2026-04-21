/**
 * 双人对抗 - 游戏结束界面
 */

import type { VersusResult } from '../../types/versus';

interface Props {
  result:   VersusResult;
  onRestart: () => void;
}

function StatRow({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="text-gray-900 font-mono font-bold">{value.toFixed(0)}</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            pct > 60 ? 'bg-emerald-500' : pct > 30 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function VersusGameOver({ result, onRestart }: Props) {
  const specWon = result.winner === 'speculator';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="max-w-2xl w-full mx-4">
        {/* 标题区 */}
        <div className={`rounded-2xl border p-8 text-center mb-4 ${
          specWon
            ? 'border-amber-200 bg-amber-50'
            : 'border-emerald-200 bg-emerald-50'
        }`}>
          <div className="text-5xl mb-3">{specWon ? '🦅' : '🏛'}</div>
          <div className={`text-3xl font-black mb-2 ${specWon ? 'text-amber-700' : 'text-emerald-700'}`}>
            {specWon ? '投机者获胜' : '拯救者获胜'}
          </div>
          <div className="text-gray-700 text-base">{result.reason}</div>
          <div className="text-gray-400 text-sm mt-2">共 {result.turns} 回合</div>
        </div>

        {/* 双方战绩 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* 国家最终状态 */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-2">
              🏛 <span>国家最终状态</span>
            </div>
            <div className="space-y-2.5">
              <StatRow label="外汇储备" value={result.savior_final.foreign_reserves} />
              <StatRow label="民众支持" value={result.savior_final.public_support} />
              <StatRow label="国家信用" value={result.savior_final.credit_rating} />
              <StatRow label="通货膨胀" value={result.savior_final.inflation} max={100} />
            </div>
          </div>

          {/* 投机者最终资产 */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-sm font-bold text-amber-700 mb-3 flex items-center gap-2">
              💸 <span>投机者最终资产</span>
            </div>
            <div className="text-3xl font-black font-mono text-amber-600 mb-2">
              ${(result.spec_final / 10000).toFixed(0)}万
            </div>
            <div className="text-sm text-gray-500">
              初始：$100万
            </div>
            <div className={`text-lg font-bold mt-2 ${
              result.spec_final >= 1_000_000 ? 'text-amber-600' : 'text-red-500'
            }`}>
              {(result.spec_final / 1_000_000).toFixed(2)}x 倍率
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {result.spec_final >= 3_000_000
                ? '达成收割目标 🏆'
                : result.spec_final >= 1_000_000
                ? '盈利但未达目标'
                : '破产清算 💀'}
            </div>
          </div>
        </div>

        {/* 重来 */}
        <button
          onClick={onRestart}
          className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-base transition-all shadow-sm"
        >
          再战一局
        </button>
      </div>
    </div>
  );
}
