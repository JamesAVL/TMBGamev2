// Naboo's inventory: permanent trinkets bought with shrapnel. Original items
// in the show's register — each one a real modifier, not a bigger number for
// its own sake.

export type TrinketId = 'luckyPolo' | 'poloTin' | 'velvetGlove' | 'mirrorBall';

export type TrinketDef = {
  id: TrinketId;
  name: string;
  blurb: string;
  effect: string;
  price: number;
};

export const TRINKETS: TrinketDef[] = [
  {
    id: 'luckyPolo',
    name: 'The Lucky Polo',
    blurb: 'Found in a jacket that wasn’t Naboo’s.',
    effect: '+7% crit chance, always',
    price: 40,
  },
  {
    id: 'poloTin',
    name: 'Tin of Polos',
    blurb: 'Emergency mints. Structural.',
    effect: '+1 max hp, always',
    price: 50,
  },
  {
    id: 'velvetGlove',
    name: 'The Velvet Glove',
    blurb: 'Firm. Gentle. Devastating.',
    effect: '+10% all damage, always',
    price: 75,
  },
  {
    id: 'mirrorBall',
    name: 'The Mirror Ball',
    blurb: 'Death checks itself out in it.',
    effect: 'once per realm: survive a killing blow at 1 hp',
    price: 100,
  },
];

export type TrinketMods = {
  damageMult: number;
  critBonus: number;
  maxHpBonus: number;
  hasMirrorBall: boolean;
};

export function computeTrinketMods(owned: Partial<Record<TrinketId, boolean>>): TrinketMods {
  return {
    damageMult: owned.velvetGlove ? 1.1 : 1,
    critBonus: owned.luckyPolo ? 0.07 : 0,
    maxHpBonus: owned.poloTin ? 1 : 0,
    hasMirrorBall: Boolean(owned.mirrorBall),
  };
}
