/**
 * P2-1: 上下文提示组件
 * 在关键时刻显示交互式提示，帮助玩家理解游戏机制
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipData {
  id: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  highlight?: string; // 高亮区域的选择器
}

interface ContextualHintProps {
  hints: TooltipData[];
  activeHintId: string | null;
  onHintClick: (hint: TooltipData) => void;
  onDismiss: () => void;
}

export function ContextualHint({ hints, activeHintId, onHintClick, onDismiss }: ContextualHintProps) {
  const activeHint = hints.find(h => h.id === activeHintId);

  return (
    <AnimatePresence>
      {activeHint && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="fixed z-40 max-w-xs mx-4"
        >
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 text-lg shrink-0">💡</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-gray-800 mb-1">
                  {activeHint.title}
                </div>
                <div className="text-xs text-gray-600 leading-relaxed">
                  {activeHint.content}
                </div>
              </div>
              <button
                onClick={onDismiss}
                className="text-gray-400 hover:text-gray-600 shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ────────────────────────────────────────────────────────────────
// 关键决策点提示配置
// ────────────────────────────────────────────────────────────────
export const DECISION_HINTS: Record<string, TooltipData> = {
  // 拯救者模式提示
  savior_low_reserves: {
    id: 'savior_low_reserves',
    title: '外汇储备告急',
    content: '当外储低于30时，汇率会急剧下跌。建议：申请IMF援助或加税来补充外储。',
    position: 'top',
  },
  savior_high_inflation: {
    id: 'savior_high_inflation',
    title: '通胀失控警告',
    content: '高通胀会侵蚀民众购买力，导致民心下降。除非万不得已，不要大量印钞。',
    position: 'top',
  },
  savior_policy_tradeoff: {
    id: 'savior_policy_tradeoff',
    title: '政策权衡',
    content: '每个政策都有正负效果。选择前查看"决策辅助面板"了解详细影响。',
    position: 'right',
  },

  // 投机者模式提示
  spec_cheap_intel: {
    id: 'spec_cheap_intel',
    title: '情报购买提示',
    content: '情报价格$50K，有真有假。可信度<50%的情报可能误导你。优先购买可信度高的情报。',
    position: 'right',
  },
  spec_leverage_warning: {
    id: 'spec_leverage_warning',
    title: '杠杆风险',
    content: '5倍杠杆意味着10%的反向波动就会让你爆仓！建议新手使用1-2倍杠杆。',
    position: 'left',
  },
  spec_attack_timing: {
    id: 'spec_attack_timing',
    title: '最佳攻击时机',
    content: '当政府指标全面低于40时，你的攻击效果最好。此时信用崩塌，市场恐慌。',
    position: 'bottom',
  },
};

// ────────────────────────────────────────────────────────────────
// 提示钩子，用于管理提示状态
// ────────────────────────────────────────────────────────────────
export function useGameHints() {
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [dismissedHints, setDismissedHints] = useState<Set<string>>(new Set());

  const showHint = (hintId: string) => {
    if (!dismissedHints.has(hintId)) {
      setActiveHint(hintId);
    }
  };

  const dismissHint = () => {
    if (activeHint) {
      setDismissedHints(prev => new Set([...prev, activeHint]));
    }
    setActiveHint(null);
  };

  const resetDismissed = () => {
    setDismissedHints(new Set());
  };

  return {
    activeHint,
    showHint,
    dismissHint,
    resetDismissed,
    isHintDismissed: (hintId: string) => dismissedHints.has(hintId),
  };
}