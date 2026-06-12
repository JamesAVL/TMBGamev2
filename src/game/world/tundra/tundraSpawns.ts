import type { EnemySpawnDef } from '../../../stores/combatStore';

// Realm enemies stay dead (a run is a run) — no respawnDelay.

export const TUNDRA_PLACED: EnemySpawnDef[] = [
  // Room 1 welcoming committee
  { id: 'bailiff-r1-a', kind: 'bailiff', position: [-5, 1, 18], hp: 2, line: 'Permit. Now.' },
  {
    id: 'bailiff-r1-b',
    kind: 'bailiff',
    position: [5, 1, 16],
    hp: 2,
    line: 'That is a fineable jacket.',
  },
  { id: 'bailiff-r1-c', kind: 'bailiff', position: [0, 1, 11], hp: 2 },
  // Wind corridor toll desk
  {
    id: 'bailiff-wc-a',
    kind: 'bailiff',
    position: [-2, 1, 2],
    hp: 2,
    line: 'Walking fee: everything.',
  },
  { id: 'bailiff-wc-b', kind: 'bailiff', position: [2, 1, -2], hp: 2 },
];

export const TUNDRA_WAVES: EnemySpawnDef[][] = [
  [
    { id: 'wave1-a', kind: 'bailiff', position: [-7, 1, -16], hp: 2, line: 'Audit time.' },
    { id: 'wave1-b', kind: 'bailiff', position: [7, 1, -16], hp: 2 },
    { id: 'wave1-c', kind: 'bailiff', position: [0, 1, -22], hp: 2 },
  ],
  [
    { id: 'wave2-a', kind: 'bailiff', position: [-8, 1, -12], hp: 2, line: 'Form 12-F: assault.' },
    { id: 'wave2-b', kind: 'bailiff', position: [8, 1, -12], hp: 2 },
    { id: 'wave2-c', kind: 'bailiff', position: [-5, 1, -22], hp: 2 },
    { id: 'wave2-d', kind: 'bailiff', position: [5, 1, -22], hp: 2 },
  ],
  [
    { id: 'wave3-a', kind: 'bailiff', position: [-9, 1, -18], hp: 2, line: 'Final notice.' },
    { id: 'wave3-b', kind: 'bailiff', position: [9, 1, -18], hp: 2 },
    { id: 'wave3-c', kind: 'bailiff', position: [0, 1, -24], hp: 2 },
    { id: 'wave3-d', kind: 'bailiff', position: [-4, 1, -10], hp: 2 },
    { id: 'wave3-e', kind: 'bailiff', position: [4, 1, -10], hp: 2 },
  ],
];

export const BLACK_FROST: EnemySpawnDef = {
  id: 'blackfrost',
  kind: 'blackfrost',
  position: [0, 2, -40],
  hp: 9,
  invulnerable: true, // composure intact — break it with brazier embers
  line: 'Ah. An audience. I will keep your encore brief.',
};
