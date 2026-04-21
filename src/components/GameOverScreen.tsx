import { motion } from 'framer-motion';
import type { GameState, LogEntry } from '../types/game';

interface GameOverScreenProps {
  gameState: GameState;
  log: LogEntry[];
  onRestart: () => void;
}

function StatBlock({ label, val, delay = 0 }: { label: string; val: number; delay?: number }) {
  const isGood = val > 60;
  const color = isGood ? 'text-emerald-600' : val > 30 ? 'text-amber-600' : 'text-red-600';
  return (
    <motion.div
      className="rounded-lg bg-white/60 border border-white/80 p-3 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay + 0.1, type: 'spring', stiffness: 200 }}
    >
      <div className="text-[10px] text-gray-500 mb-1">{label}</div>
      <motion.div
        className={`text-2xl font-bold tabular-nums ${color}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.3, type: 'spring', stiffness: 300 }}
      >
        {Math.round(val)}
      </motion.div>
    </motion.div>
  );
}

function MarketBlock({ gameState, delay = 0 }: { gameState: GameState; delay?: number }) {
  const { market } = gameState;
  return (
    <motion.div
      className="rounded-lg bg-white/40 border border-white/60 p-2.5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: delay + 0.2 }}
    >
      <div className="text-[10px] text-gray-500 mb-2 text-center">最终市场状态</div>
      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
        <div>
          <div className="text-gray-500">汇率</div>
          <div className={market.exchange_rate < 0.7 ? 'text-red-600' : 'text-gray-600'}>{market.exchange_rate.toFixed(3)}</div>
        </div>
        <div>
          <div className="text-gray-500">通胀</div>
          <div className={market.inflation > 60 ? 'text-red-600' : 'text-gray-600'}>{market.inflation.toFixed(0)}%</div>
        </div>
        <div>
          <div className="text-gray-500">波动</div>
          <div className={market.volatility > 0.6 ? 'text-red-600' : 'text-gray-600'}>{(market.volatility * 100).toFixed(0)}%</div>
        </div>
      </div>
    </motion.div>
  );
}

function GameSummary({ log, isVictory, turn, maxTurns }: { log: LogEntry[]; isVictory: boolean; turn: number; maxTurns: number }) {
  // Count policy usage
  const policyCounts: Record<string, number> = {};
  log.forEach((e) => {
    policyCounts[e.policy] = (policyCounts[e.policy] ?? 0) + 1;
  });
  const mostUsed = Object.entries(policyCounts).sort((a, b) => b[1] - a[1])[0];

  // Count speculator hits
  const specHits = log.filter((e) => e.speculatorAction).length;

  // Calculate total damage taken
  const totalDamage = log.reduce((sum, e) => {
    const d = e.netChange;
    return sum + Math.abs((d.foreign_reserves ?? 0)) + Math.abs((d.public_support ?? 0)) + Math.abs((d.credit_rating ?? 0));
  }, 0);

  return (
    <div className="text-xs text-gray-600 space-y-3 text-left">
      <motion.div
        className="text-gray-500 font-semibold text-center mb-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        ——— 执政总结 ———
      </motion.div>

      {isVictory ? (
        <motion.div
          className="space-y-1.5 text-center text-gray-700 text-sm leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p>🏆 你在乱局中稳住了方向。</p>
          <p>财政与民心兼顾，信用未曾崩塌。</p>
          <p className="text-emerald-600">这次，国家撑下来了。</p>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-1.5 text-center text-gray-500 text-sm leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p>每一个决定都有代价，</p>
          <p>但代价最终积累成了崩溃。</p>
          <p className="text-red-500">下次，也许权衡会不同。</p>
        </motion.div>
      )}

      <motion.div
        className="border-t border-gray-200 pt-3 mt-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="text-center">
            <div className="text-gray-500 mb-1">坚持月份</div>
            <div className="text-gray-900 font-bold text-lg">
              {turn - 1}
              <span className="text-gray-400 text-xs">/{maxTurns}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 mb-1">投机者干预</div>
            <div className="text-red-500 font-bold text-lg">{specHits} 次</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 mb-1">累计波动</div>
            <div className="text-amber-600 font-bold text-lg">{totalDamage}</div>
          </div>
        </div>

        {mostUsed && (
          <div className="mt-3 text-center">
            <div className="text-gray-500 mb-1">最常用政策</div>
            <div className="text-blue-600 font-medium">{mostUsed[0]} ×{mostUsed[1]}</div>
          </div>
        )}
      </motion.div>

      {/* Failed decisions */}
      {log.length > 0 && (
        <motion.div
          className="border-t border-gray-200 pt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="text-gray-500 mb-2 text-center text-[10px]">失败回合分析</div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {log.slice(0, 5).map((e, i) => {
              const damage = Math.abs((e.netChange.foreign_reserves ?? 0)) +
                             Math.abs((e.netChange.public_support ?? 0)) +
                             Math.abs((e.netChange.credit_rating ?? 0));
              if (damage < 10) return null;
              return (
                <div key={i} className="text-[10px] text-gray-500 flex justify-between">
                  <span>第{e.turn}月: {e.policy}</span>
                  <span className="text-red-500">-{damage}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export function GameOverScreen({ gameState, log, onRestart }: GameOverScreenProps) {
  const isVictory = gameState.phase === 'victory';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={`
          w-full max-w-md rounded-2xl border p-7
          ${isVictory
            ? 'border-emerald-200 bg-gradient-to-b from-emerald-50 to-white'
            : 'border-red-200 bg-gradient-to-b from-red-50 to-white'
          }
          shadow-2xl
        `}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Icon */}
        <motion.div
          className="text-center mb-5"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
        >
          <span className="text-6xl block mb-2">{isVictory ? '🏆' : '💀'}</span>
          <motion.h2
            className={`text-2xl font-bold ${isVictory ? 'text-emerald-700' : 'text-red-700'}`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {isVictory ? '经济复苏成功' : '国家破产'}
          </motion.h2>
          <motion.p
            className="text-gray-500 text-sm mt-1.5 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {gameState.defeatReason}
          </motion.p>
        </motion.div>

        {/* Final stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatBlock label="外汇储备" val={gameState.foreign_reserves} delay={0.1} />
          <StatBlock label="民众支持" val={gameState.public_support} delay={0.2} />
          <StatBlock label="国家信用" val={gameState.credit_rating} delay={0.3} />
        </div>

        {/* Market status */}
        <MarketBlock gameState={gameState} delay={0.3} />

        {/* Summary */}
        <motion.div
          className="mt-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GameSummary log={log} isVictory={isVictory} turn={gameState.turn} maxTurns={gameState.maxTurns} />
        </motion.div>

        {/* Button */}
        <motion.button
          onClick={onRestart}
          className={`
            w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 mt-6
            ${isVictory
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-[0_0_24px_rgba(52,211,153,0.4)]'
              : 'bg-red-600 hover:bg-red-500 text-white hover:shadow-[0_0_24px_rgba(239,68,68,0.4)]'
            }
          `}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isVictory ? '🎖 再来一局' : '💪 重新执政'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
