import { useRef } from 'react';
import type * as THREE from 'three';
import { MeleeEnemy, type MeleeTuning } from './MeleeEnemy';

// Mod Wolves, as per the reference: upright gents in dark navy suits with
// white pocket squares — and shaggy grey wolf heads. Formal. Unsettling.
// Fast lunging pack hunters; original design and lines in the show's spirit.
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
  capsule: [0.45, 0.3],
};

function ModWolfModel({
  eyeMaterialRef,
}: {
  eyeMaterialRef: React.RefObject<THREE.MeshStandardMaterial | null>;
}) {
  return (
    <group>
      {/* The suit — immaculate */}
      <mesh castShadow position={[0, -0.08, 0]}>
        <capsuleGeometry args={[0.3, 0.55, 6, 14]} />
        <meshStandardMaterial color="#232a3d" roughness={0.7} />
      </mesh>
      {/* Shirt at the collar */}
      <mesh position={[0, 0.2, 0.26]}>
        <boxGeometry args={[0.11, 0.16, 0.03]} />
        <meshStandardMaterial color="#e8e4da" />
      </mesh>
      {/* The pocket square — standards matter */}
      <mesh position={[-0.15, 0.08, 0.27]}>
        <boxGeometry args={[0.07, 0.06, 0.02]} />
        <meshStandardMaterial color="#f4f1e8" />
      </mesh>
      {/* Trousers */}
      <mesh castShadow position={[-0.12, -0.58, 0]}>
        <cylinderGeometry args={[0.08, 0.09, 0.42, 8]} />
        <meshStandardMaterial color="#1c2230" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0.12, -0.58, 0]}>
        <cylinderGeometry args={[0.08, 0.09, 0.42, 8]} />
        <meshStandardMaterial color="#1c2230" roughness={0.8} />
      </mesh>
      {/* Furry hands at rest */}
      <mesh castShadow position={[-0.36, -0.22, 0.04]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#8a8a92" roughness={1} />
      </mesh>
      <mesh castShadow position={[0.36, -0.22, 0.04]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#8a8a92" roughness={1} />
      </mesh>
      {/* The wolf head — shaggy, grey, unbothered */}
      <mesh castShadow position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.26, 12, 10]} />
        <meshStandardMaterial color="#8a8a92" roughness={1} />
      </mesh>
      <mesh castShadow position={[-0.17, 0.57, -0.03]}>
        <sphereGeometry args={[0.17, 10, 8]} />
        <meshStandardMaterial color="#7c7c86" roughness={1} />
      </mesh>
      <mesh castShadow position={[0.17, 0.57, -0.03]}>
        <sphereGeometry args={[0.17, 10, 8]} />
        <meshStandardMaterial color="#7c7c86" roughness={1} />
      </mesh>
      <mesh castShadow position={[0, 0.72, 0.03]}>
        <sphereGeometry args={[0.17, 10, 8]} />
        <meshStandardMaterial color="#6c6c76" roughness={1} />
      </mesh>
      {/* Snout + nose */}
      <mesh castShadow position={[0, 0.49, 0.3]}>
        <boxGeometry args={[0.17, 0.15, 0.28]} />
        <meshStandardMaterial color="#7c7c86" roughness={1} />
      </mesh>
      <mesh position={[0, 0.52, 0.45]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#101014" />
      </mesh>
      {/* Tall ears */}
      <mesh castShadow position={[-0.14, 0.85, -0.02]} rotation={[0, 0, -0.12]}>
        <coneGeometry args={[0.07, 0.22, 6]} />
        <meshStandardMaterial color="#7c7c86" roughness={1} />
      </mesh>
      <mesh castShadow position={[0.14, 0.85, -0.02]} rotation={[0, 0, 0.12]}>
        <coneGeometry args={[0.07, 0.22, 6]} />
        <meshStandardMaterial color="#7c7c86" roughness={1} />
      </mesh>
      {/* Amber eyes (windup flare) */}
      <mesh position={[-0.1, 0.62, 0.22]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial
          ref={eyeMaterialRef}
          color="#ffb83d"
          emissive="#ffb83d"
          emissiveIntensity={2}
        />
      </mesh>
      <mesh position={[0.1, 0.62, 0.22]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color="#ffb83d" emissive="#ffb83d" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

export function ModWolf({ id }: { id: string }) {
  const eyeMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  return (
    <MeleeEnemy id={id} tuning={TUNING} eyeMaterialRef={eyeMaterialRef} lineHeight={1.4}>
      <ModWolfModel eyeMaterialRef={eyeMaterialRef} />
    </MeleeEnemy>
  );
}
