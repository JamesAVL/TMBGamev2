import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ensureAudio, sfx } from '../../audio/sfx';
import { BASE_CRIT, XP_BY_KIND } from '../progression/skills';
import { useCombatStore } from '../../stores/combatStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useProfileStore } from '../../stores/profileStore';
import { useRunStore } from '../../stores/runStore';
import { useSceneStore } from '../../stores/sceneStore';
import { throwRecord } from '../combat/projectilePool';
import { runtime } from '../combat/runtime';
import { movementConfig } from './movementConfig';

const SPRAY_COOLDOWN = 0.45; // × stats.cooldownMult
const SPRAY_RANGE = 2.4; // × stats.rangeMult, × (1 + Wide Nozzle)
const SPRAY_BASE_HALF_ANGLE = 55; // degrees, + Wide Nozzle
const SPRAY_LIFETIME = 0.16;
const RECORD_COOLDOWN = 0.6; // × stats.cooldownMult
const RECORD_RANGE = 12; // × stats.rangeMult, × (1 + Strong Arm)
const RECORD_SPEED = 16; // × Strong Arm
const MIST_RADIUS = 1.7; // Extra Hold's lingering glitter
const MIST_TICK = 0.45;
const MIST_DAMAGE_FACTOR = 0.35;
const MAX_MISTS = 4;
const VOID_Y = -10; // below the slab: teleport home instead of falling forever
const RESPAWN_DELAY = 1.4;

type Mist = { id: number; x: number; z: number; until: number; nextTick: number };

// Mounted inside <Ecctrl>, so the spray cone inherits the body transform
// (which faces the camera heading under CameraBasedMovement).
export function PlayerCombat() {
  const camera = useThree((state) => state.camera);
  const scene = useThree((state) => state.scene);
  const sprayRef = useRef<THREE.Mesh>(null);
  const sprayMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const lastAttackRef = useRef(-Infinity);
  const lastRegenRef = useRef(0);
  const deadAtRef = useRef(0); // wall-clock seconds
  const wasFrozenRef = useRef(false);
  const iceRef = useRef<THREE.Mesh>(null);
  const [mists, setMists] = useState<Mist[]>([]);
  const mistSeq = useRef(0);
  const forward = useMemo(() => new THREE.Vector3(), []);
  const toEnemy = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    // Damage one enemy, with crit roll; grants XP / kill heal on death.
    const strike = (id: string, dmg: number, knockback: number, dir: { x: number; z: number }) => {
      const combat = useCombatStore.getState();
      const entry = combat.enemies[id];
      if (!entry?.alive) return { connected: false, killed: false, immune: false, crit: false };
      const crit = Math.random() < BASE_CRIT;
      const result = combat.damageEnemy(id, crit ? dmg * 2 : dmg);
      if (result === 'none') return { connected: false, killed: false, immune: false, crit: false };
      if (result === 'immune')
        return { connected: false, killed: false, immune: true, crit: false };
      runtime.enemyBodies
        .get(id)
        ?.applyImpulse({ x: dir.x * knockback, y: 0.9, z: dir.z * knockback }, true);
      if (result === 'dead') {
        useRunStore.getState().addXp(XP_BY_KIND[entry.kind]);
      }
      return { connected: true, killed: result === 'dead', immune: false, crit };
    };

    // Vince: a tight cone of weaponised glamour
    const sprayAttack = (p: { x: number; y: number; z: number }) => {
      const can = useRunStore.getState().stats.vince;
      const range = SPRAY_RANGE * can.rangeMult;
      const halfAngleCos = Math.cos(((SPRAY_BASE_HALF_ANGLE + can.arcBonusDeg) * Math.PI) / 180);
      sfx.spray();
      useCombatStore.getState().registerAttack();
      let connected = false;
      let killed = false;
      let immune = false;
      let anyCrit = false;
      for (const [id, body] of runtime.enemyBodies) {
        const t = body.translation();
        toEnemy.set(t.x - p.x, 0, t.z - p.z);
        if (toEnemy.length() > range) continue;
        toEnemy.normalize();
        if (toEnemy.dot(forward) < halfAngleCos) continue;
        const r = strike(id, can.damage, 3, toEnemy);
        connected ||= r.connected;
        killed ||= r.killed;
        immune ||= r.immune;
        anyCrit ||= r.crit;
      }
      for (const target of runtime.swipeTargets.values()) {
        const t = target.position();
        toEnemy.set(t.x - p.x, 0, t.z - p.z);
        if (toEnemy.length() > range) continue;
        toEnemy.normalize();
        if (toEnemy.dot(forward) < halfAngleCos) continue;
        target.onHit();
        connected = true;
      }
      if (connected) {
        if (anyCrit) sfx.crit();
        else sfx.hit();
        useCombatStore.getState().triggerHitStop(anyCrit ? 110 : 70);
      } else if (immune) {
        sfx.clink(); // bounced off — he's unbothered
      }
      if (killed) sfx.enemyDeath();

      // Extra Hold: the mist remembers
      if (can.lingerSeconds > 0) {
        const now = runtime.time;
        const mist: Mist = {
          id: mistSeq.current++,
          x: p.x + forward.x * 1.5,
          z: p.z + forward.z * 1.5,
          until: now + can.lingerSeconds,
          nextTick: now + MIST_TICK,
        };
        setMists((zs) => [...zs.slice(-(MAX_MISTS - 1)), mist]);
      }
    };

    // Howard: a 12-inch of pure jazz, thrown flat and spinning
    const recordAttack = (p: { x: number; y: number; z: number }) => {
      const collection = useRunStore.getState().stats.howard;
      const rare = Math.random() < collection.rareChance;
      const dmg = collection.damage * (rare ? 2 : 1);
      const knockback = 3 + collection.knockbackBonus + (rare ? 1 : 0);
      sfx.throwWhoosh();
      throwRecord({
        x: p.x + forward.x * 0.5,
        y: p.y + 0.35,
        z: p.z + forward.z * 0.5,
        dx: forward.x,
        dz: forward.z,
        speed: RECORD_SPEED * collection.speedMult,
        range: RECORD_RANGE * collection.rangeMult,
        rare,
        onEnemyHit: (id, dir) => {
          const r = strike(id, dmg, knockback, dir);
          if (r.connected) {
            if (r.crit) sfx.crit();
            else sfx.thunk();
            useCombatStore.getState().triggerHitStop(r.crit ? 110 : 60);
            if (r.killed) sfx.enemyDeath();
            return !rare; // a rare pressing carves straight through
          }
          if (r.immune) {
            sfx.clink();
            return true; // disc bounces off the composure
          }
          return false; // dead/missing enemy — sail on
        },
        onTargetHit: (id) => {
          runtime.swipeTargets.get(id)?.onHit();
          sfx.thunk();
        },
      });
    };

    const attack = () => {
      const now = runtime.time;
      const run = useRunStore.getState();
      if (run.panelOpen) return; // mid skill-spend
      const character = useProfileStore.getState().character;
      const cooldown =
        character === 'vince'
          ? SPRAY_COOLDOWN * run.stats.vince.cooldownMult
          : RECORD_COOLDOWN * run.stats.howard.cooldownMult;
      if (now - lastAttackRef.current < cooldown) return;
      const player = usePlayerStore.getState();
      if (player.dead || now < player.frozenUntil) return; // no flailing in the ice
      const body = runtime.player?.group;
      if (!body) return;
      lastAttackRef.current = now;
      ensureAudio();

      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      const p = body.translation();

      if (character === 'vince') sprayAttack(p);
      else recordAttack(p);
    };

    const onMouseDown = (e: MouseEvent) => {
      // While pointer-locked, left click attacks (the unlocked click only locks).
      if (e.button === 0 && document.pointerLockElement) attack();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyF' && !e.repeat) attack();
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [camera, forward, toEnemy]);

  // Damage one enemy from a mist tick (no sounds per tick — too spammy)
  const mistStrike = (id: string, dmg: number, dir: THREE.Vector3) => {
    const combat = useCombatStore.getState();
    const entry = combat.enemies[id];
    if (!entry?.alive) return;
    const result = combat.damageEnemy(id, dmg);
    if (result === 'none' || result === 'immune') return;
    runtime.enemyBodies.get(id)?.applyImpulse({ x: dir.x * 0.8, y: 0.2, z: dir.z * 0.8 }, true);
    if (result === 'dead') {
      useRunStore.getState().addXp(XP_BY_KIND[entry.kind]);
      sfx.enemyDeath();
    }
  };

  useFrame(() => {
    const now = runtime.time;
    const stats = useRunStore.getState().stats;
    const character = useProfileStore.getState().character;

    // Hairspray visual: a glitter cone that blooms and fades (Vince only)
    if (sprayRef.current && sprayMatRef.current) {
      const t = now - useCombatStore.getState().lastAttackAt;
      const active = character === 'vince' && t >= 0 && t < SPRAY_LIFETIME;
      sprayRef.current.visible = active;
      if (active) {
        const k = t / SPRAY_LIFETIME;
        const flare = 1 + stats.vince.arcBonusDeg / 55;
        sprayRef.current.scale.set(
          (0.6 + k * 0.7) * flare,
          (0.6 + k * 0.7) * flare,
          stats.vince.rangeMult,
        );
        sprayMatRef.current.opacity = 0.7 * (1 - k);
      }
    }

    // Extra Hold mists: tick damage on the game clock, expire quietly
    if (mists.length > 0) {
      let anyExpired = false;
      for (const mist of mists) {
        while (now >= mist.nextTick && now < mist.until) {
          mist.nextTick += MIST_TICK;
          for (const [id, body] of runtime.enemyBodies) {
            if (!body.isEnabled()) continue;
            const t = body.translation();
            toEnemy.set(t.x - mist.x, 0, t.z - mist.z);
            if (toEnemy.length() > MIST_RADIUS) continue;
            toEnemy.normalize();
            mistStrike(id, stats.vince.damage * MIST_DAMAGE_FACTOR, toEnemy);
          }
        }
        if (now >= mist.until) anyExpired = true;
      }
      if (anyExpired) setMists((zs) => zs.filter((m) => now < m.until));
    }

    // Polo Discipline: mint-fresh recovery
    const player = usePlayerStore.getState();
    if (stats.shared.regenInterval > 0 && !player.dead) {
      if (now - lastRegenRef.current >= stats.shared.regenInterval) {
        lastRegenRef.current = now;
        player.heal(1);
      }
    } else {
      lastRegenRef.current = now;
    }

    const body = runtime.player?.group;

    // The Black Frost's signature: frozen solid for a moment. Lock the body
    // in place (an ice statue), show the block, thaw cleanly.
    const frozen = !player.dead && now < player.frozenUntil;
    if (body && frozen && !wasFrozenRef.current) {
      wasFrozenRef.current = true;
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.lockTranslations(true, true);
      sfx.freezeSnap();
    } else if (body && !frozen && wasFrozenRef.current) {
      wasFrozenRef.current = false;
      body.lockTranslations(false, true);
    }
    if (iceRef.current) iceRef.current.visible = frozen;
    const teleportHome = () => {
      if (!body) return;
      const [x, y, z] = movementConfig.position;
      body.setTranslation({ x, y, z }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    };

    // Safety net: anything that slips below the world goes home
    if (body && body.translation().y < VOID_Y) teleportHome();

    // Death → brief pause → respawn. Dying inside a realm ends the run and
    // sends you home to the greybox (the SceneManager handles the teleport).
    // WALL clock, deliberately: the game clock pauses with the skills panel,
    // and a death must never deadlock behind a pause.
    if (player.dead) {
      const wall = performance.now() / 1000;
      if (deadAtRef.current === 0) {
        deadAtRef.current = wall;
        useRunStore.getState().setPanelOpen(false); // no spending from beyond
        if (body && wasFrozenRef.current) {
          wasFrozenRef.current = false;
          body.lockTranslations(false, true);
        }
      }
      if (wall - deadAtRef.current > RESPAWN_DELAY) {
        deadAtRef.current = 0;
        const scenes = useSceneStore.getState();
        if (scenes.scene !== 'greybox') {
          scenes.setScene('greybox');
        } else {
          teleportHome();
        }
        player.respawnPlayer();
      }
    }
  });

  return (
    <>
      {/* Spray cone: apex at the can, base flaring forward (+Z) */}
      <mesh
        ref={sprayRef}
        visible={false}
        position={[0, 0.25, 1.3]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <coneGeometry args={[0.65, 2.2, 12, 1, true]} />
        <meshStandardMaterial
          ref={sprayMatRef}
          color="#cfe0ff"
          emissive="#e8d4ff"
          emissiveIntensity={2}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Frozen solid: the ice block (rides the body) */}
      <mesh ref={iceRef} visible={false} position={[0, 0, 0]}>
        <boxGeometry args={[1.05, 1.7, 1.05]} />
        <meshStandardMaterial
          color="#9fd4ff"
          emissive="#7fd4ff"
          emissiveIntensity={0.5}
          transparent
          opacity={0.45}
          roughness={0.1}
          depthWrite={false}
        />
      </mesh>
      {/* Extra Hold mists live in world space, not on the moving body */}
      {createPortal(
        <>
          {mists.map((mist) => (
            <mesh key={mist.id} position={[mist.x, 0.06, mist.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[MIST_RADIUS, 24]} />
              <meshStandardMaterial
                color="#e8d4ff"
                emissive="#cc88ff"
                emissiveIntensity={0.8}
                transparent
                opacity={0.3}
                depthWrite={false}
              />
            </mesh>
          ))}
        </>,
        scene,
      )}
    </>
  );
}
