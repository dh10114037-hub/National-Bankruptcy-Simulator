// ═══════════════════════════════════════════
// 完整持仓面板 - 包含盈亏动画
// ═══════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Position } from '../../types/speculator';

interface Props {
  positions: Position[];
  totalPnL: number;
  onClose: (posId: string) => void;
  isHighlighted?: boolean;
}

// 持仓类型标签
const POSITION_LABELS: Record<string, { emoji: string; name: string; desc: string }> = {
  bond: { emoji: '📜', name: '国债做多', desc: '违约赔付' },
  short_currency: { emoji: '💱', name: '做空货币', desc: '汇率下跌获利' },
  gold: { emoji: '🥇', name: '做多黄金', desc: '避险升值' },
  short_bank: { emoji: '🏦', name: '做空银行', desc: '银行崩盘获利' },
};

// 格式化金额
function formatMoney(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 10000) return `${(value / 10000).toFixed(1)}万`;
  return value.toFixed(0);
}

// 数字动画组件
function AnimatedNumber({ value, positive }: { value: number; positive: boolean }) {
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      setDirection(value > prevRef.current ? 'up' : 'down');
      prevRef.current = value;

      // 0.6秒后重置动画状态
      const timer = setTimeout(() => setDirection(null), 600);
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <span
      className={`font-mono font-bold tabular-nums transition-all duration-300 ${
        direction === 'up' ? 'text-emerald-400 scale-110' :
        direction === 'down' ? 'text-red-400 scale-110' :
        positive ? 'text-emerald-400' : 'text-red-400'
      }`}
    >
      {positive ? '+' : ''}{formatMoney(value)}
    </span>
  );
}

// 单条持仓卡片
function PositionCard({
  pos,
  onClose,
  index,
}: {
  pos: Position;
  onClose: () => void;
  index: number;
}) {
  const [isClosing, setIsClosing] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const info = POSITION_LABELS[pos.type] ?? { emoji: '📊', name: pos.label, desc: '' };

  const pnlPositive = pos.pnl >= 0;
  const pnlPercent = pos.pnl_pct.toFixed(1);

  // 计算浮动盈亏（考虑杠杆）
  const leveragedPnL = pos.pnl * pos.leverage;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{
        opacity: isClosing ? 0 : 1,
        x: isClosing ? -50 : 0,
        scale: isClosing ? 0.8 : 1,
      }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`relative rounded-xl border p-4 transition-all cursor-pointer ${
        pnlPositive
          ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white hover:border-emerald-300 hover:shadow-md'
          : 'border-red-200 bg-gradient-to-br from-red-50 to-white hover:border-red-300 hover:shadow-md'
      }`}
      onClick={() => setShowDetail(!showDetail)}
    >
      {/* 头部：类型 + 状态 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{info.emoji}</span>
          <div>
            <div className="font-bold text-gray-900 text-sm">{info.name}</div>
            <div className="text-xs text-gray-500">{info.desc}</div>
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded text-xs font-bold ${
          pnlPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
        }`}>
          {pnlPositive ? '盈利' : '亏损'}
        </div>
      </div>

      {/* 核心数据 */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
          <div className="text-xs text-gray-500 mb-0.5">投入金额</div>
          <div className="text-gray-900 font-mono text-sm">${pos.amount.toLocaleString()}</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
          <div className="text-xs text-gray-500 mb-0.5">杠杆倍数</div>
          <div className="text-amber-600 font-mono text-sm font-bold">x{pos.leverage}</div>
        </div>
      </div>

      {/* 盈亏展示（带动画） */}
      <div className={`rounded-lg p-3 mb-3 ${
        pnlPositive ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 mb-0.5">浮动盈亏</div>
            <AnimatedNumber value={leveragedPnL} positive={pnlPositive} />
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-0.5">收益率</div>
            <div className={`font-mono font-bold text-lg ${
              pnlPositive ? 'text-emerald-600' : 'text-red-500'
            }`}>
              {pnlPositive ? '+' : ''}{pnlPercent}%
            </div>
          </div>
        </div>
        {/* 盈亏进度条 */}
        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${Math.min(Math.abs(pos.pnl_pct) / 20 * 100, 100)}%` }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`h-full ${pnlPositive ? 'bg-emerald-400' : 'bg-red-400'}`}
          />
        </div>
      </div>

      {/* 详情（可展开） */}
      <AnimatePresence>
        {showDetail && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">入场价格</span>
                <span className="text-gray-700 font-mono">{pos.buy_price.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">当前价格</span>
                <span className="text-gray-700 font-mono">{pos.current_price.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">价差</span>
                <span className={pnlPositive ? 'text-emerald-600' : 'text-red-500'}>
                  {(pos.current_price - pos.buy_price).toFixed(4)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 平仓按钮 */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={(e) => { e.stopPropagation(); handleClose(); }}
        className={`w-full mt-3 py-2 rounded-lg font-bold text-sm transition-all ${
          pnlPositive
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
            : 'bg-red-600 hover:bg-red-500 text-white'
        }`}
      >
        {pnlPositive ? '止盈平仓' : '止损平仓'}
      </motion.button>
    </motion.div>
  );
}

// 总览面板
function PortfolioSummary({ positions, totalPnL }: { positions: Position[]; totalPnL: number }) {
  const totalInvested = positions.reduce((sum, p) => sum + p.amount, 0);
  const positionsCount = positions.length;
  const winningPositions = positions.filter(p => p.pnl >= 0).length;

  return (
    <div className="rounded-xl bg-white border border-gray-200 p-4 mb-4 shadow-sm">
      <div className="text-xs text-gray-500 mb-3 flex items-center gap-2">
        <span>📊</span> <span>投资组合总览</span>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-gray-500 mb-1">持仓数</div>
          <div className="text-xl font-bold text-gray-900">{positionsCount}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">总投入</div>
          <div className="text-xl font-bold text-gray-900 font-mono">${(totalInvested / 10000).toFixed(0)}万</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">盈利/亏损</div>
          <div className={`text-xl font-bold font-mono ${totalPnL >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {totalPnL >= 0 ? '+' : ''}{(totalPnL / 10000).toFixed(1)}万
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">胜率</div>
          <div className="text-xl font-bold text-gray-900">
            {positionsCount > 0 ? Math.round(winningPositions / positionsCount * 100) : 0}%
          </div>
        </div>
      </div>
    </div>
  );
}

export function PositionPanel({ positions, totalPnL, onClose, isHighlighted }: Props) {
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // 当盈亏变化时，高亮变化的持仓
  useEffect(() => {
    if (isHighlighted && positions.length > 0) {
      const maxPnLPos = positions.reduce((max, p) => Math.abs(p.pnl) > Math.abs(max.pnl) ? p : max, positions[0]);
      setHighlightId(maxPnLPos?.id ?? null);
      setTimeout(() => setHighlightId(null), 1500);
    }
  }, [totalPnL, isHighlighted]);

  if (positions.length === 0) {
    return (
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-8 text-center">
        <div className="text-4xl mb-3">📭</div>
        <div className="text-gray-500 text-sm">暂无持仓</div>
        <div className="text-gray-400 text-xs mt-1">在右侧交易终端开仓</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PortfolioSummary positions={positions} totalPnL={totalPnL} />

      <div className="space-y-3">
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span>💼</span> <span>持仓详情</span>
          <span className="text-gray-600">（点击展开详情）</span>
        </div>
        {positions.map((pos, i) => (
          <motion.div
            key={pos.id}
            animate={highlightId === pos.id ? {
              scale: [1, 1.02, 1],
              boxShadow: pos.pnl >= 0
                ? ['0 0 0 rgba(52,211,153,0)', '0 0 30px rgba(52,211,153,0.5)', '0 0 0 rgba(52,211,153,0)']
                : ['0 0 0 rgba(248,113,113,0)', '0 0 30px rgba(248,113,113,0.5)', '0 0 0 rgba(248,113,113,0)'],
            } : {}}
            transition={{ duration: 0.6 }}
          >
            <PositionCard pos={pos} onClose={() => onClose(pos.id)} index={i} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
