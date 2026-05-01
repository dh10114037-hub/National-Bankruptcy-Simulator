/**
 * SpecStrategyPanel - P1-3: 策略分析面板
 * 展示风险评分、策略类型和大机会事件
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { RiskScore, StrategyType, MegaOpportunity } from '../../types/speculator';

interface SpecStrategyPanelProps {
  riskScore: RiskScore;
  strategyType: StrategyType;
  activeOpportunity: MegaOpportunity | null;
  opportunityRemainingTurns: number;
}

// 策略类型配置
const STRATEGY_CONFIG: Record<StrategyType, { name: string; icon: string; color: string; description: string }> = {
  macro_hedge: {
    name: '宏观对冲',
    icon: '🛡️',
    color: 'bg-blue-100 border-blue-300 text-blue-700',
    description: '多空双向布局，攻守兼备',
  },
  aggressive_short: {
    name: '激进做空',
    icon: '⚔️',
    color: 'bg-red-100 border-red-300 text-red-700',
    description: '高杠杆做空，追求暴利',
  },
  insider_trade: {
    name: '内幕交易',
    icon: '🔍',
    color: 'bg-purple-100 border-purple-300 text-purple-700',
    description: '依赖情报，信息优势',
  },
  balanced: {
    name: '均衡策略',
    icon: '⚖️',
    color: 'bg-gray-100 border-gray-300 text-gray-700',
    description: '稳健布局，伺机而动',
  },
  conservative: {
    name: '保守策略',
    icon: '🏦',
    color: 'bg-green-100 border-green-300 text-green-700',
    description: '现金为王，谨慎出击',
  },
};

// 风险等级配置
const RISK_LEVEL_CONFIG = {
  low: { name: '低风险', color: 'text-green-600', bg: 'bg-green-100' },
  medium: { name: '中风险', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  high: { name: '高风险', color: 'text-orange-600', bg: 'bg-orange-100' },
  extreme: { name: '极高风险', color: 'text-red-600', bg: 'bg-red-100' },
};

export function SpecStrategyPanel({
  riskScore,
  strategyType,
  activeOpportunity,
  opportunityRemainingTurns,
}: SpecStrategyPanelProps) {
  const strategy = STRATEGY_CONFIG[strategyType];
  const risk = RISK_LEVEL_CONFIG[riskScore.risk_level];

  return (
    <div className="space-y-3">
      {/* 大机会事件提示 */}
      <AnimatePresence>
        {activeOpportunity && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{activeOpportunity.icon}</span>
              <span className="font-bold text-sm text-amber-800">大机会激活</span>
              <span className="ml-auto text-xs font-mono text-amber-600">
                剩余 {opportunityRemainingTurns} 回合
              </span>
            </div>
            <div className="text-xs font-semibold text-amber-900">{activeOpportunity.name}</div>
            <div className="text-[11px] text-amber-700 mt-0.5">{activeOpportunity.description}</div>
            <div className="text-[10px] text-amber-600 mt-1">
              收益倍率 ×{activeOpportunity.profit_multiplier}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 策略类型 */}
      <div className="p-3 rounded-xl border-2 bg-white">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">{strategy.icon}</span>
          <span className="font-bold text-xs text-gray-700">当前策略</span>
        </div>
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border ${strategy.color}`}>
          <span className="text-xs font-bold">{strategy.name}</span>
        </div>
        <div className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">
          {strategy.description}
        </div>
      </div>

      {/* 风险评分 */}
      <div className="p-3 rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">📊</span>
          <span className="font-bold text-xs text-gray-700">风险评估</span>
          <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded ${risk.bg} ${risk.color}`}>
            {risk.name}
          </span>
        </div>

        {/* 总风险条 */}
        <div className="mb-2">
          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
            <span>综合风险</span>
            <span className="font-mono font-bold">{riskScore.total_risk}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${riskScore.total_risk}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                riskScore.risk_level === 'low' ? 'bg-green-500' :
                riskScore.risk_level === 'medium' ? 'bg-yellow-500' :
                riskScore.risk_level === 'high' ? 'bg-orange-500' : 'bg-red-500'
              }`}
            />
          </div>
        </div>

        {/* 三项风险 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-1.5 rounded-lg bg-gray-50">
            <div className="text-[9px] text-gray-500 mb-0.5">波动</div>
            <div className="text-xs font-bold text-gray-700">{riskScore.volatility_risk}</div>
          </div>
          <div className="text-center p-1.5 rounded-lg bg-gray-50">
            <div className="text-[9px] text-gray-500 mb-0.5">集中</div>
            <div className="text-xs font-bold text-gray-700">{riskScore.concentration_risk}</div>
          </div>
          <div className="text-center p-1.5 rounded-lg bg-gray-50">
            <div className="text-[9px] text-gray-500 mb-0.5">流动</div>
            <div className="text-xs font-bold text-gray-700">{riskScore.liquidity_risk}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
