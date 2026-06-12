// Howard Moon: jazz maverick, man of action, slightly wider load.
// Offset down by floatHeight (0.3) — ecctrl floats its capsule by design.
export function HowardModel() {
  return (
    <group position={[0, -0.3, 0]}>
      {/* Sturdy body in earth tones */}
      <mesh castShadow>
        <capsuleGeometry args={[0.32, 0.68, 6, 16]} />
        <meshStandardMaterial color="#c4a86a" roughness={0.8} />
      </mesh>
      {/* Roll-neck */}
      <mesh castShadow position={[0, 0.3, 0]}>
        <torusGeometry args={[0.28, 0.06, 8, 16]} />
        <meshStandardMaterial color="#8a6f4a" />
      </mesh>
      {/* Porkpie hat */}
      <mesh castShadow position={[0, 0.66, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.05, 14]} />
        <meshStandardMaterial color="#5a4a36" />
      </mesh>
      <mesh castShadow position={[0, 0.76, 0]}>
        <cylinderGeometry args={[0.23, 0.25, 0.18, 14]} />
        <meshStandardMaterial color="#5a4a36" />
      </mesh>
      {/* Small eyes. Don't mention them. */}
      <mesh position={[-0.09, 0.5, 0.28]}>
        <sphereGeometry args={[0.032, 8, 8]} />
        <meshStandardMaterial color="#101010" />
      </mesh>
      <mesh position={[0.09, 0.5, 0.28]}>
        <sphereGeometry args={[0.032, 8, 8]} />
        <meshStandardMaterial color="#101010" />
      </mesh>
      {/* The moustache of a man you can trust */}
      <mesh castShadow position={[0, 0.4, 0.3]}>
        <boxGeometry args={[0.18, 0.045, 0.05]} />
        <meshStandardMaterial color="#6a5538" roughness={1} />
      </mesh>
      {/* Record satchel on the hip */}
      <mesh castShadow position={[-0.3, 0, 0.05]}>
        <boxGeometry args={[0.1, 0.34, 0.34]} />
        <meshStandardMaterial color="#4a3a2a" />
      </mesh>
    </group>
  );
}
