import { lazy, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { useControls } from 'leva';
import { useCombatStore } from '../stores/combatStore';
import { useHubStore } from '../stores/hubStore';
import { useRunStore } from '../stores/runStore';
import { useSceneStore } from '../stores/sceneStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useUiStore } from '../stores/uiStore';
import { keyboardMap } from './controls';
import { DamageNumbers } from './combat/DamageNumbers';
import { Projectiles } from './combat/Projectiles';
import { Effects } from './Effects';
import { Enemies } from './enemies/Enemies';
import { GameClock } from './GameClock';
import { PointerLockOnClick } from './PointerLockOnClick';
import { Player } from './player/Player';
import { SceneManager } from './SceneManager';
import { Nabootique } from './world/hub/Nabootique';
import { Lights } from './world/Lights';
import { Playground } from './world/Playground';

// Lazy so r3f-perf (and its nested drei copy) code-splits out of the normal path.
const Perf = lazy(() => import('r3f-perf').then((m) => ({ default: m.Perf })));
// The realm code-splits too: the greybox boots lighter, tundra loads on entry.
const TundraRealm = lazy(() =>
  import('./world/tundra/TundraRealm').then((m) => ({ default: m.TundraRealm })),
);

export function GameCanvas() {
  // Called unconditionally (hook rules); with the leva root hidden the
  // values simply stay at their defaults.
  const { physicsWireframe, perfHud, fixedTimestep } = useControls('Debug', {
    physicsWireframe: false,
    perfHud: true,
    // A/B: "vary" steps physics per-frame (pairs best with ecctrl's camera,
    // which follows the raw body position); fixed 1/60 is the alternative.
    fixedTimestep: false,
  });
  // Brief freeze-frame when an attack connects — cheap, very effective punch.
  // The skills panel pauses the whole sim while open.
  const hitStop = useCombatStore((s) => s.hitStopActive);
  const skillsOpen = useRunStore((s) => s.panelOpen);
  const hubUiOpen = useHubStore((s) => s.dialogOpen || s.shopOpen);
  const framePaused = useUiStore((s) => s.phase !== 'playing' || s.pauseOpen);
  const debugTools = useSettingsStore((s) => s.debugTools);
  const performanceMode = useSettingsStore((s) => s.performanceMode);
  const scene = useSceneStore((s) => s.scene);

  return (
    <div id="game-canvas">
      {/* dpr capped at 1.5: full retina/4K resolution + bloom is the main
          frame-rate cost. Normal mode: canvas antialias off — the
          EffectComposer renders offscreen with its own MSAA, so canvas MSAA is
          pure waste. Perf mode: the composer is skipped (Effects.tsx), so
          cheap context MSAA is the only AA. gl options bind at context
          creation — a mid-session perf toggle changes AA only after reload. */}
      <Canvas
        shadows={!performanceMode}
        dpr={performanceMode ? [1, 1] : [1, 1.5]}
        camera={{ fov: 55, near: 0.1, far: 300 }}
        gl={{ antialias: performanceMode, powerPreference: 'high-performance', stencil: false }}
      >
        {scene === 'greybox' && (
          <>
            <color attach="background" args={['#1b1e2b']} />
            <fog attach="fog" args={['#1b1e2b', 35, 120]} />
            <Lights />
          </>
        )}
        <PointerLockOnClick />
        {debugTools && perfHud && (
          <Suspense fallback={null}>
            <Perf position="top-left" />
          </Suspense>
        )}
        {/* Suspense: rapier's wasm init suspends on first load.
            timeStep: "vary" matches ecctrl's canonical setup (its defaults
            were tuned under it) — but it feeds real frame deltas straight into
            the integrator, and at very low FPS (deltas clamp at 0.5s) ecctrl's
            autoBalance yaw spring goes unstable: the idle character spins.
            Perf mode therefore uses the fixed 1/60 accumulator (interpolate
            defaults on), which bounds per-step dt no matter the frame rate.
            fixedTimestep stays as the leva A/B for desktop testing. */}
        <Suspense fallback={null}>
          <Physics
            timeStep={performanceMode || fixedTimestep ? 1 / 60 : 'vary'}
            paused={hitStop || skillsOpen || hubUiOpen || framePaused}
            debug={debugTools && physicsWireframe}
          >
            <GameClock />
            <KeyboardControls map={keyboardMap}>
              <Player />
            </KeyboardControls>
            <SceneManager />
            <Projectiles />
            <DamageNumbers />
            <Enemies />
            {scene === 'hub' && <Nabootique />}
            {scene === 'greybox' && <Playground />}
            {scene === 'tundra' && <TundraRealm />}
          </Physics>
        </Suspense>
        <Effects />
      </Canvas>
    </div>
  );
}
