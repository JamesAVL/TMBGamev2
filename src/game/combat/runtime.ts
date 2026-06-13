import type { CustomEcctrlRigidBody } from 'ecctrl';
import type { RapierRigidBody } from '@react-three/rapier';
import type * as THREE from 'three';

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
  // Touch ATTACK button state — PlayerCombat's frame loop fires while held,
  // so a hold auto-repeats at the weapon's own cooldown.
  attackHeld: false,
  // Auto-aim direction (touch only), set per attack and consumed by the spray
  // cone visual so it points where the damage was aimed.
  aimDir: null as { x: number; z: number } | null,
  // The active legend's right-hand node (KayKit `handslot.r`), set by KayLegend.
  // Attacks read its world position so spray/records originate from the hand.
  playerHand: null as THREE.Object3D | null,
};
