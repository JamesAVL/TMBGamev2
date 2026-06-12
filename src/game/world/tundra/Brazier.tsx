import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CylinderCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { sfx } from '../../../audio/sfx';
import { XP_BY_KIND } from '../../progression/skills';
import { useCombatStore } from '../../../stores/combatStore';
import { usePlayerStore } from '../../../stores/playerStore';
import { useRunStore } from '../../../stores/runStore';
import { runtime } from '../../combat/runtime';

const FLARE_COOLDOWN = 8;
const FLARE_AOE = 3.5;
const HEAL_RANGE = 2.5;
const HEAL_INTERVAL = 2; // 1 hp every 2s of standing in the warmth
const BOSS_VULNERABLE_FOR = 4;

// Warmth in the waste. Stand close to slowly heal; swipe it to burst embers —
// scalds nearby bailiffs, and if the Black Frost is caught in it, his
// composure breaks and he can be hurt for a few seconds.
export function Brazier({
  id,
  position,
  bossLink = false,
}: {
  id: string;
  position: [number, number, number];
  bossLink?: boolean;
}) {
  const lightRef = useRef<THREE.PointLight>(null);
  const coalsRef = useRef<THREE.MeshStandardMaterial>(null);
  const readyAt = useRef(0);
  const flareUntil = useRef(0);
  const healAcc = useRef(0);
  const reInvulnAt = useRef(0);

  useEffect(() => {
    runtime.swipeTargets.set(id, {
      position: () => ({ x: position[0], y: position[1], z: position[2] }),
      onHit: () => {
        const now = runtime.time;
        if (now < readyAt.current) return; // still recovering — a dull thud
        readyAt.current = now + FLARE_COOLDOWN;
        flareUntil.current = now + 0.5;
        sfx.ember();
        const combat = useCombatStore.getState();
        // Scald anything nearby (ember kills still feed XP and kill-heal)
        for (const [enemyId, body] of runtime.enemyBodies) {
          if (enemyId === 'blackfrost') continue;
          const entry = combat.enemies[enemyId];
          if (!entry?.alive) continue;
          const t = body.translation();
          const dx = t.x - position[0];
          const dz = t.z - position[2];
          if (dx * dx + dz * dz > FLARE_AOE * FLARE_AOE) continue;
          const result = combat.damageEnemy(enemyId, 1);
          if (result === 'none' || result === 'immune') continue;
          const d = Math.max(0.01, Math.hypot(dx, dz));
          body.applyImpulse({ x: (dx / d) * 2.5, y: 0.8, z: (dz / d) * 2.5 }, true);
          if (result === 'dead') {
            useRunStore.getState().addXp(XP_BY_KIND[entry.kind]);
          }
        }
        // Any stage brazier breaks the Black Frost's composure — no lure,
        // no positioning puzzle. Burst embers, then strike.
        if (bossLink && combat.enemies['blackfrost']?.alive) {
          combat.setInvulnerable('blackfrost', false);
          reInvulnAt.current = now + BOSS_VULNERABLE_FOR;
        }
      },
    });
    return () => {
      runtime.swipeTargets.delete(id);
    };
  }, [id, position, bossLink]);

  useFrame((state, delta) => {
    const now = runtime.time;
    const flaring = now < flareUntil.current;
    const cooling = now < readyAt.current && !flaring;

    // Composure restored after the vulnerability window
    if (reInvulnAt.current > 0 && now >= reInvulnAt.current) {
      reInvulnAt.current = 0;
      const combat = useCombatStore.getState();
      if (combat.enemies['blackfrost']?.alive) combat.setInvulnerable('blackfrost', true);
    }

    // Fire light flicker
    if (lightRef.current) {
      const base = flaring ? 9 : cooling ? 0.7 : 2.6;
      lightRef.current.intensity =
        base + Math.sin(state.clock.elapsedTime * 11 + position[0]) * base * 0.18;
    }
    if (coalsRef.current) {
      coalsRef.current.emissiveIntensity = flaring ? 4 : cooling ? 0.35 : 1.4;
    }

    // Warmth heals — but the boss-stage braziers are tools, not treatment
    if (!bossLink) {
      const body = runtime.player?.group;
      if (body && !usePlayerStore.getState().dead) {
        const t = body.translation();
        const dx = t.x - position[0];
        const dz = t.z - position[2];
        if (dx * dx + dz * dz < HEAL_RANGE * HEAL_RANGE) {
          healAcc.current += delta;
          if (healAcc.current >= HEAL_INTERVAL) {
            healAcc.current = 0;
            usePlayerStore.getState().heal(1);
          }
        } else {
          healAcc.current = 0;
        }
      }
    }
  });

  return (
    <group position={position}>
      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider args={[0.35, 0.55]} position={[0, 0.35, 0]} />
        <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.55, 0.42, 0.6, 12]} />
          <meshStandardMaterial color="#564e44" />
        </mesh>
      </RigidBody>
      <mesh position={[0, 0.62, 0]}>
        <sphereGeometry args={[0.38, 12, 8]} />
        <meshStandardMaterial
          ref={coalsRef}
          color="#3a2218"
          emissive="#ff7a30"
          emissiveIntensity={1.4}
        />
      </mesh>
      <pointLight ref={lightRef} position={[0, 1.2, 0]} color="#ff9a40" distance={10} />
    </group>
  );
}
