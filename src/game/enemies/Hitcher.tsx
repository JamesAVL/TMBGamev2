import { useRef } from 'react';
import type * as THREE from 'three';
import { HitcherModel } from './HitcherModel';
import { MeleeEnemy, type MeleeTuning } from './MeleeEnemy';

const TUNING: MeleeTuning = {
  chaseSpeed: 3, // slower than the player's 5 — kiting is always possible
  aggroRange: 12,
  deaggroRange: 16,
  attackTrigger: 1.9,
  strikeRange: 2.4,
  windup: 0.45,
  strikeCooldown: 1.1,
  damage: 1,
  playerKnockback: 1.4,
  steer: 1,
  capsule: [0.5, 0.35],
};

export function Hitcher({ id }: { id: string }) {
  const eyeMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  return (
    <MeleeEnemy id={id} tuning={TUNING} eyeMaterialRef={eyeMaterialRef}>
      <HitcherModel eyeMaterialRef={eyeMaterialRef} />
    </MeleeEnemy>
  );
}
