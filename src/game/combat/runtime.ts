import type { CustomEcctrlRigidBody } from 'ecctrl';
import type { RapierRigidBody } from '@react-three/rapier';

// Mutable per-frame registry of physics bodies. Deliberately NOT zustand:
// these are engine handles read every frame, not reactive game state.
export const runtime = {
  player: null as CustomEcctrlRigidBody | null,
  enemyBodies: new Map<string, RapierRigidBody>(),
};
