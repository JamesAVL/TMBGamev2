// Floating combat text pool — split from the component so the component
// file stays fast-refresh friendly.
import { runtime } from './runtime';

export const DMG_POOL = 10;
export const DMG_LIFE = 0.7;
export const DMG_RISE = 1.2; // metres per second

export type PopKind = 'hit' | 'gold' | 'info';

export type Pop = {
  active: boolean;
  x: number;
  y: number;
  z: number;
  born: number;
  text: string;
  kind: PopKind;
};

export const damagePops: Pop[] = Array.from({ length: DMG_POOL }, () => ({
  active: false,
  x: 0,
  y: 0,
  z: 0,
  born: 0,
  text: '',
  kind: 'hit',
}));
let seq = 0;

export function popDamage(x: number, y: number, z: number, text: string, kind: PopKind = 'hit') {
  const slot = damagePops[seq++ % DMG_POOL]!;
  slot.active = true;
  slot.x = x;
  slot.y = y;
  slot.z = z;
  slot.born = runtime.time;
  slot.text = text;
  slot.kind = kind;
}
