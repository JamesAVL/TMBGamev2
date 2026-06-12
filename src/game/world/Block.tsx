import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';

export type Vec3 = [number, number, number];

// World materials are never mutated, so every block of a given colour shares
// one material instance — dozens fewer shader-program bindings and GC churn.
const materialCache = new Map<string, THREE.MeshStandardMaterial>();
function materialFor(color: string): THREE.MeshStandardMaterial {
  let m = materialCache.get(color);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color });
    materialCache.set(color, m);
  }
  return m;
}

export function Block({
  size,
  position,
  rotation,
  color,
}: {
  size: Vec3;
  position: Vec3;
  rotation?: Vec3;
  color: string;
}) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
      <mesh castShadow receiveShadow material={materialFor(color)}>
        <boxGeometry args={size} />
      </mesh>
    </RigidBody>
  );
}
