import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type * as THREE from 'three';
import { useHubStore } from '../../../stores/hubStore';
import { useSceneStore } from '../../../stores/sceneStore';
import { runtime } from '../../combat/runtime';
import { Block } from '../Block';
import { Portal } from '../Portal';

// THE NABOOTIQUE — the shop between runs. Warm, cluttered, faintly mystical.
// Naboo holds the counter at the north end; the doors out are to the south.

const NABOO_POS: [number, number, number] = [0, 0, -5];
const TALK_RANGE = 2.6;

function NabooNPC() {
  const groupRef = useRef<THREE.Group>(null);
  const wasNear = useRef(false);

  useFrame((state) => {
    const group = groupRef.current;
    if (group) {
      // unhurried shaman bob
      group.position.y = 0.02 + Math.sin(state.clock.elapsedTime * 1.2) * 0.03;
    }
    const body = runtime.player?.group;
    if (!body) return;
    const t = body.translation();
    const dx = t.x - NABOO_POS[0];
    const dz = t.z - NABOO_POS[2];
    const near = dx * dx + dz * dz < TALK_RANGE * TALK_RANGE;
    if (near !== wasNear.current) {
      wasNear.current = near;
      useHubStore.getState().setNearNaboo(near);
    }
  });

  return (
    <group position={NABOO_POS}>
      <group ref={groupRef}>
        {/* Robe */}
        <mesh castShadow position={[0, 0.55, 0]}>
          <capsuleGeometry args={[0.26, 0.6, 6, 14]} />
          <meshStandardMaterial color="#3a8a8a" roughness={0.85} />
        </mesh>
        {/* Sash */}
        <mesh castShadow position={[0, 0.6, 0]}>
          <torusGeometry args={[0.27, 0.05, 8, 16]} />
          <meshStandardMaterial color="#c4a86a" />
        </mesh>
        {/* Head */}
        <mesh castShadow position={[0, 1.12, 0]}>
          <sphereGeometry args={[0.2, 14, 12]} />
          <meshStandardMaterial color="#d8b894" />
        </mesh>
        {/* Turban */}
        <mesh castShadow position={[0, 1.28, 0]}>
          <sphereGeometry args={[0.21, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#e8e4da" />
        </mesh>
        <mesh position={[0, 1.3, 0.18]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color="#c4332f" emissive="#c4332f" emissiveIntensity={0.6} />
        </mesh>
        {/* Heavy-lidded eyes (facing the door, +z) */}
        <mesh position={[-0.07, 1.13, 0.18]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#16161a" />
        </mesh>
        <mesh position={[0.07, 1.13, 0.18]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#16161a" />
        </mesh>
      </group>
      <Html position={[0, 1.9, 0]} center>
        <div className="portal-label">NABOO</div>
      </Html>
    </group>
  );
}

// A shelf of unexplainable tat: little randomized boxes and orbs.
function TatShelf({ position, seed }: { position: [number, number, number]; seed: number }) {
  const colors = ['#d84f9a', '#7fd4ff', '#ffd76e', '#9fd08a', '#c4332f', '#b8c4e8'];
  return (
    <group position={position}>
      <Block size={[3.2, 0.12, 0.7]} position={[0, 0, 0]} color="#5a4a36" />
      {Array.from({ length: 4 }, (_, i) => {
        const c = colors[(seed + i * 2) % colors.length]!;
        const x = -1.2 + i * 0.8;
        return (i + seed) % 2 === 0 ? (
          <mesh key={i} castShadow position={[x, 0.22, 0]}>
            <boxGeometry args={[0.3, 0.32, 0.3]} />
            <meshStandardMaterial color={c} roughness={0.6} />
          </mesh>
        ) : (
          <mesh key={i} castShadow position={[x, 0.24, 0]}>
            <sphereGeometry args={[0.17, 10, 8]} />
            <meshStandardMaterial color={c} roughness={0.4} emissive={c} emissiveIntensity={0.2} />
          </mesh>
        );
      })}
    </group>
  );
}

export function Nabootique() {
  const setScene = useSceneStore((s) => s.setScene);

  return (
    <>
      {/* Atmosphere: warm, lived-in — and properly lit where it matters */}
      <color attach="background" args={['#171221']} />
      <hemisphereLight args={['#ffd9b0', '#241a2e', 0.8]} />
      {/* the counter spot: Naboo works under good light */}
      <spotLight
        position={[0, 4.2, -3.2]}
        angle={0.65}
        penumbra={0.6}
        intensity={26}
        color="#ffe2c0"
        distance={12}
        castShadow
      />
      {/* shelf wash lights so the tat reads */}
      <pointLight position={[-6.2, 3.2, -2.5]} color="#ffe8d0" intensity={5} distance={6.5} />
      <pointLight position={[6.2, 3.2, 0.5]} color="#ffe8d0" intensity={5} distance={6.5} />
      <pointLight position={[0, 3.4, 2]} color="#ffb070" intensity={3.5} distance={12} />
      {/* colour accents, gentler now */}
      <pointLight position={[5, 1.4, 4]} color="#ff5fae" intensity={1.2} distance={7} />
      <pointLight position={[-5.5, 1.2, 4.5]} color="#7fd4ff" intensity={1} distance={6} />

      {/* Floor + walls + ceiling shadow box */}
      <Block size={[16, 0.5, 16]} position={[0, -0.25, 0]} color="#7a5b3a" />
      <Block size={[16, 4.4, 0.5]} position={[0, 2.2, -8]} color="#4a3a52" />
      <Block size={[16, 4.4, 0.5]} position={[0, 2.2, 8]} color="#4a3a52" />
      <Block size={[0.5, 4.4, 16]} position={[-8, 2.2, 0]} color="#4a3a52" />
      <Block size={[0.5, 4.4, 16]} position={[8, 2.2, 0]} color="#4a3a52" />
      {/* Rug */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.6, 24]} />
        <meshStandardMaterial color="#8a3a5a" roughness={1} />
      </mesh>

      {/* The counter, and the shaman behind it */}
      <Block size={[5, 1.1, 1]} position={[0, 0.55, -4]} color="#5a4a36" />
      <NabooNPC />

      {/* Tat. Do not touch unless buying. */}
      <TatShelf position={[-6.8, 1.4, -3]} seed={0} />
      <TatShelf position={[-6.8, 2.3, -3]} seed={1} />
      <TatShelf position={[6.8, 1.4, -1]} seed={2} />
      <TatShelf position={[6.8, 2.3, -1]} seed={3} />
      <TatShelf position={[-6.8, 1.8, 3]} seed={4} />
      <TatShelf position={[6.8, 1.8, 4]} seed={5} />

      {/* The doors out (south wall) */}
      <Portal position={[-4, 1.7, 7.2]} label="THE TUNDRA" onEnter={() => setScene('tundra')} />
      <Portal
        position={[4, 1.7, 7.2]}
        label="TRAINING RANGE"
        color="#9aa3b8"
        onEnter={() => setScene('greybox')}
      />
    </>
  );
}
