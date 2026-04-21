/**
 * 失败复盘页面
 * 在游戏结束（失败/超时）时展示完整复盘分析
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PostMortem } from '../types/game';

interface PostMortemScreenProps {
  postMortem: PostMortem;
  turn: number;
  onRestart: () => void;
}

type Tab = 'summary' | 'timeline' | 'mistakes' | 'advice';

const TAB_LIST: { id: Tab; label: string; icon: string }[] = [
  { id: 'summary',  label: '失败总结', icon: '💀' },
  { id: 'timeline', label: '崩溃路径', icon: '🗺️' },
  { id: 'mistakes', label: '错误分析', icon: '❌' },
  { id: 'advice',   label: '改进建议', icon: '📖' },
];

// ── 评分环 ────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 60 ? '#10b981' : score >= 35 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <motion.circle
          cx="48" cy="48" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums" style={{ color }}>{score}</span>
        <span className="text-[9px] text-gray-400">执政评分</span>
      </div>
    </div>
  );
}

// ── Tab: 失败总结 ─────────────────────────────────────────────
function SummaryTab({ postMortem }: { postMortem: PostMortem }) {
  return (
    <div className="space-y-4">
      {/* 主因 */}
      <div className="rounded-xl bg-red-50 border border-red-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{postMortem.primaryCause.icon}</span>
          <span className="font-bold text-red-700 text-sm">核心失败原因</span>
        </div>
        <p className="text-red-800 font-semibold text-sm mb-1">{postMortem.primaryCause.label}</p>
        <p className="text-red-600 text-xs leading-relaxed">{postMortem.primaryCause.description}</p>
      </div>

      {/* 次因 */}
      {postMortem.secondaryCauses.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-semibold tracking-wide">辅助因素</p>
          {postMortem.secondaryCauses.map((c, i) => (
            <motion.div
              key={i}
              className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              <span className="text-base mt-0.5">{c.icon}</span>
              <div>
                <p className="text-amber-800 font-semibold text-xs">{c.label}</p>
                <p className="text-amber-600 text-xs mt-0.5 leading-relaxed">{c.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* 玩家风格 */}
      <div className="rounded-xl bg-purple-50 border border-purple-200 p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{postMortem.playerStyle.icon}</span>
          <span className="text-purple-700 font-bold text-sm">你的决策风格</span>
          <span className="ml-auto text-purple-600 font-bold text-sm bg-purple-100 px-2 py-0.5 rounded-full">
            {postMortem.playerStyle.label}
          </span>
        </div>
        <p className="text-purple-600 text-xs leading-relaxed mt-1">{postMortem.playerStyle.description}</p>
      </div>
    </div>
  );
}

// ── Tab: 崩溃路径 ─────────────────────────────────────────────
function TimelineTab({ postMortem }: { postMortem: PostMortem }) {
  const typeColors: Record<string, string> = {
    decision:   'bg-blue-100 border-blue-300 text-blue-700',
    crisis:     'bg-red-100 border-red-300 text-red-700',
    speculator: 'bg-orange-100 border-orange-300 text-orange-700',
    delayed:    'bg-purple-100 border-purple-300 text-purple-700',
    game_over:  'bg-gray-800 border-gray-700 text-white',
  };
  const lineColors: Record<string, string> = {
    decision:   'bg-blue-300',
    crisis:     'bg-red-400',
    speculator: 'bg-orange-400',
    delayed:    'bg-purple-400',
    game_over:  'bg-gray-600',
  };

  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-400 mb-3">关键节点按时间排列，帮助你理解危机如何一步步恶化。</p>
      {postMortem.timeline.map((ev, i) => (
        <motion.div
          key={i}
          className="flex gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          {/* 竖线 */}
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs flex-shrink-0 ${typeColors[ev.type]}`}>
              {ev.icon}
            </div>
            {i < postMortem.timeline.length - 1 && (
              <div className={`w-0.5 flex-1 min-h-[16px] mt-1 ${lineColors[ev.type]}`} />
            )}
          </div>
          {/* 内容 */}
          <div className="pb-3 flex-1">
            <p className="text-gray-800 font-semibold text-xs leading-snug">{ev.label}</p>
            <p className="text-gray-500 text-[11px] mt-0.5 leading-relaxed">{ev.detail}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Tab: 错误分析 ─────────────────────────────────────────────
function MistakesTab({ postMortem }: { postMortem: PostMortem }) {
  if (postMortem.criticalMistakes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400 space-y-2">
        <span className="text-4xl">🎯</span>
        <p className="text-sm">没有发现明显的关键错误决策</p>
        <p className="text-xs">失败可能是由指标长期积累导致</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">以下是本局中对游戏结果影响最大的错误操作：</p>
      {postMortem.criticalMistakes.map((m, i) => (
        <motion.div
          key={i}
          className="rounded-xl border border-red-200 bg-red-50 p-4"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">{m.icon}</span>
            <span className="text-red-700 font-bold text-xs">第 {m.turn} 月</span>
            <span className="text-red-800 font-semibold text-xs">→ {m.policy}</span>
          </div>
          <p className="text-red-600 text-xs leading-relaxed">{m.reason}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ── Tab: 改进建议 ─────────────────────────────────────────────
function AdviceTab({ postMortem }: { postMortem: PostMortem }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">基于你本局的行为模式，以下是针对性的改进策略：</p>
      {postMortem.suggestions.map((s, i) => (
        <motion.div
          key={i}
          className="rounded-xl bg-emerald-50 border border-emerald-200 p-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.12 }}
        >
          <div className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold text-sm flex-shrink-0">#{i + 1}</span>
            <p className="text-emerald-800 text-xs leading-relaxed">{s}</p>
          </div>
        </motion.div>
      ))}

      {/* 鼓励 */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 mt-2">
        <p className="text-blue-700 text-xs leading-relaxed text-center">
          💡 每次失败都是理解政策联动的机会。下一局试试将评分提升 20 分！
        </p>
      </div>
    </div>
  );
}

// ── 主组件 ────────────────────────────────────────────────────
export function PostMortemScreen({ postMortem, turn, onRestart }: PostMortemScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>('summary');

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        {/* 头部 */}
        <div className="bg-gradient-to-r from-gray-900 to-red-900 px-5 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">国家破产复盘</h2>
              <p className="text-gray-300 text-xs mt-0.5">第 {turn} 月告终 · 逐步分析失败原因</p>
            </div>
            <ScoreRing score={postMortem.score} />
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="flex border-b border-gray-100 bg-gray-50">
          {TAB_LIST.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-[11px] font-semibold transition-all ${
                activeTab === tab.id
                  ? 'text-red-600 border-b-2 border-red-500 bg-white'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="block">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab 内容 */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'summary'  && <SummaryTab  postMortem={postMortem} />}
              {activeTab === 'timeline' && <TimelineTab postMortem={postMortem} />}
              {activeTab === 'mistakes' && <MistakesTab postMortem={postMortem} />}
              {activeTab === 'advice'   && <AdviceTab   postMortem={postMortem} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <motion.button
            onClick={onRestart}
            className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all active:scale-95 hover:shadow-[0_0_24px_rgba(239,68,68,0.4)]"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            💪 带着经验重新执政
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
