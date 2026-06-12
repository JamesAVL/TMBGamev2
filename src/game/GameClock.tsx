import { useFrame } from '@react-three/fiber';
import { useCombatStore } from '../stores/combatStore';
import { useHubStore } from '../stores/hubStore';
import { useRunStore } from '../stores/runStore';
import { useUiStore } from '../stores/uiStore';
import { runtime } from './combat/runtime';

// Advances the pause-aware game clock. Mounted once inside the Canvas.
export function GameClock() {
  useFrame((_, delta) => {
    const hub = useHubStore.getState();
    const ui = useUiStore.getState();
    const paused =
      ui.phase !== 'playing' ||
      ui.pauseOpen ||
      useCombatStore.getState().hitStopActive ||
      useRunStore.getState().panelOpen ||
      hub.dialogOpen ||
      hub.shopOpen;
    if (!paused) runtime.time += Math.min(delta, 0.1);
  });
  return null;
}
