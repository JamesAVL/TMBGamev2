import type { EnemySpawnDef } from '../../../stores/combatStore';

// Realm enemies stay dead (a run is a run) — no respawnDelay.
// The Parka People are the keepers of the Egg of Mantumbi; all lines are
// original writing in their register.

export const TUNDRA_PLACED: EnemySpawnDef[] = [
  // Room 1 welcoming committee
  {
    id: 'parka-r1-a',
    kind: 'parka',
    position: [-5, 1, 18],
    hp: 2,
    line: 'You want the Egg. They all want the Egg.',
  },
  {
    id: 'parka-r1-b',
    kind: 'parka',
    position: [5, 1, 16],
    hp: 2,
    line: 'Got any sandwiches? No? Then die.',
  },
  { id: 'parka-r1-c', kind: 'parka', position: [0, 1, 11], hp: 2 },
  // Wind corridor watch
  {
    id: 'parka-wc-a',
    kind: 'parka',
    position: [-2, 1, 2],
    hp: 2,
    line: 'Look into the hood. See what you came for.',
  },
  { id: 'parka-wc-b', kind: 'parka', position: [2, 1, -2], hp: 2 },
];

export const TUNDRA_WAVES: EnemySpawnDef[][] = [
  [
    { id: 'wave1-a', kind: 'parka', position: [-7, 1, -16], hp: 2, line: 'Keepers! To arms!' },
    { id: 'wave1-b', kind: 'parka', position: [7, 1, -16], hp: 2 },
    { id: 'wave1-c', kind: 'parka', position: [0, 1, -22], hp: 2 },
  ],
  [
    {
      id: 'wave2-a',
      kind: 'parka',
      position: [-8, 1, -12],
      hp: 2,
      line: 'The hood has seen your desire. Denied.',
    },
    { id: 'wave2-b', kind: 'parka', position: [8, 1, -12], hp: 2 },
    { id: 'wave2-c', kind: 'parka', position: [-5, 1, -22], hp: 2 },
    { id: 'wave2-d', kind: 'parka', position: [5, 1, -22], hp: 2 },
  ],
  [
    {
      id: 'wave3-a',
      kind: 'parka',
      position: [-9, 1, -18],
      hp: 2,
      line: 'You will make a lovely offering.',
    },
    { id: 'wave3-b', kind: 'parka', position: [9, 1, -18], hp: 2 },
    { id: 'wave3-c', kind: 'parka', position: [0, 1, -24], hp: 2 },
    { id: 'wave3-d', kind: 'parka', position: [-4, 1, -10], hp: 2 },
    { id: 'wave3-e', kind: 'parka', position: [4, 1, -10], hp: 2 },
  ],
];

export const BLACK_FROST: EnemySpawnDef = {
  id: 'blackfrost',
  kind: 'blackfrost',
  position: [0, 2, -40],
  hp: 9,
  invulnerable: true, // composure intact — break it with brazier embers
  line: 'The little ones sang my name. Very well — one last number.',
};
