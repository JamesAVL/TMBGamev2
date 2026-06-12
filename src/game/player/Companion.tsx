import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import type * as THREE from 'three';
import { useProfileStore } from '../../stores/profileStore';
import { runtime } from '../combat/runtime';
import { HowardModel } from './HowardModel';
import { VinceModel } from './VinceModel';

const FOLLOW_START = 3.5; // begins jogging when this far behind
const FOLLOW_STOP = 2.0;
const FOLLOW_SPEED = 6; // faster than the player's run — never left behind for long
const STRAND_DISTANCE = 14; // beyond this (or below the world): teleport to your side
const VOID_Y = -10;

// The legend you're NOT controlling. Follows, dodges nothing, fights nobody —
// switching (Q) is how their kit enters the fray. A plain dynamic body, so
// knockbacks and wind apply, which is funnier.
export function Companion() {
  const bodyRef = useRef<RapierRigidBody>(null);
  const groupRef = useRef<THREE.Group>(null);
  const active = useProfileStore((s) => s.character);

  useEffect(() => {
    runtime.companion = bodyRef.current;
    return () => {
      runtime.companion = null;
    };
  }, []);

  useFrame((_, delta) => {
    const body = bodyRef.current;
    const group = groupRef.current;
    const player = runtime.player?.group;
    if (!body || !group || !player) return;

    const p = player.translation();
    const t = body.translation();
    const dx = p.x - t.x;
    const dz = p.z - t.z;
    const dist = Math.hypot(dx, dz);

    if (dist > STRAND_DISTANCE || t.y < VOID_Y) {
      body.setTranslation({ x: p.x + 1.2, y: p.y + 0.6, z: p.z + 1.2 }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }

    // face the player
    if (dist > 0.01) {
      const targetYaw = Math.atan2(dx, dz);
      let dYaw = targetYaw - group.rotation.y;
      dYaw = Math.atan2(Math.sin(dYaw), Math.cos(dYaw));
      group.rotation.y += dYaw * Math.min(1, delta * 8);
    }

    const v = body.linvel();
    if (dist > FOLLOW_START) {
      const nx = dx / dist;
      const nz = dz / dist;
      const k = Math.min(1, 0.22 * delta * 60);
      body.setLinvel(
        { x: v.x + (nx * FOLLOW_SPEED - v.x) * k, y: v.y, z: v.z + (nz * FOLLOW_SPEED - v.z) * k },
        true,
      );
    } else if (dist < FOLLOW_STOP) {
      body.setLinvel({ x: v.x * 0.8, y: v.y, z: v.z * 0.8 }, true);
    } else {
      body.setLinvel({ x: v.x * 0.9, y: v.y, z: v.z * 0.9 }, true);
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      colliders={false}
      ccd
      enabledRotations={[false, false, false]}
      position={[1.8, 4, 1.8]}
    >
      <CapsuleCollider args={[0.35, 0.3]} />
      <group ref={groupRef}>
        {/* counter the models' baked ecctrl float offset (−0.3) */}
        <group position={[0, 0.3, 0]}>
          {active === 'vince' ? <HowardModel /> : <VinceModel />}
        </group>
      </group>
    </RigidBody>
  );
}
