import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import { ENEMY_HIT_RADIUS, POOL_SIZE, projectileSlots, TARGET_HIT_RADIUS } from './projectilePool';
import { useCombatStore } from '../../stores/combatStore';
import { runtime } from './runtime';

// Howard's jazz records (and any future projectile — the Moon will want
// these). Fixed pool, no rapier bodies: manual sphere checks against the
// enemy registry and swipe targets. Motion advances on the pause-aware
// game clock, so discs freeze mid-air during pauses.
export function Projectiles() {
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const lastTimeRef = useRef(0);

  useFrame(() => {
    const now = runtime.time;
    const dt = Math.max(0, now - lastTimeRef.current); // 0 while paused
    lastTimeRef.current = now;

    for (let i = 0; i < POOL_SIZE; i++) {
      const slot = projectileSlots[i]!;
      const group = groupRefs.current[i];
      if (!group) continue;
      if (!slot.active) {
        group.visible = false;
        continue;
      }

      const step = slot.speed * dt;
      slot.x += slot.dx * step;
      slot.z += slot.dz * step;
      slot.traveled += step;

      // collide with enemies (piercing discs strike each enemy once)
      const enemies = useCombatStore.getState().enemies;
      for (const [id, body] of runtime.enemyBodies) {
        if (!enemies[id]?.alive || !body.isEnabled() || slot.hitIds.has(id)) continue;
        const t = body.translation();
        const ddx = t.x - slot.x;
        const ddz = t.z - slot.z;
        if (Math.abs(t.y - slot.y) > 1.4) continue;
        if (ddx * ddx + ddz * ddz > ENEMY_HIT_RADIUS * ENEMY_HIT_RADIUS) continue;
        slot.hitIds.add(id);
        if (slot.onEnemyHit(id, { x: slot.dx, z: slot.dz })) {
          slot.active = false;
          break;
        }
      }
      if (!slot.active) {
        group.visible = false;
        continue;
      }

      // collide with hittable props (braziers)
      for (const [id, target] of runtime.swipeTargets) {
        const t = target.position();
        const ddx = t.x - slot.x;
        const ddz = t.z - slot.z;
        if (ddx * ddx + ddz * ddz > TARGET_HIT_RADIUS * TARGET_HIT_RADIUS) continue;
        slot.onTargetHit(id);
        slot.active = false;
        break;
      }
      if (!slot.active || slot.traveled >= slot.range) {
        slot.active = false;
        group.visible = false;
        continue;
      }

      group.visible = true;
      group.position.set(slot.x, slot.y, slot.z);
      group.rotation.y = now * 14; // spin, baby
      group.scale.setScalar(slot.rare ? 1.35 : 1);
      const labels = group.children[1] as THREE.Mesh | undefined;
      const goldLabel = group.children[2] as THREE.Mesh | undefined;
      if (labels) labels.visible = !slot.rare;
      if (goldLabel) goldLabel.visible = slot.rare;
    }
  });

  return (
    <>
      {Array.from({ length: POOL_SIZE }, (_, i) => (
        <group
          key={i}
          visible={false}
          ref={(g) => {
            groupRefs.current[i] = g;
          }}
        >
          {/* a 12-inch of pure jazz */}
          <mesh castShadow>
            <cylinderGeometry args={[0.32, 0.32, 0.045, 18]} />
            <meshStandardMaterial color="#16161a" roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.026, 0]}>
            <cylinderGeometry args={[0.11, 0.11, 0.002, 14]} />
            <meshStandardMaterial color="#d8543f" emissive="#d8543f" emissiveIntensity={0.4} />
          </mesh>
          {/* the rare pressing's gold label */}
          <mesh position={[0, 0.026, 0]} visible={false}>
            <cylinderGeometry args={[0.13, 0.13, 0.002, 14]} />
            <meshStandardMaterial color="#e8c050" emissive="#ffae34" emissiveIntensity={1.6} />
          </mesh>
        </group>
      ))}
    </>
  );
}
