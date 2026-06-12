import type { CustomEcctrlRigidBody } from 'ecctrl';
import type { RapierRigidBody } from '@react-three/rapier';

export type SwipeTarget = {
  position: () => { x: number; y: number; z: number };
  onHit: () => void;
};

// Mutable per-frame registry of physics bodies and hittable props.
// Deliberately NOT zustand: these are engine handles read every frame,
// not reactive game state.
export const runtime = {
  player: null as CustomEcctrlRigidBody | null,
  enemyBodies: new Map<string, RapierRigidBody>(),
  swipeTargets: new Map<string, SwipeTarget>(),
  // Pause-aware game clock (seconds). Advanced by GameClock each frame unless
  // the sim is paused (hit-stop, level-up pick). ALL combat/AI timers compare
  // against this, never wall-clock — so windups can't lapse during a pause.
  time: 0,
};
