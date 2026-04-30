import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameStore } from './store/gameStore';
import { useSpeculatorStore } from './store/speculatorStore';
import { ModeSelect } from './components/ModeSelect';
import { SpeculatorView } from './components/speculator/SpeculatorView';
import { VersusView } from './components/versus/VersusView';
import { ResponsiveLayout } from './components/layout';
import { AuxActionPanel } from './components/AuxActionPanel';
import { PostMortemScreen } from './components/PostMortemScreen';
import './App.css';

type AppMode = 'select' | 'savior' | 'speculator' | 'versus';

export default function App() {
  const [mode, setMode] = useState<AppMode>('select');
  const [showAuxPanel, setShowAuxPanel] = useState(false);
  const [pendingPolicy, setPendingPolicy] = useState<any>(null);

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
    currentAuxActions,
    selectedAuxActions,
    delayedEffectQueue,
    postMortem,
    startNewRound,
    choosePolicy,
    restartGame,
    advanceTurnPhase,
    dismissRoundSummary,
    toggleAuxAction,
  } = useGameStore();

  const { state: specState, saveToSlot: specSave, loadFromSlot: specLoad } = useSpeculatorStore();

  // Auto-start first round
  const bootedRef = useRef(false);
  useEffect(() => {
    if (
      mode === 'savior' &&
      !bootedRef.current &&
      gameState.phase === 'playing' &&
      !currentEvent &&
      !hasChosen
    ) {
      bootedRef.current = true;
      startNewRound();
    }
  }, [mode]);

  useEffect(() => {
    if (gameState.turn === 1 && !currentEvent && !hasChosen) {
      bootedRef.current = false;
    }
  }, [gameState.turn]);

  const handleNextRound = () => {
    dismissRoundSummary();
    advanceTurnPhase('idle');
    startNewRound();
  };

  // 玩家点击政策卡片时，先弹出辅助操作面板
  const handlePolicyChoose = (policy: any) => {
    setPendingPolicy(policy);
    setShowAuxPanel(true);
  };

  // 辅助操作确认或跳过后，才真正提交政策
  const handleAuxConfirm = () => {
    setShowAuxPanel(false);
    if (pendingPolicy) {
      choosePolicy(pendingPolicy);
      setPendingPolicy(null);
    }
  };

  const handleAuxSkip = () => {
    setShowAuxPanel(false);
    if (pendingPolicy) {
      choosePolicy(pendingPolicy);
      setPendingPolicy(null);
    }
  };

  // ── 存档/读档回调 ──────────────────────────────────────────
  const handleLoadSave = (loadMode: 'savior' | 'speculator' | 'versus') => {
    if (loadMode === 'speculator') {
      specLoad(0);
      setMode('speculator');
    } else {
      // 拯救者模式：目前重置（简化实现）
      // TODO: 后续实现拯救者模式的存档
      setMode(loadMode);
    }
  };

  const handleSaveCurrent = (slot: number) => {
    if (mode === 'speculator') {
      specSave(slot);
    }
    // 拯救者模式暂不支持
  };

  // ── 模式选择页 ──
  if (mode === 'select') {
    return (
      <ModeSelect
        onSelect={(m) => setMode(m)}
        onLoadSave={handleLoadSave}
        onSaveCurrent={handleSaveCurrent}
        currentMode={null}
      />
    );
  }

  // ── 投机者模式 ──
  if (mode === 'speculator') {
    return (
      <div>
        <SpeculatorView onBack={() => setMode('select')} />
      </div>
    );
  }

  // ── 双人对抗模式 ──
  if (mode === 'versus') {
    return (
      <div>
        <VersusView onBack={() => setMode('select')} />
      </div>
    );
  }

  // ── 拯救者模式 ──
  const dangerZone  = crisisLevel >= 70;
  const tenseZone   = crisisLevel >= 40 && crisisLevel < 70;
  const isRevealing = turnPhase === 'event_reveal';

  // 延迟效果提醒（即将触发的）
  const upcomingDelays = delayedEffectQueue.map((d) => ({
    description: d.description,
    triggerTurn: d.triggerTurn,
  }));

  return (
    <>
      <ResponsiveLayout
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
        lastRoundSummary={lastRoundSummary}
        recommendedPolicyId={recommendedPolicyId}
        onChoose={handlePolicyChoose}
        onNextRound={handleNextRound}
        onBack={() => setMode('select')}
        onDismissSummary={dismissRoundSummary}
        dangerZone={dangerZone}
        tenseZone={tenseZone}
        isRevealing={isRevealing}
        bootedRef={bootedRef}
        onRestart={() => {
          bootedRef.current = false;
          restartGame();
          setTimeout(() => startNewRound(), 50);
        }}
      />

      {/* 辅助操作面板 */}
      <AnimatePresence>
        {showAuxPanel && (
          <AuxActionPanel
            auxActions={currentAuxActions}
            selected={selectedAuxActions}
            gameState={gameState}
            onToggle={toggleAuxAction}
            onConfirm={handleAuxConfirm}
            onSkip={handleAuxSkip}
            pendingDelays={upcomingDelays}
            currentTurn={gameState.turn}
          />
        )}
      </AnimatePresence>

      {/* 失败复盘页面 */}
      <AnimatePresence>
        {postMortem && gameState.phase !== 'playing' && gameState.phase !== 'victory' && (
          <PostMortemScreen
            postMortem={postMortem}
            turn={gameState.turn}
            onRestart={() => {
              bootedRef.current = false;
              restartGame();
              setTimeout(() => startNewRound(), 50);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
