// ═══════════════════════════════════════════
// 剧情事件面板（浅色主题）
// ═══════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StoryEvent, StoryChoice } from '../../types/story';

interface Props {
  event: StoryEvent;
  onChoice: (choice: StoryChoice) => void;
}

// 主题颜色映射（浅色）
const THEME_COLORS = {
  red: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    hover: 'hover:bg-red-100',
    text: 'text-red-700',
    accent: 'bg-red-600',
    tag_pos: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    tag_neg: 'bg-red-50 text-red-700 border border-red-200',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    hover: 'hover:bg-blue-100',
    text: 'text-blue-700',
    accent: 'bg-blue-600',
    tag_pos: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    tag_neg: 'bg-red-50 text-red-700 border border-red-200',
  },
  yellow: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    hover: 'hover:bg-amber-100',
    text: 'text-amber-700',
    accent: 'bg-amber-600',
    tag_pos: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    tag_neg: 'bg-red-50 text-red-700 border border-red-200',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    hover: 'hover:bg-purple-100',
    text: 'text-purple-700',
    accent: 'bg-purple-600',
    tag_pos: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    tag_neg: 'bg-red-50 text-red-700 border border-red-200',
  },
};

// 效果显示映射
function formatEffect(choice: StoryChoice): { label: string; value: string; positive: boolean }[] {
  const effects: { label: string; value: string; positive: boolean }[] = [];
  const e = choice.effects;

  if (e.public_support !== undefined) {
    effects.push({ label: '民心', value: `${e.public_support > 0 ? '+' : ''}${e.public_support}`, positive: e.public_support > 0 });
  }
  if (e.credit_rating !== undefined) {
    effects.push({ label: '信用', value: `${e.credit_rating > 0 ? '+' : ''}${e.credit_rating}`, positive: e.credit_rating > 0 });
  }
  if (e.inflation !== undefined) {
    effects.push({ label: '通胀', value: `${e.inflation > 0 ? '+' : ''}${e.inflation}`, positive: e.inflation < 0 });
  }
  if (e.foreign_reserves !== undefined) {
    effects.push({ label: '外储', value: `${e.foreign_reserves > 0 ? '+' : ''}${e.foreign_reserves}`, positive: e.foreign_reserves > 0 });
  }
  if (e.exchange_rate !== undefined) {
    effects.push({ label: '汇率', value: `${e.exchange_rate > 0 ? '+' : ''}${(e.exchange_rate * 100).toFixed(0)}%`, positive: e.exchange_rate > 0 });
  }

  return effects;
}

export function StoryEventPanel({ event, onChoice }: Props) {
  const [showChoices, setShowChoices] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<StoryChoice | null>(null);
  const [result, setResult] = useState<{ success: boolean; effects: { label: string; value: string; positive: boolean }[] } | null>(null);

  // 重置状态
  useEffect(() => {
    setShowChoices(false);
    setSelectedChoice(null);
    setResult(null);
  }, [event.id]);

  // 延迟显示选项
  useEffect(() => {
    const timer = setTimeout(() => setShowChoices(true), 800);
    return () => clearTimeout(timer);
  }, [event.id]);

  const handleChoice = (choice: StoryChoice) => {
    setSelectedChoice(choice);
    const successRate = choice.successRate ?? 1.0;
    const isSuccess = Math.random() < successRate;
    setResult({
      success: isSuccess,
      effects: formatEffect(choice),
    });

    setTimeout(() => {
      onChoice(choice);
    }, 2000);
  };

  const colors = THEME_COLORS[event.choices[0]?.theme ?? 'blue'];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-lg">
        {/* 事件卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className={`rounded-2xl border ${colors.border} bg-white overflow-hidden shadow-xl`}
        >
          {/* 标题栏 */}
          <div className={`px-6 py-4 ${colors.accent} text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs opacity-80 uppercase tracking-wider">{event.subtitle}</div>
                <div className="text-xl font-bold">{event.name}</div>
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
            </div>
          </div>

          {/* 描述 */}
          <div className="px-6 py-5">
            <p className="text-gray-700 leading-relaxed">{event.description}</p>
          </div>

          {/* 选择结果 */}
          <AnimatePresence>
            {selectedChoice && result && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="px-6 pb-5"
              >
                <div className={`p-4 rounded-xl border ${
                  result.success
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className={`text-lg font-bold mb-3 ${result.success ? 'text-emerald-700' : 'text-red-700'}`}>
                    {result.success ? '✓ 选择成功！' : '✗ 选择失败...'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.effects.map((eff, i) => (
                      <span
                        key={i}
                        className={`px-3 py-1 rounded-full text-sm font-mono ${
                          eff.positive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {eff.label}: {eff.value}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 选择选项 */}
          <AnimatePresence>
            {showChoices && !selectedChoice && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-6 pb-6 space-y-3"
              >
                {event.choices.map((choice, index) => {
                  const choiceColors = THEME_COLORS[choice.theme ?? 'blue'];
                  const effects = formatEffect(choice);

                  return (
                    <motion.button
                      key={choice.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleChoice(choice)}
                      className={`w-full p-4 rounded-xl border ${choiceColors.border} ${choiceColors.bg} ${choiceColors.hover} transition-all text-left group`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 mb-2 group-hover:text-amber-700 transition-colors">
                            {choice.text}
                          </div>
                          {effects.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {effects.map((eff, i) => (
                                <span
                                  key={i}
                                  className={`text-xs px-2 py-0.5 rounded ${
                                    eff.positive ? choiceColors.tag_pos : choiceColors.tag_neg
                                  }`}
                                >
                                  {eff.label}: {eff.value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="ml-3 text-right">
                          <div className={`text-xs ${choiceColors.text}`}>
                            {((choice.successRate ?? 1) * 100).toFixed(0)}%成功率
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 剧情进度指示 */}
        <div className="mt-4 flex justify-center gap-1.5">
          {Array.from({ length: event.duration }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className={`w-2 h-2 rounded-full ${
                i === 0 ? 'bg-gray-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
