/**
 * AI 顾问面板 - 拯救者模式（升级版）
 * 新增：明确推荐哪个政策 + 推荐理由
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameState, Policy } from '../types/game';
import { generateRecommendReason } from '../engine/advisorSavior';

interface AdvisorPanelProps {
  gameState: GameState;
  phase?: 'idle' | 'decision' | 'feedback' | 'event_reveal' | 'ai_action' | 'next_prompt';
  lastSpeculatorAction?: string | null;
  currentPolicies?: Policy[];
  recommendedPolicyId?: string | null;
}

interface AdvisorTip {
  summary: string;
  advice: string;
  risk_warning: string;
  explanation: string;
  topic: string;
}

// 金融知识库
const KNOWLEDGE_BASE = [
  {
    topic: 'inflation',
    title: '通货膨胀',
    explain: '当市场上的钱变多了，但商品没变多，东西就会变贵。你的钱在不知不觉中变"薄"了。',
  },
  {
    topic: 'credit',
    title: '国家信用',
    explain: '信用就是别人愿不愿意借钱给你。信用低，意味着没人相信你会还钱，借钱成本暴涨。',
  },
  {
    topic: 'exchange_rate',
    title: '汇率波动',
    explain: '汇率是你的钱在国际上值多少。汇率下跌，进口变贵，外资跑路，国内通胀随之加剧。',
  },
  {
    topic: 'debt',
    title: '债务螺旋',
    explain: '借的钱越来越多，大家开始怀疑你还不起。借钱成本猛涨，形成越借越穷的恶性循环。',
  },
  {
    topic: 'coupling',
    title: '市场联动',
    explain: '汇率跌 → 进口贵 → 通胀升 → 民心降。经济指标像多米诺骨牌，一个倒下会引发连锁反应。',
  },
];

function calcCrisis(state: GameState): number {
  const { foreign_reserves, public_support, credit_rating, market } = state;
  const frRisk = Math.max(0, (50 - foreign_reserves) / 50);
  const psRisk = Math.max(0, (50 - public_support) / 50);
  const crRisk = Math.max(0, (40 - credit_rating) / 40);
  const infRisk = market ? Math.max(0, (market.inflation - 40) / 60) * 0.3 : 0;
  return Math.min(100, Math.round((frRisk * 0.4 + psRisk * 0.3 + crRisk * 0.2 + infRisk) * 100));
}

function generateAdvisorTip(gameState: GameState, turnIndex: number, specAction: string | null | undefined): AdvisorTip {
  const { foreign_reserves, public_support, credit_rating, market } = gameState;
  const crisis = calcCrisis(gameState);
  const knowledge = KNOWLEDGE_BASE[turnIndex % KNOWLEDGE_BASE.length];

  let summary = '';
  let advice = '';
  let risk = '';

  if (crisis >= 70) {
    summary = '⚠️ 国家处于崩溃边缘！';
    if (foreign_reserves <= 20) {
      advice = '外汇储备极度紧张！优先找钱——加税、IMF援助、甚至削减开支。不能再犹豫了。';
      risk = '外储归零 = 国家破产。这是生死线，没有退路。';
    } else if (public_support <= 20) {
      advice = '民心已经崩溃边缘！先稳住社会——发福利、喊口号、转移矛盾，什么都要做。';
      risk = '民心归零 = 政府垮台。内乱比经济危机更难收拾。';
    } else {
      advice = '全面危机！必须做出艰难抉择。不要同时失去所有指标，优先保住一个。';
      risk = '多个指标同时告急，经济崩溃概率极高。';
    }
  } else if (crisis >= 50) {
    summary = '🔴 局势严峻，需要果断行动';
    if (foreign_reserves < 40) {
      advice = '外汇在持续流失。减少不必要的进口，同时考虑紧急融资渠道。';
      risk = '如果外储继续下降，汇率将首当其冲崩溃。';
    }
    if (public_support < 40) {
      advice = (advice ? advice + ' 同时，' : '') + '民心不稳可能引发连锁反应，适当让步是必要的。';
      risk = '社会不稳会让投资者更加恐慌，资金加速外逃。';
    }
    if (credit_rating < 35) {
      advice = (advice ? advice + ' 另外，' : '') + '信用过低导致融资成本飙升，避免继续借债。';
      risk = '信用崩塌后很难恢复，国际融资渠道将彻底关闭。';
    }
  } else if (crisis >= 30) {
    summary = '🟡 危机可控，但不可大意';
    if (market && market.inflation > 50) {
      advice = '通胀在上升！避免继续印钞，这只会让情况更糟。';
      risk = '高通胀会侵蚀购买力，引发新一轮民生危机。';
    }
    if (market && market.volatility > 0.5) {
      advice = (advice ? advice + ' 同时，' : '') + '市场波动剧烈，投机者可能在暗中操作。';
      risk = '高波动环境是做空者的天堂，提高警惕。';
    }
    if (!advice) {
      advice = '各项指标暂时稳定，但要注意保持平衡。任何冒进的政策都可能打破平衡。';
      risk = '经济复苏需要时间，不要因为短期好转就放松警惕。';
    }
  } else {
    summary = '🟢 局势相对稳定';
    if (foreign_reserves > 70 && public_support > 70 && credit_rating > 60) {
      advice = '一切良好！继续保持现有政策，避免过度干预。';
      risk = '但别忘了投机者还在虎视眈眈，危机随时可能卷土重来。';
    } else {
      advice = '危机暂时缓解，但还没到庆祝的时候。趁稳定期修复薄弱环节。';
      risk = '稳定期也是发展期，错过这个窗口，危机再来时会更被动。';
    }
  }

  let specWarning = '';
  if (specAction) {
    specWarning = `📉 投机者动向：${specAction}`;
  }

  return {
    summary,
    advice: advice || '观察局势，等待时机。',
    risk_warning: risk + (specWarning ? '\n' + specWarning : ''),
    explanation: `📘 今日知识：【${knowledge.title}】${knowledge.explain}`,
    topic: knowledge.title,
  };
}

export function AdvisorPanel({
  gameState,
  phase = 'decision',
  lastSpeculatorAction,
  currentPolicies,
  recommendedPolicyId,
}: AdvisorPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [visible, setVisible] = useState(false);

  const tip = useMemo(
    () => generateAdvisorTip(gameState, gameState.turn, lastSpeculatorAction),
    [gameState.foreign_reserves, gameState.public_support, gameState.credit_rating, gameState.turn, lastSpeculatorAction]
  );

  // 推荐政策说明
  const recommendedPolicy = currentPolicies?.find((p) => p.id === recommendedPolicyId);
  const recommendReason = useMemo(
    () => generateRecommendReason(gameState, recommendedPolicy),
    [gameState.foreign_reserves, gameState.public_support, gameState.credit_rating, recommendedPolicyId]
  );

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, [gameState.turn]);

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 overflow-hidden">
      {/* 顶部栏 */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5 cursor-pointer hover:bg-emerald-100/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🧠</span>
          <div>
            <div className="text-xs font-bold text-emerald-700">AI 经济顾问</div>
            <div className="text-[10px] text-gray-400">冷静 · 现实 · 不保证正确</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {phase === 'feedback' && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[10px] text-amber-600"
            >
              分析中...
            </motion.span>
          )}
          <button className="text-gray-400 hover:text-gray-600 text-xs transition-colors">
            {expanded ? '收起 ▲' : '展开 ▼'}
          </button>
        </div>
      </div>

      {/* 内容 */}
      <AnimatePresence mode="wait">
        {expanded && (
          <motion.div
            key="content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3.5 pb-3.5 space-y-3 border-t border-emerald-200/60"
          >
            {/* 局势总结 */}
            <motion.div
              className="pt-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
              transition={{ delay: 0.1 }}
            >
              <div className="text-[10px] text-gray-400 mb-1">📌 局势判断</div>
              <div className="text-sm text-gray-800 leading-relaxed font-medium">{tip.summary}</div>
            </motion.div>

            {/* 推荐政策（新增，高亮显示） */}
            {recommendedPolicy && (
              <motion.div
                className="rounded-lg p-3 bg-indigo-50 border border-indigo-200"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
                transition={{ delay: 0.15 }}
              >
                <div className="text-[10px] font-bold text-indigo-700 mb-1.5">🎯 推荐决策</div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">{recommendedPolicy.icon}</span>
                  <span className="text-sm font-bold text-indigo-800">{recommendedPolicy.name}</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-600 border border-indigo-200 px-1.5 py-0.5 rounded-full font-bold ml-auto">
                    推荐
                  </span>
                </div>
                <div className="text-xs text-indigo-700 leading-relaxed">{recommendReason}</div>
              </motion.div>
            )}

            {/* 建议 */}
            <motion.div
              className="rounded-lg p-2.5 bg-emerald-100/70 border border-emerald-200"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-[10px] font-bold text-emerald-700 mb-1">💡 策略建议</div>
              <div className="text-xs text-gray-700 leading-relaxed">{tip.advice}</div>
            </motion.div>

            {/* 风险警告 */}
            {tip.risk_warning && (
              <motion.div
                className="rounded-lg p-2.5 bg-red-50 border border-red-200"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
                transition={{ delay: 0.3 }}
              >
                <div className="text-[10px] font-bold text-red-600 mb-1">⚠ 风险提示</div>
                <div className="text-xs text-red-700 leading-relaxed whitespace-pre-line">{tip.risk_warning}</div>
              </motion.div>
            )}

            {/* 金融知识 */}
            <motion.div
              className="rounded-lg p-2.5 bg-blue-50 border border-blue-200"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-xs text-blue-700 leading-relaxed">{tip.explanation}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
