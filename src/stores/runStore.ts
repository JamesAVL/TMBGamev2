import { create } from 'zustand';
import { sfx } from '../audio/sfx';
import {
  computeStats,
  UPGRADES,
  type RunStats,
  type UpgradeId,
} from '../game/progression/upgrades';
import { usePlayerStore } from './playerStore';

// In-run progression: resets every time the scene changes (a run is a run).
// The permanent meta layer arrives in Step 5.

const xpForLevel = (level: number) => Math.round(40 * Math.pow(1.5, level));

function rollChoices(picks: Partial<Record<UpgradeId, number>>): UpgradeId[] | null {
  const eligible = UPGRADES.filter((u) => (picks[u.id] ?? 0) < u.maxStacks).map((u) => u.id);
  if (eligible.length === 0) return null;
  for (let i = eligible.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = eligible[i]!;
    eligible[i] = eligible[j]!;
    eligible[j] = a;
  }
  return eligible.slice(0, Math.min(3, eligible.length));
}

type RunState = {
  xp: number;
  level: number;
  xpToNext: number;
  picks: Partial<Record<UpgradeId, number>>;
  pendingChoices: UpgradeId[] | null;
  stats: RunStats;
  addXp: (amount: number) => void;
  choosePick: (id: UpgradeId) => void;
  resetRun: () => void;
};

export const useRunStore = create<RunState>()((set, get) => ({
  xp: 0,
  level: 0,
  xpToNext: xpForLevel(0),
  picks: {},
  pendingChoices: null,
  stats: computeStats({}),
  addXp: (amount) => {
    const s = get();
    let xp = s.xp + amount;
    // only one pending pick at a time; surplus XP keeps and re-triggers after
    if (!s.pendingChoices && xp >= s.xpToNext) {
      xp -= s.xpToNext;
      const level = s.level + 1;
      const choices = rollChoices(s.picks);
      set({ xp, level, xpToNext: xpForLevel(level), pendingChoices: choices });
      sfx.levelUp();
      return;
    }
    set({ xp });
  },
  choosePick: (id) => {
    const s = get();
    if (!s.pendingChoices?.includes(id)) return;
    const picks = { ...s.picks, [id]: (s.picks[id] ?? 0) + 1 };
    // immediate effects
    if (id === 'shamansFlask') {
      usePlayerStore.getState().addMaxHp(1);
      usePlayerStore.getState().heal(1);
    }
    set({ picks, stats: computeStats(picks), pendingChoices: null });
    // banked XP can trigger the next level immediately
    if (get().xp >= get().xpToNext) get().addXp(0);
  },
  resetRun: () => {
    usePlayerStore.getState().clearMaxHpBonus();
    set({
      xp: 0,
      level: 0,
      xpToNext: xpForLevel(0),
      picks: {},
      pendingChoices: null,
      stats: computeStats({}),
    });
  },
}));
