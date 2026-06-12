import { ToonOutline } from '../../look/ToonOutline';
import { getGradientMap } from '../../look/toon';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type * as THREE from 'three';
import { useHubStore } from '../../../stores/hubStore';
import { useSceneStore } from '../../../stores/sceneStore';
import { runtime } from '../../combat/runtime';
import { Block } from '../Block';
import { Portal } from '../Portal';
import { KayProp } from '../props/KayProp';

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
          <meshToonMaterial gradientMap={getGradientMap()} color="#3a8a8a" />
          <ToonOutline />
        </mesh>
        {/* Sash */}
        <mesh castShadow position={[0, 0.6, 0]}>
          <torusGeometry args={[0.27, 0.05, 8, 16]} />
          <meshToonMaterial gradientMap={getGradientMap()} color="#c4a86a" />
        </mesh>
        {/* Head */}
        <mesh castShadow position={[0, 1.12, 0]}>
          <sphereGeometry args={[0.2, 14, 12]} />
          <meshToonMaterial gradientMap={getGradientMap()} color="#d8b894" />
        </mesh>
        {/* Turban */}
        <mesh castShadow position={[0, 1.28, 0]}>
          <sphereGeometry args={[0.21, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshToonMaterial gradientMap={getGradientMap()} color="#e8e4da" />
        </mesh>
        <mesh position={[0, 1.3, 0.18]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color="#c4332f" emissive="#c4332f" emissiveIntensity={0.6} />
        </mesh>
        {/* Heavy-lidded eyes (facing the door, +z) */}
        <mesh position={[-0.07, 1.13, 0.18]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshToonMaterial gradientMap={getGradientMap()} color="#16161a" />
        </mesh>
        <mesh position={[0.07, 1.13, 0.18]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshToonMaterial gradientMap={getGradientMap()} color="#16161a" />
        </mesh>
      </group>
      <Html position={[0, 1.9, 0]} center>
        <div className="portal-label">NABOO</div>
      </Html>
    </group>
  );
}

export function Nabootique() {
  const setScene = useSceneStore((s) => s.setScene);

  return (
    <>
      {/* Atmosphere: warm, lived-in — and properly lit where it matters */}
      <color attach="background" args={['#171221']} />
      <hemisphereLight args={['#ffd9b0', '#241a2e', 0.65]} />
      {/* the counter spot: Naboo works under good light */}
      <spotLight
        position={[0, 4.2, -3.2]}
        angle={0.65}
        penumbra={0.6}
        intensity={32}
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
        <meshToonMaterial gradientMap={getGradientMap()} color="#8a3a5a" />
      </mesh>

      {/* The counter, and the shaman behind it */}
      <Block size={[5, 1.1, 1]} position={[0, 0.55, -4]} color="#5a4a36" />
      <NabooNPC />

      {/* Tat. Do not touch unless buying. (KayKit Dungeon Remastered, CC0) */}
      <KayProp
        name="shelf_large"
        position={[-7.4, 0, -3]}
        rotation={[0, Math.PI / 2, 0]}
        physical
      />
      <KayProp
        name="shelf_small"
        position={[-7.4, 0, 1.2]}
        rotation={[0, Math.PI / 2, 0]}
        physical
      />
      <KayProp
        name="shelf_large"
        position={[7.4, 0, -1]}
        rotation={[0, -Math.PI / 2, 0]}
        physical
      />
      <KayProp
        name="shelf_small"
        position={[7.4, 0, 3.4]}
        rotation={[0, -Math.PI / 2, 0]}
        physical
      />
      <KayProp name="crates_stacked" position={[-6.6, 0, 6.2]} rotation={[0, 0.5, 0]} physical />
      <KayProp name="keg_decorated" position={[6.8, 0, 6.4]} physical />
      <KayProp name="barrel_large_decorated" position={[-6.9, 0, -6.5]} physical />
      <KayProp
        name="box_small_decorated"
        position={[6.7, 0, -5.9]}
        rotation={[0, -0.4, 0]}
        physical
      />
      <KayProp name="chest_gold" position={[2.9, 0, -6.6]} rotation={[0, Math.PI, 0]} physical />
      <KayProp name="table_long" position={[-3.4, 0, -6.4]} physical />
      <KayProp name="chair" position={[-4.3, 0, -5.3]} rotation={[0, 2.6, 0]} />
      {/* counter clutter */}
      <KayProp name="candle_triple" position={[-1.6, 1.1, -4]} />
      <KayProp name="coin_stack_medium" position={[1.4, 1.1, -4]} />
      <KayProp name="bottle_A_labeled_green" position={[0.6, 1.1, -4.2]} />
      <KayProp name="bottle_B_brown" position={[-0.6, 1.1, -3.8]} />
      {/* the house banner */}
      <KayProp name="banner_patternA_red" position={[3.4, 3.9, -7.7]} />

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
