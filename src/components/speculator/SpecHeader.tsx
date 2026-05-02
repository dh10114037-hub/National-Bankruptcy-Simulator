/**
 * 投机者模式 - 顶部状态栏（浅色主题，H5 响应式）
 */

import { useState, useEffect, useRef } from 'react';
import type { SpeculatorAssets, MarketState, Position } from '../../types/speculator';

interface Props {
  assets: SpeculatorAssets;
  market: MarketState;
  turn: number;
  maxTurns: number;
  marketFlash: Partial<Record<keyof MarketState, 'up' | 'down'>>;
  initialCash: number;
  onBack?: () => void;
}

function FlashNum({
  value,
  format,
  prefix = '',
  suffix = '',
  decimals = 2,
}: {
  value: number;
  format?: 'currency' | 'percent' | 'plain';
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [anim, setAnim] = useState<'up' | 'down' | null>(null);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      setAnim(value > prevRef.current ? 'up' : 'down');
      prevRef.current = value;
      setTimeout(() => setAnim(null), 700);
    }
  }, [value]);

  const color =
    anim === 'up'
      ? 'text-emerald-600'
      : anim === 'down'
      ? 'text-red-600'
      : 'text-gray-900';

  let display = value.toFixed(decimals);
  if (format === 'currency') display = `$${Number(value.toFixed(0)).toLocaleString()}`;
  if (format === 'percent')  display = `${value.toFixed(1)}%`;

  return (
    <span
      className={`font-mono font-bold transition-colors duration-300 ${color} ${
        anim ? (anim === 'up' ? 'num-up' : 'num-down') : ''
      }`}
    >
      {prefix}{display}{suffix}
    </span>
  );
}

function PositionTooltip({ pos }: { pos: Position }) {
  const pnlPositive = pos.pnl >= 0;
  return (
    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 min-w-[200px] bg-white border border-gray-200 rounded-xl p-3 shadow-xl text-xs space-y-1.5">
      <div className="text-gray-400">买入价格</div>
      <div className="text-gray-900 font-mono">{pos.buy_price.toFixed(4)}</div>
      <div className="text-gray-400">当前盈亏</div>
      <div className={`font-mono font-bold flex items-center gap-1 ${pnlPositive ? 'text-emerald-600' : 'text-red-600'}`}>
        <span>{pnlPositive ? '▲' : '▼'}</span>
        <span>{pnlPositive ? '+' : ''}{pos.pnl.toFixed(0)} ({pnlPositive ? '+' : ''}{pos.pnl_pct.toFixed(1)}%)</span>
      </div>
      <div className="text-gray-400">杠杆</div>
      <div className="text-amber-600 font-mono">x{pos.leverage}</div>
    </div>
  );
}

const MARKET_LABELS: Record<keyof MarketState, string> = {
  exchange_rate: '汇率',
  inflation:     '通胀',
  credit_rating: '信用',
  bond_price:    '国债',
  stock_index:   '股指',
};

export function SpecHeader({ assets, market, turn, maxTurns, marketFlash, initialCash, onBack }: Props) {
  const [activePos, setActivePos] = useState<{ index: number; pos: Position } | null>(null);
  const marketEntries = Object.entries(market) as [keyof MarketState, number][];

  const totalRatio = assets.total_pnl / initialCash;
  const victoryPct = Math.min(100, (totalRatio / 3) * 100);
  const progressColor =
    victoryPct >= 66 ? 'bg-emerald-500' :
    victoryPct >= 33 ? 'bg-amber-500' : 'bg-gray-300';

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6">

        {/* 第一行：返回 + 标题 + 资产（桌面一行；H5 仅显示现金/总资产，回合压缩） */}
        <div className="flex items-center gap-2 sm:gap-3 py-2 border-b border-gray-100 overflow-x-auto">
          {/* 返回按钮 */}
          {onBack && (
            <button
              onClick={onBack}
              className="shrink-0 px-2 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 text-xs transition-all hover:bg-gray-200"
            >
              ← 返回
            </button>
          )}

          {/* 标题 */}
          <span className="shrink-0 text-xs font-mono font-bold tracking-widest text-gray-400">
            SPEC
          </span>

          <div className="w-px h-5 bg-gray-200 shrink-0" />

          {/* 现金 */}
          <div className="shrink-0 flex flex-col items-start">
            <div className="text-[10px] text-gray-400 leading-none mb-0.5">现金</div>
            <FlashNum value={assets.cash} format="currency" decimals={0} />
          </div>

          <div className="w-px h-5 bg-gray-200 shrink-0" />

          {/* 总资产 */}
          <div className="shrink-0 flex flex-col items-start">
            <div className="text-[10px] text-gray-400 leading-none mb-0.5">总资产</div>
            <FlashNum value={assets.total_value} format="currency" decimals={0} />
          </div>

          {/* 持仓（H5 隐藏） */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <div className="w-px h-5 bg-gray-200" />
            <div className="flex items-center gap-1.5">
              {assets.positions.map((pos, i) => (
                <button
                  key={i}
                  onClick={() => setActivePos(activePos?.index === i ? null : { index: i, pos })}
                  className={`relative px-2 py-0.5 rounded text-xs font-mono font-bold transition-all ${
                    pos.pnl >= 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {pos.type === 'long' ? '多' : '空'} x{pos.leverage}
                  {activePos?.index === i && <PositionTooltip pos={pos} />}
                </button>
              ))}
            </div>
          </div>

          {/* 回合数（H5 压缩） */}
          <div className="ml-auto shrink-0 flex items-center gap-1.5">
            <span className="text-[10px] sm:text-xs text-gray-400">第 {turn}/{maxTurns}</span>
            <div className="w-16 sm:w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${(turn / maxTurns) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* 第二行：市场状态 + 收割进度（H5 仅显示核心市场指标） */}
        <div className="flex items-center gap-3 sm:gap-6 py-2 overflow-x-auto">
          {/* 市场指标（H5 横向滚动） */}
          <div className="flex items-center gap-3 sm:gap-5 flex-wrap sm:flex-nowrap">
            {marketEntries.map(([key, val]) => {
              const flashDir = marketFlash[key];
              const color =
                flashDir === 'up' ? 'text-emerald-600' :
                flashDir === 'down' ? 'text-red-600' : 'text-gray-700';
              const arrow =
                flashDir === 'up' ? '↑' :
                flashDir === 'down' ? '↓' : '→';

              let display = '';
              if (key === 'exchange_rate') display = val.toFixed(2);
              else if (key === 'inflation') display = `${val.toFixed(1)}%`;
              else if (key === 'credit_rating') display = val.toFixed(0);
              else if (key === 'bond_price') display = val.toFixed(3);
              else if (key === 'stock_index') display = val.toFixed(0);

              return (
                <div key={key} className="text-center shrink-0">
                  <div className="text-[10px] sm:text-xs text-gray-400">{MARKET_LABELS[key]}</div>
                  <div className={`font-mono font-bold text-xs sm:text-sm ${color} ${flashDir ? (flashDir === 'up' ? 'num-up' : 'num-down') : ''}`}>
                    <span className="text-[10px] mr-0.5 opacity-70">{arrow}</span>
                    {display}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 收割进度（H5 隐藏文字标签） */}
          <div className="ml-auto shrink-0 flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-gray-400">收割进度</span>
            <div className="w-20 sm:w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-700 ${progressColor}`}
                style={{ width: `${Math.max(0, victoryPct)}%` }}
              />
            </div>
            <span className="text-xs font-mono text-gray-600">
              {(totalRatio * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
