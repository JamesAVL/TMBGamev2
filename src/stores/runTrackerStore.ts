import { create } from 'zustand';

// Per-run scoreboard (not persisted). Activated entering a realm; finalized
// on the way out; the HUD shows the card back at the shop.
export type RunOutcome = 'cleared' | 'died';

export type RunSummary = {
  outcome: RunOutcome;
  seconds: number;
  kills: number;
  euros: number;
  levels: number;
};

type RunTrackerState = {
  active: boolean;
  startedAt: number; // wall-clock seconds
  startLevel: number;
  kills: number;
  euros: number;
  lastSummary: RunSummary | null;
  start: (currentLevel: number) => void;
  addKill: () => void;
  addEuros: (n: number) => void;
  finalize: (outcome: RunOutcome, currentLevel: number) => void;
  discard: () => void;
  dismissSummary: () => void;
};

export const useRunTracker = create<RunTrackerState>()((set, get) => ({
  active: false,
  startedAt: 0,
  startLevel: 0,
  kills: 0,
  euros: 0,
  lastSummary: null,
  start: (currentLevel) =>
    set({
      active: true,
      startedAt: performance.now() / 1000,
      startLevel: currentLevel,
      kills: 0,
      euros: 0,
    }),
  addKill: () => {
    if (get().active) set((s) => ({ kills: s.kills + 1 }));
  },
  addEuros: (n) => {
    if (get().active) set((s) => ({ euros: s.euros + n }));
  },
  finalize: (outcome, currentLevel) => {
    const s = get();
    if (!s.active) return;
    set({
      active: false,
      lastSummary: {
        outcome,
        seconds: Math.max(0, performance.now() / 1000 - s.startedAt),
        kills: s.kills,
        euros: s.euros,
        levels: Math.max(0, currentLevel - s.startLevel),
      },
    });
  },
  discard: () => set({ active: false }),
  dismissSummary: () => set({ lastSummary: null }),
}));
