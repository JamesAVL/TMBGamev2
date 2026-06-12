import * as THREE from 'three';
import { Outlines } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { useSettingsStore } from '../../stores/settingsStore';
import { getGradientMap, getPaperTexture, OUTLINE_COLOR, OUTLINE_THICKNESS } from '../look/toon';

export type Vec3 = [number, number, number];

// World materials are never mutated, so every block of a given colour shares
// one toon material instance — stepped shading + paper grain, cached.
const materialCache = new Map<string, THREE.MeshToonMaterial>();
function materialFor(color: string): THREE.MeshToonMaterial {
  let m = materialCache.get(color);
  if (!m) {
    m = new THREE.MeshToonMaterial({
      color,
      gradientMap: getGradientMap(),
      map: getPaperTexture(),
    });
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
  const performanceMode = useSettingsStore((s) => s.performanceMode);
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
      <mesh castShadow receiveShadow material={materialFor(color)}>
        <boxGeometry args={size} />
        {!performanceMode && <Outlines thickness={OUTLINE_THICKNESS} color={OUTLINE_COLOR} />}
      </mesh>
    </RigidBody>
  );
}
