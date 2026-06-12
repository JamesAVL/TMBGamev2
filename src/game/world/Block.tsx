import { RigidBody } from '@react-three/rapier';

export type Vec3 = [number, number, number];

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
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  );
}
