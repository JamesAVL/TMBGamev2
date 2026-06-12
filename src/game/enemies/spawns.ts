// First enemy: the Hitcher — a green-skinned cockney toll-collector with a
// polo-mint eye. Original lines in his voice (no reproduced show dialogue).
export type HitcherSpawn = {
  id: string;
  position: [number, number, number];
  line: string;
};

export const HITCHER_SPAWNS: HitcherSpawn[] = [
  { id: 'hitcher-1', position: [6.5, 1, -9], line: 'Oi oi. This here is a toll road, sunshine.' },
  { id: 'hitcher-2', position: [-12, 1, 7], line: 'Lovely night for it. Shame about you.' },
  {
    id: 'hitcher-3',
    position: [-16, 1, -19.5],
    line: 'I have got an eel with your name on it, boy.',
  },
  { id: 'hitcher-4', position: [15, 1, 7], line: 'Nobody walks my tarmac for free.' },
];
