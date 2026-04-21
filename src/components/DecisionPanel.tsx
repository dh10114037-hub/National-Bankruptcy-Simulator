import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Policy } from '../types/game';
import { CausalChainAnimation } from './CausalChainAnimation';
import { POLICY_CAUSAL_CHAINS } from '../data/policyCausalChains';

interface DecisionPanelProps {
  policies: Policy[];
  onChoose: (policy: Policy) => void;
  hasChosen: boolean;
  onNextRound: () => void;
  isWaiting: boolean;
  turnPhase: string;
  interactiveMode?: 'hover' | 'click';
  /** 顾问推荐的政策 id（高亮显示） */
  recommendedPolicyId?: string | null;
}

// Possible side effects shown on hover
const sideEffectMap: Record<string, string[]> = {
  tax_increase:     ['可能引发抗议', '企业外迁风险'],
  print_money:      ['通货膨胀', '货币贬值加速'],
  cut_welfare:      ['社会不满激增', '可能触发游行'],
  imf_bailout:      ['主权受限', '政策自主权损失'],
  raise_interest:   ['房贷压力上升', '内需萎缩'],
  capital_control:  ['外资撤离加速', '黑市汇率出现'],
  emergency_bond:   ['债务负担加重', '未来偿债压力'],
  economic_reform:  ['短期阵痛', '改革派与保守派冲突'],
  public_speech:    ['治标不治本', '效果仅持续1回合'],
  sell_assets:      ['丧失战略资产', '未来控制力下降'],
};

// Confirm modal
function ConfirmModal({
  policy,
  onConfirm,
  onCancel,
}: {
  policy: Policy;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const sides = sideEffectMap[policy.id] ?? [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="pop-in w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="text-4xl text-center mb-3">{policy.icon}</div>
        <h3 className="text-gray-900 font-bold text-center text-lg mb-1">
          确认执行：{policy.name}？
        </h3>
        <p className="text-gray-500 text-sm text-center mb-4 leading-relaxed">
          {policy.description}
        </p>

        {/* 三行解释信息 */}
        <div className="space-y-2 mb-4">
          {policy.shortEffect && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-800 leading-relaxed">
              {policy.shortEffect}
            </div>
          )}
          {policy.risk && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 leading-relaxed">
              {policy.risk}
            </div>
          )}
          {policy.tip && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700 leading-relaxed">
              {policy.tip}
            </div>
          )}
        </div>

        {sides.length > 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-4">
            <div className="text-amber-600 text-xs font-semibold mb-1.5">⚠ 潜在后果</div>
            <ul className="space-y-1">
              {sides.map((s) => (
                <li key={s} className="text-amber-700 text-xs flex items-center gap-1.5">
                  <span className="text-amber-500">·</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-gray-400 text-xs italic text-center mb-5 border-t border-gray-100 pt-3">
          💬 {policy.tradeoff}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all hover:shadow-lg active:scale-95"
          >
            确认执行
          </button>
        </div>
      </div>
    </div>
  );
}

function PolicyCard({
  policy,
  onClick,
  disabled,
  interactiveMode = 'hover',
  isRecommended = false,
}: {
  policy: Policy;
  onClick: () => void;
  disabled: boolean;
  interactiveMode?: 'hover' | 'click';
  isRecommended?: boolean;
}) {
  // H5: click模式; PC: hover模式
  const [isExpanded, setIsExpanded] = useState(false);
  const sides = sideEffectMap[policy.id] ?? [];
  const hasSides = sides.length > 0;

  const effectEntries = Object.entries(policy.effects);
  const hasPositive = effectEntries.some(([, v]) => (v as number) > 0);
  const hasNegative = effectEntries.some(([, v]) => (v as number) < 0);

  const names: Record<string, string> = {
    foreign_reserves: '外储',
    public_support: '民心',
    credit_rating: '信用',
    exchange_rate: '汇率',
    inflation: '通胀',
  };

  const handleClick = () => {
    if (disabled) return;
    // H5 click模式：展开/收起副作用信息
    if (interactiveMode === 'click' && hasSides) {
      setIsExpanded(prev => !prev);
    } else {
      onClick();
    }
  };

  const handleActivate = () => {
    if (disabled) return;
    onClick();
  };

  return (
    <div className="relative">
      {/* 顾问推荐徽章 */}
      {isRecommended && (
        <div className="absolute -top-2 left-3 z-10 flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
          🧠 顾问推荐
        </div>
      )}

      {/* 新手推荐徽章 */}
      {!isRecommended && policy.tag === '新手推荐' && (
        <div className="absolute -top-2 left-3 z-10 flex items-center gap-1 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
          🛡️ 新手推荐
        </div>
      )}

      <motion.button
        onClick={handleClick}
        onTouchEnd={(e) => {
          // 阻止幽灵点击：touch后不触发onClick两次
          e.preventDefault();
          handleClick();
        }}
        className={`
          group w-full text-left rounded-xl border p-4 transition-all duration-200
          ${disabled
            ? 'border-gray-200 bg-gray-50 opacity-40 cursor-not-allowed'
            : isRecommended
              ? 'border-emerald-400 bg-emerald-50/40 cursor-pointer hover:border-emerald-500 hover:shadow-md ring-1 ring-emerald-300'
              : policy.tag === '新手推荐'
                ? 'border-blue-300 bg-blue-50/30 cursor-pointer hover:border-blue-400 hover:shadow-md ring-1 ring-blue-200'
                : 'border-gray-200 bg-white cursor-pointer active:scale-[0.99] hover:border-blue-300 hover:shadow-md'
          }
        `}
        whileTap={disabled ? {} : { scale: 0.98 }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">{policy.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-900 text-sm mb-1">{policy.name}</div>
            <p className="text-gray-500 text-xs leading-relaxed mb-2 line-clamp-2">
              {policy.description}
            </p>

            {/* Effect tags */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {effectEntries.map(([k, v]) => {
                const num = v as number;
                const sign = num > 0 ? '+' : '';
                const color = num > 0
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-red-600 bg-red-50 border-red-200';
                return (
                  <span key={k} className={`${color} text-xs font-mono px-2 py-0.5 rounded border`}>
                    {names[k] ?? k} {sign}{num}
                  </span>
                );
              })}
            </div>

            {/* 三行解释信息（PC hover 折叠 / H5 始终显示） */}
            <div className="mt-2 space-y-1">
              {policy.shortEffect && (
                <div className="text-[11px] text-blue-700 leading-snug">
                  {policy.shortEffect}
                </div>
              )}
              {policy.risk && (
                <div className="text-[11px] text-red-600 leading-snug">
                  {policy.risk}
                </div>
              )}
              {policy.tip && (
                <div className="text-[11px] text-emerald-700 leading-snug">
                  {policy.tip}
                </div>
              )}
            </div>

            {/* ⚠ 潜在后果（H5 始终可见 / PC 仅 hover 显示） */}
            {hasSides && (
              <div className={`
                mt-2 px-2 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-700
                ${interactiveMode === 'click' ? 'opacity-100' : 'sm:opacity-0 sm:group-hover:opacity-100 transition-opacity'}
              `}>
                <span className="font-semibold">⚠ 潜在后果：</span>
                {sides.join(' · ')}
              </div>
            )}

            {/* Risk indicator dots + tradeoff */}
            <div className="flex items-center gap-1.5 mt-2">
              {hasPositive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
              {hasNegative && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
              <span className="text-gray-400 text-[10px] italic">{policy.tradeoff}</span>
            </div>
          </div>
        </div>

        {/* H5 click模式：展开后显示"点此确认"按钮 */}
        {interactiveMode === 'click' && hasSides && !disabled && (
          <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-amber-600">
              {isExpanded ? '↑ 点击卡片外部区域' : '👆 点击展开风险提示'}
            </span>
            {isExpanded && (
              <button
                onClick={(e) => { e.stopPropagation(); handleActivate(); }}
                onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); handleActivate(); }}
                className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold active:bg-blue-700 transition-colors"
              >
                确认执行 →
              </button>
            )}
          </div>
        )}
      </motion.button>
    </div>
  );
}

export function DecisionPanel({
  policies,
  onChoose,
  hasChosen,
  onNextRound,
  isWaiting,
  turnPhase,
  interactiveMode = 'hover',
  recommendedPolicyId,
}: DecisionPanelProps) {
  const [pendingPolicy, setPendingPolicy] = useState<Policy | null>(null);
  // 因果链动画状态
  const [chainPolicy, setChainPolicy] = useState<Policy | null>(null);

  const handlePolicyClick = (policy: Policy) => {
    if (hasChosen || isWaiting) return;
    setPendingPolicy(policy);
  };

  const handleConfirm = () => {
    if (!pendingPolicy) return;
    const chain = POLICY_CAUSAL_CHAINS[pendingPolicy.id];
    if (chain) {
      // 有因果链数据 → 先播放动画，动画结束后再真正结算
      setChainPolicy(pendingPolicy);
      setPendingPolicy(null);
    } else {
      // 没有因果链数据 → 直接结算（兼容性保底）
      onChoose(pendingPolicy);
      setPendingPolicy(null);
    }
  };

  // 因果链动画播放完毕 → 真正触发游戏结算
  const handleChainComplete = () => {
    if (chainPolicy) {
      onChoose(chainPolicy);
      setChainPolicy(null);
    }
  };

  const handleCancel = () => setPendingPolicy(null);

  return (
    <div className="flex flex-col h-full">
      {/* Heading */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-blue-400 text-xs">◆</span>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest font-mono">
            决策中心
          </h2>
        </div>
        {!hasChosen && !isWaiting && (
          <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-mono animate-pulse">
            需要决策
          </span>
        )}
      </div>

      {/* Waiting state */}
      {isWaiting && (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          <div className="text-center space-y-2">
            <div className="text-3xl">⏳</div>
            <div>等待事件触发...</div>
          </div>
        </div>
      )}

      {/* Policy cards */}
      {!isWaiting && !hasChosen && (
        <div className="space-y-4 flex-1">
          <p className="text-gray-400 text-xs leading-relaxed border-l-2 border-blue-500/50 pl-3">
            选择一项政策应对当前局势。每个选择都有代价——权衡是唯一出路。
          </p>
          {policies.map((p) => (
            <PolicyCard
              key={p.id}
              policy={p}
              onClick={() => handlePolicyClick(p)}
              disabled={hasChosen}
              interactiveMode={interactiveMode}
              isRecommended={recommendedPolicyId === p.id}
            />
          ))}
        </div>
      )}

      {/* Post-choice feedback */}
      {hasChosen && (
        <div className="flex-1 flex flex-col">
          {turnPhase === 'feedback' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2 pop-in">
                <div className="text-3xl animate-spin" style={{ animationDuration: '1s' }}>⚙️</div>
                <div className="text-gray-500 text-sm">正在结算...</div>
              </div>
            </div>
          )}
          {turnPhase === 'ai_action' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2 pop-in">
                <div className="text-3xl">📉</div>
                <div className="text-red-500 text-sm font-bold animate-pulse">投机者出手了</div>
              </div>
            </div>
          )}
          {(turnPhase === 'next_prompt' || turnPhase === 'idle') && (
            <div className="flex-1 flex items-center justify-center">
              <button
                onClick={onNextRound}
                className="
                  px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500
                  text-white font-bold text-sm transition-all
                  hover:shadow-[0_0_24px_rgba(59,130,246,0.4)]
                  active:scale-95 border border-blue-500/30
                "
              >
                进入下一月 →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Confirm modal */}
      {pendingPolicy && (
        <ConfirmModal
          policy={pendingPolicy}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {/* 因果链动画弹层（确认后播放，播完再结算） */}
      {chainPolicy && POLICY_CAUSAL_CHAINS[chainPolicy.id] && (
        <CausalChainAnimation
          chain={POLICY_CAUSAL_CHAINS[chainPolicy.id]}
          onComplete={handleChainComplete}
        />
      )}
    </div>
  );
}
