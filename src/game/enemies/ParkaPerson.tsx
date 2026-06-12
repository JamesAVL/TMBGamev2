import { ToonOutline } from '../look/ToonOutline';
import { getGradientMap } from '../look/toon';
import { useRef } from 'react';
import type * as THREE from 'three';
import { MeleeEnemy, type MeleeTuning } from './MeleeEnemy';

// The Parka People: diminutive keepers of the Egg of Mantumbi. Faces lost in
// the dark of their hoods — look too deep and you'll see your heart's desire,
// right before the mittens come out. They live on this ice; you don't.
const TUNING: MeleeTuning = {
  chaseSpeed: 3.6,
  aggroRange: 13,
  deaggroRange: 18,
  attackTrigger: 1.7,
  strikeRange: 2.2,
  windup: 0.4,
  strikeCooldown: 1.0,
  damage: 1,
  playerKnockback: 1.2,
  steer: 0.2, // native to the ice — drifty, but less than a tourist
  capsule: [0.32, 0.3],
};

function ParkaPersonModel({
  hoodVoidRef,
}: {
  hoodVoidRef: React.RefObject<THREE.MeshToonMaterial | null>;
}) {
  return (
    <group position={[0, -0.08, 0]}>
      {/* Squat parka body */}
      <mesh castShadow position={[0, -0.1, 0]}>
        <coneGeometry args={[0.42, 0.85, 10]} />
        <meshToonMaterial gradientMap={getGradientMap()} color="#5f6e44" />
        <ToonOutline />
      </mesh>
      {/* Hood: a great fur-trimmed ring... */}
      <mesh castShadow position={[0, 0.52, 0.02]} rotation={[0.25, 0, 0]}>
        <torusGeometry args={[0.26, 0.11, 10, 18]} />
        <meshToonMaterial gradientMap={getGradientMap()} color="#d8cfb4" />
        <ToonOutline />
      </mesh>
      {/* ...around a face that is only darkness. During the windup the void
          glows — it is showing you your deepest desire. Do not look. */}
      <mesh position={[0, 0.52, 0.02]} rotation={[0.25, 0, 0]}>
        <circleGeometry args={[0.2, 16]} />
        <meshToonMaterial
          gradientMap={getGradientMap()}
          ref={hoodVoidRef}
          color="#06070c"
          emissive="#ffd9a0"
          emissiveIntensity={0}
        />
      </mesh>
      {/* Mittens */}
      <mesh castShadow position={[-0.34, 0.05, 0.12]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshToonMaterial gradientMap={getGradientMap()} color="#8a4f3d" />
      </mesh>
      <mesh castShadow position={[0.34, 0.05, 0.12]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshToonMaterial gradientMap={getGradientMap()} color="#8a4f3d" />
      </mesh>
    </group>
  );
}

export function ParkaPerson({ id }: { id: string }) {
  const hoodVoidRef = useRef<THREE.MeshToonMaterial>(null);
  return (
    <MeleeEnemy
      id={id}
      tuning={TUNING}
      eyeMaterialRef={hoodVoidRef}
      eyeIdleIntensity={0}
      eyeFlareIntensity={3.5}
      lineHeight={1.2}
    >
      <ParkaPersonModel hoodVoidRef={hoodVoidRef} />
    </MeleeEnemy>
  );
}
