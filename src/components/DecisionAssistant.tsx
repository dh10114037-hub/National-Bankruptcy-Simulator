/**
 * P1-2: 决策辅助面板
 * 提供智能决策建议、威胁分析和市场预测
 */

import { motion } from 'framer-motion';
import type { GameState, Policy, MarketState } from '../types/game';
import { analyzeRiskSources, generateRecommendReason } from '../engine/advisorSavior';
import type { DifficultyState } from '../engine/gameEngine';

// ─── 威胁分析组件 ────────────────────────────────────────────────

interface ThreatAnalysisProps {
  state: GameState;
}

export function ThreatAnalysis({ state }: ThreatAnalysisProps) {
  const risks = analyzeRiskSources(state);
  const biggestThreat = risks[0];
  const secondaryThreat = risks[1];

  const levelColors = {
    critical: 'text-red-600 bg-red-50 border-red-200',
    warning: 'text-amber-600 bg-amber-50 border-amber-200',
    ok: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  };

  const levelIcons = {
    critical: '🚨',
    warning: '⚠️',
    ok: '✅',
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        🎯 威胁分析
      </div>

      {/* 最大威胁 */}
      {biggestThreat && biggestThreat.level !== 'ok' && (
        <div className={`p-2.5 rounded-lg border ${levelColors[biggestThreat.level]}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <span>{levelIcons[biggestThreat.level]}</span>
            <span className="font-bold text-xs">
              最大威胁: {biggestThreat.label}
            </span>
            <span className="font-mono font-bold ml-auto">{biggestThreat.value}</span>
          </div>
          <div className="text-[11px] opacity-80 leading-snug">
            {biggestThreat.description}
          </div>
        </div>
      )}

      {/* 次要威胁 */}
      {secondaryThreat && secondaryThreat.level === 'critical' && (
        <div className={`p-2 rounded-lg border ${levelColors[secondaryThreat.level]} opacity-80`}>
          <div className="flex items-center gap-1.5">
            <span>{levelIcons[secondaryThreat.level]}</span>
            <span className="font-semibold text-xs">
              次要威胁: {secondaryThreat.label}
            </span>
            <span className="font-mono font-bold ml-auto">{secondaryThreat.value}</span>
          </div>
        </div>
      )}

      {/* 状态良好提示 */}
      {risks.every(r => r.level === 'ok') && (
        <div className="p-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs">
          ✅ 各项指标稳定，暂无明显威胁
        </div>
      )}
    </div>
  );
}

// ─── 市场预测组件 ────────────────────────────────────────────────

interface MarketPredictionProps {
  market: MarketState;
  crisisLevel: number;
}

export function MarketPrediction({ market, crisisLevel }: MarketPredictionProps) {
  // 预测汇率趋势
  const getCurrencyTrend = () => {
    if (market.exchange_rate < 0.7) return { icon: '📉', text: '汇率下行', color: 'text-red-600' };
    if (market.exchange_rate < 0.9) return { icon: '↘️', text: '汇率承压', color: 'text-amber-600' };
    if (market.exchange_rate > 1.1) return { icon: '📈', text: '汇率走强', color: 'text-emerald-600' };
    return { icon: '➡️', text: '汇率稳定', color: 'text-gray-600' };
  };

  // 预测通胀趋势
  const getInflationTrend = () => {
    if (market.inflation > 60) return { icon: '🔥', text: '通胀失控', color: 'text-red-600' };
    if (market.inflation > 40) return { icon: '↗️', text: '通胀偏高', color: 'text-amber-600' };
    return { icon: '➡️', text: '通胀可控', color: 'text-emerald-600' };
  };

  // 波动率预测
  const getVolatilityOutlook = () => {
    if (market.volatility > 0.7) return { icon: '🌀', text: '市场动荡', color: 'text-red-600' };
    if (market.volatility > 0.5) return { icon: '〰️', text: '波动加剧', color: 'text-amber-600' };
    return { icon: '➡️', text: '相对平稳', color: 'text-emerald-600' };
  };

  // 投机者攻击预警
  const getAttackWarning = () => {
    if (crisisLevel > 60) return { icon: '⚠️', text: '投机者蠢蠢欲动', color: 'text-red-600 bg-red-50' };
    if (crisisLevel > 40) return { icon: '👀', text: '投机者在观望', color: 'text-amber-600 bg-amber-50' };
    return { icon: '😴', text: '投机者观望中', color: 'text-gray-600 bg-gray-50' };
  };

  const currency = getCurrencyTrend();
  const inflation = getInflationTrend();
  const volatility = getVolatilityOutlook();
  const attack = getAttackWarning();

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        📊 市场预测
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <div className={`p-2 rounded-lg border border-gray-200 ${currency.color}`}>
          <div className="text-sm">{currency.icon}</div>
          <div className="text-[11px] font-medium">{currency.text}</div>
          <div className="text-[10px] opacity-70">{(market.exchange_rate * 100).toFixed(0)}</div>
        </div>

        <div className={`p-2 rounded-lg border border-gray-200 ${inflation.color}`}>
          <div className="text-sm">{inflation.icon}</div>
          <div className="text-[11px] font-medium">{inflation.text}</div>
          <div className="text-[10px] opacity-70">{market.inflation.toFixed(0)}%</div>
        </div>

        <div className={`p-2 rounded-lg border border-gray-200 ${volatility.color}`}>
          <div className="text-sm">{volatility.icon}</div>
          <div className="text-[11px] font-medium">{volatility.text}</div>
          <div className="text-[10px] opacity-70">{(market.volatility * 100).toFixed(0)}%</div>
        </div>

        <div className={`p-2 rounded-lg border ${attack.color}`}>
          <div className="text-sm">{attack.icon}</div>
          <div className="text-[11px] font-medium">{attack.text}</div>
          <div className="text-[10px] opacity-70">危机 {crisisLevel}%</div>
        </div>
      </div>
    </div>
  );
}

// ─── 政策效果预测组件 ────────────────────────────────────────────

interface PolicyPredictionProps {
  policy: Policy;
  state: GameState;
}

export function PolicyPrediction({ policy, state }: PolicyPredictionProps) {
  const effects = policy.effects;
  const names: Record<string, string> = {
    foreign_reserves: '外储',
    public_support: '民心',
    credit_rating: '信用',
    exchange_rate: '汇率',
    inflation: '通胀',
  };

  const effectEntries = Object.entries(effects).filter(([_, v]) => typeof v === 'number' && v !== 0);

  // 计算即时效果
  const getImmediateEffects = () => {
    return effectEntries.map(([key, value]) => {
      const num = value as number;
      const sign = num > 0 ? '+' : '';
      const isPositive = key === 'foreign_reserves' || key === 'public_support' || key === 'credit_rating'
        ? num > 0
        : num < 0; // 汇率/通胀：下降为正

      return {
        label: names[key] ?? key,
        value: sign + num.toString(),
        positive: isPositive,
      };
    });
  };

  // 预测副作用
  const getSideEffects = () => {
    const sides: { label: string; severity: 'high' | 'medium' | 'low' }[] = [];

    // 印钞副作用
    if (policy.id === 'print_money') {
      sides.push({ label: '通胀上升风险', severity: 'high' });
      sides.push({ label: '汇率下行压力', severity: 'medium' });
    }

    // 削减福利副作用
    if (policy.id === 'cut_welfare') {
      sides.push({ label: '民心大幅下降', severity: 'high' });
    }

    // 加息副作用
    if (policy.id === 'raise_interest') {
      sides.push({ label: '经济活动放缓', severity: 'low' });
    }

    // 资本管制副作用
    if (policy.id === 'capital_control') {
      sides.push({ label: '外资信心下降', severity: 'medium' });
    }

    // IMF援助副作用
    if (policy.id === 'imf_bailout') {
      sides.push({ label: '主权条件限制', severity: 'medium' });
    }

    return sides;
  };

  // 置信度评估
  const getConfidence = () => {
    // 基于政策类型和数据完整性评估置信度
    if (['stabilize', 'imf_bailout'].includes(policy.id)) return 90;
    if (['print_money', 'cut_welfare'].includes(policy.id)) return 75;
    return 85;
  };

  const immediateEffects = getImmediateEffects();
  const sideEffects = getSideEffects();
  const confidence = getConfidence();

  return (
    <div className="p-2.5 rounded-lg border border-blue-200 bg-blue-50/50 space-y-2">
      <div className="text-xs font-semibold text-blue-700">
        📋 {policy.name} 效果预测
      </div>

      {/* 即时效果 */}
      <div className="flex flex-wrap gap-1">
        {immediateEffects.map((effect, i) => (
          <span
            key={i}
            className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
              effect.positive
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-red-600 bg-red-50 border-red-200'
            }`}
          >
            {effect.label} {effect.value}
          </span>
        ))}
      </div>

      {/* 副作用 */}
      {sideEffects.length > 0 && (
        <div className="space-y-0.5">
          <div className="text-[10px] text-amber-600 font-semibold">⚠️ 可能副作用:</div>
          {sideEffects.map((side, i) => (
            <div
              key={i}
              className={`text-[10px] ${
                side.severity === 'high'
                  ? 'text-red-600'
                  : side.severity === 'medium'
                  ? 'text-amber-600'
                  : 'text-gray-600'
              }`}
            >
              · {side.label}
            </div>
          ))}
        </div>
      )}

      {/* 置信度 */}
      <div className="text-[10px] text-gray-500">
        预测置信度: {confidence}%
      </div>
    </div>
  );
}

// ─── 决策建议组件 ────────────────────────────────────────────────

interface DecisionSuggestionProps {
  state: GameState;
  policies: Policy[];
  recommendedPolicyId: string | null;
  difficultyState: DifficultyState;
}

export function DecisionSuggestion({
  state,
  policies,
  recommendedPolicyId,
  difficultyState,
}: DecisionSuggestionProps) {
  const recommendedPolicy = policies.find(p => p.id === recommendedPolicyId);
  const reason = generateRecommendReason(state, recommendedPolicy);

  const phaseColors = {
    early: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    growth: 'bg-blue-50 border-blue-200 text-blue-700',
    crisis: 'bg-amber-50 border-amber-200 text-amber-700',
    final: 'bg-orange-50 border-orange-200 text-orange-700',
    desperate: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        💡 决策建议
      </div>

      {/* 推荐政策 */}
      {recommendedPolicy && (
        <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-lg">{recommendedPolicy.icon}</span>
            <div className="flex-1">
              <div className="text-xs font-bold text-emerald-800">
                🧠 顾问推荐: {recommendedPolicy.name}
              </div>
            </div>
          </div>
          <div className="text-[11px] text-emerald-700 leading-snug">
            {reason}
          </div>
        </div>
      )}

      {/* 难度阶段提示 */}
      <div className={`p-2 rounded-lg border ${phaseColors[difficultyState.phase]}`}>
        <div className="text-[11px] font-medium">
          {difficultyState.description}
        </div>
      </div>

      {/* 通用提示 */}
      {policies.length > 0 && !recommendedPolicy && (
        <div className="p-2 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-600">
          当前局势复杂，请综合各项指标谨慎决策。
        </div>
      )}
    </div>
  );
}

// ─── 完整决策辅助面板 ────────────────────────────────────────────

interface DecisionAssistantPanelProps {
  state: GameState;
  policies: Policy[];
  recommendedPolicyId: string | null;
  crisisLevel: number;
  difficultyState: DifficultyState;
  selectedPolicy?: Policy | null;
}

export function DecisionAssistantPanel({
  state,
  policies,
  recommendedPolicyId,
  crisisLevel,
  difficultyState,
  selectedPolicy,
}: DecisionAssistantPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="border-b border-gray-200 bg-gray-50/50 overflow-hidden"
    >
      {/* 折叠头 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between text-xs hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-blue-500">🎯</span>
          <span className="font-semibold text-gray-700">决策助手</span>
        </div>
        <div className="flex items-center gap-2">
          {recommendedPolicyId && (
            <span className="text-emerald-600 text-[10px]">已推荐政策</span>
          )}
          <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </button>

      {/* 展开内容 */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 pb-4 space-y-3"
        >
          {/* 威胁分析 */}
          <ThreatAnalysis state={state} />

          {/* 市场预测 */}
          {state.market && (
            <MarketPrediction market={state.market} crisisLevel={crisisLevel} />
          )}

          {/* 决策建议 */}
          <DecisionSuggestion
            state={state}
            policies={policies}
            recommendedPolicyId={recommendedPolicyId}
            difficultyState={difficultyState}
          />

          {/* 选中政策预测 */}
          {selectedPolicy && (
            <PolicyPrediction policy={selectedPolicy} state={state} />
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// 导入 useState
import { useState } from 'react';
