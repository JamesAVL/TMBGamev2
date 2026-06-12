import { create } from 'zustand';
import { sfx } from '../audio/sfx';
import {
  computeStats,
  SKILLS,
  type RunStats,
  type SkillId,
  type SkillPoints,
} from '../game/progression/skills';
import { usePlayerStore } from './playerStore';

// In-run progression: resets every time the scene changes (a run is a run).
// The permanent meta layer arrives with the hub.

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
  resetRun: () => void;
};

export const useRunStore = create<RunState>()((set, get) => ({
  xp: 0,
  level: 0,
  xpToNext: xpForLevel(0),
  // every run opens with one point to spend — points earned always equal the
  // level badge, which starts at 1
  unspentPoints: 1,
  points: {},
  panelOpen: false,
  stats: computeStats({}),
  addXp: (amount) => {
    let { xp, level, xpToNext, unspentPoints } = get();
    xp += amount;
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
}));
