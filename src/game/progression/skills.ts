// Skill-point progression: each level-up banks a point; points are spent
// freely (T panel) on multi-point skills. Shared skills serve both legends;
// each weapon has its own branch. Percentages use the brief's soft-cap form
// (x / (x + k)) so nothing runs away.
import type { EnemyKind } from '../../stores/combatStore';
import type { CharacterId } from '../../stores/profileStore';

export type SkillId =
  | 'biggerBackhand'
  | 'quickWrists'
  | 'shamansFlask'
  | 'eelGrease'
  | 'ganglyReach'
  | 'sequinEdge'
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
    id: 'biggerBackhand',
    owner: 'shared',
    name: 'Bigger Backhand',
    blurb: 'Technically jazz percussion.',
    maxPoints: 5,
    valueLabel: (n) => `${(1 + 0.35 * n).toFixed(2)}× damage`,
  },
  {
    id: 'quickWrists',
    owner: 'shared',
    name: 'Quick Wrists',
    blurb: 'Honed on vintage zips.',
    maxPoints: 5,
    valueLabel: (n) => `−${pct(softCap(n, 0.5, 1.8))} cooldown`,
  },
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
    id: 'ganglyReach',
    owner: 'shared',
    name: 'Gangly Reach',
    blurb: 'Unsettling. Useful.',
    maxPoints: 5,
    valueLabel: (n) => `+${pct(softCap(n, 0.5, 3))} reach`,
  },
  {
    id: 'sequinEdge',
    owner: 'shared',
    name: 'Sequin Edge',
    blurb: 'Suddenly, fashion.',
    maxPoints: 5,
    valueLabel: (n) => `${pct(softCap(n, 0.55, 2.6))} crit`,
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
    blurb: 'The mist remembers.',
    maxPoints: 3,
    valueLabel: (n) => (n === 0 ? 'no linger' : `mist lingers ${(0.2 + 0.8 * n).toFixed(1)}s`),
  },
  {
    id: 'wideNozzle',
    owner: 'vince',
    name: 'Wide Nozzle',
    blurb: 'Coverage is a lifestyle.',
    maxPoints: 3,
    valueLabel: (n) => `+${12 * n}° cone, +${pct(0.08 * n)} spray range`,
  },
  // ---- Howard: the collection ----
  {
    id: 'rarePressing',
    owner: 'howard',
    name: 'Rare Pressing',
    blurb: 'Mint condition. Devastating.',
    maxPoints: 3,
    valueLabel: (n) =>
      n === 0 ? 'no rare pressings' : `${pct(0.12 * n)} chance: 2× damage, pierces`,
  },
  {
    id: 'strongArm',
    owner: 'howard',
    name: 'Strong Arm',
    blurb: 'Years of crate digging.',
    maxPoints: 3,
    valueLabel: (n) => `+${pct(0.2 * n)} throw speed, +${pct(0.1 * n)} range`,
  },
];

export type RunStats = {
  speedMult: number;
  jumpMult: number;
  damage: number;
  cooldownMult: number;
  rangeMult: number;
  critChance: number;
  regenInterval: number; // seconds per hp; 0 = off
  // Vince
  sprayLingerSeconds: number; // 0 = off
  sprayArcBonusDeg: number;
  sprayRangeBonus: number;
  // Howard
  rareChance: number;
  throwSpeedMult: number;
  throwRangeBonus: number;
  throwKnockbackBonus: number;
};

export function computeStats(points: SkillPoints): RunStats {
  const n = (id: SkillId) => points[id] ?? 0;
  return {
    speedMult: 1 + softCap(n('eelGrease'), 0.45, 2.5),
    jumpMult: 1 + 0.15 * n('moonBoots'),
    damage: 1 + 0.35 * n('biggerBackhand'),
    cooldownMult: 1 - softCap(n('quickWrists'), 0.5, 1.8),
    rangeMult: 1 + softCap(n('ganglyReach'), 0.5, 3),
    critChance: softCap(n('sequinEdge'), 0.55, 2.6),
    regenInterval: n('poloDiscipline') === 0 ? 0 : 16 / n('poloDiscipline'),
    sprayLingerSeconds: n('extraHold') === 0 ? 0 : 0.2 + 0.8 * n('extraHold'),
    sprayArcBonusDeg: 12 * n('wideNozzle'),
    sprayRangeBonus: 0.08 * n('wideNozzle'),
    rareChance: 0.12 * n('rarePressing'),
    throwSpeedMult: 1 + 0.2 * n('strongArm'),
    throwRangeBonus: 0.1 * n('strongArm'),
    throwKnockbackBonus: n('strongArm'),
  };
}

export const XP_BY_KIND: Record<EnemyKind, number> = {
  modwolf: 12,
  parka: 12,
  hitcher: 15, // benched for now — he'll be back, top billing
  blackfrost: 60,
};
