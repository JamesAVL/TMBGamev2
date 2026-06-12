// Shared projectile pool state — split from the Projectiles component so the
// component file stays fast-refresh friendly.

export const POOL_SIZE = 8;
export const ENEMY_HIT_RADIUS = 0.55;
export const TARGET_HIT_RADIUS = 0.8;

export type ProjectileSlot = {
  active: boolean;
  x: number;
  y: number;
  z: number;
  dx: number;
  dz: number;
  speed: number;
  traveled: number;
  range: number;
  rare: boolean; // a rare pressing: bigger, gold, pierces
  hitIds: Set<string>; // enemies already struck (piercing discs hit once each)
  // return true to consume the disc
  onEnemyHit: (id: string, dir: { x: number; z: number }) => boolean;
  onTargetHit: (id: string) => void;
};

const makeSlot = (): ProjectileSlot => ({
  active: false,
  x: 0,
  y: 0,
  z: 0,
  dx: 0,
  dz: 0,
  speed: 16,
  traveled: 0,
  range: 0,
  rare: false,
  hitIds: new Set(),
  onEnemyHit: () => true,
  onTargetHit: () => undefined,
});

export const projectileSlots: ProjectileSlot[] = Array.from({ length: POOL_SIZE }, makeSlot);

export function throwRecord(opts: {
  x: number;
  y: number;
  z: number;
  dx: number;
  dz: number;
  speed: number;
  range: number;
  rare: boolean;
  onEnemyHit: ProjectileSlot['onEnemyHit'];
  onTargetHit: ProjectileSlot['onTargetHit'];
}): boolean {
  const slot = projectileSlots.find((s) => !s.active);
  if (!slot) return false;
  Object.assign(slot, opts, { active: true, traveled: 0 });
  slot.hitIds.clear();
  return true;
}

export function clearProjectiles() {
  for (const s of projectileSlots) s.active = false;
}
