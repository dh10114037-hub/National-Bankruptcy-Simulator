/**
 * 影响建模面板（浅色主题）
 */

import { useMemo } from 'react';
import type { StoryEvent } from '../../types/story';
import type { VersusCountry } from '../../types/versus';
import { generateImpactModel, generateDecisionsFromImpact, calculateEffectiveness } from '../../engine/impactModelEngine';

interface ImpactContext {
  turn: number;
  country: VersusCountry;
  market: any;
}

interface Props {
  storyEvent: StoryEvent | null;
  context: ImpactContext;
  expanded?: boolean;
}

export function ImpactModelPanel({ storyEvent, context, expanded = false }: Props) {
  const impactModel = useMemo(() => {
    if (!storyEvent) return null;
    return generateImpactModel(storyEvent, {
      turn: context.turn,
      country: {
        public_support: context.country.public_support,
        credit_rating: context.country.credit_rating,
        inflation: context.country.inflation,
        foreign_reserves: context.country.foreign_reserves,
      },
      market: context.market ? {
        exchange_rate: context.market.exchange_rate,
        bond_price: context.market.bond_price,
        stock_index: context.market.stock_index,
      } : { exchange_rate: 1, bond_price: 1, stock_index: 100 },
    });
  }, [storyEvent, context]);

  const suggestedDecisions = useMemo(() => {
    if (!impactModel) return [];
    const decisions = generateDecisionsFromImpact(impactModel, {
      turn: context.turn,
      country: {
        public_support: context.country.public_support,
        credit_rating: context.country.credit_rating,
        inflation: context.country.inflation,
        foreign_reserves: context.country.foreign_reserves,
      },
      market: context.market ? {
        exchange_rate: context.market.exchange_rate,
        bond_price: context.market.bond_price,
        stock_index: context.market.stock_index,
      } : { exchange_rate: 1, bond_price: 1, stock_index: 100 },
    }, 3);

    return decisions
      .map(d => ({ ...d, score: calculateEffectiveness(d, impactModel) }))
      .sort((a, b) => b.score - a.score);
  }, [impactModel, context]);

  if (!impactModel) return null;

  const urgencyColor =
    impactModel.urgency >= 4 ? 'text-red-600' :
    impactModel.urgency >= 3 ? 'text-orange-600' :
    impactModel.urgency >= 2 ? 'text-amber-600' : 'text-gray-500';

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-4">
      {/* 标题：事件名称 */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-bold text-red-600 flex items-center gap-2">
            🎯 <span>局势影响分析</span>
          </div>
          <div className="text-lg font-bold text-gray-900 mt-1">{impactModel.event}</div>
        </div>
        <div className={`text-xs font-bold ${urgencyColor}`}>
          {'🔴'.repeat(impactModel.urgency)}
          {'⚪'.repeat(5 - impactModel.urgency)}
          <div className="text-center mt-0.5">
            {impactModel.urgency >= 4 ? '危急' :
             impactModel.urgency >= 3 ? '严重' :
             impactModel.urgency >= 2 ? '中等' : '轻微'}
          </div>
        </div>
      </div>

      {/* 核心问题 */}
      <div className="bg-white rounded-lg p-3 border border-red-200">
        <div className="text-xs text-red-500 mb-1">⚠️ 核心问题</div>
        <div className="text-sm text-gray-800 font-medium">
          {impactModel.coreProblem}
        </div>
      </div>

      {/* 影响指标 */}
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(impactModel.impacts).map(([key, value]) => {
          if (value === undefined || value === 0) return null;
          const isNegative = value < 0;
          const label = getImpactLabel(key);

          return (
            <div
              key={key}
              className={`rounded-lg p-2 text-center ${
                isNegative
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-emerald-50 border border-emerald-200'
              }`}
            >
              <div className="text-xs text-gray-500">{label}</div>
              <div className={`text-sm font-bold font-mono ${
                isNegative ? 'text-red-600' : 'text-emerald-600'
              }`}>
                {isNegative ? '' : '+'}{value}
              </div>
            </div>
          );
        })}
      </div>

      {/* 决策建议（展开时显示） */}
      {expanded && suggestedDecisions.length > 0 && (
        <div className="border-t border-red-200 pt-4 space-y-2">
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            💡 <span>基于影响建模的建议</span>
          </div>
          {suggestedDecisions.map((decision, i) => (
            <div
              key={decision.id}
              className={`rounded-lg p-3 text-xs ${
                i === 0
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i === 0 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="font-bold text-gray-900">{decision.name}</div>
                  <div className="text-gray-500 mt-0.5">{decision.explain}</div>
                  <div className="flex items-center gap-3 mt-2 text-[10px]">
                    <span className="text-gray-400">
                      成功率: {Math.round(decision.successRate * 100)}%
                    </span>
                    <span className={`${
                      decision.riskLevel >= 4 ? 'text-red-500' :
                      decision.riskLevel >= 3 ? 'text-orange-500' :
                      decision.riskLevel >= 2 ? 'text-amber-600' : 'text-gray-400'
                    }`}>
                      风险: {'⚠️'.repeat(decision.riskLevel)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 持续时间提示 */}
      <div className="text-xs text-gray-500 text-center pt-2 border-t border-red-100">
        影响持续: {impactModel.duration} 回合
      </div>
    </div>
  );
}

function getImpactLabel(key: string): string {
  const labels: Record<string, string> = {
    public_support: '民心',
    credit_rating: '信用',
    foreign_confidence: '外资',
    inflation: '通胀',
    foreign_reserves: '外储',
    exchange_rate: '汇率',
    bond_market: '债市',
    stock_market: '股市',
  };
  return labels[key] || key;
}

/**
 * 轻量版影响提示（用于非事件阶段）
 */
export function ImpactTip({ crisisLevel: _crisisLevel, country, market }: {
  crisisLevel: number;
  country: VersusCountry;
  market: any;
}) {
  const criticalIssues = useMemo(() => {
    const issues: { name: string; severity: number; icon: string }[] = [];

    if (country.public_support < 30) {
      issues.push({ name: '民心危机', severity: 5 - country.public_support / 6, icon: '😰' });
    }
    if (country.credit_rating < 30) {
      issues.push({ name: '信用危机', severity: 5 - country.credit_rating / 6, icon: '💳' });
    }
    if (country.inflation > 60) {
      issues.push({ name: '通胀失控', severity: Math.min(5, country.inflation / 15), icon: '📈' });
    }
    if (market && market.exchange_rate < 0.7) {
      issues.push({ name: '汇率崩溃', severity: (1 - market.exchange_rate) * 7, icon: '💱' });
    }

    return issues.sort((a, b) => b.severity - a.severity).slice(0, 3);
  }, [country, market]);

  if (criticalIssues.length === 0) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
        ✅ 局势稳定，未检测到重大危机
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
      <div className="text-xs text-amber-700 font-medium mb-2">⚠️ 监测到的危机</div>
      <div className="space-y-1">
        {criticalIssues.map((issue, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span>{issue.icon}</span>
            <span className="text-gray-700">{issue.name}</span>
            <span className="ml-auto text-red-500">
              {'🔴'.repeat(Math.ceil(issue.severity))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
