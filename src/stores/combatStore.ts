import { create } from 'zustand';
import { HITCHER_SPAWNS } from '../game/enemies/spawns';

const ENEMY_HP = 3;
const RESPAWN_DELAY = 10; // seconds dead before a Hitcher reappears at his spawn

export type EnemyEntry = {
  hp: number;
  alive: boolean;
  aggro: boolean;
  lastHitAt: number; // performance.now()/1000 of the last hit taken
  diedAt: number;
  respawnAt: number; // 0 = none scheduled
  spawn: [number, number, number];
};

type CombatState = {
  enemies: Record<string, EnemyEntry>;
  lastAttackAt: number; // player's last swipe, drives the arc visual
  hitStopActive: boolean; // brief physics freeze on connect, for punch
  registerAttack: () => void;
  damageEnemy: (id: string, amount: number) => 'dead' | 'hit' | 'none';
  setAggro: (id: string, aggro: boolean) => void;
  respawnEnemy: (id: string) => void;
  triggerHitStop: (ms: number) => void;
};

const initialEnemies = Object.fromEntries(
  HITCHER_SPAWNS.map((s) => [
    s.id,
    {
      hp: ENEMY_HP,
      alive: true,
      aggro: false,
      lastHitAt: -Infinity,
      diedAt: 0,
      respawnAt: 0,
      spawn: s.position,
    } satisfies EnemyEntry,
  ]),
);

export const useCombatStore = create<CombatState>()((set, get) => ({
  enemies: initialEnemies,
  lastAttackAt: -Infinity,
  hitStopActive: false,
  registerAttack: () => set({ lastAttackAt: performance.now() / 1000 }),
  damageEnemy: (id, amount) => {
    const e = get().enemies[id];
    if (!e || !e.alive) return 'none';
    const now = performance.now() / 1000;
    const hp = Math.max(0, e.hp - amount);
    const alive = hp > 0;
    set({
      enemies: {
        ...get().enemies,
        [id]: {
          ...e,
          hp,
          alive,
          lastHitAt: now,
          diedAt: alive ? e.diedAt : now,
          respawnAt: alive ? e.respawnAt : now + RESPAWN_DELAY,
        },
      },
    });
    return alive ? 'hit' : 'dead';
  },
  setAggro: (id, aggro) => {
    const e = get().enemies[id];
    if (!e || e.aggro === aggro) return;
    set({ enemies: { ...get().enemies, [id]: { ...e, aggro } } });
  },
  respawnEnemy: (id) => {
    const e = get().enemies[id];
    if (!e) return;
    set({
      enemies: {
        ...get().enemies,
        [id]: { ...e, hp: ENEMY_HP, alive: true, aggro: false, lastHitAt: -Infinity, respawnAt: 0 },
      },
    });
  },
  triggerHitStop: (ms) => {
    if (get().hitStopActive) return;
    set({ hitStopActive: true });
    setTimeout(() => set({ hitStopActive: false }), ms);
  },
}));
