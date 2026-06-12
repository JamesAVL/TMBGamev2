import { useFrame } from '@react-three/fiber';
import { useCombatStore } from '../stores/combatStore';
import { useRunStore } from '../stores/runStore';
import { runtime } from './combat/runtime';

// Advances the pause-aware game clock. Mounted once inside the Canvas.
export function GameClock() {
  useFrame((_, delta) => {
    const paused = useCombatStore.getState().hitStopActive || useRunStore.getState().panelOpen;
    if (!paused) runtime.time += Math.min(delta, 0.1);
  });
  return null;
}
