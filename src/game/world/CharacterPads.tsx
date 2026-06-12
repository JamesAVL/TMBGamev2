import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { sfx } from '../../audio/sfx';
import { useProfileStore, type CharacterId } from '../../stores/profileStore';
import { runtime } from '../combat/runtime';

// Dressing-room pads: stand on one to become that legend. The hub wardrobe
// replaces these eventually.
function Pad({
  character,
  position,
  color,
  label,
}: {
  character: CharacterId;
  position: [number, number, number];
  color: string;
  label: string;
}) {
  const active = useProfileStore((s) => s.character === character);
  const wasInside = useRef(false);

  useFrame(() => {
    const body = runtime.player?.group;
    if (!body) return;
    const t = body.translation();
    const dx = t.x - position[0];
    const dz = t.z - position[2];
    const inside = dx * dx + dz * dz < 1.1;
    if (inside && !wasInside.current && !active) {
      useProfileStore.getState().setCharacter(character);
      sfx.spend();
    }
    wasInside.current = inside;
  });

  return (
    <group position={position}>
      <mesh receiveShadow position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.95, 1.05, 0.14, 20]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 1.2 : 0.15}
        />
      </mesh>
      <Html position={[0, 1.5, 0]} center>
        <div className={active ? 'pad-label active' : 'pad-label'}>{label}</div>
      </Html>
    </group>
  );
}

export function CharacterPads() {
  return (
    <>
      <Pad character="vince" position={[-3, 0, 6.5]} color="#d84f9a" label="VINCE" />
      <Pad character="howard" position={[-5.6, 0, 6.5]} color="#c4a86a" label="HOWARD" />
    </>
  );
}
