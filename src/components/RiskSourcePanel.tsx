/**
 * RiskSourcePanel - 风险来源分析模块
 * 显示当前最危险的指标及说明
 */

import type { GameState } from '../types/game';
import { analyzeRiskSources } from '../engine/advisorSavior';

interface Props {
  gameState: GameState;
}

const LEVEL_STYLES = {
  critical: {
    bar:    'bg-red-500',
    badge:  'bg-red-100 text-red-700 border-red-300',
    label:  '危急',
    row:    'border-red-200 bg-red-50/50',
    text:   'text-red-700',
    num:    'text-red-600',
  },
  warning: {
    bar:    'bg-amber-400',
    badge:  'bg-amber-50 text-amber-700 border-amber-300',
    label:  '警告',
    row:    'border-amber-200 bg-amber-50/40',
    text:   'text-amber-700',
    num:    'text-amber-600',
  },
  ok: {
    bar:    'bg-emerald-400',
    badge:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    label:  '正常',
    row:    'border-gray-200 bg-gray-50/60',
    text:   'text-gray-600',
    num:    'text-gray-500',
  },
};

export function RiskSourcePanel({ gameState }: Props) {
  const risks = analyzeRiskSources(gameState);
  const criticalCount  = risks.filter((r) => r.level === 'critical').length;
  const warningCount   = risks.filter((r) => r.level === 'warning').length;

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/40 overflow-hidden">
      {/* 顶部 */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-orange-200/60">
        <div className="flex items-center gap-2">
          <span className="text-base">🎯</span>
          <div>
            <div className="text-xs font-bold text-orange-700">风险来源分析</div>
            <div className="text-[10px] text-gray-400">当前最危险的因素</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {criticalCount > 0 && (
            <span className="text-[10px] font-bold text-red-600 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded-full">
              危急 ×{criticalCount}
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
              警告 ×{warningCount}
            </span>
          )}
          {criticalCount === 0 && warningCount === 0 && (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
              ✓ 稳定
            </span>
          )}
        </div>
      </div>

      {/* 风险列表 */}
      <div className="p-3 space-y-2">
        {risks.map((r) => {
          const s = LEVEL_STYLES[r.level];
          // 对于汇率，value 是 exchange_rate*100，进度条直接用
          // 对于通胀，数字越高越危险，进度条反向
          const isInflation = r.label === '通货膨胀';
          const barWidth = isInflation
            ? Math.min(100, r.value)
            : r.label === '汇率稳定'
            ? Math.min(100, r.value)
            : Math.min(100, r.value);

          return (
            <div
              key={r.label}
              className={`rounded-lg border px-3 py-2 ${s.row}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{r.icon}</span>
                  <span className="text-xs font-semibold text-gray-700">{r.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-mono font-bold ${s.num}`}>
                    {r.label === '汇率稳定' ? (r.value / 100).toFixed(2) : r.value.toFixed(0)}
                  </span>
                  <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded-full ${s.badge}`}>
                    {s.label}
                  </span>
                </div>
              </div>
              {/* 进度条 */}
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden mb-1.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${s.bar}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              {/* 说明 */}
              <div className={`text-[10px] leading-relaxed ${s.text}`}>
                {r.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
