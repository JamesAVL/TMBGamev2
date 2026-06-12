import { create } from 'zustand';
import { runtime } from '../game/combat/runtime';

const BASE_HP = 5;
const INVULN_SECONDS = 0.6; // i-frames so overlapping strikes don't double-hit

type PlayerState = {
  hp: number;
  maxHp: number; // BASE_HP + run bonuses (Shaman's Flask); reset with the run
  dead: boolean;
  hitCount: number; // increments every hit taken — keys the damage-flash animation
  lastDamagedAt: number;
  frozenUntil: number; // game-clock time; the Black Frost's signature
  damagePlayer: (amount: number) => void;
  freezePlayer: (seconds: number) => void;
  heal: (amount: number) => void;
  addMaxHp: (amount: number) => void;
  clearMaxHpBonus: () => void;
  respawnPlayer: () => void;
};

export const usePlayerStore = create<PlayerState>()((set, get) => ({
  hp: BASE_HP,
  maxHp: BASE_HP,
  dead: false,
  hitCount: 0,
  lastDamagedAt: -Infinity,
  frozenUntil: 0,
  damagePlayer: (amount) => {
    const s = get();
    const now = runtime.time;
    if (s.dead || now - s.lastDamagedAt < INVULN_SECONDS) return;
    const hp = Math.max(0, s.hp - amount);
    set({ hp, dead: hp === 0, hitCount: s.hitCount + 1, lastDamagedAt: now });
  },
  freezePlayer: (seconds) => {
    const s = get();
    if (s.dead) return;
    set({ frozenUntil: Math.max(s.frozenUntil, runtime.time + seconds) });
  },
  heal: (amount) => {
    const s = get();
    if (s.dead || s.hp >= s.maxHp) return;
    set({ hp: Math.min(s.maxHp, s.hp + amount) });
  },
  addMaxHp: (amount) => set((s) => ({ maxHp: s.maxHp + amount })),
  clearMaxHpBonus: () => set((s) => ({ maxHp: BASE_HP, hp: Math.min(s.hp, BASE_HP) })),
  respawnPlayer: () => set((s) => ({ hp: s.maxHp, dead: false })),
}));
