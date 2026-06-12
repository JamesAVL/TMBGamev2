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
const ORBIT_SPEED = 0.8; // never a statue — he circles his audience
const PREFERRED_MIN = 3.2;
const PREFERRED_MAX = 5.5;
const COLD_SNAP_RANGE = 2.3;
const COLD_SNAP_EVERY = 2.5;
const TELEGRAPH = 1.35; // floor patterns: seconds of clearly-visible warning
const SNAP_LINGER = 0.3;
const PATTERN_FREEZE = 0.8;
const BEAM_TELEGRAPH = 0.8; // jockstrap glows; aim locks partway through
const BEAM_LOCK = 0.5;
const BEAM_FLASH = 0.18;
const BEAM_LENGTH = 14;
const BEAM_HALF_WIDTH = 0.9;
const BEAM_FREEZE = 1.0;
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
  // High contrast on the pale ice floor — you should never be hit by a
  // pattern you couldn't see.
  const opacity = zone.snapped ? 0.9 : 0.55;
  const emissive = zone.snapped ? 2.5 : 1.2;
  const color = zone.snapped ? '#dff4ff' : '#1a9bff';
  const mat = (
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={emissive}
      transparent
      opacity={opacity}
      depthWrite={false}
      side={THREE.DoubleSide}
    />
  );
  return (
    <group position={[zone.center[0], 0.06, zone.center[1]]}>
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

// The Black Frost, as illustrated: charcoal punk menace, black hair spikes,
// jagged claws, red cowboy boots — and a red jockstrap that fires a freezing
// beam. Invulnerable while his composure holds (brazier embers break it).
export function BlackFrost() {
  const bodyRef = useRef<RapierRigidBody>(null);
  const groupRef = useRef<THREE.Group>(null);
  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const jockMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const beamWarnRef = useRef<THREE.Mesh>(null);
  const beamWarnMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const beamRef = useRef<THREE.Mesh>(null);

  const [zones, setZones] = useState<FreezeZone[]>([]);
  const zoneSeq = useRef(0);
  const nextAttackAt = useRef(0);
  const attackTurn = useRef<'beam' | 'pattern'>('beam');
  const castIdx = useRef(0);
  const beamPhase = useRef<'idle' | 'telegraph' | 'fire'>('idle');
  const beamStartAt = useRef(0);
  const beamTarget = useMemo(() => new THREE.Vector2(), []);
  const orbitDir = useRef(1);
  const nextOrbitFlipAt = useRef(0);
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
        beamPhase.current = 'idle';
        if (beamWarnRef.current) beamWarnRef.current.visible = false;
        if (beamRef.current) beamRef.current.visible = false;
      }
      const k = Math.min(1, (now - entry.diedAt) / 0.6);
      group.scale.setScalar(Math.max(0.001, 1 - k));
      if (k >= 1 && body.isEnabled()) body.setEnabled(false);
      return;
    }

    // hit flash on the body while vulnerable
    if (entry.lastHitAt !== lastSeenHitAt.current) {
      lastSeenHitAt.current = entry.lastHitAt;
      flashUntil.current = now + HIT_FLASH;
    }
    if (bodyMatRef.current) {
      if (now < flashUntil.current) {
        bodyMatRef.current.emissive.setRGB(1, 1, 1);
        bodyMatRef.current.emissiveIntensity = 1.5;
      } else if (!entry.invulnerable) {
        // composure broken: he smoulders
        bodyMatRef.current.emissive.setRGB(1, 0.45, 0.15);
        bodyMatRef.current.emissiveIntensity = 0.6;
      } else {
        bodyMatRef.current.emissive.setRGB(0, 0, 0);
        bodyMatRef.current.emissiveIntensity = 0;
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
        nextAttackAt.current = now + 2;
        nextOrbitFlipAt.current = now + 6;
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

    // movement: approach/retreat to his preferred performing distance, and
    // always orbiting — he sweeps past the braziers on his rounds
    if (now >= nextOrbitFlipAt.current) {
      nextOrbitFlipAt.current = now + 5 + Math.random() * 4;
      orbitDir.current *= -1;
    }
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
      // tangential sweep (perpendicular to the player direction)
      vx += -toPlayer.z * ORBIT_SPEED * orbitDir.current;
      vz += toPlayer.x * ORBIT_SPEED * orbitDir.current;
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

    const enraged = entry.hp <= entry.maxHp / 2;

    // ---- the set list: beam and floor patterns, alternating ----
    if (!playerDead && beamPhase.current === 'idle' && now >= nextAttackAt.current) {
      nextAttackAt.current = now + (enraged ? 3.2 : 4.2);
      sfx.castCue();
      if (attackTurn.current === 'beam') {
        attackTurn.current = 'pattern';
        beamPhase.current = 'telegraph';
        beamStartAt.current = now;
        beamTarget.set(p.x, p.z);
      } else {
        attackTurn.current = 'beam';
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
    }

    // ---- beam state machine: telegraph (aim), fire (freeze), done ----
    if (beamPhase.current !== 'idle') {
      const tBeam = now - beamStartAt.current;
      // aim tracks the player until lock, then holds — that's the dodge
      if (tBeam < BEAM_LOCK) beamTarget.set(p.x, p.z);
      const dirX = beamTarget.x - t.x;
      const dirZ = beamTarget.y - t.z;
      const dirLen = Math.max(0.01, Math.hypot(dirX, dirZ));
      const nx = dirX / dirLen;
      const nz = dirZ / dirLen;
      const yaw = Math.atan2(nx, nz);

      if (jockMatRef.current) {
        jockMatRef.current.emissive.setRGB(0.4, 0.8, 1);
        jockMatRef.current.emissiveIntensity = Math.min(4, (tBeam / BEAM_TELEGRAPH) * 4);
      }
      if (beamPhase.current === 'telegraph') {
        if (beamWarnRef.current && beamWarnMatRef.current) {
          beamWarnRef.current.visible = true;
          beamWarnRef.current.position.set(
            t.x + nx * (BEAM_LENGTH / 2),
            0.1,
            t.z + nz * (BEAM_LENGTH / 2),
          );
          beamWarnRef.current.rotation.y = yaw;
          beamWarnMatRef.current.opacity = 0.35 + 0.25 * Math.sin(now * 18);
        }
        if (tBeam >= BEAM_TELEGRAPH) {
          beamPhase.current = 'fire';
          sfx.beamFire();
          if (beamWarnRef.current) beamWarnRef.current.visible = false;
          // the corridor check: distance from player to the beam segment
          if (!playerDead) {
            const px = p.x - t.x;
            const pz = p.z - t.z;
            const along = Math.max(0, Math.min(BEAM_LENGTH, px * nx + pz * nz));
            const cx = nx * along;
            const cz = nz * along;
            const offX = px - cx;
            const offZ = pz - cz;
            if (offX * offX + offZ * offZ < BEAM_HALF_WIDTH * BEAM_HALF_WIDTH) {
              usePlayerStore.getState().damagePlayer(1);
              usePlayerStore.getState().freezePlayer(BEAM_FREEZE);
              sfx.playerHurt();
            }
          }
        }
      }
      if (beamPhase.current === 'fire') {
        if (beamRef.current) {
          beamRef.current.visible = true;
          beamRef.current.position.set(
            t.x + nx * (BEAM_LENGTH / 2),
            0.35,
            t.z + nz * (BEAM_LENGTH / 2),
          );
          beamRef.current.rotation.y = yaw;
        }
        if (tBeam >= BEAM_TELEGRAPH + BEAM_FLASH) {
          beamPhase.current = 'idle';
          if (beamRef.current) beamRef.current.visible = false;
          if (jockMatRef.current) jockMatRef.current.emissiveIntensity = 0.4;
        }
      }
    }

    // resolve floor zones: snap, hurt + freeze, expire
    let changed = false;
    for (const zone of zones) {
      if (!zone.snapped && now >= zone.snapAt) {
        changed = true;
        sfx.freezeSnap();
        if (!playerDead && playerInZone(zone, p.x, p.z)) {
          usePlayerStore.getState().damagePlayer(1);
          usePlayerStore.getState().freezePlayer(PATTERN_FREEZE);
          sfx.playerHurt();
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

  const spike = (i: number, count: number) => {
    const a = (i / count) * Math.PI * 2;
    const tilt = 0.55;
    return (
      <mesh
        key={i}
        castShadow
        position={[Math.sin(a) * 0.2, 1.32 + (i % 2) * 0.05, Math.cos(a) * 0.2]}
        rotation={[Math.cos(a) * tilt, 0, -Math.sin(a) * tilt]}
      >
        <coneGeometry args={[0.055, 0.5, 5]} />
        <meshStandardMaterial color="#0c0c10" roughness={0.9} />
      </mesh>
    );
  };

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
          {/* Charcoal punk body */}
          <mesh castShadow position={[0, 0.1, 0]}>
            <capsuleGeometry args={[0.38, 1.2, 6, 14]} />
            <meshStandardMaterial ref={bodyMatRef} color="#26262c" roughness={0.85} />
          </mesh>
          {/* Grey scowling face */}
          <mesh castShadow position={[0, 0.98, 0.08]}>
            <sphereGeometry args={[0.3, 14, 12]} />
            <meshStandardMaterial color="#4e4e58" roughness={0.8} />
          </mesh>
          <mesh position={[-0.1, 1.04, 0.32]}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshStandardMaterial color="#e8e4da" emissive="#e8e4da" emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[0.1, 1.04, 0.32]}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshStandardMaterial color="#e8e4da" emissive="#e8e4da" emissiveIntensity={0.6} />
          </mesh>
          {/* Gritted teeth */}
          <mesh position={[0, 0.88, 0.33]}>
            <boxGeometry args={[0.16, 0.05, 0.03]} />
            <meshStandardMaterial color="#d8d4c8" />
          </mesh>
          {/* The hair: a crown of black spikes */}
          {Array.from({ length: 9 }, (_, i) => spike(i, 9))}
          <mesh castShadow position={[0, 1.45, 0]}>
            <coneGeometry args={[0.06, 0.55, 5]} />
            <meshStandardMaterial color="#0c0c10" roughness={0.9} />
          </mesh>
          {/* Jagged claw hands */}
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.52, -0.15, 0.08]} rotation={[0, 0, side * 0.5]}>
              <mesh castShadow>
                <coneGeometry args={[0.11, 0.34, 5]} />
                <meshStandardMaterial color="#0c0c10" roughness={0.95} />
              </mesh>
              <mesh castShadow position={[side * 0.08, -0.08, 0.06]} rotation={[0.5, 0, 0]}>
                <coneGeometry args={[0.07, 0.26, 5]} />
                <meshStandardMaterial color="#0c0c10" roughness={0.95} />
              </mesh>
            </group>
          ))}
          {/* THE jockstrap — red, emblazoned, and the source of the beam */}
          <mesh castShadow position={[0, -0.52, 0.2]}>
            <boxGeometry args={[0.36, 0.3, 0.2]} />
            <meshStandardMaterial
              ref={jockMatRef}
              color="#c4332f"
              emissive="#7fd4ff"
              emissiveIntensity={0.4}
              roughness={0.6}
            />
          </mesh>
          <mesh position={[0, -0.52, 0.31]}>
            <boxGeometry args={[0.12, 0.14, 0.01]} />
            <meshStandardMaterial color="#f4f1e8" />
          </mesh>
          {/* Red cowboy boots, white trim */}
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.2, -1.12, 0.04]}>
              <mesh castShadow>
                <boxGeometry args={[0.2, 0.34, 0.22]} />
                <meshStandardMaterial color="#c4332f" roughness={0.5} />
              </mesh>
              <mesh castShadow position={[0, -0.12, 0.14]}>
                <boxGeometry args={[0.18, 0.12, 0.18]} />
                <meshStandardMaterial color="#c4332f" roughness={0.5} />
              </mesh>
              <mesh position={[0, 0.05, 0.115]}>
                <boxGeometry args={[0.05, 0.2, 0.01]} />
                <meshStandardMaterial color="#f4f1e8" />
              </mesh>
            </group>
          ))}
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
          {!invulnerable && alive && <AggroLine line="You have… creased my aura." height={2.1} />}
        </group>
      </RigidBody>
      {/* Beam warning line + the beam itself (world space) */}
      <mesh ref={beamWarnRef} visible={false}>
        <boxGeometry args={[0.14, 0.02, BEAM_LENGTH]} />
        <meshStandardMaterial
          ref={beamWarnMatRef}
          color="#1a9bff"
          emissive="#1a9bff"
          emissiveIntensity={1.5}
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={beamRef} visible={false}>
        <boxGeometry args={[BEAM_HALF_WIDTH * 2, 0.7, BEAM_LENGTH]} />
        <meshStandardMaterial
          color="#dff4ff"
          emissive="#9fd4ff"
          emissiveIntensity={3}
          transparent
          opacity={0.75}
          depthWrite={false}
        />
      </mesh>
      {zones.map((zone) => (
        <FreezeZoneMesh key={zone.id} zone={zone} />
      ))}
    </>
  );
}
