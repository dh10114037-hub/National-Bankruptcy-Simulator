/**
 * 政策因果链动画弹层
 *
 * 流程：
 *  1. 弹层出现（策名 + 第一节点立即显示）
 *  2. 每隔 ~600ms 逐步显示下一节点（淡入 + 上滑）
 *  3. 最后一节点显示完毕后，延迟 700ms 调用 onComplete
 *
 * 样式：
 *  positive → 绿色
 *  negative → 红色
 *  warning  → 黄色
 *  neutral  → 灰色
 *
 * ⚠️ 不依赖 framer-motion 的高级特性，仅用 CSS transition + keyframe
 */

import { useEffect, useRef, useState } from 'react';
import type { ChainNode, PolicyCausalChain } from '../data/policyCausalChains';

interface Props {
  chain: PolicyCausalChain;
  /** 动画全部播放完毕后调用（此时再执行实际数值结算） */
  onComplete: () => void;
  /** 可选：步骤间隔毫秒，默认 600 */
  stepInterval?: number;
}

// ─── 节点样式映射 ────────────────────────────────────────────
const NODE_STYLES: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  positive: {
    bg:     'bg-emerald-50',
    border: 'border-emerald-300',
    text:   'text-emerald-800',
    badge:  'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  negative: {
    bg:     'bg-red-50',
    border: 'border-red-300',
    text:   'text-red-800',
    badge:  'bg-red-100 text-red-600 border-red-200',
  },
  warning: {
    bg:     'bg-amber-50',
    border: 'border-amber-300',
    text:   'text-amber-800',
    badge:  'bg-amber-100 text-amber-700 border-amber-200',
  },
  neutral: {
    bg:     'bg-gray-50',
    border: 'border-gray-200',
    text:   'text-gray-700',
    badge:  'bg-gray-100 text-gray-500 border-gray-200',
  },
};

const TYPE_LABEL: Record<string, string> = {
  positive: '正向',
  negative: '负向',
  warning:  '风险',
  neutral:  '过程',
};

// ─── 箭头连接符 ───────────────────────────────────────────────
function Arrow({ fromType }: { fromType: string }) {
  const colors: Record<string, string> = {
    positive: 'text-emerald-400',
    negative: 'text-red-400',
    warning:  'text-amber-400',
    neutral:  'text-gray-300',
  };
  return (
    <div className={`flex justify-center py-0.5 ${colors[fromType] ?? 'text-gray-300'}`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="12" y1="2" x2="12" y2="18" />
        <polyline points="6,13 12,19 18,13" />
      </svg>
    </div>
  );
}

// ─── 单节点 ────────────────────────────────────────────────────
function ChainNodeCard({ node, visible }: { node: ChainNode; visible: boolean }) {
  const s = NODE_STYLES[node.type];
  return (
    <div
      style={{
        transition: 'opacity 0.4s ease, transform 0.4s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
      }}
    >
      <div className={`rounded-xl border-2 ${s.border} ${s.bg} px-4 py-3 flex items-start gap-3`}>
        {node.icon && (
          <span className="text-xl leading-none mt-0.5 shrink-0">{node.icon}</span>
        )}
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-sm leading-tight ${s.text}`}>{node.label}</div>
          {node.sub && (
            <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{node.sub}</div>
          )}
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0 ${s.badge}`}>
          {TYPE_LABEL[node.type]}
        </span>
      </div>
    </div>
  );
}

// ─── 进度条 ────────────────────────────────────────────────────
function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mt-3">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{ transition: 'all 0.3s ease' }}
          className={`rounded-full ${
            i < current
              ? 'w-2 h-2 bg-gray-600'
              : i === current
                ? 'w-2.5 h-2.5 bg-amber-500 shadow-sm shadow-amber-300'
                : 'w-1.5 h-1.5 bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

// ─── 主组件 ────────────────────────────────────────────────────
export function CausalChainAnimation({ chain, onComplete, stepInterval = 600 }: Props) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const completeCalled = useRef(false);
  const nodes = chain.nodes;

  useEffect(() => {
    // 第一个节点立即显示
    setVisibleCount(1);
  }, []);

  useEffect(() => {
    if (visibleCount === 0) return;

    if (visibleCount < nodes.length) {
      const t = setTimeout(() => {
        setVisibleCount(v => v + 1);
      }, stepInterval);
      return () => clearTimeout(t);
    } else {
      // 所有节点已显示，开始完成动画
      setFinishing(true);
      const t = setTimeout(() => {
        if (!completeCalled.current) {
          completeCalled.current = true;
          onComplete();
        }
      }, 700);
      return () => clearTimeout(t);
    }
  }, [visibleCount, nodes.length, stepInterval, onComplete]);

  // 跳过按钮：立即完成
  const handleSkip = () => {
    if (!completeCalled.current) {
      completeCalled.current = true;
      onComplete();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)', touchAction: 'none' }}
    >
      {/* 阻止背景滚动 */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        style={{
          transition: finishing ? 'opacity 0.4s ease, transform 0.4s ease' : undefined,
          opacity: finishing ? 0.9 : 1,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 标题栏 */}
        <div className="bg-gray-900 px-4 py-3 flex items-center gap-3 shrink-0">
          <span className="text-2xl">{chain.policyIcon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-sm truncate">{chain.policyName}</div>
            <div className="text-gray-400 text-xs mt-0.5">政策因果链</div>
          </div>
          {/* 跳过按钮（大触摸区域） */}
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-white text-xs px-3 py-1.5 rounded-lg border border-gray-600 hover:border-gray-400 transition-colors active:bg-gray-800 shrink-0"
            style={{ minWidth: '44px', minHeight: '36px' }}
          >
            跳过
          </button>
        </div>

        {/* 节点列表（可滚动） */}
        <div className="px-4 py-3 space-y-1 overflow-y-auto flex-1" style={{ maxHeight: 'calc(85vh - 140px)' }}>
          {nodes.map((node, idx) => (
            <div key={idx}>
              <ChainNodeCard node={node} visible={idx < visibleCount} />
              {/* 中间箭头（最后一个节点不显示） */}
              {idx < nodes.length - 1 && idx < visibleCount - 1 && (
                <Arrow fromType={node.type} />
              )}
            </div>
          ))}
        </div>

        {/* 进度 + 说明 */}
        <div className="px-4 pb-4 shrink-0">
          <ProgressDots total={nodes.length} current={visibleCount - 1} />
          <div className="text-center text-xs text-gray-400 mt-2">
            {visibleCount < nodes.length
              ? `${visibleCount} / ${nodes.length} · 正在分析影响...`
              : '分析完成，即将结算...'}
          </div>
        </div>
      </div>
    </div>
  );
}
