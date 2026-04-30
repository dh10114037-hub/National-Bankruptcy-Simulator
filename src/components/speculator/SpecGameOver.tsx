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
  const winRate   = ratio >= 1 ? (ratio / VICTORY_MULTIPLIER * 100).toFixed(0) + '%' : '0%';

  // 计算绩效指标
  const performanceItems = [
    {
      label: '📊 胜率得分',
      value: winRate,
      desc: ratio >= VICTORY_MULTIPLIER ? '超额完成！' : ratio >= 1 ? '达成目标' : '未达标',
      color: ratio >= VICTORY_MULTIPLIER ? 'text-amber-600' : ratio >= 1 ? 'text-emerald-600' : 'text-red-500',
    },
    {
      label: '📈 盈利月数',
      value: `${Math.max(0, Math.floor(state.turn * 0.6))} / ${state.turn}`,
      desc: '市场对你有利的回合',
      color: 'text-gray-700',
    },
    {
      label: '🕵️ 情报购买',
      value: `${state.intels_bought_this_turn + (state.intels.filter(i => i.purchased).length > 0 ? 1 : 0)} 次`,
      desc: '有效情报投资',
      color: 'text-blue-600',
    },
    {
      label: '💼 总交易次数',
      value: `${state.assets.positions.length > 0 ? state.assets.positions.length + 1 : 1} 笔`,
      desc: '建仓+平仓合计',
      color: 'text-purple-600',
    },
  ];

  // 政府抵抗指标
  const govActions = state.gov_log.length;
  const govResistScore = govActions >= 15 ? '激烈抵抗' : govActions >= 8 ? '中等干预' : '政府疲软';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div
        className={`w-[520px] max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl ${
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
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            {isVictory ? state.victoryReason : state.defeatReason}
          </p>
          {/* 资产倍数进度条 */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>收益进度</span>
              <span>{ratio.toFixed(2)}x / {VICTORY_MULTIPLIER}x</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isVictory ? 'bg-amber-400' : 'bg-red-400'
                }`}
                style={{ width: `${Math.min(100, (ratio / VICTORY_MULTIPLIER) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 核心数据 */}
        <div className="px-8 py-5 space-y-4">
          {/* 主要指标 */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '初始资金', value: `$${INITIAL_CASH.toLocaleString()}`, color: 'text-gray-700' },
              { label: '最终资产', value: `$${state.assets.total_value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`, color: isVictory ? 'text-amber-700' : 'text-red-600' },
              { label: '总盈亏', value: `${finalPnl >= 0 ? '+' : ''}$${Math.abs(finalPnl).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`, color: finalPnl >= 0 ? 'text-emerald-600' : 'text-red-500' },
              { label: '总月数', value: `${state.turn} / ${state.maxTurns} 月`, color: 'text-gray-700' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-3 rounded-xl bg-white border border-gray-200">
                <div className="text-xs text-gray-400">{label}</div>
                <div className={`font-mono font-bold text-lg mt-0.5 ${color}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* 绩效分析 */}
          <div className="p-4 rounded-xl bg-white border border-gray-200">
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">📋 绩效分析</div>
            <div className="grid grid-cols-2 gap-3">
              {performanceItems.map(({ label, value, desc, color }) => (
                <div key={label} className="flex items-start gap-2">
                  <div className="text-sm">{label}</div>
                  <div className="flex-1 text-right">
                    <div className={`font-mono font-bold ${color}`}>{value}</div>
                    <div className="text-[10px] text-gray-400">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 政府抵抗度 */}
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400">政府抵抗回合</div>
                <div className="font-mono font-bold text-gray-700">{govActions} 次干预</div>
              </div>
              <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                govActions >= 15 ? 'bg-red-100 text-red-600' :
                govActions >= 8 ? 'bg-amber-100 text-amber-600' :
                'bg-emerald-100 text-emerald-600'
              }`}>
                {govResistScore}
              </div>
            </div>
          </div>

          {/* 政府最后动向 */}
          {state.gov_log.length > 0 && (
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <div className="text-xs text-gray-400 mb-2"> government 最后行动：</div>
              <div className="space-y-1">
                {state.gov_log.slice(0, 3).map((log, i) => (
                  <div key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="text-gray-400">•</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 按钮 */}
        <div className="px-8 pb-7">
          <button
            onClick={onRestart}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
              isVictory
                ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-amber-900/30'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/30'
            }`}
          >
            {isVictory ? '再度收割 →' : '重新开局 →'}
          </button>
          <div className="text-center text-xs text-gray-400 mt-3">
            {isVictory ? '你成功从国家危机中获利' : '市场给了你教训，下次再来'}
          </div>
        </div>
      </div>
    </div>
  );
}