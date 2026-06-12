import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sfx } from '../audio/sfx';
import {
  computeStats,
  SKILLS,
  type RunStats,
  type SkillId,
  type SkillPoints,
} from '../game/progression/skills';
import { usePlayerStore } from './playerStore';

// Progression persists: across scenes, through death, and across refreshes
// (localStorage). The hub will formalise the meta layer later; for now what
// you earn is yours.

const xpForLevel = (level: number) => Math.round(40 * Math.pow(1.5, level));

type RunState = {
  xp: number;
  level: number;
  xpToNext: number;
  unspentPoints: number;
  points: SkillPoints;
  panelOpen: boolean;
  stats: RunStats;
  addXp: (amount: number) => void;
  spendPoint: (id: SkillId) => void;
  setPanelOpen: (open: boolean) => void;
  resetRun: () => void; // kept for a future "new game" — not used in flow
};

export const useRunStore = create<RunState>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 0,
      xpToNext: xpForLevel(0),
      // every fresh save opens with one point — points earned always equal the
      // level badge, which starts at 1
      unspentPoints: 1,
      points: {},
      panelOpen: false,
      stats: computeStats({}),
      addXp: (amount) => {
        let { xp, level, xpToNext, unspentPoints } = get();
        xp += Math.round(amount * get().stats.shared.xpMult);
        let leveled = false;
        while (xp >= xpToNext) {
          xp -= xpToNext;
          level += 1;
          unspentPoints += 1;
          xpToNext = xpForLevel(level);
          leveled = true;
        }
        set({ xp, level, xpToNext, unspentPoints });
        if (leveled) sfx.levelUp();
      },
      spendPoint: (id) => {
        const s = get();
        if (s.unspentPoints <= 0) return;
        const def = SKILLS.find((d) => d.id === id);
        const current = s.points[id] ?? 0;
        if (!def || current >= def.maxPoints) return;
        const points = { ...s.points, [id]: current + 1 };
        if (id === 'shamansFlask') {
          usePlayerStore.getState().addMaxHp(1);
          usePlayerStore.getState().heal(1);
        }
        set({ points, unspentPoints: s.unspentPoints - 1, stats: computeStats(points) });
        sfx.spend();
      },
      setPanelOpen: (open) => set({ panelOpen: open }),
      resetRun: () => {
        usePlayerStore.getState().clearMaxHpBonus();
        set({
          xp: 0,
          level: 0,
          xpToNext: xpForLevel(0),
          unspentPoints: 1,
          points: {},
          panelOpen: false,
          stats: computeStats({}),
        });
      },
    }),
    {
      name: 'tmb-progression',
      partialize: (s) => ({
        xp: s.xp,
        level: s.level,
        xpToNext: s.xpToNext,
        unspentPoints: s.unspentPoints,
        points: s.points,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<RunState>;
        const points = p.points ?? {};
        return {
          ...current,
          ...p,
          points,
          stats: computeStats(points),
          panelOpen: false,
        };
      },
    },
  ),
);

// Re-apply the Flask's max-hp bonus after rehydration (playerStore doesn't
// persist; it derives). localStorage hydration is synchronous.
const flask = useRunStore.getState().points.shamansFlask ?? 0;
if (flask > 0) usePlayerStore.getState().addMaxHp(flask);
