/**
 * AchievementToast — 成就解锁通知
 *
 * 当新成就解锁时，从屏幕顶部滑入展示
 * 展示图标、名称、描述和稀有度标签
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Achievement } from '../../data/achievements';
import { RARITY_COLORS } from '../../data/achievements';

interface Props {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export function AchievementToast({ achievement, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setVisible(true);
      // 4秒后自动消失
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 400);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onDismiss]);

  if (!achievement) return null;

  const rarity = RARITY_COLORS[achievement.rarity];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -80, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -80, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[100]"
          onClick={onDismiss}
        >
          <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 shadow-2xl backdrop-blur-md ${rarity.bg} ${rarity.border}`}>
            {/* 图标 */}
            <div className="text-4xl leading-none">{achievement.icon}</div>

            {/* 内容 */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${rarity.bg} ${rarity.border} ${rarity.text}`}>
                  {rarity.label}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">成就解锁</span>
              </div>
              <div className="font-bold text-gray-900 text-sm leading-tight">{achievement.name}</div>
              <div className="text-xs text-gray-500 mt-0.5 leading-relaxed max-w-[200px] truncate">
                {achievement.description}
              </div>
            </div>

            {/* 关闭 */}
            <button
              onClick={(e) => { e.stopPropagation(); setVisible(false); setTimeout(onDismiss, 100); }}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none shrink-0 w-6 h-6 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * AchievementPanel — 成就展示面板
 */
import { ACHIEVEMENTS, RARITY_COLORS as RC, type AchievementRarity } from '../../data/achievements';

interface PanelProps {
  mode: 'speculator' | 'savior' | 'versus';
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: AchievementRarity;
    isUnlocked: boolean;
    unlockedAt?: string;
  }>;
  onClose: () => void;
}

export function AchievementPanel({ mode, achievements, onClose }: PanelProps) {
  const unlockedCount = achievements.filter(a => a.isUnlocked).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏆</span>
            <div>
              <div className="font-bold text-gray-900 text-base">成就</div>
              <div className="text-xs text-gray-400">{unlockedCount} / {achievements.length} 已解锁</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm text-gray-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 进度条 */}
        <div className="px-5 py-3 border-b border-gray-50 shrink-0">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
              style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
            />
          </div>
        </div>

        {/* 成就列表 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {achievements
            .sort((a, b) => {
              // 已解锁优先，然后按稀有度
              if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? -1 : 1;
              const order: Record<AchievementRarity, number> = { legendary: 0, epic: 1, rare: 2, common: 3 };
              return order[a.rarity] - order[b.rarity];
            })
            .map((a) => {
              const rarity = RC[a.rarity];
              return (
                <div
                  key={a.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    a.isUnlocked
                      ? `${rarity.bg} ${rarity.border}`
                      : 'bg-gray-50 border-gray-100 opacity-50'
                  }`}
                >
                  <div className={`text-2xl leading-none ${a.isUnlocked ? '' : 'grayscale'}`}>
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className={`text-sm font-bold ${a.isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                        {a.name}
                      </div>
                      {a.isUnlocked && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${rarity.bg} ${rarity.border} ${rarity.text}`}>
                          {rarity.label}
                        </span>
                      )}
                      {!a.isUnlocked && (
                        <span className="text-[10px] text-gray-400">🔒</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 leading-relaxed">{a.description}</div>
                  </div>
                </div>
              );
            })}
        </div>
      </motion.div>
    </motion.div>
  );
}
