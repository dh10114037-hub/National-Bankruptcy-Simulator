import { motion } from 'framer-motion';
import type { GameState, TrendPoint } from '../types/game';
import { StatBar } from './StatBar';

interface HeaderProps {
  gameState: GameState;
  crisisLevel: number;
  trendHistory: TrendPoint[];
  lastDelta: { foreign_reserves: number; public_support: number; credit_rating: number } | null;
  onBack?: () => void;
  onAchievement?: () => void;
}

function TurnProgress({ turn, maxTurns }: { turn: number; maxTurns: number }) {
  const pct = ((turn - 1) / maxTurns) * 100;
  const danger = pct > 80;
  const warn = pct > 60;

  const startYear = 2028;
  const month = ((turn - 1) % 12) + 1;
  const year = startYear + Math.floor((turn - 1) / 12);
  const monthName = ['一','二','三','四','五','六','七','八','九','十','十一','十二'][month - 1];

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="text-gray-500 font-mono">第 <span className="text-gray-900 font-bold text-sm">{turn}</span><span className="text-gray-400"> / {maxTurns} 月</span></span>
          <span className="text-gray-300">|</span>
          <span className="text-blue-500 text-xs">{year}年 {monthName}月</span>
        </div>
        <span className={`text-xs font-mono ${danger ? 'text-red-500 animate-pulse' : warn ? 'text-amber-600' : 'text-gray-400'}`}>
          {danger ? '⚠ 最终阶段' : warn ? `⚡ 还剩 ${maxTurns - turn + 1} 月` : `剩余 ${maxTurns - turn + 1} 月`}
        </span>
      </div>
      <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${danger ? 'bg-red-500' : warn ? 'bg-amber-500' : 'bg-blue-500'}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function CrisisLevelBar({ level }: { level: number }) {
  const color =
    level >= 70 ? 'bg-red-500' :
    level >= 40 ? 'bg-amber-500' :
    'bg-emerald-500';
  const label =
    level >= 70 ? '崩溃边缘' :
    level >= 40 ? '局势紧张' :
    '相对稳定';
  const labelColor =
    level >= 70 ? 'text-red-600' :
    level >= 40 ? 'text-amber-600' :
    'text-emerald-600';

  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <span className="text-xs text-gray-400 whitespace-nowrap">危机等级</span>
      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color} ${level >= 70 ? 'shadow-[0_0_8px_rgba(239,68,68,0.4)]' : ''}`}
          initial={{ width: 0 }}
          animate={{ width: `${level}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className={`text-xs font-bold font-mono ${labelColor} w-16 text-right`}>{level}% {label}</span>
    </motion.div>
  );
}

function MarketBadge({ label, value, flash }: { label: string; value: string; flash?: 'up' | 'down' }) {
  const color = flash === 'up' ? 'text-emerald-600' : flash === 'down' ? 'text-red-600' : 'text-gray-600';

  return (
    <motion.div
      className={`flex items-center gap-1.5 ${color}`}
      key={flash}
      initial={flash ? { scale: 1.2 } : {}}
      animate={flash ? { scale: 1 } : {}}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
    >
      <span className="text-[10px] text-gray-400">{label}</span>
      <span className="text-xs font-mono font-bold">{value}</span>
      {flash === 'up' && <span className="text-emerald-500 text-[8px]">▲</span>}
      {flash === 'down' && <span className="text-red-500 text-[8px]">▼</span>}
    </motion.div>
  );
}

// 成就徽章按钮
function AchievementBadge({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="查看成就"
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 transition-colors"
      title="查看成就"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <span className="text-xs font-medium">成就</span>
    </button>
  );
}

export function Header({ gameState, crisisLevel, trendHistory, lastDelta, onBack, onAchievement }: HeaderProps) {
  const dangerZone =
    gameState.foreign_reserves < 20 ||
    gameState.public_support < 20 ||
    gameState.credit_rating < 15;

  const { market } = gameState;

  const formatReason = (val: number | undefined, label: string) => {
    if (!val) return undefined;
    return val > 0
      ? `+${val} 来自本回合 ${label}`
      : `${val} 来自本回合 ${label}`;
  };

  return (
    <div className={`border-b sticky top-0 z-30 bg-white ${dangerZone ? 'border-red-200' : 'border-gray-200'} shadow-sm`}>
      <div className="px-4 lg:px-6 py-3 space-y-3">
        {/* Top row: back + title + badges */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                aria-label="返回主菜单"
                className="relative px-2.5 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 text-xs transition-all hover:bg-gray-200"
              >
                ← 返回
              </button>
            )}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${dangerZone ? 'bg-red-50' : 'bg-blue-50'}`}>
              🌍
            </div>
            <div>
              <h1 className={`font-bold text-sm leading-tight tracking-wide text-gray-900 glitch-text ${dangerZone ? 'glitch-active' : ''}`}
                  data-text="国家破产模拟器">
                国家破产模拟器
              </h1>
              <p className="text-gray-400 text-[10px] font-mono">NATION COLLAPSE SIMULATOR</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onAchievement && <AchievementBadge onClick={onAchievement} />}
            {gameState.winStreak > 0 && (
              <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                🔥 稳定 ×{gameState.winStreak}
              </span>
            )}
            {dangerZone && (
              <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full animate-pulse font-mono">
                ⚠ 危机
              </span>
            )}
            <span className="text-[10px] text-gray-400 font-mono border border-gray-200 px-2 py-0.5 rounded bg-gray-50">
              GOV TERMINAL v3.0
            </span>
          </div>
        </div>

        {/* Turn progress */}
        <TurnProgress turn={gameState.turn} maxTurns={gameState.maxTurns} />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatBar
            label="外汇储备"
            icon="💰"
            value={gameState.foreign_reserves}
            dangerThreshold={15}
            warnThreshold={35}
            lastReason={lastDelta ? formatReason(lastDelta.foreign_reserves, '结算') : undefined}
            trendHistory={trendHistory}
            statKey="foreign_reserves"
          />
          <StatBar
            label="民众支持"
            icon="👥"
            value={gameState.public_support}
            dangerThreshold={15}
            warnThreshold={35}
            lastReason={lastDelta ? formatReason(lastDelta.public_support, '结算') : undefined}
            trendHistory={trendHistory}
            statKey="public_support"
          />
          <StatBar
            label="国家信用"
            icon="📊"
            value={gameState.credit_rating}
            dangerThreshold={10}
            warnThreshold={30}
            lastReason={lastDelta ? formatReason(lastDelta.credit_rating, '结算') : undefined}
            trendHistory={trendHistory}
            statKey="credit_rating"
          />
        </div>

        {/* Market status row */}
        <div className="flex items-center gap-4 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-[10px] text-gray-400 font-mono mr-2">市场</span>
          <MarketBadge label="汇率" value={market.exchange_rate.toFixed(2)} />
          <div className="w-px h-4 bg-gray-200" />
          <MarketBadge label="通胀" value={`${market.inflation.toFixed(0)}%`} />
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400">波动</span>
            <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  market.volatility > 0.7 ? 'bg-red-500' :
                  market.volatility > 0.4 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${market.volatility * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-[10px] font-mono text-gray-500">{(market.volatility * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Crisis level bar */}
        <CrisisLevelBar level={crisisLevel} />
      </div>
    </div>
  );
}
