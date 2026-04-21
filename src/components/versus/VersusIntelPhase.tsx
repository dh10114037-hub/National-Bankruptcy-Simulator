/**
 * 双人对抗 - 情报阶段面板（Phase 1）
 * 投机者查看 / 购买 / 贿赂情报，拯救者只能等待
 */

import { useState } from 'react';
import type { VersusIntel } from '../../types/versus';

interface Props {
  intels:    VersusIntel[];
  cash:      number;
  onBuy:     (id: string) => void;
  onBribe:   (id: string) => void;
  onConfirm: () => void;
}

export function VersusIntelPhase({ intels, cash, onBuy, onBribe, onConfirm }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-blue-600 flex items-center gap-2">
          🔍 <span>情报阶段</span>
          <span className="text-xs text-gray-400 font-normal">（投机者优先）</span>
        </h3>
        <div className="text-xs text-gray-500">
          可用资金：<span className="text-amber-600 font-mono">${(cash / 10000).toFixed(0)}万</span>
        </div>
      </div>

      {/* 情报卡列表 */}
      <div className="space-y-3">
        {intels.map((intel) => (
          <div
            key={intel.id}
            className={`rounded-xl border p-3.5 cursor-pointer transition-all ${
              expanded === intel.id
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/50'
            }`}
            onClick={() => setExpanded(expanded === intel.id ? null : intel.id)}
          >
            <div className="flex items-start gap-3">
              {/* 图标 */}
              <div className="text-xl shrink-0">📋</div>

              <div className="flex-1 min-w-0">
                {/* 内容（未购买时模糊） */}
                <div className={`text-sm font-medium mb-2 leading-snug ${
                  !intel.purchased ? 'blur-sm text-gray-400 select-none' : 'text-gray-900'
                }`}>
                  {intel.purchased ? intel.content : '██████ ███ ██████ ██████'}
                </div>

                {/* 可信度条 */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-500 shrink-0">可信度</span>
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        intel.purchased
                          ? intel.confidence > 0.7 ? 'bg-emerald-500' : intel.confidence > 0.5 ? 'bg-amber-500' : 'bg-red-500'
                          : 'bg-gray-300'
                      }`}
                      style={{ width: intel.purchased ? `${intel.confidence * 100}%` : '0%' }}
                    />
                  </div>
                  <span className={`text-xs font-mono ${intel.purchased ? 'text-gray-600' : 'text-gray-400'}`}>
                    {intel.purchased ? `${(intel.confidence * 100).toFixed(0)}%` : '?'}
                  </span>
                  {intel.bribed && (
                    <span className="text-xs text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full border border-emerald-200">贿赂+</span>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  {!intel.purchased && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onBuy(intel.id); }}
                      disabled={cash < 50000}
                      className="flex-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all"
                    >
                      购买情报 $5万
                    </button>
                  )}
                  {intel.purchased && !intel.bribed && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onBribe(intel.id); }}
                      disabled={cash < 80000}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 hover:bg-amber-200 disabled:opacity-40 disabled:cursor-not-allowed text-amber-700 border border-amber-200 transition-all"
                    >
                      贿赂官员 $8万 ↑准确率
                    </button>
                  )}
                  {intel.purchased && (
                    <div className="flex-1 text-right text-xs text-emerald-600 py-1.5">
                      ✓ 已解锁
                    </div>
                  )}
                </div>

                {/* 展开详情 */}
                {expanded === intel.id && intel.purchased && (
                  <div className="mt-2.5 pt-2.5 border-t border-gray-200 text-xs text-gray-500 space-y-1">
                    <div>📌 来源：{['财政部内鬼', '媒体线人', '国际机构', '银行顾问'][Math.floor(Math.random() * 4)]}</div>
                    <div>⚠ 注意：情报可能有偏差，请结合当前局势判断</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 确认按钮 */}
      <button
        onClick={onConfirm}
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-sm mt-4"
      >
        情报阶段完成 → 进入行动
      </button>

      <p className="text-center text-xs text-gray-400 italic">
        情报有真有假 · 可信度有偏差 · 谨慎决策
      </p>
    </div>
  );
}
