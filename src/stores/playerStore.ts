import { create } from 'zustand';

const MAX_HP = 5;
const INVULN_SECONDS = 0.6; // i-frames so overlapping strikes don't double-hit

type PlayerState = {
  hp: number;
  maxHp: number;
  dead: boolean;
  hitCount: number; // increments every hit taken — keys the damage-flash animation
  lastDamagedAt: number;
  damagePlayer: (amount: number) => void;
  respawnPlayer: () => void;
};

export const usePlayerStore = create<PlayerState>()((set, get) => ({
  hp: MAX_HP,
  maxHp: MAX_HP,
  dead: false,
  hitCount: 0,
  lastDamagedAt: -Infinity,
  damagePlayer: (amount) => {
    const s = get();
    const now = performance.now() / 1000;
    if (s.dead || now - s.lastDamagedAt < INVULN_SECONDS) return;
    const hp = Math.max(0, s.hp - amount);
    set({ hp, dead: hp === 0, hitCount: s.hitCount + 1, lastDamagedAt: now });
  },
  respawnPlayer: () => set({ hp: MAX_HP, dead: false }),
}));
