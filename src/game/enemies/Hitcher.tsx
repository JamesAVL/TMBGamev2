import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { sfx } from '../../audio/sfx';
import { useCombatStore } from '../../stores/combatStore';
import { usePlayerStore } from '../../stores/playerStore';
import { runtime } from '../combat/runtime';
import { HitcherModel } from './HitcherModel';
import type { HitcherSpawn } from './spawns';

const AGGRO_RANGE = 12;
const DEAGGRO_RANGE = 16;
const CHASE_SPEED = 3; // slower than the player's 5 — kiting is always possible
const ATTACK_TRIGGER = 1.9;
const STRIKE_RANGE = 2.4;
const WINDUP = 0.45; // telegraph: lean in, eye flares
const STRIKE_COOLDOWN = 1.1;
const STAGGER = 0.35; // no steering while a knockback impulse carries
const HIT_FLASH = 0.15;
const DEATH_SHRINK = 0.35;
const SPAWN_POP = 0.2;
const EYE_IDLE_INTENSITY = 2;

type AiState = 'idle' | 'chase' | 'windup' | 'cooldown' | 'stagger' | 'dead';

// Mounts visible on aggro (parent remounts it per aggro episode), hides itself
// after a beat. setState only happens in the timeout callback.
function AggroLine({ line }: { line: string }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2600);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;
  return (
    <Html position={[0, 1.7, 0]} center>
      <div className="hitcher-line">{line}</div>
    </Html>
  );
}

export function Hitcher({ spawn }: { spawn: HitcherSpawn }) {
  const { id, position, line } = spawn;
  const bodyRef = useRef<RapierRigidBody>(null);
  const groupRef = useRef<THREE.Group>(null);
  const eyeMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

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

  useEffect(() => {
    const body = bodyRef.current;
    if (body) runtime.enemyBodies.set(id, body);
    // Collect materials for the hit flash (everything except the polo eye)
    const mats: THREE.MeshStandardMaterial[] = [];
    groupRef.current?.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
        if (obj.material !== eyeMaterialRef.current) mats.push(obj.material);
      }
    });
    flashMaterials.current = mats;
    return () => {
      runtime.enemyBodies.delete(id);
    };
  }, [id]);

  useFrame((_, delta) => {
    const entry = useCombatStore.getState().enemies[id];
    const body = bodyRef.current;
    const group = groupRef.current;
    if (!entry || !body || !group) return;
    const now = performance.now() / 1000;

    // ---- dead: shrink out, wait, respawn at home ----
    if (!entry.alive) {
      ai.current = 'dead';
      const k = Math.min(1, (now - entry.diedAt) / DEATH_SHRINK);
      group.scale.setScalar(Math.max(0.001, 1 - k));
      if (k >= 1 && body.isEnabled()) body.setEnabled(false);
      if (entry.respawnAt > 0 && now >= entry.respawnAt) {
        body.setTranslation({ x: position[0], y: position[1], z: position[2] }, true);
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

    // Safety net: knocked below the world → back to his post
    if (t.y < -10) {
      body.setTranslation({ x: position[0], y: position[1], z: position[2] }, true);
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
      group.rotation.y += dYaw * Math.min(1, delta * 10);
    }

    // Windup telegraph: lean in, eye flares
    const leanTarget = ai.current === 'windup' ? 0.35 : 0;
    group.rotation.x += (leanTarget - group.rotation.x) * Math.min(1, delta * 12);
    if (eyeMaterialRef.current) {
      const eyeTarget =
        ai.current === 'windup'
          ? EYE_IDLE_INTENSITY + 4 * (1 - Math.max(0, stateUntil.current - now) / WINDUP)
          : EYE_IDLE_INTENSITY;
      eyeMaterialRef.current.emissiveIntensity +=
        (eyeTarget - eyeMaterialRef.current.emissiveIntensity) * Math.min(1, delta * 14);
    }

    const stop = () => body.setLinvel({ x: 0, y: body.linvel().y, z: 0 }, true);

    switch (ai.current) {
      case 'idle': {
        stop();
        if (!playerDead && dist < AGGRO_RANGE) {
          ai.current = 'chase';
          useCombatStore.getState().setAggro(id, true);
        }
        break;
      }
      case 'chase': {
        if (playerDead || dist > DEAGGRO_RANGE) {
          stop();
          ai.current = 'idle';
          useCombatStore.getState().setAggro(id, false);
          break;
        }
        if (dist < ATTACK_TRIGGER) {
          stop();
          ai.current = 'windup';
          stateUntil.current = now + WINDUP;
          break;
        }
        toPlayer.normalize();
        body.setLinvel(
          { x: toPlayer.x * CHASE_SPEED, y: body.linvel().y, z: toPlayer.z * CHASE_SPEED },
          true,
        );
        break;
      }
      case 'windup': {
        stop();
        if (now >= stateUntil.current) {
          if (!playerDead && dist < STRIKE_RANGE) {
            usePlayerStore.getState().damagePlayer(1);
            sfx.playerHurt();
            toPlayer.normalize();
            playerBody.applyImpulse({ x: toPlayer.x * 1.4, y: 0.5, z: toPlayer.z * 1.4 }, true);
          }
          ai.current = 'cooldown';
          stateUntil.current = now + STRIKE_COOLDOWN;
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

  return (
    <RigidBody
      ref={bodyRef}
      colliders={false}
      ccd
      enabledRotations={[false, false, false]}
      position={position}
    >
      <CapsuleCollider args={[0.5, 0.35]} />
      <group ref={groupRef}>
        <HitcherModel eyeMaterialRef={eyeMaterialRef} />
        {aggro && alive && <AggroLine line={line} />}
      </group>
    </RigidBody>
  );
}
