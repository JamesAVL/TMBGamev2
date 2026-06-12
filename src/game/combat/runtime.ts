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
  // Set when the control scheme flips mid-scene: the remounted player body
  // restores this position instead of the scene spawn.
  pendingReposition: null as { x: number; y: number; z: number } | null,
};
