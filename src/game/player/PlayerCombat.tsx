import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ensureAudio, sfx } from '../../audio/sfx';
import { XP_BY_KIND } from '../progression/skills';
import { useCombatStore } from '../../stores/combatStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useProfileStore } from '../../stores/profileStore';
import { useRunStore } from '../../stores/runStore';
import { useSceneStore } from '../../stores/sceneStore';
import { throwRecord } from '../combat/projectilePool';
import { runtime } from '../combat/runtime';
import { movementConfig } from './movementConfig';

const SPRAY_COOLDOWN = 0.45; // × stats.cooldownMult
const SPRAY_RANGE = 2.4; // × stats.rangeMult
const SPRAY_HALF_ANGLE_COS = Math.cos((55 * Math.PI) / 180);
const SPRAY_LIFETIME = 0.16;
const RECORD_COOLDOWN = 0.6; // × stats.cooldownMult
const RECORD_RANGE = 12; // × stats.rangeMult
const VOID_Y = -10; // below the slab: teleport home instead of falling forever
const RESPAWN_DELAY = 1.4;

// Mounted inside <Ecctrl>, so the spray cone inherits the body transform
// (which faces the camera heading under CameraBasedMovement).
export function PlayerCombat() {
  const camera = useThree((state) => state.camera);
  const sprayRef = useRef<THREE.Mesh>(null);
  const sprayMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const lastAttackRef = useRef(-Infinity);
  const lastRegenRef = useRef(0);
  const deadAtRef = useRef(0);
  const forward = useMemo(() => new THREE.Vector3(), []);
  const toEnemy = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    // Damage one enemy, with crit roll; grants XP / kill heal on death.
    const strike = (id: string, dmg: number, knockback: number, dir: { x: number; z: number }) => {
      const combat = useCombatStore.getState();
      const entry = combat.enemies[id];
      if (!entry?.alive) return { connected: false, killed: false, immune: false, crit: false };
      const stats = useRunStore.getState().stats;
      const crit = Math.random() < stats.critChance;
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
    const sprayAttack = (p: { x: number; y: number; z: number }, range: number, dmg: number) => {
      sfx.spray();
      useCombatStore.getState().registerAttack();
      let connected = false;
      let killed = false;
      let immune = false;
      let anyCrit = false;
      for (const [id] of runtime.enemyBodies) {
        const body = runtime.enemyBodies.get(id);
        if (!body) continue;
        const t = body.translation();
        toEnemy.set(t.x - p.x, 0, t.z - p.z);
        if (toEnemy.length() > range) continue;
        toEnemy.normalize();
        if (toEnemy.dot(forward) < SPRAY_HALF_ANGLE_COS) continue;
        const r = strike(id, dmg, 3, toEnemy);
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
        if (toEnemy.dot(forward) < SPRAY_HALF_ANGLE_COS) continue;
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
    };

    // Howard: a 12-inch of pure jazz, thrown flat and spinning
    const recordAttack = (p: { x: number; y: number; z: number }, range: number, dmg: number) => {
      sfx.throwWhoosh();
      throwRecord({
        x: p.x + forward.x * 0.5,
        y: p.y + 0.35,
        z: p.z + forward.z * 0.5,
        dx: forward.x,
        dz: forward.z,
        range,
        onEnemyHit: (id, dir) => {
          const r = strike(id, dmg, 3, dir);
          if (r.connected) {
            if (r.crit) sfx.crit();
            else sfx.thunk();
            useCombatStore.getState().triggerHitStop(r.crit ? 110 : 60);
            if (r.killed) sfx.enemyDeath();
            return true;
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
      const stats = run.stats;
      const character = useProfileStore.getState().character;
      const cooldown =
        (character === 'vince' ? SPRAY_COOLDOWN : RECORD_COOLDOWN) * stats.cooldownMult;
      if (now - lastAttackRef.current < cooldown) return;
      if (usePlayerStore.getState().dead) return;
      const body = runtime.player?.group;
      if (!body) return;
      lastAttackRef.current = now;
      ensureAudio();

      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      const p = body.translation();

      if (character === 'vince') {
        sprayAttack(p, SPRAY_RANGE * stats.rangeMult, stats.damage);
      } else {
        recordAttack(p, RECORD_RANGE * stats.rangeMult, stats.damage);
      }
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
        sprayRef.current.scale.set(0.6 + k * 0.7, 0.6 + k * 0.7, stats.rangeMult);
        sprayMatRef.current.opacity = 0.7 * (1 - k);
      }
    }

    // Polo Discipline: mint-fresh recovery
    const player = usePlayerStore.getState();
    if (stats.regenInterval > 0 && !player.dead) {
      if (now - lastRegenRef.current >= stats.regenInterval) {
        lastRegenRef.current = now;
        player.heal(1);
      }
    } else {
      lastRegenRef.current = now;
    }

    const body = runtime.player?.group;
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
    if (player.dead) {
      if (deadAtRef.current === 0) deadAtRef.current = now;
      if (now - deadAtRef.current > RESPAWN_DELAY) {
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

  // Spray cone: apex at the can, base flaring forward (+Z)
  return (
    <mesh ref={sprayRef} visible={false} position={[0, 0.25, 1.3]} rotation={[-Math.PI / 2, 0, 0]}>
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
  );
}
