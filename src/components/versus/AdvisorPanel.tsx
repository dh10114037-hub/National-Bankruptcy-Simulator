/**
 * AI 顾问面板组件
 * 展示：局势总结 + 建议 + 风险警告 + 金融知识点
 * 两种角色风格：拯救者（蓝/绿）vs 投机者（黄/红）
 */

import { useState, useEffect } from 'react';
import type { AdvisorTip } from '../../types/versus';

// ────────────────────────────────────────────────────────────────
// 教程系统本地存储键
// ────────────────────────────────────────────────────────────────
const TUTORIAL_KEY = 'nation_collapse_tutorial_done';

export function isTutorialCompleted(role: 'savior' | 'speculator' | 'versus'): boolean {
  try {
    const done = localStorage.getItem(TUTORIAL_KEY);
    if (!done) return false;
    const parsed = JSON.parse(done) as Record<string, boolean>;
    return parsed[role] === true;
  } catch {
    return false;
  }
}

export function markTutorialCompleted(role: 'savior' | 'speculator' | 'versus'): void {
  try {
    const done = localStorage.getItem(TUTORIAL_KEY);
    const parsed = (done ? JSON.parse(done) : {}) as Record<string, boolean>;
    parsed[role] = true;
    localStorage.setItem(TUTORIAL_KEY, JSON.stringify(parsed));
  } catch {
    // 忽略localStorage错误
  }
}

interface Props {
  tip:   AdvisorTip | null;
  role:  'savior' | 'speculator';
  isLoading?: boolean;
}

export function AdvisorPanel({ tip, role, isLoading }: Props) {
  const [expanded, setExpanded] = useState(true);

  const isSavior = role === 'savior';

  const headerColor = isSavior
    ? 'text-emerald-700 border-emerald-200 bg-emerald-50'
    : 'text-amber-700 border-amber-200 bg-amber-50';

  const icon    = isSavior ? '🧠' : '💀';
  const title   = isSavior ? 'AI 经济顾问' : '资本猎手顾问';
  const tagline = isSavior ? '冷静 · 现实 · 不保证正确' : '冷血 · 逐利 · 只谈钱';

  if (!tip && !isLoading) return null;

  return (
    <div className={`rounded-xl border ${headerColor} overflow-hidden`}>
      {/* 顶部栏 */}
      <div
        className={`flex items-center justify-between px-3.5 py-2.5 cursor-pointer`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <div>
            <div className={`text-xs font-bold ${isSavior ? 'text-emerald-700' : 'text-amber-700'}`}>
              {title}
            </div>
            <div className="text-xs text-gray-400">{tagline}</div>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 text-xs transition-colors">
          {expanded ? '收起 ▲' : '展开 ▼'}
        </button>
      </div>

      {/* 内容 */}
      {expanded && (
        <div className="px-3.5 pb-3.5 space-y-3 border-t border-gray-200">
          {isLoading ? (
            <div className="py-4 text-center text-xs text-gray-400 animate-pulse">
              正在分析局势...
            </div>
          ) : tip ? (
            <>
              {/* 局势总结 */}
              <div className="pt-3">
                <div className="text-xs text-gray-500 mb-1">📌 局势判断</div>
                <div className="text-sm text-gray-800 leading-relaxed">{tip.summary}</div>
              </div>

              {/* 建议 */}
              <div className={`rounded-lg p-2.5 ${
                isSavior ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'
              }`}>
                <div className={`text-xs font-bold mb-1 ${isSavior ? 'text-emerald-700' : 'text-amber-700'}`}>
                  💡 建议
                </div>
                <div className="text-xs text-gray-700 leading-relaxed">{tip.advice}</div>
              </div>

              {/* 风险警告 */}
              {tip.risk_warning && (
                <div className="rounded-lg p-2.5 bg-red-50 border border-red-200">
                  <div className="text-xs font-bold text-red-600 mb-1">⚠ 风险警告</div>
                  <div className="text-xs text-red-700 leading-relaxed">{tip.risk_warning}</div>
                </div>
              )}

              {/* 金融知识点 */}
              <div className="rounded-lg p-2.5 bg-blue-50 border border-blue-200">
                <div className="text-xs text-gray-700 leading-relaxed">{tip.explanation}</div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// 新手引导浮层（游戏开始时展示）
// ────────────────────────────────────────────────────────────────
interface TutorialProps {
  role:      'savior' | 'speculator' | 'versus';
  onClose:   () => void;
}

export function TutorialOverlay({ role, onClose }: TutorialProps) {
  const [step, setStep] = useState(0);

  // 检查是否已完成过教程，若是则直接关闭
  useEffect(() => {
    if (isTutorialCompleted(role)) {
      onClose();
    }
  }, [role, onClose]);

  // ESC键关闭支持（低优先级问题1.2.2）
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const STEPS_SAVIOR = [
    {
      title:   '你是国家的最后防线',
      content: '外汇储备归零 → 破产。民众支持归零 → 政府垮台。你需要让两项都不归零，撑过30个月。',
      icon:    '🏛',
    },
    {
      title:   '每个政策都有代价',
      content: '没有"无脑最优解"。加税补外储，但民心掉。印钞看起来最快，但信用会崩、通胀失控。',
      icon:    '⚖️',
    },
    {
      title:   '对手在背后捅刀',
      content: '投机者会趁你弱的时候做空货币、散布谣言。越危险，攻击越猛烈。',
      icon:    '🦅',
    },
    {
      title:   'AI 顾问帮你分析',
      content: '每回合有顾问给出建议，但不保证正确。多玩几局，你会自然理解金融逻辑。',
      icon:    '🧠',
    },
  ];

  const STEPS_SPECULATOR = [
    {
      title:   '你的目标：收割国家',
      content: '把 $100万本金扩大到 $300万。做空货币、散布谣言、全面攻击——只要能赚钱。',
      icon:    '💰',
    },
    {
      title:   '信息就是武器',
      content: '购买情报能提前知道政府行动。情报有真有假，可信度有偏差，需要你自己判断。',
      icon:    '🔍',
    },
    {
      title:   '杠杆是双刃剑',
      content: '5倍杠杆能快速翻身，也能让你爆仓破产。资金管理是关键。',
      icon:    '📈',
    },
    {
      title:   '攻击时机很重要',
      content: '当外储 < 30、信用 < 35 时，攻击效果最佳。过早出手可能被政府反制。',
      icon:    '⚡',
    },
  ];

  const STEPS_VERSUS = [
    {
      title:   '双人对抗模式',
      content: '拯救者 vs 投机者，5个阶段轮流行动。情报 → 投机行动 → 政府决策 → 市场结算 → 反馈。',
      icon:    '⚔️',
    },
    {
      title:   '回合流程',
      content: '投机者先行：查看情报，加入行动队列。然后拯救者选政策。系统统一结算，展示双方结果。',
      icon:    '🔄',
    },
    {
      title:   '胜负条件',
      content: '拯救者：国家撑过30月，三项指标均 > 60。投机者：资产达到3倍，或让国家破产。',
      icon:    '🏆',
    },
  ];

  const steps = role === 'savior' ? STEPS_SAVIOR : role === 'speculator' ? STEPS_SPECULATOR : STEPS_VERSUS;

  // 安全检查
  if (step >= steps.length) return null;

  const current = steps[step];
  const isLast  = step >= steps.length - 1;

  const handleFinish = () => {
    markTutorialCompleted(role);
    onClose();
  };

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
      <div className="max-w-md w-full mx-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
        {/* 步骤指示 */}
        <div className="flex gap-1.5 mb-5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i <= step
                  ? role === 'speculator' ? 'bg-amber-500'
                  : role === 'savior'    ? 'bg-blue-600'
                  : 'bg-purple-500'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* 内容 */}
        <div className="text-5xl text-center mb-4">{current.icon}</div>
        <div className="text-xl font-black text-gray-900 text-center mb-3">{current.title}</div>
        <div className="text-sm text-gray-600 leading-relaxed text-center mb-6">{current.content}</div>

        {/* 按钮 */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:text-gray-800 transition-all"
            >
              上一步
            </button>
          )}
          <button
            onClick={handleNext}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
              role === 'speculator'
                ? 'bg-amber-500 hover:bg-amber-400 text-white'
                : role === 'savior'
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            {isLast ? '开始游戏 →' : '下一步 →'}
          </button>
        </div>

        {/* 跳过 */}
        {!isLast && (
          <button
            onClick={handleFinish}
            className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-3 transition-colors"
          >
            跳过引导（下次不再显示）
          </button>
        )}
      </div>
    </div>
  );
}
