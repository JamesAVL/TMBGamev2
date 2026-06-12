import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import type * as THREE from 'three';
import { sfx } from '../../../audio/sfx';
import { aliveCount, useCombatStore } from '../../../stores/combatStore';
import { usePlayerStore } from '../../../stores/playerStore';
import { useSceneStore } from '../../../stores/sceneStore';
import { runtime } from '../../combat/runtime';
import { BlackFrost } from '../../enemies/BlackFrost';
import { Block } from '../Block';
import { Portal } from '../Portal';
import { Brazier } from './Brazier';
import { BLACK_FROST, TUNDRA_WAVES } from './tundraSpawns';

// THE TUNDRA — a blue-white waste of glacier walls under a sodium aurora.
// Layout (north = -z): entrance plateau (z 28..40) → room 1 (z 8..26) →
// wind corridor (z -6..8) → wave arena (z -28..-6, ice gate at -28) →
// boss stage (z -54..-30) → exit portal home.

const ICE_ZONES: { x: number; z: number; w: number; d: number }[] = [
  { x: 0, z: 16, w: 10, d: 8 }, // room 1 sheet
  { x: 0, z: 4, w: 9, d: 6 }, // corridor stripe A
  { x: 0, z: -3, w: 9, d: 5 }, // corridor stripe B
  { x: -6, z: -18, w: 8, d: 8 }, // arena sheet west
  { x: 7, z: -12, w: 7, d: 7 }, // arena sheet east
  { x: 0, z: -40, w: 16, d: 12 }, // the boss's dance floor
];

const ICE_SLIDE = 0.015; // per-frame velocity feed — keeps momentum alive

function inZone(x: number, z: number, zone: (typeof ICE_ZONES)[number]): boolean {
  return Math.abs(x - zone.x) < zone.w / 2 && Math.abs(z - zone.z) < zone.d / 2;
}

// Ice + wind forces on the player, all in one frame pass.
function TundraForces() {
  const nextGustAt = useRef(0);
  const gustUntil = useRef(0);
  const gustDirX = useRef(1);

  useFrame((_, delta) => {
    const body = runtime.player?.group;
    if (!body || usePlayerStore.getState().dead) return;
    const now = runtime.time;
    if (nextGustAt.current === 0) nextGustAt.current = now + 4; // first calm
    const t = body.translation();

    // Ice: feed current momentum back in, so stopping and turning smear
    for (const zone of ICE_ZONES) {
      if (inZone(t.x, t.z, zone)) {
        const v = body.linvel();
        const k = ICE_SLIDE * delta * 60;
        body.applyImpulse({ x: v.x * k, y: 0, z: v.z * k }, true);
        break;
      }
    }

    // Wind: periodic crosswind gusts, twice as hard in the corridor pinch
    if (now >= nextGustAt.current) {
      nextGustAt.current = now + 6 + Math.random() * 4;
      gustUntil.current = now + 1.4;
      gustDirX.current = Math.random() < 0.5 ? -1 : 1;
      sfx.gust();
    }
    if (now < gustUntil.current) {
      const inCorridor = t.z > -6 && t.z < 8 && Math.abs(t.x) < 6;
      const strength = inCorridor ? 1.3 : 0.55;
      body.applyImpulse({ x: gustDirX.current * strength * delta, y: 0, z: 0 }, true);
    }
  });

  return null;
}

// The Egg of Mantumbi — what the Parka People keep, and what you came for.
// Claimable once the Black Frost has been seen off.
function EggOfMantumbi() {
  const phase = useSceneStore((s) => s.tundra.phase);
  const eggRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const group = eggRef.current;
    if (!group) return;
    group.rotation.y = state.clock.elapsedTime * 0.5;
    group.position.y = 1.25 + Math.sin(state.clock.elapsedTime * 1.6) * 0.08;

    if (phase !== 'egg') return;
    const body = runtime.player?.group;
    if (!body) return;
    const t = body.translation();
    const dx = t.x;
    const dz = t.z + 48;
    if (dx * dx + dz * dz < 2.2) {
      sfx.treasure();
      const scenes = useSceneStore.getState();
      scenes.setTundra({ phase: 'cleared' });
      scenes.setObjective('The Egg of Mantumbi is yours. The way home is open.');
    }
  });

  if (phase === 'cleared') return null; // claimed

  return (
    <group position={[0, 0, -48]}>
      <Block size={[1.2, 0.9, 1.2]} position={[0, 0.45, 0]} color="#b4d4e8" />
      <group ref={eggRef}>
        <mesh castShadow scale={[1, 1.35, 1]}>
          <sphereGeometry args={[0.42, 18, 14]} />
          <meshStandardMaterial
            color="#e8c050"
            emissive="#ffae34"
            emissiveIntensity={phase === 'egg' ? 1.6 : 0.4}
            roughness={0.3}
          />
        </mesh>
      </group>
    </group>
  );
}

// Drives the run: trigger the waves, melt the gate, summon the headliner,
// open the egg for claiming, declare the realm cleared.
function TundraDirector() {
  const waveIds = useRef<string[]>([]);
  const nextWaveAt = useRef(0);

  useFrame(() => {
    const scenes = useSceneStore.getState();
    const combat = useCombatStore.getState();
    const { phase, wave } = scenes.tundra;
    const now = runtime.time;
    const body = runtime.player?.group;
    if (!body) return;

    if (phase === 'approach') {
      if (body.translation().z < -7) {
        scenes.setTundra({ phase: 'waves', wave: 1 });
        scenes.setObjective('The keepers defend the Egg — wave 1 of 3.');
        const defs = TUNDRA_WAVES[0] ?? [];
        waveIds.current = defs.map((d) => d.id);
        combat.spawnEnemies(defs);
        sfx.waveSting();
      }
      return;
    }

    if (phase === 'waves') {
      if (aliveCount(combat.enemies, waveIds.current) > 0) return;
      if (wave >= TUNDRA_WAVES.length) {
        scenes.setTundra({ phase: 'boss' });
        scenes.setObjective(
          'The Black Frost takes the stage. Swipe a brazier — embers break his composure.',
        );
        combat.spawnEnemies([BLACK_FROST]);
        sfx.freezeSnap();
        return;
      }
      if (nextWaveAt.current === 0) {
        nextWaveAt.current = now + 1.2;
        return;
      }
      if (now >= nextWaveAt.current) {
        nextWaveAt.current = 0;
        const next = wave + 1;
        scenes.setTundra({ wave: next });
        scenes.setObjective(`The keepers defend the Egg — wave ${next} of 3.`);
        const defs = TUNDRA_WAVES[next - 1] ?? [];
        waveIds.current = defs.map((d) => d.id);
        combat.spawnEnemies(defs);
        sfx.waveSting();
      }
      return;
    }

    if (phase === 'boss') {
      const boss = combat.enemies['blackfrost'];
      if (boss && !boss.alive) {
        scenes.setTundra({ phase: 'egg' });
        scenes.setObjective('Claim the Egg of Mantumbi.');
      }
    }
  });

  return null;
}

export function TundraRealm() {
  const setScene = useSceneStore((s) => s.setScene);
  const phase = useSceneStore((s) => s.tundra.phase);
  const gateUp = phase === 'approach' || phase === 'waves';

  return (
    <>
      {/* Atmosphere */}
      <color attach="background" args={['#0d1422']} />
      <fog attach="fog" args={['#0d1422', 14, 70]} />
      <hemisphereLight args={['#a8c8e8', '#1c2433', 0.5]} />
      <directionalLight
        position={[20, 30, 10]}
        intensity={0.9}
        color="#cfe4ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-near={1}
        shadow-camera-far={100}
      />
      {/* A whisper of aurora */}
      <pointLight position={[0, 18, -45]} color="#56e8a8" intensity={2.5} distance={60} />
      <Sparkles
        count={500}
        position={[0, 6, -8]}
        scale={[40, 12, 96]}
        size={2.5}
        speed={0.4}
        opacity={0.65}
        color="#dfe8ff"
      />

      {/* Ground + glacier walls */}
      <Block size={[44, 0.5, 100]} position={[0, -0.25, -7]} color="#dfe8ef" />
      <Block size={[3, 12, 100]} position={[-22.5, 6, -7]} color="#9fc4dd" />
      <Block size={[3, 12, 100]} position={[22.5, 6, -7]} color="#9fc4dd" />
      <Block size={[48, 12, 3]} position={[0, 6, -56]} color="#9fc4dd" />
      <Block size={[48, 12, 3]} position={[0, 6, 42]} color="#9fc4dd" />

      {/* Room 1 dressing */}
      <Block size={[3, 7, 3]} position={[-12, 3.5, 20]} color="#b4d4e8" />
      <Block size={[3, 9, 3]} position={[13, 4.5, 14]} color="#b4d4e8" />
      <Block size={[2.5, 6, 2.5]} position={[-14, 3, 10]} color="#b4d4e8" />

      {/* Wind corridor pinch */}
      <Block size={[14, 8, 14]} position={[-12, 4, 1]} color="#9fc4dd" />
      <Block size={[14, 8, 14]} position={[12, 4, 1]} color="#9fc4dd" />

      {/* Wave arena gate walls + meltable ice gate */}
      <Block size={[16, 9, 3]} position={[-13, 4.5, -28]} color="#9fc4dd" />
      <Block size={[16, 9, 3]} position={[13, 4.5, -28]} color="#9fc4dd" />
      {gateUp && <Block size={[10, 6, 1.5]} position={[0, 3, -28]} color="#bfe4f5" />}

      {/* Boss stage dressing */}
      <Block size={[3, 8, 3]} position={[-15, 4, -44]} color="#b4d4e8" />
      <Block size={[3, 8, 3]} position={[15, 4, -44]} color="#b4d4e8" />

      {/* Ice sheets (visual; the slide force lives in TundraForces) */}
      {ICE_ZONES.map((zone, i) => (
        <mesh key={i} position={[zone.x, 0.012, zone.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[zone.w, zone.d]} />
          <meshStandardMaterial color="#bfe4f5" transparent opacity={0.45} roughness={0.12} />
        </mesh>
      ))}

      {/* Braziers: warmth in the arena, leverage on the boss stage */}
      <Brazier id="brazier-arena-w" position={[-9, 0, -20]} />
      <Brazier id="brazier-arena-e" position={[9, 0, -14]} />
      <Brazier id="brazier-boss-n" position={[0, 0, -47]} bossLink />
      <Brazier id="brazier-boss-w" position={[-8, 0, -36]} bossLink />
      <Brazier id="brazier-boss-e" position={[8, 0, -36]} bossLink />

      {/* The headliner (mounts when the director spawns his store entry) */}
      <BlackFrost />

      {/* What everyone is here for */}
      <EggOfMantumbi />

      {/* Doors */}
      <Portal
        position={[5, 1.7, 36]}
        label="BACK TO THE RANGE"
        onEnter={() => setScene('greybox')}
      />
      {phase === 'cleared' && (
        <Portal
          position={[0, 1.7, -51]}
          label="HOME"
          color="#9fd08a"
          onEnter={() => setScene('greybox')}
        />
      )}

      <TundraForces />
      <TundraDirector />
    </>
  );
}
