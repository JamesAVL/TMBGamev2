// Skill-point progression: each level-up banks a point; points are spent
// freely (T panel) on multi-point skills. Percentages use the brief's
// soft-cap form (x / (x + k)) so nothing runs away.
import type { EnemyKind } from '../../stores/combatStore';

export type SkillId =
  | 'biggerBackhand'
  | 'quickWrists'
  | 'shamansFlask'
  | 'eelGrease'
  | 'ganglyReach'
  | 'sequinEdge'
  | 'moonBoots'
  | 'poloDiscipline';

export type SkillPoints = Partial<Record<SkillId, number>>;

export type SkillDef = {
  id: SkillId;
  name: string;
  blurb: string;
  maxPoints: number;
  // human-readable value at a given investment, for the panel's now → next
  valueLabel: (points: number) => string;
};

const softCap = (points: number, cap: number, k: number) => (cap * points) / (points + k);
const pct = (x: number) => `${Math.round(x * 100)}%`;

export const SKILLS: SkillDef[] = [
  {
    id: 'biggerBackhand',
    name: 'Bigger Backhand',
    blurb: 'Technically jazz percussion.',
    maxPoints: 5,
    valueLabel: (n) => `${(1 + 0.35 * n).toFixed(2)}× damage`,
  },
  {
    id: 'quickWrists',
    name: 'Quick Wrists',
    blurb: 'Honed on vintage zips.',
    maxPoints: 5,
    valueLabel: (n) => `−${pct(softCap(n, 0.5, 1.8))} cooldown`,
  },
  {
    id: 'shamansFlask',
    name: "Shaman's Flask",
    blurb: 'Don’t ask what’s in it.',
    maxPoints: 5,
    valueLabel: (n) => `+${n} max hp`,
  },
  {
    id: 'eelGrease',
    name: 'Eel Grease',
    blurb: 'Slippery when applied liberally.',
    maxPoints: 5,
    valueLabel: (n) => `+${pct(softCap(n, 0.45, 2.5))} speed`,
  },
  {
    id: 'ganglyReach',
    name: 'Gangly Reach',
    blurb: 'Unsettling. Useful.',
    maxPoints: 5,
    valueLabel: (n) => `+${pct(softCap(n, 0.5, 3))} reach`,
  },
  {
    id: 'sequinEdge',
    name: 'Sequin Edge',
    blurb: 'Suddenly, fashion.',
    maxPoints: 5,
    valueLabel: (n) => `${pct(softCap(n, 0.55, 2.6))} crit`,
  },
  {
    id: 'moonBoots',
    name: 'Moon Boots',
    blurb: 'The Moon approves, silently.',
    maxPoints: 4,
    valueLabel: (n) => `+${pct(0.15 * n)} jump`,
  },
  {
    id: 'poloDiscipline',
    name: 'Polo Discipline',
    blurb: 'Mint-fresh recovery.',
    maxPoints: 4,
    valueLabel: (n) => (n === 0 ? 'no regen' : `1 hp / ${(16 / n).toFixed(0)}s`),
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
  };
}

export const XP_BY_KIND: Record<EnemyKind, number> = {
  modwolf: 12,
  parka: 12,
  hitcher: 15, // benched for now — he'll be back, top billing
  blackfrost: 60,
};
