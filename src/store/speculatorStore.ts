import { create } from 'zustand';
import type { SpeculatorGameState, SpecNotif, TradeOrder } from '../types/speculator';
import type { StoryState, StoryChoice } from '../types/story';
import {
  createSpeculatorState,
  executeTrade,
  closePosition,
  buyIntel,
  bribeIntel,
  executeManipulation,
  advanceSpecTurn,
} from '../engine/speculatorEngine';
import {
  createStoryState,
  checkAndTriggerEvent,
  makeChoice,
  advanceStoryTurn,
} from '../engine/storyEngine';

interface SpeculatorStore {
  state: SpeculatorGameState;
  story: StoryState;
  // 剧情相关
  hasActiveStory: boolean;

  // 交易
  openTrade: (order: TradeOrder) => void;
  closeTrade: (posId: string) => void;

  // 情报
  purchaseIntel: (intelId: string) => void;
  bribeForIntel: (intelId: string) => void;

  // 操控市场
  triggerManipulation: (actionId: string) => void;

  // 回合推进
  nextTurn: () => void;

  // 剧情选择
  makeStoryChoice: (choice: StoryChoice) => void;

  // 通知管理
  dismissNotif: (id: string) => void;
  pushNotif: (notif: SpecNotif) => void;

  // 重置
  resetGame: () => void;
}

export const useSpeculatorStore = create<SpeculatorStore>((set, get) => ({
  state: createSpeculatorState(),
  story: createStoryState(),
  hasActiveStory: false,

  openTrade: (order) => {
    const { state } = get();
    if (state.assets.cash < order.amount) {
      get().pushNotif({
        id: `err_${Date.now()}`,
        type: 'manipulation_fail',
        message: '资金不足，无法开仓',
        timestamp: Date.now(),
      });
      return;
    }
    const { newState, notif } = executeTrade(state, order);
    set({ state: newState });
    get().pushNotif(notif);
  },

  closeTrade: (posId) => {
    const { state } = get();
    const { newState, notif } = closePosition(state, posId);
    set({ state: newState });
    get().pushNotif(notif);
  },

  purchaseIntel: (intelId) => {
    const { state } = get();
    const newState = buyIntel(state, intelId);
    set({ state: newState });
  },

  bribeForIntel: (intelId) => {
    const { state } = get();
    const newState = bribeIntel(state, intelId);
    set({ state: newState });
  },

  triggerManipulation: (actionId) => {
    const { state } = get();
    const { newState, notif } = executeManipulation(state, actionId);
    set({ state: newState });
    get().pushNotif(notif);
  },

  nextTurn: () => {
    const { state, story } = get();

    // 1. 推进剧情回合
    const advancedStory = advanceStoryTurn(story);

    // 2. 推进游戏回合（使用当前剧情状态判断是否触发新事件）
    const countryMetrics = {
      public_support: 70 - state.market.inflation * 0.5,
      credit_rating: state.market.credit_rating,
      inflation: state.market.inflation,
      foreign_reserves: 50 - state.market.exchange_rate * 30,
    };

    // 3. 检测剧情事件
    const storyAfterCheck = checkAndTriggerEvent(
      advancedStory,
      state.market,
      countryMetrics
    );

    // 4. 如果有触发的事件，先不推进游戏，等玩家选择
    if (storyAfterCheck.currentEvent) {
      set({
        story: storyAfterCheck,
        hasActiveStory: true,
      });
      return;
    }

    // 5. 没有触发事件，正常推进游戏回合
    const { newState, notifs } = advanceSpecTurn(state);
    set({ state: newState, story: storyAfterCheck });
    notifs.forEach((n) => get().pushNotif(n));
  },

  makeStoryChoice: (choice) => {
    const { state, story } = get();

    // 处理选择
    const newStory = makeChoice(story, choice);

    // 应用效果到市场
    const effects = choice.effects;
    const newMarket = { ...state.market };

    if (effects.exchange_rate) {
      newMarket.exchange_rate = Math.max(0.1, Math.min(2.0, newMarket.exchange_rate + effects.exchange_rate));
    }
    if (effects.bond_price) {
      newMarket.bond_price = Math.max(0.05, Math.min(1.0, newMarket.bond_price + effects.bond_price));
    }
    if (effects.stock_index) {
      newMarket.stock_index = Math.max(500, Math.min(5000, newMarket.stock_index + effects.stock_index));
    }

    // 推进游戏回合
    const { newState, notifs } = advanceSpecTurn({ ...state, market: newMarket });

    // 添加剧情通知
    const choiceResult = choice.successRate !== undefined && Math.random() < choice.successRate;
    get().pushNotif({
      id: `story_${Date.now()}`,
      type: choiceResult ? 'profit' : 'loss',
      message: choiceResult
        ? `✓ ${choice.text}成功！`
        : `✗ ${choice.text}失败...`,
      amount: choiceResult ? 1 : 0,
      timestamp: Date.now(),
    });

    set({
      state: newState,
      story: newStory,
      hasActiveStory: false,
    });
    notifs.forEach((n) => get().pushNotif(n));
  },

  pushNotif: (notif) => {
    set((s) => ({
      state: {
        ...s.state,
        notifications: [notif, ...s.state.notifications].slice(0, 8),
      },
    }));
    // 5秒后自动消除
    setTimeout(() => get().dismissNotif(notif.id), 5000);
  },

  dismissNotif: (id) => {
    set((s) => ({
      state: {
        ...s.state,
        notifications: s.state.notifications.filter((n) => n.id !== id),
      },
    }));
  },

  resetGame: () => {
    set({
      state: createSpeculatorState(),
      story: createStoryState(),
      hasActiveStory: false,
    });
  },
}));
