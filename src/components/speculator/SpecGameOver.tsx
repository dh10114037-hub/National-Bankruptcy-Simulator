import type { SpeculatorGameState } from '../../types/speculator';
import { INITIAL_CASH, VICTORY_MULTIPLIER } from '../../engine/speculatorEngine';

interface Props {
  state: SpeculatorGameState;
  onRestart: () => void;
}

export function SpecGameOver({ state, onRestart }: Props) {
  const isVictory = state.phase === 'victory';
  const ratio     = state.assets.total_value / INITIAL_CASH;
  const finalPnl  = state.assets.total_value - INITIAL_CASH;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div
        className={`w-[500px] rounded-3xl border shadow-2xl overflow-hidden ${
          isVictory
            ? 'border-amber-200 bg-gradient-to-b from-amber-50 to-white'
            : 'border-red-200 bg-gradient-to-b from-red-50 to-white'
        }`}
      >
        {/* 头部 */}
        <div className={`px-8 py-6 text-center border-b ${isVictory ? 'border-amber-200' : 'border-red-200'}`}>
          <div className="text-5xl mb-3">{isVictory ? '🦅' : '💀'}</div>
          <h1 className={`text-3xl font-black ${isVictory ? 'text-amber-700' : 'text-red-600'}`}>
            {isVictory ? '收割成功' : '破产清算'}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {isVictory ? state.victoryReason : state.defeatReason}
          </p>
        </div>

        {/* 数据 */}
        <div className="px-8 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '初始资金', value: `$${INITIAL_CASH.toLocaleString()}`, color: 'text-gray-700' },
              { label: '最终资产', value: `$${state.assets.total_value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`, color: isVictory ? 'text-amber-700' : 'text-red-600' },
              { label: '总盈亏', value: `${finalPnl >= 0 ? '+' : ''}$${Math.abs(finalPnl).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`, color: finalPnl >= 0 ? 'text-emerald-600' : 'text-red-500' },
              { label: '资产倍数', value: `${ratio.toFixed(2)}x`, color: ratio >= VICTORY_MULTIPLIER ? 'text-amber-700' : 'text-gray-500' },
              { label: '总月数', value: `${state.turn} / ${state.maxTurns} 月`, color: 'text-gray-700' },
              { label: '剩余持仓', value: `${state.assets.positions.length} 笔`, color: 'text-gray-700' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div className="text-xs text-gray-400">{label}</div>
                <div className={`font-mono font-bold text-lg mt-0.5 ${color}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* 政府最后动向 */}
          {state.gov_log.length > 0 && (
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500">
              <div className="text-gray-400 mb-1">最后政府动向：</div>
              {state.gov_log[0]}
            </div>
          )}
        </div>

        {/* 按钮 */}
        <div className="px-8 pb-7 flex gap-3">
          <button
            onClick={onRestart}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
              isVictory
                ? 'bg-amber-500 hover:bg-amber-400 text-white'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            {isVictory ? '再度收割' : '重新开局'}
          </button>
        </div>
      </div>
    </div>
  );
}
