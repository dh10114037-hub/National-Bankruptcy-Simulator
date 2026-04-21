/**
 * MobileTopStatus - 移动端顶部状态栏（浅色主题）
 */

import type { GameState, TrendPoint } from '../../types/game';

interface MobileTopStatusProps {
  gameState: GameState;
  crisisLevel: number;
  trendHistory: TrendPoint[];
  lastDelta: { foreign_reserves: number; public_support: number; credit_rating: number } | null;
  onBack: () => void;
}

export function MobileTopStatus({ gameState, crisisLevel, onBack }: MobileTopStatusProps) {
  const dangerZone = crisisLevel >= 70;

  const getCrisisColor = () => {
    if (crisisLevel >= 70) return 'text-red-600';
    if (crisisLevel >= 40) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const getCrisisBg = () => {
    if (crisisLevel >= 70) return 'bg-red-50 border border-red-200';
    if (crisisLevel >= 40) return 'bg-amber-50 border border-amber-200';
    return 'bg-emerald-50 border border-emerald-200';
  };

  return (
    <div className={`sticky top-0 z-30 border-b ${dangerZone ? 'border-red-200 bg-white' : 'border-gray-200 bg-white'} shadow-sm`}>
      {/* 顶部一行：标题 + 返回 + 危机 */}
      <div className="max-w-[420px] mx-auto px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="px-2 py-1 rounded-lg bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 text-xs transition-all hover:bg-gray-200"
          >
            ← 返回
          </button>
          <span className="text-sm font-bold text-gray-900">国家破产模拟器</span>
        </div>

        {/* 危机等级 */}
        <div className={`flex items-center gap-2 px-2 py-1 rounded-lg ${getCrisisBg()}`}>
          <span className="text-xs text-gray-500">危机</span>
          <span className={`text-sm font-mono font-bold ${getCrisisColor()}`}>
            {crisisLevel}%
          </span>
        </div>
      </div>

      {/* 第二行：回合 + 三指标 */}
      <div className="max-w-[420px] mx-auto px-3 pb-2">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-gray-400 font-mono">
            第 {gameState.turn} 月 / {gameState.maxTurns}
          </span>
          <span className={`font-mono ${dangerZone ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
            {dangerZone ? '⚠ 危机' : '稳定'}
          </span>
        </div>

        {/* 三指标横向展示 */}
        <div className="grid grid-cols-3 gap-2">
          <StatMini label="💰 外储" value={gameState.foreign_reserves} />
          <StatMini label="👥 民心" value={gameState.public_support} />
          <StatMini label="🏦 信用" value={gameState.credit_rating} />
        </div>
      </div>
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: number }) {
  const getColor = () => {
    if (value < 15) return 'text-red-600';
    if (value < 35) return 'text-amber-600';
    return 'text-emerald-600';
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-center">
      <div className="text-[10px] text-gray-400 mb-0.5">{label}</div>
      <div className={`text-sm font-mono font-bold ${getColor()}`}>
        {Math.round(value)}
      </div>
    </div>
  );
}
