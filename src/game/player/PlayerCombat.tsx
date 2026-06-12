import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ensureAudio, sfx } from '../../audio/sfx';
import { useCombatStore } from '../../stores/combatStore';
import { usePlayerStore } from '../../stores/playerStore';
import { runtime } from '../combat/runtime';

const ATTACK_COOLDOWN = 0.45;
const ATTACK_RANGE = 2.4;
const ATTACK_HALF_ANGLE_COS = Math.cos((55 * Math.PI) / 180);
const SWIPE_LIFETIME = 0.18;
const RESPAWN_DELAY = 1.4;
const ARC = Math.PI * 0.7;

// Mounted inside <Ecctrl>, so the swipe arc inherits the body transform
// (which faces the camera heading under CameraBasedMovement).
export function PlayerCombat() {
  const camera = useThree((state) => state.camera);
  const arcRef = useRef<THREE.Mesh>(null);
  const arcMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const lastAttackRef = useRef(-Infinity);
  const deadAtRef = useRef(0);
  const forward = useMemo(() => new THREE.Vector3(), []);
  const toEnemy = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const attack = () => {
      const now = performance.now() / 1000;
      if (now - lastAttackRef.current < ATTACK_COOLDOWN) return;
      if (usePlayerStore.getState().dead) return;
      const body = runtime.player?.group;
      if (!body) return;
      lastAttackRef.current = now;
      ensureAudio();
      sfx.swing();
      const combat = useCombatStore.getState();
      combat.registerAttack();

      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      const p = body.translation();

      let connected = false;
      let killed = false;
      for (const [id, enemyBody] of runtime.enemyBodies) {
        if (!useCombatStore.getState().enemies[id]?.alive) continue;
        const t = enemyBody.translation();
        toEnemy.set(t.x - p.x, 0, t.z - p.z);
        const dist = toEnemy.length();
        if (dist > ATTACK_RANGE) continue;
        toEnemy.normalize();
        if (toEnemy.dot(forward) < ATTACK_HALF_ANGLE_COS) continue;
        const result = useCombatStore.getState().damageEnemy(id, 1);
        if (result === 'none') continue;
        connected = true;
        enemyBody.applyImpulse({ x: toEnemy.x * 3, y: 0.9, z: toEnemy.z * 3 }, true);
        if (result === 'dead') killed = true;
      }
      if (connected) {
        sfx.hit();
        useCombatStore.getState().triggerHitStop(70);
      }
      if (killed) sfx.enemyDeath();
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
    const now = performance.now() / 1000;

    // Swipe arc visual: quick expand-and-fade in front of the body
    if (arcRef.current && arcMatRef.current) {
      const t = now - useCombatStore.getState().lastAttackAt;
      const active = t >= 0 && t < SWIPE_LIFETIME;
      arcRef.current.visible = active;
      if (active) {
        const k = t / SWIPE_LIFETIME;
        arcRef.current.scale.setScalar(0.75 + k * 0.6);
        arcMatRef.current.opacity = 1 - k;
      }
    }

    // Death → brief pause → teleport home with full hp
    const player = usePlayerStore.getState();
    if (player.dead) {
      if (deadAtRef.current === 0) deadAtRef.current = now;
      if (now - deadAtRef.current > RESPAWN_DELAY) {
        const body = runtime.player?.group;
        if (body) {
          body.setTranslation({ x: 0, y: 4, z: 0 }, true);
          body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        }
        deadAtRef.current = 0;
        player.respawnPlayer();
      }
    }
  });

  return (
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
  );
}
