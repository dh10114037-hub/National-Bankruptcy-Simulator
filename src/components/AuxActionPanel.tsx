/**
 * AuxActionPanel - 辅助操作面板
 * 每回合在选完核心政策后显示，玩家可选0-1个辅助操作
 */

import { motion } from 'framer-motion';
import type { AuxAction, GameState } from '../types/game';

interface AuxActionPanelProps {
  auxActions: AuxAction[];
  selected: AuxAction[];
  gameState: GameState;
  onToggle: (action: AuxAction) => void;
  onConfirm: () => void;
  onSkip: () => void;
  /** 延迟效果队列（展示即将触发的效果） */
  pendingDelays: { description: string; triggerTurn: number }[];
  currentTurn: number;
}

function canAfford(action: AuxAction, gameState: GameState): boolean {
  const cost = action.cost;
  if (cost.foreign_reserves && gameState.foreign_reserves < cost.foreign_reserves + 5) return false;
  if (cost.public_support && gameState.public_support < cost.public_support + 5) return false;
  if (cost.credit_rating && gameState.credit_rating < cost.credit_rating + 5) return false;
  return true;
}

function EffectTag({ label, positive }: { label: string; positive: boolean }) {
  return (
    <span
      className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
        positive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
      }`}
    >
      {label}
    </span>
  );
}

function AuxCard({
  action,
  isSelected,
  affordable,
  onToggle,
}: {
  action: AuxAction;
  isSelected: boolean;
  affordable: boolean;
  onToggle: () => void;
}) {
  const hasDelay = !!action.delayedEffect;

  return (
    <motion.div
      onClick={affordable ? onToggle : undefined}
      className={`
        rounded-xl border p-3 transition-all cursor-pointer select-none
        ${!affordable ? 'opacity-40 cursor-not-allowed' : ''}
        ${isSelected
          ? 'border-purple-400 bg-purple-50 shadow-[0_0_12px_rgba(147,51,234,0.2)]'
          : affordable
          ? 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50'
          : 'border-gray-100 bg-gray-50'
        }
      `}
      whileHover={affordable ? { scale: 1.01 } : {}}
      whileTap={affordable ? { scale: 0.98 } : {}}
      layout
    >
      <div className="flex items-start gap-2.5">
        {/* 图标 + 选中圆 */}
        <div className="relative flex-shrink-0">
          <span className="text-xl">{action.icon}</span>
          {isSelected && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </span>
          )}
        </div>
        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-gray-800 font-semibold text-xs">{action.name}</span>
            {hasDelay && (
              <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">
                ⏰ 延迟效果
              </span>
            )}
          </div>
          <p className="text-gray-400 text-[11px] mt-0.5 leading-relaxed">{action.description}</p>

          {/* 效果标签 */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            <span className="text-[10px] text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full font-medium">
              {action.costLabel}
            </span>
            {action.immediateEffect && Object.entries(action.immediateEffect).map(([k, v]) => {
              if (!v || k === 'exchange_rate' || k === 'volatility' || k === 'inflation') return null;
              const label = k === 'foreign_reserves' ? '外储' : k === 'public_support' ? '民心' : '信用';
              return (
                <EffectTag key={k} label={`${label} ${v > 0 ? '+' : ''}${v}`} positive={v > 0} />
              );
            })}
            {action.immediateEffect?.exchange_rate !== undefined && (
              <EffectTag
                label={`汇率 ${action.immediateEffect.exchange_rate > 0 ? '+' : ''}${(action.immediateEffect.exchange_rate * 100).toFixed(0)}%`}
                positive={action.immediateEffect.exchange_rate > 0}
              />
            )}
            {action.immediateEffect?.inflation !== undefined && (
              <EffectTag
                label={`通胀 ${action.immediateEffect.inflation > 0 ? '+' : ''}${action.immediateEffect.inflation}%`}
                positive={action.immediateEffect.inflation < 0}
              />
            )}
          </div>

          {/* 延迟效果说明 */}
          {action.delayedEffect && (
            <p className="text-amber-600 text-[10px] mt-1 leading-relaxed border-t border-amber-100 pt-1">
              {action.delayedEffect.description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function AuxActionPanel({
  auxActions,
  selected,
  gameState,
  onToggle,
  onConfirm,
  onSkip,
  pendingDelays,
  currentTurn,
}: AuxActionPanelProps) {
  const hasSelected = selected.length > 0;

  return (
    <motion.div
      className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      >
        {/* 头部 */}
        <div className="bg-gradient-to-r from-purple-900 to-purple-700 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-sm">辅助操作 · 第 {currentTurn} 月</h3>
              <p className="text-purple-200 text-xs mt-0.5">政策已定，可选1项辅助行动强化效果（可跳过）</p>
            </div>
            <div className="text-2xl">🎯</div>
          </div>
        </div>

        {/* 即将触发的延迟效果提醒 */}
        {pendingDelays.length > 0 && (
          <div className="px-4 pt-3 space-y-1.5">
            {pendingDelays
              .filter((d) => d.triggerTurn <= currentTurn + 2)
              .map((d, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                  <span className="text-amber-500 text-sm flex-shrink-0">⏰</span>
                  <p className="text-amber-700 text-[11px] leading-relaxed">
                    <span className="font-semibold">第{d.triggerTurn}月到期：</span>
                    {d.description}
                  </p>
                </div>
              ))}
          </div>
        )}

        {/* 辅助操作列表 */}
        <div className="px-4 py-3 space-y-2.5 max-h-[55vh] overflow-y-auto">
          {auxActions.map((action) => {
            const affordable = canAfford(action, gameState);
            const isSelected = selected.some((s) => s.id === action.id);
            return (
              <AuxCard
                key={action.id}
                action={action}
                isSelected={isSelected}
                affordable={affordable}
                onToggle={() => onToggle(action)}
              />
            );
          })}
        </div>

        {/* 底部按钮 */}
        <div className="px-4 pb-4 pt-2 flex gap-2.5">
          <button
            onClick={onSkip}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-all active:scale-95"
          >
            跳过
          </button>
          <motion.button
            onClick={hasSelected ? onConfirm : onSkip}
            className={`
              flex-[2] py-3 rounded-xl text-white text-sm font-bold transition-all active:scale-95
              ${hasSelected
                ? 'bg-purple-600 hover:bg-purple-500 shadow-[0_0_16px_rgba(147,51,234,0.3)]'
                : 'bg-gray-400'
              }
            `}
            whileHover={hasSelected ? { scale: 1.02 } : {}}
          >
            {hasSelected ? `✅ 执行「${selected[0].name}」` : '直接进入下月'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
