import { motion } from 'framer-motion';
import type { TrendPoint, GameState } from '../types/game';

interface DataPanelProps {
  gameState: GameState;
  trendHistory: TrendPoint[];
  lastSpeculatorAction: string | null;
  lastSpeculatorEffects: Record<string, number> | null;
  marketFlash?: { exchange_rate?: 'up' | 'down'; inflation?: 'up' | 'down' } | null;
}

// ── SVG Sparkline ────────────────────────────────────
interface SparklineProps {
  data: number[];
  color: string;
  height?: number;
  width?: number;
}

function Sparkline({ data, color, height = 40, width = 160 }: SparklineProps) {
  if (data.length < 2) {
    return (
      <svg width={width} height={height}>
        <text x={width / 2} y={height / 2 + 4} textAnchor="middle" fill="#9CA3AF" fontSize="9">
          数据不足
        </text>
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 4;

  const points = data.map((val, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = pad + ((1 - (val - min) / range) * (height - pad * 2));
    return { x, y, val };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  // Fill under line
  const fillD =
    pathD +
    ` L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#grad-${color.replace('#', '')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 3 : 2}
          fill={i === points.length - 1 ? color : 'transparent'}
          stroke={color}
          strokeWidth="1"
          className="sparkline-dot"
        >
          <title>{p.val.toFixed(0)}</title>
        </circle>
      ))}
    </svg>
  );
}

// ── Risk Alerts ──────────────────────────────────────
function RiskAlerts({ gameState }: { gameState: GameState }) {
  const alerts: { text: string; severity: 'critical' | 'warn' }[] = [];

  if (gameState.foreign_reserves < 20) {
    alerts.push({ text: '外储极度匮乏，破产在即', severity: 'critical' });
  } else if (gameState.foreign_reserves < 35) {
    alerts.push({ text: '外储不足，需紧急补充', severity: 'warn' });
  }

  if (gameState.public_support < 20) {
    alerts.push({ text: '民心即将崩溃，社会不稳', severity: 'critical' });
  } else if (gameState.public_support < 35) {
    alerts.push({ text: '民众不满上升，需安抚', severity: 'warn' });
  }

  if (gameState.credit_rating < 20) {
    alerts.push({ text: '信用崩盘，无法融资', severity: 'critical' });
  } else if (gameState.credit_rating < 40) {
    alerts.push({ text: '信用过低，投机者将介入', severity: 'warn' });
  }

  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 text-emerald-400/70 text-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        当前局势相对稳定
      </div>
    );
  }

  return (
    <ul className="space-y-1.5">
      {alerts.map((a, i) => (
        <li key={i} className={`flex items-start gap-2 text-xs ${a.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
          <span className="flex-shrink-0 mt-0.5">{a.severity === 'critical' ? '🔴' : '🟡'}</span>
          {a.text}
        </li>
      ))}
    </ul>
  );
}

// ── Market Mini Card ─────────────────────────────────
function MarketCard({ gameState, marketFlash }: { gameState: GameState; marketFlash?: { exchange_rate?: 'up' | 'down'; inflation?: 'up' | 'down' } | null }) {
  const { market } = gameState;
  const erColor = market.exchange_rate < 0.7 ? 'text-red-600' : market.exchange_rate < 0.9 ? 'text-amber-600' : 'text-emerald-600';
  const infColor = market.inflation > 60 ? 'text-red-600' : market.inflation > 40 ? 'text-amber-600' : 'text-gray-600';
  const volColor = market.volatility > 0.7 ? 'text-red-600' : market.volatility > 0.4 ? 'text-amber-600' : 'text-emerald-600';

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs">📈</span>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-mono">
          市场状态
        </h3>
      </div>
      <div className="space-y-3">
        {/* 汇率 */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400">汇率</span>
          <motion.span
            className={`text-sm font-mono font-bold ${erColor}`}
            key={marketFlash?.exchange_rate}
            animate={marketFlash?.exchange_rate ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            {market.exchange_rate.toFixed(3)}
            {marketFlash?.exchange_rate === 'up' && <span className="ml-1 text-[8px] text-emerald-500">▲</span>}
            {marketFlash?.exchange_rate === 'down' && <span className="ml-1 text-[8px] text-red-500">▼</span>}
          </motion.span>
        </div>
        {/* 通胀 */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400">通胀率</span>
          <motion.span
            className={`text-sm font-mono font-bold ${infColor}`}
            key={marketFlash?.inflation}
            animate={marketFlash?.inflation ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            {market.inflation.toFixed(0)}%
            {marketFlash?.inflation === 'up' && <span className="ml-1 text-[8px] text-red-500">▲</span>}
            {marketFlash?.inflation === 'down' && <span className="ml-1 text-[8px] text-emerald-500">▼</span>}
          </motion.span>
        </div>
        {/* 波动率 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400">市场波动</span>
            <span className={`text-sm font-mono font-bold ${volColor}`}>{(market.volatility * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
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
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────
export function DataPanel({
  gameState,
  trendHistory,
  lastSpeculatorAction,
  lastSpeculatorEffects,
  marketFlash,
}: DataPanelProps) {
  const frData = trendHistory.map((p) => p.foreign_reserves);
  const psData = trendHistory.map((p) => p.public_support);
  const crData = trendHistory.map((p) => p.credit_rating);

  const statNames: Record<string, string> = {
    foreign_reserves: '外储',
    public_support: '民心',
    credit_rating: '信用',
  };

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Market status */}
      <MarketCard gameState={gameState} marketFlash={marketFlash} />

      {/* Trend chart */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs">📊</span>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-mono">
            趋势图（最近{trendHistory.length}回合）
          </h3>
        </div>

        <div className="space-y-4">
          {/* Foreign reserves */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-400 font-mono">外汇储备</span>
              <span className="text-[10px] text-emerald-600 font-mono tabular-nums">
                {gameState.foreign_reserves.toFixed(0)}
              </span>
            </div>
            <div className="w-full">
              <Sparkline data={frData} color="#059669" width={200} height={36} />
            </div>
          </div>

          {/* Public support */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-400 font-mono">民众支持</span>
              <span className="text-[10px] text-blue-600 font-mono tabular-nums">
                {gameState.public_support.toFixed(0)}
              </span>
            </div>
            <div className="w-full">
              <Sparkline data={psData} color="#2563EB" width={200} height={36} />
            </div>
          </div>

          {/* Credit rating */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-400 font-mono">国家信用</span>
              <span className="text-[10px] text-amber-600 font-mono tabular-nums">
                {gameState.credit_rating.toFixed(0)}
              </span>
            </div>
            <div className="w-full">
              <Sparkline data={crData} color="#D97706" width={200} height={36} />
            </div>
          </div>
        </div>
      </div>

      {/* Speculator activity */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs animate-pulse">📈</span>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-mono">
            投机者动向
          </h3>
        </div>

        {lastSpeculatorAction ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              <span className="text-red-600 text-xs font-medium">{lastSpeculatorAction}</span>
            </div>
            {lastSpeculatorEffects && (
              <div className="flex flex-wrap gap-1.5 pl-4">
                {Object.entries(lastSpeculatorEffects).map(([k, v]) => {
                  const sign = v > 0 ? '+' : '';
                  return (
                    <span key={k} className="text-[10px] font-mono text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                      {statNames[k]} {sign}{v}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-gray-300" />
            暂时蛰伏中...
          </div>
        )}
      </div>

      {/* Risk alerts */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs">📦</span>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-mono">
            风险提示
          </h3>
        </div>
        <RiskAlerts gameState={gameState} />
      </div>

      {/* Win condition reminder */}
      <div className="rounded-xl border border-gray-200 bg-blue-50/50 p-3">
        <div className="text-[10px] text-gray-500 font-mono space-y-1">
          <div className="text-gray-600 font-semibold mb-1.5">胜利条件</div>
          <div className={`flex items-center gap-1.5 ${gameState.foreign_reserves > 60 ? 'text-emerald-600' : 'text-gray-400'}`}>
            <span>{gameState.foreign_reserves > 60 ? '✓' : '○'}</span>
            外储 &gt; 60 ({gameState.foreign_reserves.toFixed(0)})
          </div>
          <div className={`flex items-center gap-1.5 ${gameState.public_support > 60 ? 'text-emerald-600' : 'text-gray-400'}`}>
            <span>{gameState.public_support > 60 ? '✓' : '○'}</span>
            民心 &gt; 60 ({gameState.public_support.toFixed(0)})
          </div>
          <div className={`flex items-center gap-1.5 ${gameState.credit_rating > 60 ? 'text-emerald-600' : 'text-gray-400'}`}>
            <span>{gameState.credit_rating > 60 ? '✓' : '○'}</span>
            信用 &gt; 60 ({gameState.credit_rating.toFixed(0)})
          </div>
          <div className="border-t border-gray-200 pt-1.5 mt-1.5 text-gray-400">
            连续满足3回合 → 胜利 · 当前连续: {gameState.winStreak}/3
          </div>
        </div>
      </div>
    </div>
  );
}
