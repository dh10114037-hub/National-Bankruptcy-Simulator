/**
 * ResponsiveLayout - 统一响应式布局
 * 
 * PC:  三栏网格 (事件+顾问+风险 | 决策 | 数据)
 * H5:  操作入口模式（BottomSheet详情）
 * 
 * 响应式策略：
 * - PC (lg+): 三栏网格布局
 * - H5 (<lg): SaviorActionHub 入口模式
 */

import { type MutableRefObject } from 'react';
import { Header } from '../Header';
import { EventPanel } from '../EventPanel';
import { DecisionPanel } from '../DecisionPanel';
import { DataPanel } from '../DataPanel';
import { GameOverScreen } from '../GameOverScreen';
import { SocialVoiceToast } from '../SocialVoice';
import { AdvisorPanel } from '../AdvisorPanel';
import { RiskSourcePanel } from '../RiskSourcePanel';
import { RoundSummaryPanel } from '../RoundSummaryPanel';
import { MobileTopStatus } from './MobileTopStatus';
import { SaviorActionHub } from './SaviorActionHub';

interface ResponsiveLayoutProps {
  gameState: any;
  currentEvent: any;
  currentPolicies: any[];
  log: any[];
  hasChosen: boolean;
  turnPhase: string;
  trendHistory: any[];
  lastSpeculatorAction: any;
  lastSpeculatorEffects: any;
  crisisLevel: number;
  lastDelta: any;
  marketFlash: any;
  lastRoundSummary: any;
  recommendedPolicyId: string | null;
  onChoose: (policy: any) => void;
  onNextRound: () => void;
  onBack: () => void;
  onDismissSummary: () => void;
  dangerZone: boolean;
  tenseZone: boolean;
  isRevealing: boolean;
  bootedRef: MutableRefObject<boolean>;
  onRestart: () => void;
}

export default function ResponsiveLayout(props: ResponsiveLayoutProps) {
  const {
    gameState,
    currentEvent,
    currentPolicies,
    log,
    hasChosen,
    turnPhase,
    trendHistory,
    lastSpeculatorAction,
    lastSpeculatorEffects,
    crisisLevel,
    lastDelta,
    marketFlash,
    lastRoundSummary,
    recommendedPolicyId,
    onChoose,
    onNextRound,
    onBack,
    onDismissSummary,
    dangerZone,
    tenseZone,
    isRevealing,
    bootedRef,
    onRestart,
  } = props;

  const mainClass = [
    'min-h-screen transition-all duration-1000',
    dangerZone ? 'scanlines' : '',
  ].join(' ');

  const bgStyle: React.CSSProperties = {
    background: '#F5F7FA',
    minHeight: '100vh',
  };

  // ── H5 布局：使用入口模式 ──────────────────────────────
  const H5Layout = () => (
    <SaviorActionHub
      gameState={gameState}
      currentEvent={currentEvent}
      currentPolicies={currentPolicies}
      log={log}
      hasChosen={hasChosen}
      turnPhase={turnPhase}
      trendHistory={trendHistory}
      lastSpeculatorAction={lastSpeculatorAction}
      lastSpeculatorEffects={lastSpeculatorEffects}
      crisisLevel={crisisLevel}
      lastDelta={lastDelta}
      marketFlash={marketFlash}
      recommendedPolicyId={recommendedPolicyId}
      onChoose={onChoose}
      onNextRound={onNextRound}
      onBack={onBack}
    />
  );

  // ── PC 布局：原有三栏网格 ──────────────────────────────
  const PCLayout = () => (
    <>
      {/* 顶部状态栏 */}
      <Header
        gameState={gameState}
        crisisLevel={crisisLevel}
        trendHistory={trendHistory}
        lastDelta={lastDelta}
        onBack={onBack}
      />

      {/* 主体布局 */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_280px] gap-3 sm:gap-5 items-start">

          {/* ── 左侧栏：事件 + 顾问 + 风险 ── */}
          <div className="space-y-3 sm:space-y-4 order-1">
            <div className="rounded-2xl bg-white border border-gray-200 p-3 sm:p-5 shadow-sm">
              <EventPanel currentEvent={currentEvent} log={log} isRevealing={isRevealing} />
            </div>

            <div className="space-y-4">
              <AdvisorPanel
                gameState={gameState}
                phase={(turnPhase === 'ai_action' || turnPhase === 'next_prompt' ? 'feedback' : turnPhase) as any}
                lastSpeculatorAction={lastSpeculatorAction}
                currentPolicies={currentPolicies}
                recommendedPolicyId={recommendedPolicyId}
              />
              <RiskSourcePanel gameState={gameState} />
            </div>
          </div>

          {/* ── 中间：决策中心 ── */}
          <div className="rounded-2xl bg-white border border-gray-200 p-3 sm:p-5 min-h-[400px] sm:min-h-[520px] shadow-sm order-2">
            <DecisionPanel
              policies={currentPolicies}
              onChoose={onChoose}
              hasChosen={hasChosen}
              onNextRound={onNextRound}
              isWaiting={!currentEvent && !hasChosen}
              turnPhase={turnPhase}
              recommendedPolicyId={recommendedPolicyId}
            />
          </div>

          {/* ── 右侧栏：数据面板 ── */}
          <div className="rounded-2xl bg-white border border-gray-200 p-3 sm:p-5 shadow-sm order-3">
            <DataPanel
              gameState={gameState}
              trendHistory={trendHistory}
              lastSpeculatorAction={lastSpeculatorAction}
              lastSpeculatorEffects={lastSpeculatorEffects}
              marketFlash={marketFlash}
            />
          </div>

        </div>

        {/* Footer */}
        <div className="text-center text-gray-400 text-xs mt-6 pb-4 font-mono tracking-widest">
          每个选择都有代价 · 没有无脑最优解 · 权衡与牺牲是唯一出路
        </div>
      </div>

      <SocialVoiceToast crisisLevel={crisisLevel} />
    </>
  );

  return (
    <div className={mainClass} style={bgStyle}>
      {dangerZone && <div className="red-filter" />}

      {/* 游戏结束 */}
      {gameState.phase !== 'playing' && (
        <GameOverScreen
          gameState={gameState}
          log={log}
          onRestart={() => {
            bootedRef.current = false;
            onRestart();
          }}
        />
      )}

      {/* 回合结算总结（next_prompt 阶段显示） */}
      {(turnPhase === 'next_prompt' || turnPhase === 'idle') && lastRoundSummary && (
        <RoundSummaryPanel summary={lastRoundSummary} onDismiss={onDismissSummary} />
      )}

      {/* 
        ── 响应式布局切换 ──
        PC (lg+): PCLayout 三栏网格
        H5 (<lg): H5Layout 入口模式
      */}
      {/* H5 端：使用入口模式 */}
      <div className="lg:hidden">
        <H5Layout />
      </div>

      {/* PC 端：使用三栏布局 */}
      <div className="hidden lg:block">
        <PCLayout />
      </div>
    </div>
  );
}
