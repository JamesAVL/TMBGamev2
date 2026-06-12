import type { CharacterId } from '../../stores/profileStore';

// Original duo dialogue in the characters' registers — never reproduced
// show material. The legend you're not playing is "just off-screen" and
// keeps up a presence through these.

// Keyed by who's TAKING control.
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

// Ambient quips from the absent one (keyed by who's ABSENT), every so often.
export const OFFSCREEN_QUIPS: Record<CharacterId, string[]> = {
  howard: [
    'HOWARD: Lead with the shoulder. The jazz shoulder.',
    'HOWARD: I’m cataloguing. Shout if it’s urgent.',
    'HOWARD: Technique, Vince. Technique.',
    'HOWARD: Every record you waste is a small funeral.',
  ],
  vince: [
    'VINCE: You look well mad right now. Love it.',
    'VINCE: I’m doing my fringe. Two minutes.',
    'VINCE: Throw it like a frisbee from the future!',
    'VINCE: This biome’s got terrible lighting for my skin tone.',
  ],
};

// The absent one heckles when you're nearly dead (once per scrape).
export const LOW_HP_QUIPS: Record<CharacterId, string[]> = {
  howard: [
    'HOWARD: Stop being hit, Vince. It’s basic.',
    'HOWARD: Breathe through it. Jazz men don’t die embarrassed.',
  ],
  vince: [
    'VINCE: Howard! Your face is leaking. Sort it out.',
    'VINCE: Don’t die — I can’t carry the Egg AND your hat.',
  ],
};

// Occasional approval on a kill (keyed by who's ABSENT).
export const KILL_QUIPS: Record<CharacterId, string[]> = {
  howard: ['HOWARD: Acceptable. Barely.', 'HOWARD: Sloppy footwork. Good outcome.'],
  vince: ['VINCE: Ooh, that was glam as anything.', 'VINCE: Do that one again when I’m watching.'],
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

// The absent legend explains the composure mechanic when hits keep clinking
// off (keyed by who's ABSENT).
export const COMPOSURE_HINTS: Record<CharacterId, string> = {
  howard: 'HOWARD: His composure is holding! Smack any brazier — embers break him. Then unload.',
  vince: 'VINCE: He’s not even bothered! Hit a brazier — the embers wreck his cool. Then lay in.',
};
