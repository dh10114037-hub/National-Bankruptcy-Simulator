/**
 * RoundSummaryPanel - 每回合结算后的总结卡片
 * 展示：本回合选择 + 各指标影响 + 连锁效应
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { RoundSummary } from '../types/game';

interface Props {
  summary: RoundSummary | null;
  onDismiss: () => void;
}

function DeltaBadge({ value, label }: { value: number; label: string }) {
  if (value === 0) return null;
  const isPos = value > 0;
  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-mono font-bold ${
        isPos
          ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
          : 'bg-red-50 border border-red-200 text-red-600'
      }`}
    >
      <span className="text-base">{isPos ? '▲' : '▼'}</span>
      <span>{label}</span>
      <span>{isPos ? '+' : ''}{value.toFixed(0)}</span>
    </div>
  );
}

export function RoundSummaryPanel({ summary, onDismiss }: Props) {
  if (!summary) return null;

  const { policyName, policyIcon, eventName, delta, chainEffects, speculatorNote } = summary;
  const hasDelta = delta.foreign_reserves !== 0 || delta.public_support !== 0 || delta.credit_rating !== 0;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onDismiss}
      >
        <motion.div
          className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
          initial={{ y: 60, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 顶部标题 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <div>
                  <div className="text-sm font-bold text-gray-900">第 {summary.turn} 月 · 回合总结</div>
                  <div className="text-xs text-gray-400 mt-0.5">了解你的决策带来了什么</div>
                </div>
              </div>
              <button
                onClick={onDismiss}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* 本回合选择 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
              <div className="shrink-0">
                <div className="text-xs text-gray-400 mb-1">📌 触发事件</div>
                <div className="text-sm font-medium text-gray-700">{eventName}</div>
              </div>
              <div className="w-px h-full bg-gray-200 self-stretch" />
              <div className="shrink-0">
                <div className="text-xs text-gray-400 mb-1">✅ 你的选择</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">{policyIcon}</span>
                  <span className="text-sm font-bold text-gray-800">{policyName}</span>
                </div>
              </div>
            </div>

            {/* 指标变化 */}
            {hasDelta && (
              <div>
                <div className="text-xs font-semibold text-gray-400 mb-2">📈 指标变动</div>
                <div className="flex flex-wrap gap-2">
                  <DeltaBadge value={delta.foreign_reserves} label="外储" />
                  <DeltaBadge value={delta.public_support}   label="民心" />
                  <DeltaBadge value={delta.credit_rating}    label="信用" />
                </div>
              </div>
            )}

            {/* 连锁影响 */}
            <div>
              <div className="text-xs font-semibold text-gray-400 mb-2">🔗 连锁影响</div>
              <div className="space-y-1.5">
                {chainEffects.map((effect, i) => (
                  <div
                    key={i}
                    className={`text-xs leading-relaxed flex items-start gap-2 px-3 py-2 rounded-lg ${
                      effect.includes('投机者')
                        ? 'bg-red-50 border border-red-200 text-red-700'
                        : effect.includes('安全') || effect.includes('缓解') || effect.includes('充足') || effect.includes('平稳')
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-amber-50 border border-amber-200 text-amber-700'
                    }`}
                  >
                    <span className="shrink-0 mt-0.5">→</span>
                    <span>{effect}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 投机者警告 */}
            {speculatorNote && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-3">
                <span className="text-xl">📉</span>
                <div>
                  <div className="text-xs font-bold text-red-600 mb-0.5">投机者趁机出手</div>
                  <div className="text-xs text-red-600">{speculatorNote}</div>
                </div>
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div className="px-5 pb-5">
            <button
              onClick={onDismiss}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all active:scale-95"
            >
              明白了，进入下一月 →
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
