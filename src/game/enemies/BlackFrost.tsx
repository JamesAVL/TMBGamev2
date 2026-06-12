import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { sfx } from '../../audio/sfx';
import { useCombatStore } from '../../stores/combatStore';
import { usePlayerStore } from '../../stores/playerStore';
import { runtime } from '../combat/runtime';
import { AggroLine } from './MeleeEnemy';

const ID = 'blackfrost';
const AGGRO_RANGE = 16;
const DRIFT_SPEED = 1.2;
const PREFERRED_MIN = 3.2;
const PREFERRED_MAX = 5.5;
const COLD_SNAP_RANGE = 2.3;
const COLD_SNAP_EVERY = 2.5;
const TELEGRAPH = 1.15; // seconds of warning before a pattern snaps frozen
const SNAP_LINGER = 0.3;
const HIT_FLASH = 0.15;

type FreezeZone = {
  id: number;
  shape: 'ring' | 'circle' | 'cross';
  center: [number, number];
  snapAt: number;
  expireAt: number;
  snapped: boolean;
};

function playerInZone(zone: FreezeZone, px: number, pz: number): boolean {
  const dx = px - zone.center[0];
  const dz = pz - zone.center[1];
  if (zone.shape === 'circle') return dx * dx + dz * dz < 2.6 * 2.6;
  if (zone.shape === 'ring') {
    const r = Math.hypot(dx, dz);
    return r > 3.3 && r < 5.7;
  }
  // cross: two axis-aligned strips
  return (Math.abs(dx) < 1.0 && Math.abs(dz) < 5.5) || (Math.abs(dz) < 1.0 && Math.abs(dx) < 5.5);
}

function FreezeZoneMesh({ zone }: { zone: FreezeZone }) {
  const opacity = zone.snapped ? 0.8 : 0.32;
  const emissive = zone.snapped ? 2 : 0.5;
  const mat = (
    <meshStandardMaterial
      color="#6fd0ff"
      emissive="#6fd0ff"
      emissiveIntensity={emissive}
      transparent
      opacity={opacity}
      depthWrite={false}
      side={THREE.DoubleSide}
    />
  );
  return (
    <group position={[zone.center[0], 0.04, zone.center[1]]}>
      {zone.shape === 'ring' && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.3, 5.7, 44]} />
          {mat}
        </mesh>
      )}
      {zone.shape === 'circle' && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.6, 30]} />
          {mat}
        </mesh>
      )}
      {zone.shape === 'cross' && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2, 11]} />
            {mat}
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[11, 2]} />
            {mat}
          </mesh>
        </>
      )}
    </group>
  );
}

// The Black Frost: a velvet-voiced cold front who thinks he's a lounge act.
// Invulnerable while his composure holds — break it with brazier embers, then
// hit him hard. His set list is telegraphed floor-freeze patterns.
export function BlackFrost() {
  const bodyRef = useRef<RapierRigidBody>(null);
  const groupRef = useRef<THREE.Group>(null);
  const coatMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const [zones, setZones] = useState<FreezeZone[]>([]);
  const zoneSeq = useRef(0);
  const nextCastAt = useRef(0);
  const castIdx = useRef(0);
  const nextColdSnapAt = useRef(0);
  const deathPlayed = useRef(false);
  const lastSeenHitAt = useRef(-Infinity);
  const flashUntil = useRef(0);
  const toPlayer = useMemo(() => new THREE.Vector3(), []);

  const entryExists = useCombatStore((s) => Boolean(s.enemies[ID]));
  const aggro = useCombatStore((s) => s.enemies[ID]?.aggro ?? false);
  const alive = useCombatStore((s) => s.enemies[ID]?.alive ?? false);
  const invulnerable = useCombatStore((s) => s.enemies[ID]?.invulnerable ?? true);
  const line = useCombatStore((s) => s.enemies[ID]?.line ?? '');

  useFrame((_, delta) => {
    const entry = useCombatStore.getState().enemies[ID];
    const body = bodyRef.current;
    const group = groupRef.current;
    if (!entry || !body || !group) return;
    const now = runtime.time;

    // register lazily (mounted only when the boss phase spawns him)
    if (!runtime.enemyBodies.has(ID)) runtime.enemyBodies.set(ID, body);

    if (!entry.alive) {
      if (!deathPlayed.current) {
        deathPlayed.current = true;
        sfx.bossDown();
        if (zones.length) setZones([]);
      }
      const k = Math.min(1, (now - entry.diedAt) / 0.6);
      group.scale.setScalar(Math.max(0.001, 1 - k));
      if (k >= 1 && body.isEnabled()) body.setEnabled(false);
      return;
    }

    // hit flash on the coat while vulnerable
    if (entry.lastHitAt !== lastSeenHitAt.current) {
      lastSeenHitAt.current = entry.lastHitAt;
      flashUntil.current = now + HIT_FLASH;
    }
    if (coatMatRef.current) {
      if (now < flashUntil.current) {
        coatMatRef.current.emissive.setRGB(1, 1, 1);
        coatMatRef.current.emissiveIntensity = 1.5;
      } else if (!entry.invulnerable) {
        // composure broken: the coat smoulders
        coatMatRef.current.emissive.setRGB(1, 0.45, 0.15);
        coatMatRef.current.emissiveIntensity = 0.7;
      } else {
        coatMatRef.current.emissive.setRGB(0, 0, 0);
        coatMatRef.current.emissiveIntensity = 0;
      }
    }

    const playerBody = runtime.player?.group;
    if (!playerBody) return;
    const playerDead = usePlayerStore.getState().dead;
    const p = playerBody.translation();
    const t = body.translation();
    toPlayer.set(p.x - t.x, 0, p.z - t.z);
    const dist = toPlayer.length();

    if (!entry.aggro) {
      if (!playerDead && dist < AGGRO_RANGE) {
        useCombatStore.getState().setAggro(ID, true);
        nextCastAt.current = now + 2;
      }
      return;
    }

    // face the player
    if (dist > 0.01) {
      const targetYaw = Math.atan2(toPlayer.x, toPlayer.z);
      let dYaw = targetYaw - group.rotation.y;
      dYaw = Math.atan2(Math.sin(dYaw), Math.cos(dYaw));
      group.rotation.y += dYaw * Math.min(1, delta * 6);
    }

    // unhurried drift: keeps his preferred performing distance
    let vx = 0;
    let vz = 0;
    if (!playerDead && dist > 0.01) {
      toPlayer.normalize();
      if (dist > PREFERRED_MAX) {
        vx = toPlayer.x * DRIFT_SPEED;
        vz = toPlayer.z * DRIFT_SPEED;
      } else if (dist < PREFERRED_MIN) {
        vx = -toPlayer.x * DRIFT_SPEED * 0.7;
        vz = -toPlayer.z * DRIFT_SPEED * 0.7;
      }
    }
    const v = body.linvel();
    const k = Math.min(1, 0.18 * delta * 60);
    body.setLinvel({ x: v.x + (vx - v.x) * k, y: v.y, z: v.z + (vz - v.z) * k }, true);

    // cold snap: shoves a face-hugging player away (no damage)
    if (!playerDead && dist < COLD_SNAP_RANGE && now >= nextColdSnapAt.current) {
      nextColdSnapAt.current = now + COLD_SNAP_EVERY;
      sfx.freezeSnap();
      playerBody.applyImpulse({ x: toPlayer.x * 1.3, y: 0.4, z: toPlayer.z * 1.3 }, true);
    }

    // the set list: telegraphed floor-freeze patterns
    if (!playerDead && now >= nextCastAt.current) {
      const enraged = entry.hp <= entry.maxHp / 2;
      nextCastAt.current = now + (enraged ? 4 : 5.2);
      const shapes: FreezeZone['shape'][] = ['ring', 'cross', 'circle'];
      const shape = shapes[castIdx.current % shapes.length] ?? 'ring';
      castIdx.current++;
      const cast: FreezeZone[] = [
        {
          id: zoneSeq.current++,
          shape,
          center: shape === 'circle' ? [p.x, p.z] : [t.x, t.z],
          snapAt: now + TELEGRAPH,
          expireAt: now + TELEGRAPH + SNAP_LINGER,
          snapped: false,
        },
      ];
      if (enraged && shape !== 'circle') {
        cast.push({
          id: zoneSeq.current++,
          shape: 'circle',
          center: [p.x, p.z],
          snapAt: now + TELEGRAPH,
          expireAt: now + TELEGRAPH + SNAP_LINGER,
          snapped: false,
        });
      }
      setZones((zs) => [...zs, ...cast]);
    }

    // resolve zones: snap, hurt, expire
    let changed = false;
    for (const zone of zones) {
      if (!zone.snapped && now >= zone.snapAt) {
        changed = true;
        sfx.freezeSnap();
        if (!playerDead && playerInZone(zone, p.x, p.z)) {
          usePlayerStore.getState().damagePlayer(1);
          sfx.playerHurt();
          playerBody.applyImpulse({ x: 0, y: 0.9, z: 0 }, true);
        }
      }
    }
    if (changed || zones.some((z) => now >= z.expireAt)) {
      setZones(
        zones
          .map((z) => (now >= z.snapAt && !z.snapped ? { ...z, snapped: true } : z))
          .filter((z) => now < z.expireAt),
      );
    }
  });

  if (!entryExists) return null;

  return (
    <>
      <RigidBody
        ref={bodyRef}
        colliders={false}
        ccd
        enabledRotations={[false, false, false]}
        position={[0, 2, -40]}
      >
        <CapsuleCollider args={[0.8, 0.55]} />
        <group ref={groupRef}>
          {/* Long indigo coat */}
          <mesh castShadow position={[0, -0.4, 0]}>
            <cylinderGeometry args={[0.58, 0.78, 1.7, 14]} />
            <meshStandardMaterial ref={coatMatRef} color="#2a2440" />
          </mesh>
          {/* White fur trim */}
          <mesh castShadow position={[0, 0.5, 0]}>
            <torusGeometry args={[0.55, 0.13, 10, 20]} />
            <meshStandardMaterial color="#e8e4da" roughness={0.9} />
          </mesh>
          {/* Pale face */}
          <mesh castShadow position={[0, 0.92, 0]}>
            <sphereGeometry args={[0.42, 16, 14]} />
            <meshStandardMaterial color="#d8d4e8" />
          </mesh>
          {/* Ice crown */}
          {[-0.18, 0, 0.18].map((x, i) => (
            <mesh key={i} castShadow position={[x, 1.42, 0]}>
              <coneGeometry args={[0.08, i === 1 ? 0.42 : 0.28, 6]} />
              <meshStandardMaterial color="#bfe4ff" emissive="#bfe4ff" emissiveIntensity={1.2} />
            </mesh>
          ))}
          {/* Monocle — naturally */}
          <mesh position={[-0.16, 0.95, 0.38]}>
            <torusGeometry args={[0.12, 0.03, 8, 18]} />
            <meshStandardMaterial color="#bfe4ff" emissive="#bfe4ff" emissiveIntensity={2.5} />
          </mesh>
          <mesh position={[0.16, 0.98, 0.4]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#101018" />
          </mesh>
          {/* Composure: a shimmer of cold around him while invulnerable */}
          {invulnerable && alive && (
            <mesh>
              <sphereGeometry args={[1.5, 20, 16]} />
              <meshStandardMaterial
                color="#88d4ff"
                emissive="#88d4ff"
                emissiveIntensity={0.4}
                transparent
                opacity={0.13}
                depthWrite={false}
              />
            </mesh>
          )}
          {aggro && alive && line && <AggroLine line={line} height={2.1} />}
          {!invulnerable && alive && <AggroLine line="You have… creased my lapels." height={2.1} />}
        </group>
      </RigidBody>
      {zones.map((zone) => (
        <FreezeZoneMesh key={zone.id} zone={zone} />
      ))}
    </>
  );
}
