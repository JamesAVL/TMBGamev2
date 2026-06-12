import { useRef } from 'react';
import type * as THREE from 'three';
import { MeleeEnemy, type MeleeTuning } from './MeleeEnemy';

// Mod Wolves: the best-dressed pack on the range. Fast, frail, and very
// committed to the look. Original design and lines in the show's spirit.
const TUNING: MeleeTuning = {
  chaseSpeed: 4.2,
  aggroRange: 13,
  deaggroRange: 19,
  attackTrigger: 1.8,
  strikeRange: 2.3,
  windup: 0.3, // quick lunge — read the eye flare
  strikeCooldown: 0.9,
  damage: 1,
  playerKnockback: 1.3,
  steer: 0.8,
  capsule: [0.2, 0.32],
};

function ModWolfModel({
  eyeMaterialRef,
}: {
  eyeMaterialRef: React.RefObject<THREE.MeshStandardMaterial | null>;
}) {
  return (
    <group position={[0, -0.18, 0]}>
      {/* Low-slung lupine body */}
      <mesh castShadow position={[0, 0.18, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.26, 0.55, 6, 12]} />
        <meshStandardMaterial color="#8a8a92" roughness={0.9} />
      </mesh>
      {/* Parka over the shoulders */}
      <mesh castShadow position={[0, 0.26, -0.18]}>
        <cylinderGeometry args={[0.3, 0.34, 0.3, 10]} />
        <meshStandardMaterial color="#5f6e44" roughness={0.95} />
      </mesh>
      {/* Target roundel — the uniform */}
      <mesh position={[0, 0.24, 0.34]}>
        <cylinderGeometry args={[0.15, 0.15, 0.012, 16]} />
        <meshStandardMaterial color="#c4332f" />
      </mesh>
      <mesh position={[0, 0.24, 0.348]}>
        <cylinderGeometry args={[0.1, 0.1, 0.012, 14]} />
        <meshStandardMaterial color="#e8e4da" />
      </mesh>
      <mesh position={[0, 0.24, 0.356]}>
        <cylinderGeometry args={[0.05, 0.05, 0.012, 12]} />
        <meshStandardMaterial color="#2a4a8a" />
      </mesh>
      {/* Head + mod fringe */}
      <mesh castShadow position={[0, 0.42, 0.42]}>
        <sphereGeometry args={[0.22, 12, 10]} />
        <meshStandardMaterial color="#7c7c86" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.54, 0.46]}>
        <boxGeometry args={[0.34, 0.09, 0.16]} />
        <meshStandardMaterial color="#16161a" roughness={1} />
      </mesh>
      {/* Snout */}
      <mesh castShadow position={[0, 0.38, 0.6]}>
        <coneGeometry args={[0.09, 0.22, 8]} />
        <meshStandardMaterial color="#6c6c76" />
      </mesh>
      {/* Amber eyes (windup flare) */}
      <mesh position={[-0.09, 0.45, 0.6]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial
          ref={eyeMaterialRef}
          color="#ffb83d"
          emissive="#ffb83d"
          emissiveIntensity={2}
        />
      </mesh>
      <mesh position={[0.09, 0.45, 0.6]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#ffb83d" emissive="#ffb83d" emissiveIntensity={2} />
      </mesh>
      {/* Ears, tail, stubby legs */}
      <mesh castShadow position={[-0.1, 0.6, 0.36]} rotation={[0.2, 0, -0.15]}>
        <coneGeometry args={[0.05, 0.14, 6]} />
        <meshStandardMaterial color="#7c7c86" />
      </mesh>
      <mesh castShadow position={[0.1, 0.6, 0.36]} rotation={[0.2, 0, 0.15]}>
        <coneGeometry args={[0.05, 0.14, 6]} />
        <meshStandardMaterial color="#7c7c86" />
      </mesh>
      <mesh castShadow position={[0, 0.3, -0.48]} rotation={[-1.1, 0, 0]}>
        <coneGeometry args={[0.06, 0.3, 6]} />
        <meshStandardMaterial color="#8a8a92" />
      </mesh>
      {[-0.16, 0.16].map((x) =>
        [0.18, -0.26].map((z) => (
          <mesh key={`${x}:${z}`} castShadow position={[x, -0.02, z]}>
            <cylinderGeometry args={[0.05, 0.05, 0.24, 8]} />
            <meshStandardMaterial color="#6c6c76" />
          </mesh>
        )),
      )}
    </group>
  );
}

export function ModWolf({ id }: { id: string }) {
  const eyeMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  return (
    <MeleeEnemy id={id} tuning={TUNING} eyeMaterialRef={eyeMaterialRef} lineHeight={1.1}>
      <ModWolfModel eyeMaterialRef={eyeMaterialRef} />
    </MeleeEnemy>
  );
}
