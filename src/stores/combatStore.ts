import { create } from 'zustand';
import { runtime } from '../game/combat/runtime';

export type EnemyKind = 'hitcher' | 'parka' | 'blackfrost';

export type EnemySpawnDef = {
  id: string;
  kind: EnemyKind;
  position: [number, number, number];
  hp: number;
  line?: string;
  respawnDelay?: number; // seconds; omit for run-style enemies that stay dead
  invulnerable?: boolean;
};

export type EnemyEntry = {
  kind: EnemyKind;
  hp: number;
  maxHp: number;
  alive: boolean;
  aggro: boolean;
  invulnerable: boolean;
  lastHitAt: number;
  diedAt: number;
  respawnAt: number; // 0 = none scheduled
  respawnDelay: number; // 0 = never respawns
  spawn: [number, number, number];
  line: string;
};

type CombatState = {
  enemies: Record<string, EnemyEntry>;
  lastAttackAt: number; // player's last swipe, drives the arc visual
  hitStopActive: boolean; // brief physics freeze on connect, for punch
  setEnemies: (defs: EnemySpawnDef[]) => void; // replace all (scene change)
  spawnEnemies: (defs: EnemySpawnDef[]) => void; // merge in (waves)
  registerAttack: () => void;
  damageEnemy: (id: string, amount: number) => 'dead' | 'hit' | 'immune' | 'none';
  setAggro: (id: string, aggro: boolean) => void;
  setInvulnerable: (id: string, invulnerable: boolean) => void;
  respawnEnemy: (id: string) => void;
  triggerHitStop: (ms: number) => void;
};

function entryFromDef(def: EnemySpawnDef): EnemyEntry {
  return {
    kind: def.kind,
    hp: def.hp,
    maxHp: def.hp,
    alive: true,
    aggro: false,
    invulnerable: def.invulnerable ?? false,
    lastHitAt: -Infinity,
    diedAt: 0,
    respawnAt: 0,
    respawnDelay: def.respawnDelay ?? 0,
    spawn: def.position,
    line: def.line ?? '',
  };
}

export const useCombatStore = create<CombatState>()((set, get) => ({
  enemies: {},
  lastAttackAt: -Infinity,
  hitStopActive: false,
  setEnemies: (defs) =>
    set({ enemies: Object.fromEntries(defs.map((d) => [d.id, entryFromDef(d)])) }),
  spawnEnemies: (defs) =>
    set({
      enemies: {
        ...get().enemies,
        ...Object.fromEntries(defs.map((d) => [d.id, entryFromDef(d)])),
      },
    }),
  registerAttack: () => set({ lastAttackAt: runtime.time }),
  damageEnemy: (id, amount) => {
    const e = get().enemies[id];
    if (!e || !e.alive) return 'none';
    if (e.invulnerable) return 'immune';
    const now = runtime.time;
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
          respawnAt:
            alive || e.respawnDelay === 0 ? (alive ? e.respawnAt : 0) : now + e.respawnDelay,
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
  setInvulnerable: (id, invulnerable) => {
    const e = get().enemies[id];
    if (!e || e.invulnerable === invulnerable) return;
    set({ enemies: { ...get().enemies, [id]: { ...e, invulnerable } } });
  },
  respawnEnemy: (id) => {
    const e = get().enemies[id];
    if (!e) return;
    set({
      enemies: {
        ...get().enemies,
        [id]: { ...e, hp: e.maxHp, alive: true, aggro: false, lastHitAt: -Infinity, respawnAt: 0 },
      },
    });
  },
  triggerHitStop: (ms) => {
    if (get().hitStopActive) return;
    set({ hitStopActive: true });
    setTimeout(() => set({ hitStopActive: false }), ms);
  },
}));

export function aliveCount(enemies: Record<string, EnemyEntry>, ids: string[]): number {
  let n = 0;
  for (const id of ids) if (enemies[id]?.alive) n++;
  return n;
}
