import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { runtime } from '../combat/runtime';

// Walk-through gateway: a softly spinning emissive ring. Triggers onEnter once
// when the player's body crosses its centre (simple distance check — no
// physics sensor needed).
export function Portal({
  position,
  label,
  color = '#7fd4ff',
  onEnter,
}: {
  position: [number, number, number];
  label: string;
  color?: string;
  onEnter: () => void;
}) {
  const triggered = useRef(false);
  const ringRef = useRef<THREE.Mesh>(null);
  const discMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const center = useMemo(() => new THREE.Vector3(...position), [position]);

  useFrame((state) => {
    if (ringRef.current) ringRef.current.rotation.z = state.clock.elapsedTime * 0.6;
    if (discMatRef.current) {
      discMatRef.current.opacity = 0.25 + 0.1 * Math.sin(state.clock.elapsedTime * 2.4);
    }
    const body = runtime.player?.group;
    if (!body || triggered.current) return;
    const t = body.translation();
    const dx = t.x - center.x;
    const dz = t.z - center.z;
    if (dx * dx + dz * dz < 1.3) {
      triggered.current = true;
      onEnter();
    }
  });

  return (
    <group position={position}>
      <mesh ref={ringRef}>
        <torusGeometry args={[1.3, 0.12, 10, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} />
      </mesh>
      <mesh>
        <circleGeometry args={[1.2, 28]} />
        <meshStandardMaterial
          ref={discMatRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <Html position={[0, 1.9, 0]} center>
        <div className="portal-label">{label}</div>
      </Html>
    </group>
  );
}
