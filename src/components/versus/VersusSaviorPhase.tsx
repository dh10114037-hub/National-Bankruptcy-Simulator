/**
 * 双人对抗 - 拯救者决策面板（Phase 3）
 */

import { useState } from 'react';
import type { Policy } from '../../types/game';

interface Props {
  policies:  Policy[];
  onChoose:  (policyId: string) => void;
  crisisLevel: number;
}

export function VersusSaviorPhase({ policies, onChoose, crisisLevel }: Props) {
  const [hovered,  setHovered]  = useState<string | null>(null);
  const [confirming, setConfirming] = useState<Policy | null>(null);

  const dangerZone = crisisLevel >= 70;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-sm font-bold flex items-center gap-2 ${dangerZone ? 'text-red-600' : 'text-emerald-700'}`}>
          🏛 <span>拯救者决策</span>
          <span className="text-xs text-gray-400 font-normal">选择一项政策</span>
        </h3>
        {dangerZone && (
          <span className="text-xs text-red-500 animate-pulse">⚠ 危机临界</span>
        )}
      </div>

      <div className="space-y-3">
        {policies.map((policy) => {
          const effects = policy.effects;
          const isHovered = hovered === policy.id;

          return (
            <div
              key={policy.id}
              className={`rounded-xl border p-4 cursor-pointer transition-all relative overflow-hidden ${
                dangerZone
                  ? 'border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300'
                  : 'border-gray-200 bg-white hover:bg-blue-50/50 hover:border-blue-200'
              }`}
              onMouseEnter={() => setHovered(policy.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setConfirming(policy)}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl shrink-0">{policy.icon}</div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900 mb-1">{policy.name}</div>
                  <div className="text-xs text-gray-500 leading-snug mb-2">{policy.description}</div>

                  {/* 效果标签 */}
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(effects).map(([key, val]) => {
                      if (!val) return null;
                      const isPositive = val > 0;
                      const label = key === 'foreign_reserves' ? '外储' : key === 'public_support' ? '民心' : '信用';
                      return (
                        <span
                          key={key}
                          className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                            isPositive
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-red-100 text-red-600 border border-red-200'
                          }`}
                        >
                          {label} {isPositive ? '+' : ''}{val}
                        </span>
                      );
                    })}
                  </div>

                  {/* 代价 - 固定显示在底部，不被遮挡 */}
                  {policy.tradeoff && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="text-xs text-amber-600 flex items-start gap-1.5">
                        <span className="shrink-0 mt-0.5">⚠</span>
                        <span>{policy.tradeoff}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Hover 潜在后果 - 只在没有 tradeoff 时显示 */}
              {!policy.tradeoff && isHovered && policy.sideEffects && policy.sideEffects.length > 0 && (
                <div className="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-2 flex flex-wrap gap-1.5">
                  {policy.sideEffects.map((se, i) => (
                    <span key={i} className="text-xs text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
                      {se}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 确认弹窗 - 提高层级避免被遮挡 */}
      {confirming && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 max-w-sm w-full shadow-2xl">
            <div className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              {confirming.icon} {confirming.name}
            </div>
            <div className="text-sm text-gray-500 mb-4">{confirming.description}</div>

            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(confirming.effects).map(([key, val]) => {
                if (!val) return null;
                const isPositive = val > 0;
                const label = key === 'foreign_reserves' ? '外储' : key === 'public_support' ? '民心' : '信用';
                return (
                  <span
                    key={key}
                    className={`text-sm px-3 py-1 rounded-xl font-mono font-bold ${
                      isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {label} {isPositive ? '+' : ''}{val}
                  </span>
                );
              })}
            </div>

            {confirming.tradeoff && (
              <div className="text-sm text-amber-700 mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
                ⚠ {confirming.tradeoff}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setConfirming(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:text-gray-800 transition-all"
              >
                取消
              </button>
              <button
                onClick={() => { onChoose(confirming.id); setConfirming(null); }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all"
              >
                确认执行
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
