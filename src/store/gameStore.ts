import { create } from 'zustand';
import type {
  GameState, Event, Policy, LogEntry, TrendPoint, TurnPhase,
  RoundSummary, AuxAction, DelayedEffect,
} from '../types/game';
import {
  createInitialState,
  getRandomEvent,
  getRandomPolicies,
  getRandomAuxActions,
  applyEffects,
  runSpeculatorAI,
  buildLogEntry,
  checkGameOver,
  calcCrisisLevel,
  applyExchangeRateCoupling,
  tickMarket,
  applyRecoverySystem,
  applyDeathBuffer,
  applyWinStreakBonus,
} from '../engine/gameEngine';
import { generateRecommendedPolicy } from '../engine/advisorSavior';
import { buildPostMortem } from '../engine/postMortem';
import type { PostMortem } from '../types/game';

interface GameStore {
  gameState: GameState;
  currentEvent: Event | null;
  currentPolicies: Policy[];
  log: LogEntry[];
  hasChosen: boolean;
  turnPhase: TurnPhase;
  trendHistory: TrendPoint[];
  lastSpeculatorAction: string | null;
  lastSpeculatorEffects: Record<string, number> | null;
  crisisLevel: number;
  lastDelta: { foreign_reserves: number; public_support: number; credit_rating: number } | null;
  marketFlash: { exchange_rate?: 'up' | 'down'; inflation?: 'up' | 'down' } | null;
  lastRoundSummary: RoundSummary | null;
  recommendedPolicyId: string | null;

  // ── 新增：辅助操作 ──────────────────────────────
  currentAuxActions: AuxAction[];
  selectedAuxActions: AuxAction[];

  // ── 新增：延迟效果队列 ──────────────────────────
  delayedEffectQueue: DelayedEffect[];

  // ── 新增：失败复盘 ──────────────────────────────
  postMortem: PostMortem | null;

  // ── 新增：投机者连续攻击计数 ──────────────────
  consecutiveSpeculatorAttacks: number;

  startNewRound: () => void;
  choosePolicy: (policy: Policy) => void;
  restartGame: () => void;
  advanceTurnPhase: (phase: TurnPhase) => void;
  dismissRoundSummary: () => void;

  // ── 新增 actions ─────────────────────────────────
  toggleAuxAction: (action: AuxAction) => void;
  confirmAuxActions: () => void;
  skipAuxActions: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: createInitialState(),
  currentEvent: null,
  currentPolicies: [],
  log: [],
  hasChosen: false,
  turnPhase: 'idle',
  trendHistory: [],
  lastSpeculatorAction: null,
  lastSpeculatorEffects: null,
  crisisLevel: 0,
  lastDelta: null,
  marketFlash: null,
  lastRoundSummary: null,
  recommendedPolicyId: null,
  currentAuxActions: [],
  selectedAuxActions: [],
  delayedEffectQueue: [],
  postMortem: null,
  consecutiveSpeculatorAttacks: 0,

  advanceTurnPhase: (phase) => set({ turnPhase: phase }),
  dismissRoundSummary: () => set({ lastRoundSummary: null }),

  // ── 切换辅助操作选中状态 ─────────────────────────
  toggleAuxAction: (action: AuxAction) => {
    const { selectedAuxActions, gameState } = get();
    const isSelected = selectedAuxActions.some((a) => a.id === action.id);

    if (isSelected) {
      set({ selectedAuxActions: selectedAuxActions.filter((a) => a.id !== action.id) });
      return;
    }

    // 最多选1个
    if (selectedAuxActions.length >= 1) return;

    // 检查资源是否足够
    const cost = action.cost;
    if (
      (cost.foreign_reserves && gameState.foreign_reserves < cost.foreign_reserves + 5) ||
      (cost.public_support && gameState.public_support < cost.public_support + 5) ||
      (cost.credit_rating && gameState.credit_rating < cost.credit_rating + 5)
    ) {
      return; // 资源不足，不允许选
    }

    set({ selectedAuxActions: [...selectedAuxActions, action] });
  },

  // ── 确认辅助操作 → 触发 choosePolicy 流程 ────────
  confirmAuxActions: () => {
    // 辅助操作在 choosePolicy 中被读取并应用
    set({ turnPhase: 'feedback' });
  },

  skipAuxActions: () => {
    set({ selectedAuxActions: [], turnPhase: 'feedback' });
  },

  startNewRound: () => {
    const { gameState } = get();
    if (gameState.phase !== 'playing') return;
    const event = getRandomEvent();
    const policies = getRandomPolicies(3);
    const auxActions = getRandomAuxActions(2);
    const recommendedPolicyId = generateRecommendedPolicy(gameState, policies);
    set({
      currentEvent: event,
      currentPolicies: policies,
      currentAuxActions: auxActions,
      selectedAuxActions: [],
      hasChosen: false,
      turnPhase: 'event_reveal',
      lastDelta: null,
      marketFlash: null,
      lastRoundSummary: null,
      recommendedPolicyId,
    });
    setTimeout(() => set({ turnPhase: 'decision' }), 800);
  },

  choosePolicy: (policy: Policy) => {
    const { gameState, currentEvent, log, trendHistory, selectedAuxActions, delayedEffectQueue } = get();
    if (!currentEvent || gameState.phase !== 'playing') return;

    const statsBefore = {
      foreign_reserves: gameState.foreign_reserves,
      public_support:   gameState.public_support,
      credit_rating:    gameState.credit_rating,
      market:           gameState.market,
    };

    // Step 1: event effects
    let newStats = applyEffects(statsBefore, currentEvent.effects);
    if (!newStats.market) newStats.market = gameState.market;

    // Step 2: policy effects
    newStats = applyEffects(newStats, policy.effects);
    if (!newStats.market) newStats.market = gameState.market;

    // Step 3: 应用辅助操作（立即效果）
    const appliedAuxNames: string[] = [];
    const newDelayedQueue: DelayedEffect[] = [...delayedEffectQueue];

    for (const aux of selectedAuxActions) {
      // 扣除资源消耗
      newStats = {
        ...newStats,
        foreign_reserves: newStats.foreign_reserves - (aux.cost.foreign_reserves ?? 0),
        public_support:   newStats.public_support - (aux.cost.public_support ?? 0),
        credit_rating:    newStats.credit_rating - (aux.cost.credit_rating ?? 0),
      };
      // 应用立即效果
      if (aux.immediateEffect) {
        newStats = applyEffects(newStats, aux.immediateEffect);
      }
      // 注册延迟效果
      if (aux.delayedEffect) {
        newDelayedQueue.push({
          id: `${aux.id}-${gameState.turn}`,
          triggerTurn: gameState.turn + aux.delayedEffect.turns,
          effect: aux.delayedEffect.effect,
          sourceName: aux.name,
          description: aux.delayedEffect.description,
        });
      }
      appliedAuxNames.push(aux.name);
    }

    // Step 4: 触发当前回合到期的延迟效果
    const triggeredDelayNames: string[] = [];
    const remainingQueue: DelayedEffect[] = [];
    for (const de of newDelayedQueue) {
      if (de.triggerTurn <= gameState.turn) {
        newStats = applyEffects(newStats, de.effect);
        triggeredDelayNames.push(de.description);
      } else {
        remainingQueue.push(de);
      }
    }

    // Step 5: market tick
    let newMarket = tickMarket(newStats.market!);

    // Step 6: 数值联动
    const coupledStats = applyExchangeRateCoupling(
      { foreign_reserves: newStats.foreign_reserves, public_support: newStats.public_support, credit_rating: newStats.credit_rating },
      newMarket
    );
    newStats = { ...newStats, ...coupledStats };
    newMarket = coupledStats.market;

    // Step 7: 投机者AI（带context：回合数+连续攻击次数）
    const specContext = {
      turn: gameState.turn,
      consecutiveAttacks: get().consecutiveSpeculatorAttacks,
    };
    const specAction = runSpeculatorAI({
      foreign_reserves: newStats.foreign_reserves,
      public_support:   newStats.public_support,
      credit_rating:    newStats.credit_rating,
      market:           newMarket,
    }, specContext);

    // 更新连续攻击计数
    const isAttacking = specAction && specAction.actionType !== 'wait' && specAction.effects && Object.keys(specAction.effects).length > 0;
    const newConsecutiveAttacks = isAttacking ? gameState.consecutiveSpeculatorAttacks + 1 : 0;

    if (specAction && specAction.effects && Object.keys(specAction.effects).length > 0) {
      newStats = applyEffects(newStats, specAction.effects);
      if (!newStats.market) newStats.market = newMarket;
      if (specAction.effects.exchange_rate || specAction.effects.inflation) {
        const reCoupled = applyExchangeRateCoupling(
          { foreign_reserves: newStats.foreign_reserves, public_support: newStats.public_support, credit_rating: newStats.credit_rating },
          newStats.market!
        );
        newStats = { ...newStats, ...reCoupled };
        newMarket = reCoupled.market;
      }
    }

    // Step 8: 恢复机制（稳住后回血）
    const recoveredStats = applyRecoverySystem({
      foreign_reserves: newStats.foreign_reserves,
      public_support:   newStats.public_support,
      credit_rating:    newStats.credit_rating,
    });
    newStats = { ...newStats, ...recoveredStats };

    // Step 8.5: win streak（先算上回合，用于连胜奖励判断）
    const allGood =
      newStats.foreign_reserves > 60 &&
      newStats.public_support   > 60 &&
      newStats.credit_rating    > 60;
    const newWinStreak = allGood ? gameState.winStreak + 1 : 0;

    // Step 8.6: 连胜奖励（winStreak >= 3 → 外储+5）
    const streakBoosted = applyWinStreakBonus({
      foreign_reserves: newStats.foreign_reserves,
      public_support:   newStats.public_support,
      credit_rating:    newStats.credit_rating,
    }, newWinStreak);
    newStats = { ...newStats, ...streakBoosted };

    // Step 8.7: 死亡缓冲（任何指标降至0时托底为5）
    const { state: bufferedStats } = applyDeathBuffer({
      foreign_reserves: newStats.foreign_reserves,
      public_support:   newStats.public_support,
      credit_rating:    newStats.credit_rating,
      market:           newMarket,
    });
    newStats = { ...newStats, ...bufferedStats };

    const nextTurn = gameState.turn + 1;
    const newGameState: GameState = {
      ...gameState,
      foreign_reserves: newStats.foreign_reserves,
      public_support:   newStats.public_support,
      credit_rating:    newStats.credit_rating,
      market:           newMarket,
      turn: nextTurn,
      winStreak: newWinStreak,
    };

    // Step 9: game over check
    const { phase, reason } = checkGameOver(newGameState);
    newGameState.phase = phase;
    if (reason) newGameState.defeatReason = reason;

    // Step 10: log
    const entry = buildLogEntry(
      gameState.turn, currentEvent, policy, statsBefore, newStats, specAction,
      appliedAuxNames, triggeredDelayNames
    );

    // Step 11: delta
    const delta = {
      foreign_reserves: newStats.foreign_reserves - statsBefore.foreign_reserves,
      public_support:   newStats.public_support   - statsBefore.public_support,
      credit_rating:    newStats.credit_rating     - statsBefore.credit_rating,
    };

    // Step 12: market flash
    const marketFlash: { exchange_rate?: 'up' | 'down'; inflation?: 'up' | 'down' } = {};
    if (newMarket.exchange_rate > statsBefore.market.exchange_rate) marketFlash.exchange_rate = 'up';
    else if (newMarket.exchange_rate < statsBefore.market.exchange_rate) marketFlash.exchange_rate = 'down';
    if (newMarket.inflation > statsBefore.market.inflation) marketFlash.inflation = 'up';
    else if (newMarket.inflation < statsBefore.market.inflation) marketFlash.inflation = 'down';

    // Step 13: trend history
    const newTrend: TrendPoint = {
      turn: gameState.turn,
      foreign_reserves: newStats.foreign_reserves,
      public_support:   newStats.public_support,
      credit_rating:    newStats.credit_rating,
    };

    // Step 14: crisis level
    const crisisLevel = calcCrisisLevel(newStats);

    // Step 15: round summary
    const chainEffects = buildChainEffects(
      delta, newMarket, statsBefore.market, specAction?.name,
      appliedAuxNames, triggeredDelayNames
    );
    const roundSummary: RoundSummary = {
      turn: gameState.turn,
      policyName: policy.name,
      policyIcon: policy.icon,
      eventName: currentEvent.name,
      delta,
      chainEffects,
      speculatorNote: specAction && specAction.actionType !== 'wait' ? specAction.name : undefined,
    };

    // Step 16: 如果游戏结束，生成复盘报告
    const newLog = [entry, ...log];
    const postMortem = phase !== 'playing'
      ? buildPostMortem(newGameState, newLog)
      : null;

    set({
      gameState: newGameState,
      log: newLog,
      hasChosen: true,
      turnPhase: 'feedback',
      trendHistory: [...trendHistory.slice(-9), newTrend],
      lastSpeculatorAction: specAction.name !== '⏳ 观望待机' ? specAction.name : null,
      lastSpeculatorEffects: specAction.effects as Record<string, number> | null,
      crisisLevel,
      lastDelta: delta,
      marketFlash,
      currentEvent: phase === 'playing' ? null : currentEvent,
      lastRoundSummary: roundSummary,
      delayedEffectQueue: remainingQueue,
      selectedAuxActions: [],
      postMortem,
      consecutiveSpeculatorAttacks: newConsecutiveAttacks,
    });

    setTimeout(() => set({ turnPhase: 'ai_action' }), 800);
    setTimeout(() => set({ turnPhase: 'next_prompt' }), 1800);
  },

  restartGame: () => {
    set({
      gameState: createInitialState(),
      currentEvent: null,
      currentPolicies: [],
      log: [],
      hasChosen: false,
      turnPhase: 'idle',
      trendHistory: [],
      lastSpeculatorAction: null,
      lastSpeculatorEffects: null,
      crisisLevel: 0,
      lastDelta: null,
      marketFlash: null,
      lastRoundSummary: null,
      recommendedPolicyId: null,
      currentAuxActions: [],
      selectedAuxActions: [],
      delayedEffectQueue: [],
      postMortem: null,
      consecutiveSpeculatorAttacks: 0,
    });
  },
}));

// ─── Helper: 生成连锁影响说明 ──────────────────────────────────────
function buildChainEffects(
  delta: { foreign_reserves: number; public_support: number; credit_rating: number },
  newMarket: { exchange_rate: number; inflation: number; volatility: number },
  oldMarket: { exchange_rate: number; inflation: number; volatility: number },
  specName?: string,
  auxNames: string[] = [],
  delayNames: string[] = []
): string[] {
  const chains: string[] = [];

  if (delta.foreign_reserves <= -15) {
    chains.push('外汇储备大幅下降 → 汇率承压，投机者做空信号增强');
  } else if (delta.foreign_reserves >= 15) {
    chains.push('外储补充明显 → 短期汇率压力缓解');
  }

  if (delta.credit_rating <= -10) {
    chains.push('信用评级下降 → 国际融资成本上升，下回合借贷能力减弱');
  } else if (delta.credit_rating >= 10) {
    chains.push('信用改善 → 国际投资者信心回升');
  }

  if (delta.public_support <= -10) {
    chains.push('民心显著下降 → 社会不稳定风险上升，投机者情绪放大');
  } else if (delta.public_support >= 10) {
    chains.push('民心改善 → 社会稳定性增强，抵御危机能力提升');
  }

  const inflDiff = newMarket.inflation - oldMarket.inflation;
  if (inflDiff > 5) {
    chains.push(`通胀上升 ${inflDiff.toFixed(0)}% → 购买力下降，民众不满情绪积累`);
  } else if (inflDiff < -3) {
    chains.push(`通胀回落 ${Math.abs(inflDiff).toFixed(0)}% → 生活成本压力减轻`);
  }

  const erDiff = newMarket.exchange_rate - oldMarket.exchange_rate;
  if (erDiff < -0.05) {
    chains.push('汇率下跌 → 进口商品变贵，通胀将进一步恶化');
  } else if (erDiff > 0.03) {
    chains.push('汇率回升 → 进口成本降低，通胀压力减缓');
  }

  if (specName && specName !== '⏳ 观望待机') {
    chains.push(`投机者趁机行动：${specName}`);
  }

  // 辅助操作说明
  if (auxNames.length > 0) {
    chains.push(`辅助操作已执行：${auxNames.join('、')}`);
  }

  // 延迟效果触发
  if (delayNames.length > 0) {
    chains.push(`⏰ 延迟效果触发：${delayNames[0]}`);
  }

  if (chains.length === 0) {
    chains.push('各项指标变化平稳，无明显连锁反应');
  }

  return chains;
}
