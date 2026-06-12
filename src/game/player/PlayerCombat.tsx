import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ensureAudio, sfx } from '../../audio/sfx';
import { XP_BY_KIND } from '../progression/upgrades';
import { useCombatStore } from '../../stores/combatStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useRunStore } from '../../stores/runStore';
import { useSceneStore } from '../../stores/sceneStore';
import { runtime } from '../combat/runtime';
import { movementConfig } from './movementConfig';

const ATTACK_COOLDOWN = 0.45; // × stats.cooldownMult
const ATTACK_RANGE = 2.4; // × stats.rangeMult
const VOID_Y = -10; // below the slab: teleport home instead of falling forever
const ATTACK_HALF_ANGLE_COS = Math.cos((55 * Math.PI) / 180);
const SWIPE_LIFETIME = 0.18;
const RESPAWN_DELAY = 1.4;
const ARC = Math.PI * 0.7;
const NOVA_RANGE = 3.5;
const NOVA_LIFETIME = 0.3;

// Mounted inside <Ecctrl>, so the swipe arc inherits the body transform
// (which faces the camera heading under CameraBasedMovement).
export function PlayerCombat() {
  const camera = useThree((state) => state.camera);
  const arcRef = useRef<THREE.Mesh>(null);
  const arcMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const novaRef = useRef<THREE.Mesh>(null);
  const novaMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const novaAtRef = useRef(-Infinity);
  const lastAttackRef = useRef(-Infinity);
  const swipeCountRef = useRef(0);
  const deadAtRef = useRef(0);
  const forward = useMemo(() => new THREE.Vector3(), []);
  const toEnemy = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    // Damage one enemy, with crit roll; returns flags + grants XP / kill heal.
    const strike = (id: string, dmg: number, knockback: number, dir: THREE.Vector3) => {
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
        if (stats.killHeal) usePlayerStore.getState().heal(1);
      }
      return { connected: true, killed: result === 'dead', immune: false, crit };
    };

    const nova = (p: { x: number; y: number; z: number }) => {
      novaAtRef.current = runtime.time;
      sfx.nova();
      let killed = false;
      for (const [id, enemyBody] of runtime.enemyBodies) {
        const t = enemyBody.translation();
        toEnemy.set(t.x - p.x, 0, t.z - p.z);
        if (toEnemy.length() > NOVA_RANGE) continue;
        toEnemy.normalize();
        const r = strike(id, 1, 2.5, toEnemy);
        killed ||= r.killed;
      }
      if (killed) sfx.enemyDeath();
    };

    const attack = () => {
      const now = runtime.time;
      const stats = useRunStore.getState().stats;
      if (useRunStore.getState().pendingChoices) return; // mid level-up pick
      if (now - lastAttackRef.current < ATTACK_COOLDOWN * stats.cooldownMult) return;
      if (usePlayerStore.getState().dead) return;
      const body = runtime.player?.group;
      if (!body) return;
      lastAttackRef.current = now;
      ensureAudio();
      sfx.swing();
      useCombatStore.getState().registerAttack();

      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      const p = body.translation();
      const range = ATTACK_RANGE * stats.rangeMult;

      let connected = false;
      let killed = false;
      let immune = false;
      let anyCrit = false;
      for (const [id, enemyBody] of runtime.enemyBodies) {
        const t = enemyBody.translation();
        toEnemy.set(t.x - p.x, 0, t.z - p.z);
        if (toEnemy.length() > range) continue;
        toEnemy.normalize();
        if (toEnemy.dot(forward) < ATTACK_HALF_ANGLE_COS) continue;
        const r = strike(id, stats.damage, 3, toEnemy);
        connected ||= r.connected;
        killed ||= r.killed;
        immune ||= r.immune;
        anyCrit ||= r.crit;
      }
      // Hittable props (braziers etc.) share the same cone check
      for (const target of runtime.swipeTargets.values()) {
        const t = target.position();
        toEnemy.set(t.x - p.x, 0, t.z - p.z);
        if (toEnemy.length() > range) continue;
        toEnemy.normalize();
        if (toEnemy.dot(forward) < ATTACK_HALF_ANGLE_COS) continue;
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

      // Jazz Static: every Nth swipe erupts
      swipeCountRef.current++;
      if (stats.novaEvery > 0 && swipeCountRef.current % stats.novaEvery === 0) {
        nova(p);
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      // While pointer-locked, left click swipes (the unlocked click only locks).
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

    // Swipe arc visual: quick expand-and-fade in front of the body
    if (arcRef.current && arcMatRef.current) {
      const t = now - useCombatStore.getState().lastAttackAt;
      const active = t >= 0 && t < SWIPE_LIFETIME;
      arcRef.current.visible = active;
      if (active) {
        const k = t / SWIPE_LIFETIME;
        arcRef.current.scale.setScalar((0.75 + k * 0.6) * stats.rangeMult);
        arcMatRef.current.opacity = 1 - k;
      }
    }

    // Jazz Static nova: expanding flat ring around the body
    if (novaRef.current && novaMatRef.current) {
      const t = now - novaAtRef.current;
      const active = t >= 0 && t < NOVA_LIFETIME;
      novaRef.current.visible = active;
      if (active) {
        const k = t / NOVA_LIFETIME;
        novaRef.current.scale.setScalar(0.5 + k * NOVA_RANGE);
        novaMatRef.current.opacity = 0.85 * (1 - k);
      }
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
    const player = usePlayerStore.getState();
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

  return (
    <>
      <mesh
        ref={arcRef}
        visible={false}
        position={[0, 0.15, 0.3]}
        rotation={[Math.PI / 2, 0, Math.PI / 2 - ARC / 2]}
      >
        <torusGeometry args={[0.85, 0.06, 8, 24, ARC]} />
        <meshStandardMaterial
          ref={arcMatRef}
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={2.5}
          transparent
          depthWrite={false}
        />
      </mesh>
      <mesh ref={novaRef} visible={false} position={[0, -0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.07, 8, 36]} />
        <meshStandardMaterial
          ref={novaMatRef}
          color="#b9f"
          emissive="#cc88ff"
          emissiveIntensity={3}
          transparent
          depthWrite={false}
        />
      </mesh>
    </>
  );
}
