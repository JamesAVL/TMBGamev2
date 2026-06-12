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
};
