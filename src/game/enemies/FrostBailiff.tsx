import { useRef } from 'react';
import type * as THREE from 'three';
import { MeleeEnemy, type MeleeTuning } from './MeleeEnemy';

// Frost Bailiff: a bureaucratic icicle man. Faster and frailer than the
// Hitcher, and he steers like he's on skates (he is — he's made of ice).
const TUNING: MeleeTuning = {
  chaseSpeed: 3.6,
  aggroRange: 13,
  deaggroRange: 18,
  attackTrigger: 1.8,
  strikeRange: 2.3,
  windup: 0.35,
  strikeCooldown: 1.0,
  damage: 1,
  playerKnockback: 1.2,
  steer: 0.14, // icy drift
  capsule: [0.45, 0.32],
};

function FrostBailiffModel({
  eyeMaterialRef,
}: {
  eyeMaterialRef: React.RefObject<THREE.MeshStandardMaterial | null>;
}) {
  return (
    <group>
      {/* Icicle body — a crystal wedge in a civil-servant posture */}
      <mesh castShadow position={[0, -0.15, 0]}>
        <coneGeometry args={[0.42, 1.1, 6]} />
        <meshStandardMaterial color="#9fc8e8" roughness={0.25} />
      </mesh>
      <mesh castShadow position={[0, 0.45, 0]}>
        <coneGeometry args={[0.3, 0.7, 6]} />
        <meshStandardMaterial color="#bcdcf2" roughness={0.2} />
      </mesh>
      {/* Bowler hat — regulation issue */}
      <mesh castShadow position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.05, 14]} />
        <meshStandardMaterial color="#23262e" />
      </mesh>
      <mesh castShadow position={[0, 0.97, 0]}>
        <sphereGeometry args={[0.2, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#23262e" />
      </mesh>
      {/* Cold little eyes (shared material so the windup flare hits both) */}
      <mesh position={[-0.09, 0.62, 0.24]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial
          ref={eyeMaterialRef}
          color="#cfe9ff"
          emissive="#9fd4ff"
          emissiveIntensity={2}
        />
      </mesh>
      <mesh position={[0.09, 0.62, 0.24]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#cfe9ff" emissive="#9fd4ff" emissiveIntensity={2} />
      </mesh>
      {/* The clipboard of fines */}
      <mesh castShadow position={[0.3, 0.2, 0.18]} rotation={[0.3, -0.4, 0]}>
        <boxGeometry args={[0.22, 0.3, 0.03]} />
        <meshStandardMaterial color="#d8cfae" />
      </mesh>
    </group>
  );
}

export function FrostBailiff({ id }: { id: string }) {
  const eyeMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  return (
    <MeleeEnemy id={id} tuning={TUNING} eyeMaterialRef={eyeMaterialRef} lineHeight={1.4}>
      <FrostBailiffModel eyeMaterialRef={eyeMaterialRef} />
    </MeleeEnemy>
  );
}
