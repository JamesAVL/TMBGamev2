// Placeholder body until the first gltfjsx character lands.
// The group sits 0.3 below the rigid-body centre: ecctrl floats its capsule
// floatHeight (0.3) above ground by design — without the offset the mesh hovers.
export function PlayerModel() {
  return (
    <group position={[0, -0.3, 0]}>
      {/* Body — matches the physics capsule (radius 0.3, cylinder 0.7) */}
      <mesh castShadow>
        <capsuleGeometry args={[0.3, 0.7, 6, 16]} />
        <meshStandardMaterial color="#e0913d" />
      </mesh>
      {/* Facing indicator on +Z (glTF forward, the direction ecctrl turns toward) */}
      <mesh position={[0, 0.2, 0.34]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.12, 0.3, 12]} />
        <meshStandardMaterial color="#2b2b2b" />
      </mesh>
      <mesh position={[-0.11, 0.42, 0.25]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#f4f1e8" />
      </mesh>
      <mesh position={[0.11, 0.42, 0.25]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#f4f1e8" />
      </mesh>
    </group>
  );
}
