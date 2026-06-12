import type { CharacterId } from '../../stores/profileStore';

// Original duo dialogue in the characters' registers — never reproduced
// show material. Keyed by who's TAKING control.
export const SWITCH_LINES: Record<CharacterId, string[]> = {
  howard: [
    'HOWARD: Step aside, little man. This is jazz work.',
    'HOWARD: Watch closely — a maverick operates.',
    'HOWARD: You had your go. Now witness craft.',
    'HOWARD: Don’t touch the records with those glittery mitts.',
  ],
  vince: [
    'VINCE: Let someone with cheekbones handle it.',
    'VINCE: Mind out — these boots are vintage.',
    'VINCE: Time for a bit of glamour, yeah?',
    'VINCE: You were boring them to death, that’s half the work done.',
  ],
};

// One exchange per realm entry, picked at random.
export const TUNDRA_ENTRY_EXCHANGES: [string, string][] = [
  [
    'VINCE: It’s freezing. My hair’s gone structural.',
    'HOWARD: Hush now. The tundra respects a serious man.',
  ],
  [
    'HOWARD: Smell that? That’s the north, sir. Raw and uncut.',
    'VINCE: Smells like a freezer full of socks.',
  ],
  [
    'VINCE: If I die out here, bury me in something flattering.',
    'HOWARD: You’ll outlive us all. Cockroaches and cheekbones.',
  ],
];

export const BOSS_LOCK_LINE = 'STAGE MANAGER: No swaps mid-set.';
