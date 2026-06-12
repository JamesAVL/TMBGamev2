// Skill-point progression, consolidated: 4 shared body skills + 2 fat
// multi-stat weapon skills per legend. Percentages use the brief's soft-cap
// form (x / (x + k)) where stacking could run away.
import type { EnemyKind } from '../../stores/combatStore';
import type { CharacterId } from '../../stores/profileStore';

export type SkillId =
  | 'shamansFlask'
  | 'eelGrease'
  | 'moonBoots'
  | 'poloDiscipline'
  | 'extraHold'
  | 'wideNozzle'
  | 'rarePressing'
  | 'strongArm';

export type SkillOwner = 'shared' | CharacterId;

export type SkillPoints = Partial<Record<SkillId, number>>;

export type SkillDef = {
  id: SkillId;
  owner: SkillOwner;
  name: string;
  blurb: string;
  maxPoints: number;
  // human-readable value at a given investment, for the panel's now → next
  valueLabel: (points: number) => string;
};

const softCap = (points: number, cap: number, k: number) => (cap * points) / (points + k);
const pct = (x: number) => `${Math.round(x * 100)}%`;

export const SKILLS: SkillDef[] = [
  // ---- shared: the body beneath the outfit ----
  {
    id: 'shamansFlask',
    owner: 'shared',
    name: "Shaman's Flask",
    blurb: 'Don’t ask what’s in it.',
    maxPoints: 5,
    valueLabel: (n) => `+${n} max hp`,
  },
  {
    id: 'eelGrease',
    owner: 'shared',
    name: 'Eel Grease',
    blurb: 'Slippery when applied liberally.',
    maxPoints: 5,
    valueLabel: (n) => `+${pct(softCap(n, 0.45, 2.5))} speed`,
  },
  {
    id: 'moonBoots',
    owner: 'shared',
    name: 'Moon Boots',
    blurb: 'The Moon approves, silently.',
    maxPoints: 4,
    valueLabel: (n) => `+${pct(0.15 * n)} jump`,
  },
  {
    id: 'poloDiscipline',
    owner: 'shared',
    name: 'Polo Discipline',
    blurb: 'Mint-fresh recovery.',
    maxPoints: 4,
    valueLabel: (n) => (n === 0 ? 'no regen' : `1 hp / ${(16 / n).toFixed(0)}s`),
  },
  // ---- Vince: the can ----
  {
    id: 'extraHold',
    owner: 'vince',
    name: 'Extra Hold',
    blurb: 'Stronger formula. The mist remembers.',
    maxPoints: 4,
    valueLabel: (n) =>
      `${(1 + 0.3 * n).toFixed(2)}× damage` + (n > 0 ? `, mist ${(0.6 * n).toFixed(1)}s` : ''),
  },
  {
    id: 'wideNozzle',
    owner: 'vince',
    name: 'Wide Nozzle',
    blurb: 'Coverage is a lifestyle.',
    maxPoints: 4,
    valueLabel: (n) => `+${10 * n}° cone, +${pct(0.1 * n)} range, −${pct(0.1 * n)} cooldown`,
  },
  // ---- Howard: the collection ----
  {
    id: 'rarePressing',
    owner: 'howard',
    name: 'Rare Pressing',
    blurb: 'Mint condition. Devastating.',
    maxPoints: 4,
    valueLabel: (n) =>
      `${(1 + 0.25 * n).toFixed(2)}× damage` +
      (n > 0 ? `, ${pct(0.12 * n)} gold (2×, pierces)` : ''),
  },
  {
    id: 'strongArm',
    owner: 'howard',
    name: 'Strong Arm',
    blurb: 'Years of crate digging.',
    maxPoints: 4,
    valueLabel: (n) =>
      `+${pct(0.15 * n)} speed, +${pct(0.12 * n)} range, −${pct(0.1 * n)} cooldown`,
  },
];

export type RunStats = {
  shared: {
    speedMult: number;
    jumpMult: number;
    regenInterval: number; // seconds per hp; 0 = off
  };
  vince: {
    damage: number;
    cooldownMult: number;
    rangeMult: number;
    arcBonusDeg: number;
    lingerSeconds: number; // 0 = off
  };
  howard: {
    damage: number;
    cooldownMult: number;
    rangeMult: number;
    speedMult: number;
    knockbackBonus: number;
    rareChance: number;
  };
};

// Crits stay in the game as flat juice, not a stat — Rare Pressing is
// Howard's crit; Vince's mist is his.
export const BASE_CRIT = 0.08;

export function computeStats(points: SkillPoints): RunStats {
  const n = (id: SkillId) => points[id] ?? 0;
  return {
    shared: {
      speedMult: 1 + softCap(n('eelGrease'), 0.45, 2.5),
      jumpMult: 1 + 0.15 * n('moonBoots'),
      regenInterval: n('poloDiscipline') === 0 ? 0 : 16 / n('poloDiscipline'),
    },
    vince: {
      damage: 1 + 0.3 * n('extraHold'),
      cooldownMult: 1 - 0.1 * n('wideNozzle'),
      rangeMult: 1 + 0.1 * n('wideNozzle'),
      arcBonusDeg: 10 * n('wideNozzle'),
      lingerSeconds: 0.6 * n('extraHold'),
    },
    howard: {
      damage: 1 + 0.25 * n('rarePressing'),
      cooldownMult: 1 - 0.1 * n('strongArm'),
      rangeMult: 1 + 0.12 * n('strongArm'),
      speedMult: 1 + 0.15 * n('strongArm'),
      knockbackBonus: 0.5 * n('strongArm'),
      rareChance: 0.12 * n('rarePressing'),
    },
  };
}

export const XP_BY_KIND: Record<EnemyKind, number> = {
  modwolf: 12,
  parka: 12,
  hitcher: 15, // benched for now — he'll be back, top billing
  blackfrost: 60,
};
