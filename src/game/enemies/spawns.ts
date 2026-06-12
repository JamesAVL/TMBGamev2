import type { EnemySpawnDef } from '../../stores/combatStore';

// Greybox range: a pack of Mod Wolves on patrol, respawning so the playground
// never empties. Original lines in the show's spirit. (The Hitcher is benched
// — he's destined for top billing as a boss.)
export const GREYBOX_SPAWNS: EnemySpawnDef[] = [
  {
    id: 'modwolf-1',
    kind: 'modwolf',
    position: [6.5, 1, -9],
    hp: 2,
    respawnDelay: 10,
    line: 'Nice threads. Hand them over.',
  },
  {
    id: 'modwolf-2',
    kind: 'modwolf',
    position: [-12, 1, 7],
    hp: 2,
    respawnDelay: 10,
    line: 'The pack rides tonight.',
  },
  {
    id: 'modwolf-3',
    kind: 'modwolf',
    position: [-16, 1, -19.5],
    hp: 2,
    respawnDelay: 10,
    line: 'You call that a haircut?',
  },
  {
    id: 'modwolf-4',
    kind: 'modwolf',
    position: [15, 1, 7],
    hp: 2,
    respawnDelay: 10,
    line: 'Lovely scooter weather for a maiming.',
  },
  { id: 'modwolf-5', kind: 'modwolf', position: [12, 1, -19], hp: 2, respawnDelay: 10 },
];
