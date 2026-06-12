// Synthesized combat SFX via Web Audio — placeholder juice with zero asset
// licensing. Real foley can replace these calls one-for-one later.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function audio(): { ctx: AudioContext; master: GainNode } {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return { ctx, master: master! };
}

// Call from any user-gesture handler to satisfy autoplay policies.
export function ensureAudio() {
  audio();
}

function noiseBuffer(c: AudioContext, seconds: number): AudioBuffer {
  const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * seconds), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function envGain(c: AudioContext, out: GainNode, peak: number, seconds: number): GainNode {
  const g = c.createGain();
  g.gain.setValueAtTime(peak, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + seconds);
  g.connect(out);
  return g;
}

function tone(
  c: AudioContext,
  out: GainNode,
  type: OscillatorType,
  from: number,
  to: number,
  seconds: number,
  peak: number,
) {
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), c.currentTime + seconds);
  osc.connect(envGain(c, out, peak, seconds));
  osc.start();
  osc.stop(c.currentTime + seconds);
}

function noise(
  c: AudioContext,
  out: GainNode,
  seconds: number,
  peak: number,
  filterFrom: number,
  filterTo: number,
) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, seconds);
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(filterFrom, c.currentTime);
  filter.frequency.exponentialRampToValueAtTime(filterTo, c.currentTime + seconds);
  filter.Q.value = 1.2;
  src.connect(filter);
  filter.connect(envGain(c, out, peak, seconds));
  src.start();
}

export const sfx = {
  swing() {
    const { ctx: c, master: m } = audio();
    noise(c, m, 0.09, 0.25, 900, 250);
  },
  hit() {
    const { ctx: c, master: m } = audio();
    tone(c, m, 'square', 170, 70, 0.09, 0.5);
    noise(c, m, 0.04, 0.35, 2500, 800);
  },
  enemyDeath() {
    const { ctx: c, master: m } = audio();
    tone(c, m, 'sawtooth', 300, 45, 0.45, 0.4);
    noise(c, m, 0.25, 0.25, 600, 120);
  },
  playerHurt() {
    const { ctx: c, master: m } = audio();
    tone(c, m, 'triangle', 120, 55, 0.16, 0.55);
    tone(c, m, 'triangle', 80, 45, 0.22, 0.35);
  },
  clink() {
    // swipe bounced off something invulnerable
    const { ctx: c, master: m } = audio();
    tone(c, m, 'sine', 1800, 1200, 0.07, 0.25);
  },
  gust() {
    const { ctx: c, master: m } = audio();
    noise(c, m, 1.3, 0.18, 200, 700);
  },
  freezeSnap() {
    const { ctx: c, master: m } = audio();
    noise(c, m, 0.12, 0.4, 3500, 900);
    tone(c, m, 'sine', 900, 300, 0.12, 0.2);
  },
  ember() {
    const { ctx: c, master: m } = audio();
    noise(c, m, 0.35, 0.4, 500, 2200);
    tone(c, m, 'sawtooth', 140, 60, 0.3, 0.3);
  },
  waveSting() {
    const { ctx: c, master: m } = audio();
    tone(c, m, 'square', 220, 440, 0.18, 0.2);
    tone(c, m, 'square', 165, 330, 0.24, 0.15);
  },
  bossDown() {
    const { ctx: c, master: m } = audio();
    tone(c, m, 'sawtooth', 220, 28, 1.1, 0.5);
    noise(c, m, 0.8, 0.3, 900, 100);
  },
  portal() {
    const { ctx: c, master: m } = audio();
    tone(c, m, 'sine', 300, 900, 0.4, 0.3);
    tone(c, m, 'sine', 450, 1350, 0.4, 0.2);
  },
  treasure() {
    const { ctx: c, master: m } = audio();
    tone(c, m, 'sine', 523, 523, 0.12, 0.3);
    tone(c, m, 'sine', 659, 659, 0.18, 0.3);
    tone(c, m, 'sine', 784, 1046, 0.4, 0.3);
  },
  levelUp() {
    const { ctx: c, master: m } = audio();
    tone(c, m, 'square', 392, 392, 0.1, 0.2);
    tone(c, m, 'square', 523, 523, 0.14, 0.2);
    tone(c, m, 'square', 659, 784, 0.3, 0.25);
  },
  crit() {
    const { ctx: c, master: m } = audio();
    tone(c, m, 'square', 320, 110, 0.1, 0.55);
    tone(c, m, 'sine', 1400, 700, 0.08, 0.3);
    noise(c, m, 0.05, 0.4, 3000, 1000);
  },
  nova() {
    const { ctx: c, master: m } = audio();
    tone(c, m, 'sawtooth', 90, 440, 0.22, 0.35);
    noise(c, m, 0.25, 0.3, 1200, 3500);
  },
  spray() {
    // aerosol hiss
    const { ctx: c, master: m } = audio();
    noise(c, m, 0.16, 0.3, 2600, 4200);
  },
  throwWhoosh() {
    const { ctx: c, master: m } = audio();
    noise(c, m, 0.14, 0.25, 350, 950);
  },
  thunk() {
    // vinyl meets skull
    const { ctx: c, master: m } = audio();
    tone(c, m, 'square', 130, 60, 0.08, 0.5);
    noise(c, m, 0.03, 0.3, 1800, 700);
  },
  spend() {
    const { ctx: c, master: m } = audio();
    tone(c, m, 'sine', 700, 980, 0.09, 0.25);
  },
  castCue() {
    // the Black Frost winds up something cold — audible warning
    const { ctx: c, master: m } = audio();
    tone(c, m, 'sine', 1400, 500, 0.3, 0.3);
    noise(c, m, 0.25, 0.18, 4200, 1800);
  },
  beamFire() {
    const { ctx: c, master: m } = audio();
    tone(c, m, 'sawtooth', 700, 90, 0.3, 0.45);
    noise(c, m, 0.2, 0.3, 2800, 600);
  },
};
