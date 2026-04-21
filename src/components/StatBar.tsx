import { useState, useEffect, useRef } from 'react';
import { clamp } from '../engine/gameEngine';
import type { TrendPoint } from '../types/game';

interface StatBarProps {
  label: string;
  icon: string;
  value: number;
  prevValue?: number;
  dangerThreshold?: number;
  warnThreshold?: number;
  lastReason?: string;   // e.g. "+10 来自增税"
  trendHistory?: TrendPoint[];
  statKey?: 'foreign_reserves' | 'public_support' | 'credit_rating';
}

export function StatBar({
  label,
  icon,
  value,
  prevValue,
  dangerThreshold = 15,
  warnThreshold = 35,
  lastReason,
  trendHistory = [],
  statKey,
}: StatBarProps) {
  const pct = clamp(value, 0, 100);
  const [animClass, setAnimClass] = useState('');
  const prevRef = useRef(prevValue ?? value);

  useEffect(() => {
    const prev = prevRef.current;
    if (value !== prev) {
      setAnimClass(value > prev ? 'num-up' : 'num-down');
      const t = setTimeout(() => setAnimClass(''), 600);
      prevRef.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  let barColor = 'bg-emerald-500';
  let textColor = 'text-emerald-600';
  let glowClass = '';

  if (pct <= dangerThreshold) {
    barColor = 'bg-red-500';
    textColor = 'text-red-600';
    glowClass = 'red-flicker';
  } else if (pct <= warnThreshold) {
    barColor = 'bg-amber-500';
    textColor = 'text-amber-600';
    glowClass = '';
  }

  // Trend direction arrow
  let trendArrow = '';
  if (trendHistory.length >= 2 && statKey) {
    const last2 = trendHistory.slice(-2);
    const diff = last2[1][statKey] - last2[0][statKey];
    if (diff > 0) trendArrow = '↑';
    else if (diff < 0) trendArrow = '↓';
    else trendArrow = '→';
  }

  const trendColor =
    trendArrow === '↑' ? 'text-emerald-600' :
    trendArrow === '↓' ? 'text-red-600' :
    'text-gray-400';

  return (
    <div className="flex flex-col gap-1 group/stat relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
          <span>{icon}</span>
          <span>{label}</span>
          {trendArrow && (
            <span className={`text-xs font-bold ${trendColor}`}>{trendArrow}</span>
          )}
        </div>
        <span className={`text-sm font-bold tabular-nums ${textColor} ${animClass}`}>
          {Math.round(pct)}
        </span>
      </div>

      {/* Progress bar */}
      <div className={`h-3 rounded-full bg-gray-200 overflow-hidden ${glowClass}`}>
        <div
          className={`h-full rounded-full stat-bar-fill ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Tooltip: last change reason */}
      {lastReason && (
        <div className="
          absolute left-0 -top-9 z-20
          opacity-0 group-hover/stat:opacity-100
          transition-opacity duration-150
          bg-white border border-gray-200
          rounded-lg px-3 py-1.5 text-xs text-gray-700
          whitespace-nowrap shadow-lg pointer-events-none
        ">
          {lastReason}
        </div>
      )}
    </div>
  );
}
