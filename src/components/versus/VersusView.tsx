/**
 * 双人对抗主视图
 * 布局：
 *   - 顶部：VersusHeader（共享状态，响应式）
 *   - 主体：PC双栏 / H5单栏纵向堆叠
 *     * PC：左侧操作区 + 右侧顾问+资产
 *     * H5：操作区 → 顾问 → 资产（纵向堆叠）
 */

import { useEffect, useState } from 'react';
import { useVersusStore } from '../../store/versusStore';
import { VersusHeader }          from './VersusHeader';
import { VersusIntelPhase }      from './VersusIntelPhase';
import { VersusSpecPhase }       from './VersusSpecPhase';
import { VersusSaviorPhase }     from './VersusSaviorPhase';
import { VersusSettlementPanel } from './VersusSettlementPanel';
import { VersusGameOver }        from './VersusGameOver';
import { AdvisorPanel, TutorialOverlay } from './AdvisorPanel';
import { generateLocalAdvisorTip, callAdvisorAPI, USE_REAL_ADVISOR_API, SAVIOR_ADVISOR_PROMPT } from '../../engine/advisorEngine';
import { ImpactModelPanel, ImpactTip } from '../story/ImpactModelPanel';
import type { AdvisorTip } from '../../types/versus';

interface VersusViewProps {
  onBack?: () => void;
}

export function VersusView({ onBack }: VersusViewProps) {
  const {
    state,
    crisisLevel,
    buyIntel,
    bribeIntel,
    doneIntel,
    addAction,
    removeAction,
    doneSpec,
    chooseSavior,
    nextTurn,
    reset,
  } = useVersusStore();

  const { phase, turn, maxTurns, country, market, intels, available_policies,
          spec_actions, spec_assets, settlement_news, last_country_delta,
          last_spec_pnl, current_event, result, log } = state;

  // AI 顾问
  const [advisorTip, setAdvisorTip] = useState<AdvisorTip | null>(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // 每次进入新阶段时，更新顾问建议
  useEffect(() => {
    if (phase === 'intel' || phase === 'spec_action' || phase === 'savior_action') {
      const role: 'savior' | 'speculator' =
        phase === 'savior_action' ? 'savior' : 'speculator';

      // 构建游戏状态摘要
      const gameState = {
        turn: `${turn}/${maxTurns}`,
        country: {
          foreign_reserves: country.foreign_reserves.toFixed(0),
          public_support: country.public_support.toFixed(0),
          credit_rating: country.credit_rating.toFixed(0),
          inflation: country.inflation.toFixed(0),
        },
        market: market ? {
          exchange_rate: market.exchange_rate.toFixed(2),
          volatility: market.volatility.toFixed(1),
          bond_price: market.bond_price.toFixed(2),
        } : null,
        recent_events: log.slice(0, 2).map((e) => e.event),
        available_policies: available_policies.map((p) => p.name),
      };
      const gameStateJson = JSON.stringify(gameState, null, 2);

      if (USE_REAL_ADVISOR_API) {
        // 使用阿里百炼真实 API
        setIsLoadingAI(true);
        callAdvisorAPI(SAVIOR_ADVISOR_PROMPT, gameStateJson)
          .then((tip) => {
            if (tip) {
              setAdvisorTip({ ...tip, role });
            } else {
              // API 调用失败，回退到本地模拟
              setAdvisorTip(generateLocalAdvisorTip({
                role,
                country,
                market,
                specCash: spec_assets.cash,
                specTotalValue: spec_assets.total_value,
                turnIndex: turn - 1,
                recentEvents: log.slice(0, 2).map((e) => e.event),
                policyOptions: available_policies.map((p) => p.name),
              }));
            }
            setIsLoadingAI(false);
          });
      } else {
        // 本地模拟模式
        const tip = generateLocalAdvisorTip({
          role,
          country,
          market,
          specCash:       spec_assets.cash,
          specTotalValue: spec_assets.total_value,
          turnIndex:      turn - 1,
          recentEvents:   log.slice(0, 2).map((e) => e.event),
          policyOptions:  available_policies.map((p) => p.name),
        });
        setAdvisorTip(tip);
      }
    }
  }, [phase, turn]);

  // 背景危机感（浅色主题）
  const dangerZone = crisisLevel >= 70;
  const bgStyle = {
    background: dangerZone ? '#FEF2F2' : '#F5F7FA',
    minHeight: '100vh',
  };

  // ── 右侧栏内容（顾问 + 资产 + 回合流程）─────────────────────
  const RightSidebar = () => (
    <div className="space-y-4">
      {/* AI 顾问 */}
      <AdvisorPanel
        tip={advisorTip}
        role={phase === 'savior_action' ? 'savior' : 'speculator'}
        isLoading={isLoadingAI}
      />

      {/* 投机者资产简报 */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
          💸 <span>投机者资产</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">可用资金</span>
            <span className="font-mono text-amber-600 font-bold">
              ${(spec_assets.cash / 10000).toFixed(0)}万
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">总资产</span>
            <span className="font-mono text-gray-900 font-bold">
              ${(spec_assets.total_value / 10000).toFixed(0)}万
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">倍率</span>
            <span className={`font-mono font-bold ${
              spec_assets.total_value >= 3_000_000 ? 'text-emerald-600' :
              spec_assets.total_value >= 1_000_000 ? 'text-amber-600' : 'text-red-500'
            }`}>
              {(spec_assets.total_value / 1_000_000).toFixed(2)}x
            </span>
          </div>
          {/* 收割进度条 */}
          <div>
            <div className="text-xs text-gray-400 mb-1">收割进度（目标 3x）</div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  spec_assets.total_value >= 3_000_000 ? 'bg-emerald-500' :
                  spec_assets.total_value >= 1_500_000 ? 'bg-amber-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, ((spec_assets.total_value - 1_000_000) / 2_000_000) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 当前阶段说明 */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-xs text-gray-600 space-y-1.5">
        <div className="text-gray-700 font-bold mb-2">📋 回合流程</div>
        {[
          { p: 'intel',         label: '① 情报阶段',   desc: '投机者购买/贿赂情报' },
          { p: 'spec_action',   label: '② 投机者行动', desc: '加入行动队列（可多次）' },
          { p: 'savior_action', label: '③ 拯救者决策', desc: '选择一项政策' },
          { p: 'feedback',      label: '④ 市场结算',   desc: '查看结果与盈亏' },
        ].map(({ p, label, desc }) => (
          <div key={p} className={`flex items-start gap-2 ${phase === p ? 'text-gray-900' : 'text-gray-400'}`}>
            <span className={`shrink-0 ${phase === p ? 'text-blue-500' : ''}`}>
              {phase === p ? '▶' : '○'}
            </span>
            <span>
              <span className="font-medium">{label}</span>
              <span className="ml-1 text-gray-400">{desc}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-gray-900" style={bgStyle}>
      {/* 新手引导 */}
      {showTutorial && (
        <TutorialOverlay role="versus" onClose={() => setShowTutorial(false)} />
      )}

      {/* 游戏结束 */}
      {phase === 'game_over' && result && (
        <VersusGameOver result={result} onRestart={reset} />
      )}

      {/* 顶部状态栏 */}
      <VersusHeader
        country={country}
        market={market}
        turn={turn}
        maxTurns={maxTurns}
        phase={phase}
        crisisLevel={crisisLevel}
        onBack={onBack}
      />

      {/* 主体布局 - 统一响应式 */}
      {/* PC: 双栏 grid-cols-[1fr_320px] | H5: 单栏 grid-cols-1 */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-4 lg:py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 lg:gap-6 items-start">

          {/* ── 左侧：主操作区 ── */}
          <div className="space-y-4 order-1">
            {/* 事件卡（顶部提示） */}
            {current_event && phase !== 'feedback' && phase !== 'game_over' && (
              <div className={`rounded-xl border p-3 sm:p-4 flex items-start gap-3 ${
                current_event.severity === 'high'
                  ? 'border-red-300 bg-red-50'
                  : current_event.severity === 'positive'
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-amber-300 bg-amber-50'
              }`}>
                <div className="text-xl sm:text-2xl shrink-0">{current_event.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-900">{current_event.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{current_event.description}</div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {Object.entries(current_event.effects).map(([k, v]) => {
                      if (!v) return null;
                      const label = k === 'foreign_reserves' ? '外储' : k === 'public_support' ? '民心' : '信用';
                      return (
                        <span key={k} className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                          v > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {label} {v > 0 ? '+' : ''}{v}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="hidden sm:block shrink-0 text-xs text-gray-400 italic">本月突发事件</div>
              </div>
            )}

            {/* 阶段内容 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
              {phase === 'intel' && (
                <VersusIntelPhase
                  intels={intels}
                  cash={spec_assets.cash}
                  onBuy={buyIntel}
                  onBribe={bribeIntel}
                  onConfirm={doneIntel}
                />
              )}

              {phase === 'spec_action' && (
                <>
                  {/* 投机者视角的影响提示 */}
                  <ImpactTip crisisLevel={crisisLevel} country={country} market={market} />

                  <VersusSpecPhase
                    cash={spec_assets.cash}
                    queuedActions={spec_actions}
                    onAdd={addAction}
                    onRemove={removeAction}
                    onConfirm={doneSpec}
                  />
                </>
              )}

              {phase === 'savior_action' && (
                <>
                  {/* 影响建模面板 */}
                  <ImpactModelPanel
                    storyEvent={current_event as any}
                    context={{ turn, country, market }}
                    expanded={true}
                  />

                  <VersusSaviorPhase
                    policies={available_policies}
                    onChoose={(id) => chooseSavior({ policy_id: id })}
                    crisisLevel={crisisLevel}
                  />
                </>
              )}

              {(phase === 'feedback' || phase === 'settlement') && (
                <VersusSettlementPanel
                  news={settlement_news}
                  countryDelta={last_country_delta}
                  specPnl={last_spec_pnl}
                  onNextTurn={nextTurn}
                  turn={turn}
                  maxTurns={maxTurns}
                />
              )}
            </div>

            {/* 回合日志（最近4条） */}
            {log.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
                <div className="text-xs text-gray-500 mb-3">📜 最近记录</div>
                <div className="space-y-2">
                  {log.slice(0, 4).map((entry, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-gray-500 font-mono shrink-0">第{entry.turn}月</span>
                      <span className="text-gray-600 shrink-0">{entry.event}</span>
                      <span className="text-gray-400 shrink-0">→</span>
                      <span className="text-gray-700 shrink-0">{entry.savior_policy}</span>
                      <div className="flex gap-1.5 ml-auto flex-wrap">
                        {entry.country_delta.foreign_reserves !== undefined && entry.country_delta.foreign_reserves !== 0 && (
                          <span className={`font-mono ${entry.country_delta.foreign_reserves > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            外{entry.country_delta.foreign_reserves > 0 ? '+' : ''}{Math.round(entry.country_delta.foreign_reserves)}
                          </span>
                        )}
                        {entry.spec_pnl !== 0 && (
                          <span className={`font-mono ${entry.spec_pnl > 0 ? 'text-amber-600' : 'text-red-500'}`}>
                            投{entry.spec_pnl > 0 ? '+' : ''}${(Math.abs(entry.spec_pnl) / 10000).toFixed(0)}万
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── H5 端：顾问和资产卡片（显示在主内容下方）── */}
            {/* PC 端隐藏，H5 端显示 */}
            <div className="lg:hidden space-y-4 order-2">
              <RightSidebar />
            </div>
          </div>

          {/* ── 右侧：顾问 + 投机者资产 ── */}
          {/* PC 端显示，H5 端隐藏（已在上方 H5 区域显示） */}
          <div className="hidden lg:block space-y-4">
            <RightSidebar />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-800 text-xs mt-6 pb-4 font-mono tracking-widest">
          拯救者 VS 投机者 · 信息不对称是关键 · 每个决策都有代价
        </div>
      </div>
    </div>
  );
}
