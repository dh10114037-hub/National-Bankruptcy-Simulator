/**
 * 双人对抗 - 投机者行动面板（Phase 2）
 * 多次添加操作到队列，确认后锁定
 */

import { useState } from 'react';
import type { SpecAction, SpecActionType } from '../../types/versus';

interface Props {
  cash:        number;
  queuedActions: SpecAction[];
  onAdd:       (action: SpecAction) => void;
  onRemove:    (idx: number) => void;
  onConfirm:   () => void;
}

const ACTION_DEFS: {
  type:    SpecActionType;
  label:   string;
  icon:    string;
  desc:    string;
  minCost: number;
  color:   string;
}[] = [
  {
    type:    'short_currency',
    label:   '做空货币',
    icon:    '📉',
    desc:    '加速汇率贬值，外储流失，赚取差价',
    minCost: 100_000,
    color:   'border-red-200 bg-red-50 hover:bg-red-100',
  },
  {
    type:    'buy_bonds',
    label:   '买入国债',
    icon:    '📜',
    desc:    '押注债券价格方向，高风险高回报',
    minCost: 50_000,
    color:   'border-blue-200 bg-blue-50 hover:bg-blue-100',
  },
  {
    type:    'spread_rumor',
    label:   '散布谣言',
    icon:    '📢',
    desc:    '打压民心与信用，有30%被辟谣概率',
    minCost: 50_000,
    color:   'border-amber-200 bg-amber-50 hover:bg-amber-100',
  },
  {
    type:    'attack_market',
    label:   '全面攻击',
    icon:    '☠️',
    desc:    '多空并举，外储/信用全面打击，高成本',
    minCost: 120_000,
    color:   'border-orange-200 bg-orange-50 hover:bg-orange-100',
  },
];

const LEVERAGES = [1, 2, 3, 5];

export function VersusSpecPhase({ cash, queuedActions, onAdd, onRemove, onConfirm }: Props) {
  const [selected, setSelected] = useState<SpecActionType>('short_currency');
  const [amount,   setAmount]   = useState(100_000);
  const [leverage, setLeverage] = useState(1);

  const def = ACTION_DEFS.find((d) => d.type === selected)!;
  const canAdd = cash >= amount && amount >= def.minCost;

  const totalQueued = queuedActions.reduce((s, a) => s + a.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-amber-700 flex items-center gap-2">
          💸 <span>投机者行动</span>
          <span className="text-xs text-gray-400 font-normal">可多次操作</span>
        </h3>
        <div className="text-xs text-gray-500">
          剩余资金：<span className="text-amber-600 font-mono font-bold">${(cash / 10000).toFixed(0)}万</span>
        </div>
      </div>

      {/* 操作选择 */}
      <div className="grid grid-cols-2 gap-2">
        {ACTION_DEFS.map((d) => (
          <button
            key={d.type}
            onClick={() => { setSelected(d.type); setAmount(d.minCost); }}
            className={`rounded-xl border p-3 text-left transition-all ${d.color} ${
              selected === d.type ? 'ring-2 ring-blue-400' : ''
            }`}
          >
            <div className="text-base mb-1">{d.icon}</div>
            <div className="text-xs font-bold text-gray-900">{d.label}</div>
            <div className="text-xs text-gray-500 mt-0.5 leading-snug">{d.desc}</div>
            <div className="text-xs text-gray-400 mt-1">最低 ${(d.minCost / 10000).toFixed(0)}万</div>
          </button>
        ))}
      </div>

      {/* 金额 + 杠杆 */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">投入金额</span>
          <span className="text-sm font-mono font-bold text-gray-900">${(amount / 10000).toFixed(0)}万</span>
        </div>
        <input
          type="range"
          min={def.minCost}
          max={Math.min(cash, 1_000_000)}
          step={50_000}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full accent-amber-500"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 shrink-0">杠杆</span>
          <div className="flex gap-1.5">
            {LEVERAGES.map((lv) => (
              <button
                key={lv}
                onClick={() => setLeverage(lv)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  leverage === lv
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {lv}x
              </button>
            ))}
          </div>
          <div className="flex-1 text-right text-xs text-gray-400">
            预期最大收益 <span className="text-emerald-600 font-mono">+${((amount * leverage * 0.6) / 10000).toFixed(0)}万</span>
          </div>
        </div>
      </div>

      {/* 加入队列 */}
      <button
        onClick={() => canAdd && onAdd({ type: selected, amount, leverage })}
        disabled={!canAdd}
        className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all"
      >
        {canAdd ? `加入行动队列 → ${def.label}` : '资金不足'}
      </button>

      {/* 已排队的行动 */}
      {queuedActions.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <div className="text-xs text-gray-500 mb-2 flex justify-between">
            <span>已排队行动（{queuedActions.length}个）</span>
            <span>合计投入 <span className="text-amber-600">${(totalQueued / 10000).toFixed(0)}万</span></span>
          </div>
          <div className="space-y-1.5">
            {queuedActions.map((a, i) => {
              const d = ACTION_DEFS.find((d) => d.type === a.type)!;
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span>{d.icon}</span>
                  <span className="text-gray-700 flex-1">{d.label}</span>
                  <span className="font-mono text-amber-600">${(a.amount / 10000).toFixed(0)}万</span>
                  <span className="text-gray-400 font-mono">×{a.leverage}</span>
                  <button
                    onClick={() => onRemove(i)}
                    className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                  >✕</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 确认行动 */}
      <button
        onClick={onConfirm}
        className="w-full py-3 rounded-xl bg-gray-600 hover:bg-gray-500 text-white font-bold text-sm transition-all"
      >
        {queuedActions.length > 0 ? '确认所有行动 → 等待拯救者' : '跳过行动 → 等待拯救者'}
      </button>
    </div>
  );
}
