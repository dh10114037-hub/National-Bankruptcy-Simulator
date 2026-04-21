import { create } from 'zustand';
import type { VersusGameState, SpecAction, SaviorAction } from '../types/versus';
import {
  createVersusState,
  buyIntelVersus,
  bribeIntelVersus,
  confirmIntelPhase,
  addSpecAction,
  removeSpecAction,
  confirmSpecPhase,
  chooseSaviorPolicy,
  runSettlement,
  advanceToNextTurn,
  calcVersusCrisis,
} from '../engine/versusEngine';

interface VersusStore {
  state: VersusGameState;
  crisisLevel: number;

  // Phase 1: 情报
  buyIntel:   (id: string) => void;
  bribeIntel: (id: string) => void;
  doneIntel:  () => void;

  // Phase 2: 投机者行动
  addAction:    (action: SpecAction) => void;
  removeAction: (idx: number) => void;
  doneSpec:     () => void;

  // Phase 3: 拯救者决策
  chooseSavior: (action: SaviorAction) => void;

  // Phase 4+5: 结算 + 下一回合
  runSettlement: () => void;
  nextTurn:      () => void;

  // 重置
  reset: () => void;
}

export const useVersusStore = create<VersusStore>((set, get) => {
  const fresh = createVersusState();
  return {
    state:       fresh,
    crisisLevel: calcVersusCrisis(fresh.country),

    buyIntel: (id) => {
      const s = buyIntelVersus(get().state, id);
      set({ state: s, crisisLevel: calcVersusCrisis(s.country) });
    },

    bribeIntel: (id) => {
      const s = bribeIntelVersus(get().state, id);
      set({ state: s, crisisLevel: calcVersusCrisis(s.country) });
    },

    doneIntel: () => {
      const s = confirmIntelPhase(get().state);
      set({ state: s });
    },

    addAction: (action) => {
      const s = addSpecAction(get().state, action);
      set({ state: s });
    },

    removeAction: (idx) => {
      const s = removeSpecAction(get().state, idx);
      set({ state: s });
    },

    doneSpec: () => {
      const s = confirmSpecPhase(get().state);
      set({ state: s });
    },

    chooseSavior: (action) => {
      const s = chooseSaviorPolicy(get().state, action);
      // 选完政策立刻自动结算
      const settled = runSettlement(s);
      set({ state: settled, crisisLevel: calcVersusCrisis(settled.country) });
    },

    runSettlement: () => {
      const s = runSettlement(get().state);
      set({ state: s, crisisLevel: calcVersusCrisis(s.country) });
    },

    nextTurn: () => {
      const s = advanceToNextTurn(get().state);
      set({ state: s, crisisLevel: calcVersusCrisis(s.country) });
    },

    reset: () => {
      const fresh = createVersusState();
      set({ state: fresh, crisisLevel: calcVersusCrisis(fresh.country) });
    },
  };
});
