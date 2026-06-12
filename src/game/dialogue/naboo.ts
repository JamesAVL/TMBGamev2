// Naboo the Enigma, behind the counter. Original deadpan in his register —
// never reproduced show material. His storyline advances with realm clears.

export type NabooStage = {
  minClears: number;
  lines: string[];
};

export const NABOO_STAGES: NabooStage[] = [
  {
    minClears: 0,
    lines: [
      'Alright. Welcome to the shop.',
      'Doors are over there. The cold one goes to the Tundra. The grey one’s for practising your little moves.',
      'Bring back euros. I accept euros. Everyone accepts euros if you’re calm about it.',
      'Don’t touch the tat unless you’re buying the tat.',
    ],
  },
  {
    minClears: 1,
    lines: [
      'You got the Egg, then. The keepers will be writing letters.',
      'The Black Frost books himself, you know. No agent. No shame.',
      'Spend some euros. The economy of this dimension depends on it. Roughly.',
    ],
  },
  {
    minClears: 2,
    lines: [
      'Word’s out about you two. A green gentleman was in here asking. Smelled of eels.',
      'I sold him one polo. Singular. He seemed pleased.',
      'Keep clearing realms. Something’s stirring, and I can’t be bothered with it personally.',
    ],
  },
  {
    minClears: 3,
    lines: [
      'The shamans had a meeting about you. I left early.',
      'More doors soon. The shop expands. Don’t ask how — it’s a zoning thing.',
      'Buy something, or stand somewhere less load-bearing.',
    ],
  },
];

export function nabooLines(clears: number): string[] {
  let best = NABOO_STAGES[0]!;
  for (const stage of NABOO_STAGES) {
    if (clears >= stage.minClears) best = stage;
  }
  return best.lines;
}
