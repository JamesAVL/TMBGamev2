import { sfx } from '../audio/sfx';
import { BOSS_LOCK_LINE, SWITCH_LINES } from '../game/dialogue/banter';
import { useCombatStore } from '../stores/combatStore';
import { useHubStore } from '../stores/hubStore';
import { usePlayerStore } from '../stores/playerStore';
import { useProfileStore } from '../stores/profileStore';
import { useRunStore } from '../stores/runStore';
import { useSceneStore } from '../stores/sceneStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useUiStore } from '../stores/uiStore';

// The game's verbs, extracted from the HUD key handlers so the keyboard,
// the mouse, and the touch buttons all drive the exact same logic.

export const pick = <T>(arr: T[]): T | undefined => arr[Math.floor(Math.random() * arr.length)];

// Re-capture the mouse after a menu closes. No-op for keyboard or touch —
// pointer lock is a mouse-steering concern only.
export function relockPointer() {
  const s = useSettingsStore.getState();
  if (s.touchControls || s.controlScheme !== 'mouse') return;
  document.querySelector<HTMLCanvasElement>('#game-canvas canvas')?.requestPointerLock();
}

export function togglePause() {
  const ui = useUiStore.getState();
  if (ui.phase !== 'playing') return;
  const hub = useHubStore.getState();
  if (hub.dialogOpen || hub.shopOpen || useRunStore.getState().panelOpen) return;
  const opening = !ui.pauseOpen;
  ui.setPauseOpen(opening);
  if (opening) document.exitPointerLock();
  else relockPointer();
}

export function toggleSkills() {
  const ui = useUiStore.getState();
  if (ui.phase !== 'playing' || ui.pauseOpen) return;
  if (usePlayerStore.getState().dead) return; // no spending from beyond
  const hub = useHubStore.getState();
  if (hub.dialogOpen || hub.shopOpen) return; // Naboo is talking
  const run = useRunStore.getState();
  const opening = !run.panelOpen;
  run.setPanelOpen(opening);
  if (opening) document.exitPointerLock();
  else relockPointer();
}

export function talkToNaboo() {
  const ui = useUiStore.getState();
  if (ui.phase !== 'playing' || ui.pauseOpen) return;
  const hub = useHubStore.getState();
  if (hub.dialogOpen || hub.shopOpen) return; // the dialog handles itself
  if (hub.nearNaboo && useSceneStore.getState().scene === 'hub') {
    hub.setDialogOpen(true);
    document.exitPointerLock();
  }
}

// Swap legends. Returns the banter line to show (handover quip, or the
// boss-lock refusal), or null when the swap is silently unavailable.
export function switchLegend(): string | null {
  const ui = useUiStore.getState();
  if (ui.phase !== 'playing' || ui.pauseOpen) return null;
  const run = useRunStore.getState();
  const hub = useHubStore.getState();
  if (run.panelOpen || hub.dialogOpen || hub.shopOpen) return null;
  if (usePlayerStore.getState().dead) return null;
  const boss = useCombatStore.getState().enemies['blackfrost'];
  if (boss?.alive && boss.aggro) return BOSS_LOCK_LINE;
  // The other legend is just off-screen — the swap happens in place.
  useProfileStore.getState().switchCharacter();
  sfx.spend();
  const incoming = useProfileStore.getState().character;
  return pick(SWITCH_LINES[incoming]) ?? null;
}
