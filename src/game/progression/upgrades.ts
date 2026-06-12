// The choose-one-of-three pool. Stackable percentages use the brief's
// soft-cap form (x / (x + k)) so nothing runs away; flat picks have maxStacks.
import type { EnemyKind } from '../../stores/combatStore';

export type UpgradeId =
  | 'eelGrease'
  | 'shamansFlask'
  | 'biggerBackhand'
  | 'sequinEdge'
  | 'quickWrists'
  | 'ganglyReach'
  | 'moonBoots'
  | 'poloDiscipline'
  | 'jazzStatic';

export type UpgradeDef = {
  id: UpgradeId;
  name: string;
  blurb: string;
  effect: string;
  maxStacks: number;
};

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'eelGrease',
    name: 'Eel Grease',
    blurb: 'Slippery when applied liberally.',
    effect: '+ move & sprint speed',
    maxStacks: 4,
  },
  {
    id: 'shamansFlask',
    name: "Shaman's Flask",
    blurb: 'Don’t ask what’s in it.',
    effect: '+1 max HP, top up 1 now',
    maxStacks: 4,
  },
  {
    id: 'biggerBackhand',
    name: 'Bigger Backhand',
    blurb: 'Technically jazz percussion.',
    effect: '+1 swipe damage',
    maxStacks: 2,
  },
  {
    id: 'sequinEdge',
    name: 'Sequin Edge',
    blurb: 'Suddenly, fashion.',
    effect: '+ crit chance (crits hit double)',
    maxStacks: 4,
  },
  {
    id: 'quickWrists',
    name: 'Quick Wrists',
    blurb: 'Honed on vintage zips.',
    effect: '− swipe cooldown',
    maxStacks: 4,
  },
  {
    id: 'ganglyReach',
    name: 'Gangly Reach',
    blurb: 'Unsettling. Useful.',
    effect: '+25% swipe range',
    maxStacks: 2,
  },
  {
    id: 'moonBoots',
    name: 'Moon Boots',
    blurb: 'The Moon approves, silently.',
    effect: '+30% jump',
    maxStacks: 2,
  },
  {
    id: 'poloDiscipline',
    name: 'Polo Discipline',
    blurb: 'Mint-fresh recovery.',
    effect: 'killing blows restore 1 hp',
    maxStacks: 1,
  },
  {
    id: 'jazzStatic',
    name: 'Jazz Static',
    blurb: 'Forbidden fusion crackle.',
    effect: 'every 4th swipe erupts in a nova (stack: 3rd)',
    maxStacks: 2,
  },
];

export type RunStats = {
  speedMult: number;
  jumpMult: number;
  damage: number;
  cooldownMult: number;
  rangeMult: number;
  critChance: number;
  killHeal: boolean;
  novaEvery: number; // 0 = off
};

const softCap = (stacks: number, cap: number, k: number) => (cap * stacks) / (stacks + k);

export function computeStats(picks: Partial<Record<UpgradeId, number>>): RunStats {
  const n = (id: UpgradeId) => picks[id] ?? 0;
  return {
    speedMult: 1 + softCap(n('eelGrease'), 0.45, 2.5), // 1 stack ≈ +13%
    jumpMult: 1 + 0.3 * n('moonBoots'),
    damage: 1 + n('biggerBackhand'),
    cooldownMult: 1 - softCap(n('quickWrists'), 0.5, 1.8), // 1 stack ≈ −18%
    rangeMult: 1 + 0.25 * n('ganglyReach'),
    critChance: softCap(n('sequinEdge'), 0.55, 2.6), // 1 stack ≈ 15%
    killHeal: n('poloDiscipline') > 0,
    novaEvery: n('jazzStatic') === 0 ? 0 : n('jazzStatic') === 1 ? 4 : 3,
  };
}

export const XP_BY_KIND: Record<EnemyKind, number> = {
  parka: 12,
  hitcher: 15,
  blackfrost: 60,
};
