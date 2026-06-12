import type { RefObject } from 'react';
import type * as THREE from 'three';

// Greybox-tier Hitcher: green-skinned cockney menace in a long dark coat and
// top hat, one glowing polo-mint eye. Primitives only — lo-fi and handmade on
// purpose; a proper papier-mâché-style GLB can replace this later.
export function HitcherModel({
  eyeMaterialRef,
}: {
  eyeMaterialRef: RefObject<THREE.MeshStandardMaterial | null>;
}) {
  return (
    <group>
      {/* Long coat */}
      <mesh castShadow position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.38, 0.46, 1.0, 12]} />
        <meshStandardMaterial color="#20241c" />
      </mesh>
      {/* Torso + head */}
      <mesh castShadow position={[0, 0.35, 0]}>
        <capsuleGeometry args={[0.32, 0.5, 6, 14]} />
        <meshStandardMaterial color="#4a7a3d" />
      </mesh>
      {/* Top hat */}
      <mesh castShadow position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.06, 16]} />
        <meshStandardMaterial color="#15161a" />
      </mesh>
      <mesh castShadow position={[0, 1.06, 0]}>
        <cylinderGeometry args={[0.27, 0.29, 0.45, 16]} />
        <meshStandardMaterial color="#15161a" />
      </mesh>
      {/* The polo-mint eye (emissive — it blooms, and ramps up before a strike) */}
      <mesh position={[-0.12, 0.52, 0.28]}>
        <torusGeometry args={[0.09, 0.04, 10, 20]} />
        <meshStandardMaterial
          ref={eyeMaterialRef}
          color="#f4f1e8"
          emissive="#f4f1e8"
          emissiveIntensity={2}
        />
      </mesh>
      {/* The ordinary eye */}
      <mesh position={[0.14, 0.52, 0.31]}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial color="#101010" />
      </mesh>
    </group>
  );
}
