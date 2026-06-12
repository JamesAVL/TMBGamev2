import type { EnemySpawnDef } from '../../stores/combatStore';

// Greybox range: four Hitchers at their posts, respawning so the playground
// never empties. Original lines in his voice (no reproduced show dialogue).
export const GREYBOX_SPAWNS: EnemySpawnDef[] = [
  {
    id: 'hitcher-1',
    kind: 'hitcher',
    position: [6.5, 1, -9],
    hp: 3,
    respawnDelay: 10,
    line: 'Oi oi. This here is a toll road, sunshine.',
  },
  {
    id: 'hitcher-2',
    kind: 'hitcher',
    position: [-12, 1, 7],
    hp: 3,
    respawnDelay: 10,
    line: 'Lovely night for it. Shame about you.',
  },
  {
    id: 'hitcher-3',
    kind: 'hitcher',
    position: [-16, 1, -19.5],
    hp: 3,
    respawnDelay: 10,
    line: 'I have got an eel with your name on it, boy.',
  },
  {
    id: 'hitcher-4',
    kind: 'hitcher',
    position: [15, 1, 7],
    hp: 3,
    respawnDelay: 10,
    line: 'Nobody walks my tarmac for free.',
  },
];
