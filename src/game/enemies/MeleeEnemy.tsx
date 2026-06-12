import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { sfx } from '../../audio/sfx';
import { useCombatStore } from '../../stores/combatStore';
import { usePlayerStore } from '../../stores/playerStore';
import { runtime } from '../combat/runtime';

export type MeleeTuning = {
  chaseSpeed: number;
  aggroRange: number;
  deaggroRange: number;
  attackTrigger: number;
  strikeRange: number;
  windup: number; // telegraph seconds: lean in, eye flares
  strikeCooldown: number;
  damage: number;
  playerKnockback: number;
  steer: number; // 1 = grips the ground, lower = icy drift
  capsule: [halfHeight: number, radius: number];
};

const STAGGER = 0.35;
const HIT_FLASH = 0.15;
const DEATH_SHRINK = 0.35;
const SPAWN_POP = 0.2;
const VOID_Y = -10;

type AiState = 'idle' | 'chase' | 'windup' | 'cooldown' | 'stagger' | 'dead';

// Mounts visible on aggro (parent remounts it per aggro episode), hides itself
// after a beat. setState only happens in the timeout callback.
export function AggroLine({ line, height }: { line: string; height: number }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2600);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;
  return (
    <Html position={[0, height, 0]} center>
      <div className="hitcher-line">{line}</div>
    </Html>
  );
}

// Shared chase/windup/strike state machine for ground melee enemies.
// One component per enemy type wraps this with its model and tuning.
export function MeleeEnemy({
  id,
  tuning,
  eyeMaterialRef,
  eyeIdleIntensity = 2,
  eyeFlareIntensity = 6,
  lineHeight = 1.7,
  children,
}: {
  id: string;
  tuning: MeleeTuning;
  eyeMaterialRef?: RefObject<THREE.MeshStandardMaterial | null>;
  eyeIdleIntensity?: number;
  eyeFlareIntensity?: number;
  lineHeight?: number;
  children: ReactNode;
}) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const groupRef = useRef<THREE.Group>(null);

  const ai = useRef<AiState>('idle');
  const stateUntil = useRef(0);
  const lastSeenHitAt = useRef(-Infinity);
  const spawnedAt = useRef(0);
  const flashing = useRef(false);
  const flashMaterials = useRef<THREE.MeshStandardMaterial[]>([]);
  const toPlayer = useMemo(() => new THREE.Vector3(), []);

  // Reactive bits (rare transitions only): the aggro speech line
  const aggro = useCombatStore((s) => s.enemies[id]?.aggro ?? false);
  const alive = useCombatStore((s) => s.enemies[id]?.alive ?? false);
  const line = useCombatStore((s) => s.enemies[id]?.line ?? '');
  const spawn = useCombatStore((s) => s.enemies[id]?.spawn);

  useEffect(() => {
    const body = bodyRef.current;
    if (body) runtime.enemyBodies.set(id, body);
    // Collect materials for the hit flash (everything except the eye)
    const mats: THREE.MeshStandardMaterial[] = [];
    groupRef.current?.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
        if (obj.material !== eyeMaterialRef?.current) mats.push(obj.material);
      }
    });
    flashMaterials.current = mats;
    return () => {
      runtime.enemyBodies.delete(id);
    };
  }, [id, eyeMaterialRef]);

  useFrame((_, delta) => {
    const entry = useCombatStore.getState().enemies[id];
    const body = bodyRef.current;
    const group = groupRef.current;
    if (!entry || !body || !group) return;
    const now = runtime.time;
    const home = entry.spawn;

    // ---- dead: shrink out; respawn at home only if this enemy respawns ----
    if (!entry.alive) {
      ai.current = 'dead';
      const k = Math.min(1, (now - entry.diedAt) / DEATH_SHRINK);
      group.scale.setScalar(Math.max(0.001, 1 - k));
      if (k >= 1 && body.isEnabled()) body.setEnabled(false);
      if (entry.respawnAt > 0 && now >= entry.respawnAt) {
        body.setTranslation({ x: home[0], y: home[1], z: home[2] }, true);
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        body.setEnabled(true);
        spawnedAt.current = now;
        ai.current = 'idle';
        useCombatStore.getState().respawnEnemy(id);
      }
      return;
    }
    if (ai.current === 'dead') ai.current = 'idle';

    // ---- respawn pop-in ----
    if (spawnedAt.current > 0 && now - spawnedAt.current < SPAWN_POP) {
      group.scale.setScalar(Math.min(1, (now - spawnedAt.current) / SPAWN_POP));
    } else {
      group.scale.setScalar(1);
    }

    // ---- taking a hit interrupts everything ----
    if (entry.lastHitAt !== lastSeenHitAt.current) {
      lastSeenHitAt.current = entry.lastHitAt;
      ai.current = 'stagger';
      stateUntil.current = now + STAGGER;
    }

    // ---- hit flash ----
    const sinceHit = now - entry.lastHitAt;
    if (sinceHit >= 0 && sinceHit < HIT_FLASH) {
      flashing.current = true;
      for (const m of flashMaterials.current) {
        m.emissive.setRGB(1, 1, 1);
        m.emissiveIntensity = 1.5 * (1 - sinceHit / HIT_FLASH);
      }
    } else if (flashing.current) {
      flashing.current = false;
      for (const m of flashMaterials.current) {
        m.emissive.setRGB(0, 0, 0);
        m.emissiveIntensity = 0;
      }
    }

    const playerBody = runtime.player?.group;
    if (!playerBody) return;
    const playerDead = usePlayerStore.getState().dead;
    const p = playerBody.translation();
    const t = body.translation();

    // Safety net: knocked below the world → back home
    if (t.y < VOID_Y) {
      body.setTranslation({ x: home[0], y: home[1], z: home[2] }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }

    toPlayer.set(p.x - t.x, 0, p.z - t.z);
    const dist = toPlayer.length();

    // Face the player whenever engaged (mesh-only; body rotations are locked)
    if (entry.aggro && dist > 0.01) {
      const targetYaw = Math.atan2(toPlayer.x, toPlayer.z);
      let dYaw = targetYaw - group.rotation.y;
      dYaw = Math.atan2(Math.sin(dYaw), Math.cos(dYaw));
      group.rotation.y += dYaw * Math.min(1, delta * 14);
    }

    // Windup telegraph: lean in, eye flares
    const leanTarget = ai.current === 'windup' ? 0.35 : 0;
    group.rotation.x += (leanTarget - group.rotation.x) * Math.min(1, delta * 12);
    if (eyeMaterialRef?.current) {
      const eyeTarget =
        ai.current === 'windup'
          ? eyeIdleIntensity +
            (eyeFlareIntensity - eyeIdleIntensity) *
              (1 - Math.max(0, stateUntil.current - now) / tuning.windup)
          : eyeIdleIntensity;
      eyeMaterialRef.current.emissiveIntensity +=
        (eyeTarget - eyeMaterialRef.current.emissiveIntensity) * Math.min(1, delta * 14);
    }

    const stop = () => body.setLinvel({ x: 0, y: body.linvel().y, z: 0 }, true);
    // steer < 1 = icy drift: velocity eases toward the target instead of snapping
    const steerToward = (vx: number, vz: number) => {
      const v = body.linvel();
      const k = Math.min(1, tuning.steer * delta * 60);
      body.setLinvel({ x: v.x + (vx - v.x) * k, y: v.y, z: v.z + (vz - v.z) * k }, true);
    };

    switch (ai.current) {
      case 'idle': {
        stop();
        if (!playerDead && dist < tuning.aggroRange) {
          ai.current = 'chase';
          useCombatStore.getState().setAggro(id, true);
          // snap to face the player instantly — no backwards-walking turn
          if (dist > 0.01) group.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
        }
        break;
      }
      case 'chase': {
        if (playerDead || dist > tuning.deaggroRange) {
          stop();
          ai.current = 'idle';
          useCombatStore.getState().setAggro(id, false);
          break;
        }
        if (dist < tuning.attackTrigger) {
          stop();
          ai.current = 'windup';
          stateUntil.current = now + tuning.windup;
          break;
        }
        toPlayer.normalize();
        steerToward(toPlayer.x * tuning.chaseSpeed, toPlayer.z * tuning.chaseSpeed);
        break;
      }
      case 'windup': {
        stop();
        if (now >= stateUntil.current) {
          if (!playerDead && dist < tuning.strikeRange) {
            usePlayerStore.getState().damagePlayer(tuning.damage);
            sfx.playerHurt();
            toPlayer.normalize();
            playerBody.applyImpulse(
              {
                x: toPlayer.x * tuning.playerKnockback,
                y: 0.5,
                z: toPlayer.z * tuning.playerKnockback,
              },
              true,
            );
          }
          ai.current = 'cooldown';
          stateUntil.current = now + tuning.strikeCooldown;
        }
        break;
      }
      case 'cooldown': {
        stop();
        if (now >= stateUntil.current) ai.current = 'chase';
        break;
      }
      case 'stagger': {
        // knockback impulse carries the body; no steering
        if (now >= stateUntil.current) ai.current = 'chase';
        break;
      }
    }
  });

  if (!spawn) return null;

  return (
    <RigidBody
      ref={bodyRef}
      colliders={false}
      ccd
      enabledRotations={[false, false, false]}
      position={spawn}
    >
      <CapsuleCollider args={tuning.capsule} />
      <group ref={groupRef}>
        {children}
        {aggro && alive && line && <AggroLine line={line} height={lineHeight} />}
      </group>
    </RigidBody>
  );
}
