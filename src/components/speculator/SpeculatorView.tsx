/**
 * SpeculatorView - 投机者模式主视图
 *
 * 响应式布局策略：
 *   - PC (≥lg): 三栏网格 (机会 | 情报+交易 | 操控+结束)
 *   - H5 (<lg): 操作入口模式 (BottomSheet + 入口按钮)
 *
 * H5端不再使用纵向堆叠，而是：
 *   - 顶部状态栏
 *   - 操作入口区（4个按钮）
 *   - 点击进入BottomSheet查看详情
 */

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSpeculatorStore } from '../../store/speculatorStore';
import { SpecHeader } from './SpecHeader';
import { IntelPanel } from './IntelPanel';
import { TradingTerminal } from './TradingTerminal';
import { ManipulationPanel } from './ManipulationPanel';
import { SpecNotifications } from './SpecNotifications';
import { SpecGameOver } from './SpecGameOver';
import { OpportunityPanel } from './OpportunityPanel';
import { SpecActionHub } from './SpecActionHub';
import { StoryEventPanel } from '../story/StoryEventPanel';
import { TurnSummaryCard } from './TurnSummaryCard';
import { SpecStrategyPanel } from './SpecStrategyPanel'; // P1-3: 策略分析面板
import type { StoryChoice } from '../../types/story';
import { TutorialOverlay } from '../versus/AdvisorPanel';
import { SaveLoadModal } from '../ui/SaveLoadModal';
import { saveGame } from '../../utils/saveLoad';
import { playSound, vibrate } from '../../utils/soundEffects';
import { useAchievements } from '../../utils/useAchievements';
import { AchievementToast, AchievementPanel } from '../ui/AchievementUI';

interface SpeculatorViewProps {
  onBack?: () => void;
}

export function SpeculatorView({ onBack }: SpeculatorViewProps) {
  const [showTutorial, setShowTutorial] = useState(true);
  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const {
    state,
    story,
    hasActiveStory,
    openTrade,
    closeTrade,
    purchaseIntel,
    bribeForIntel,
    triggerManipulation,
    nextTurn,
    makeStoryChoice,
    dismissNotif,
    dismissTurnSummary,
    resetGame,
    saveToSlot,
  } = useSpeculatorStore();

  const { phase, turn, maxTurns, assets, market, intels, manipulations, notifications, market_flash, gov_log, initial_cash, turn_summary, riskScore, strategyType, activeOpportunity, opportunityRemainingTurns } = state;

  // 成就系统
  const {
    checkAndUnlock,
    newAchievement,
    dismissNewAchievement,
    getAchievementsForMode,
    unlockedCount,
    totalCount,
  } = useAchievements();

  // 危机感背景（随危机强度变化）
  const crisisDepth = Math.max(0, (1 - market.credit_rating / 100) * 0.5 + (1 - market.exchange_rate) * 0.5);
  const bgStyle = {
    background: crisisDepth > 0.7 ? '#FFF5F5' : '#F5F7FA',
    minHeight: '100vh',
  };

  // 胜负音效 + 成就检查
  const prevPhaseRef = useRef(phase);
  const manipulationsSucceededRef = useRef(0);
  useEffect(() => {
    if (prevPhaseRef.current === 'playing' && phase !== 'playing') {
      // 胜负音效
      if (phase === 'victory') {
        playSound('victory');
        vibrate('success');
      } else {
        playSound('defeat');
        vibrate('error');
      }
      // 成就检查
      checkAndUnlock({
        mode: 'speculator',
        turn,
        phase,
        spec: {
          totalValue: assets.total_value,
          initialCash: initial_cash,
          cash: assets.cash,
          positionsCount: assets.positions.length,
          intelsBought: intels.filter(i => i.purchased).length,
          manipulationsTriggered: manipulations.length > 0 ? manipulations.length : manipulationsSucceededRef.current,
          manipulationsSucceeded: manipulationsSucceededRef.current,
          largestPnl: assets.positions.reduce((max, p) => Math.max(max, p.pnl), 0),
          pnlHistory: assets.positions.map(p => p.pnl),
        },
      });
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  return (
    <div className="min-h-screen text-gray-900" style={bgStyle}>
      {/* 剧情事件面板 */}
      <AnimatePresence>
        {hasActiveStory && story.currentEvent && (
          <StoryEventPanel
            event={story.currentEvent}
            onChoice={(choice: StoryChoice) => makeStoryChoice(choice)}
          />
        )}
      </AnimatePresence>

      {/* 回合结算总结 */}
      <AnimatePresence>
        {turn_summary && (
          <TurnSummaryCard
            key="turn-summary"
            summary={turn_summary}
            onDismiss={dismissTurnSummary}
          />
        )}
      </AnimatePresence>

      {/* 胜负界面 */}
      {phase !== 'playing' && (
        <SpecGameOver
          state={state}
          onRestart={() => { resetGame(); }}
        />
      )}

      {/* 顶部：资产 + 市场状态 */}
      <SpecHeader
        assets={assets}
        market={market}
        turn={turn}
        maxTurns={maxTurns}
        marketFlash={market_flash}
        initialCash={initial_cash}
        onBack={onBack}
      />

      {/* ─────────────────────────────────────────────────────
          PC 布局 (lg+): 三栏网格布局
      ───────────────────────────────────────────────────── */}
      <div className="hidden lg:block max-w-[1400px] mx-auto px-4 lg:px-6 py-4">
        {/* 三栏：机会 | 情报+交易 | 操控+结束 */}
        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_280px] gap-4">

          {/* ① 左侧：当前机会 */}
          <div className="space-y-4">
            {/* 回合进度 */}
            <div className="rounded-2xl border-2 border-amber-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🎯</span>
                <span className="font-bold text-sm text-gray-800 tracking-wide">当前机会</span>
                <span className="ml-auto text-[10px] font-mono text-gray-400">回合 {turn}/{maxTurns}</span>
              </div>
              <OpportunityPanel
                market={market}
                turn={turn}
                cash={assets.cash}
                maxTurns={maxTurns}
              />
            </div>

            {/* P1-3: 策略分析面板 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <SpecStrategyPanel
                riskScore={riskScore}
                strategyType={strategyType}
                activeOpportunity={activeOpportunity}
                opportunityRemainingTurns={opportunityRemainingTurns}
              />
            </div>
          </div>

          {/* ② 中间：情报 + 交易终端 */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <IntelPanel
                intels={intels}
                cash={assets.cash}
                turn={turn}
                onBuy={purchaseIntel}
                onBribe={bribeForIntel}
              />
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <TradingTerminal
                market={market}
                positions={assets.positions}
                cash={assets.cash}
                govLog={gov_log}
                turn={turn}
                onTrade={openTrade}
                onClose={closeTrade}
              />
            </div>
          </div>

          {/* ③ 右侧：操控 + 结束回合 */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-red-200 bg-white p-5">
              <ManipulationPanel
                manipulations={manipulations}
                cash={assets.cash}
                turn={turn}
                market={market}
                onTrigger={triggerManipulation}
              />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-col gap-3">
              <div className="text-xs text-gray-500 leading-relaxed text-center">
                ⏳ 结束本月操作，市场将根据你的行动波动
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSaveLoad(true)}
                  disabled={phase !== 'playing'}
                  className="px-3 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  title="存档"
                >
                  💾
                </button>
                <button
                  onClick={nextTurn}
                  disabled={hasActiveStory}
                  className="flex-1 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm transition-all shadow-lg shadow-yellow-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ minHeight: '44px' }}
                >
                  结束本月 →
                </button>
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-2 justify-center">
                <span>📖</span>
                <span>已触发 {story.triggeredEvents.length} 个剧情事件</span>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-400 text-center leading-relaxed">
                  查机会 → 读情报 → 选交易 → 可选操控 → 结束
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-center text-gray-600 text-xs mt-4 pb-3 font-mono tracking-widest px-2">
          <span>信息不对称是你唯一的武器 · 操控市场 · 收割危机</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAchievements(true)}
              className="flex items-center gap-1 text-gray-400 hover:text-amber-500 transition-colors shrink-0"
              title="查看成就"
            >
              🏆
              <span className="text-[10px]">{unlockedCount}/{totalCount}</span>
            </button>
            <button
              onClick={() => setShowTutorial(true)}
              className="text-gray-400 hover:text-blue-500 transition-colors shrink-0"
              title="查看新手引导"
            >
              ❓
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────
          H5 布局 (<lg): 操作入口模式
      ───────────────────────────────────────────────────── */}
      <div className="lg:hidden max-w-[1400px] mx-auto px-3 py-3 space-y-3">
        <SpecActionHub
          market={market}
          intels={intels}
          manipulations={manipulations}
          assets={assets}
          govLog={gov_log}
          turn={turn}
          maxTurns={maxTurns}
          cash={assets.cash}
          hasActiveStory={hasActiveStory}
          storyTriggeredCount={story.triggeredEvents.length}
          onBuyIntel={purchaseIntel}
          onBribeIntel={bribeForIntel}
          onTrade={openTrade}
          onClose={closeTrade}
          onTriggerManipulation={triggerManipulation}
          onNextTurn={nextTurn}
        />

        {/* H5 P1-3: 策略分析面板 */}
        <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
          <SpecStrategyPanel
            riskScore={riskScore}
            strategyType={strategyType}
            activeOpportunity={activeOpportunity}
            opportunityRemainingTurns={opportunityRemainingTurns}
          />
        </div>

        {/* H5 教程重开入口 */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowTutorial(true)}
            className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
          >
            ❓ 查看新手引导
          </button>
        </div>
      </div>

      {/* 通知 */}
      <SpecNotifications notifications={notifications} onDismiss={dismissNotif} />

      {/* 成就解锁通知 */}
      <AchievementToast achievement={newAchievement} onDismiss={dismissNewAchievement} />

      {/* 成就面板 */}
      <AnimatePresence>
        {showAchievements && (
          <AchievementPanel
            mode="speculator"
            achievements={getAchievementsForMode('speculator')}
            onClose={() => setShowAchievements(false)}
          />
        )}
      </AnimatePresence>

      {/* 存档弹层 */}
      <AnimatePresence>
        {showSaveLoad && (
          <SaveLoadModal
            currentMode="speculator"
            canSave={phase === 'playing' && !hasActiveStory}
            currentTurn={turn}
            onClose={() => setShowSaveLoad(false)}
            onLoad={() => {}}
            onSave={(slot) => {
              const saved = saveToSlot(slot);
              if (saved) {
                dismissNotif(`notif_${Date.now()}`);
              }
              setShowSaveLoad(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* 新手引导 */}
      {showTutorial && (
        <TutorialOverlay
          role="speculator"
          onClose={() => setShowTutorial(false)}
        />
      )}
    </div>
  );
}
