import { lazy, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls, PerformanceMonitor } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { useControls } from 'leva';
import type * as THREE from 'three';
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

// One boot line that settles every "what is this machine actually running?"
// support question: build, real GPU (SwiftShader here = the browser lost
// hardware acceleration), resolution, and the live control/perf settings.
function logBootDiagnostics(gl: THREE.WebGLRenderer) {
  const ctx = gl.getContext();
  const dbg = ctx.getExtension('WEBGL_debug_renderer_info');
  const gpu = dbg ? ctx.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'masked';
  const s = useSettingsStore.getState();
  console.info(
    `[TMB] build ${__BUILD_SHA__} | gpu: ${gpu} | canvas ${ctx.drawingBufferWidth}x${ctx.drawingBufferHeight} @ dpr ${window.devicePixelRatio} | coarse-pointer ${window.matchMedia('(pointer: coarse)').matches} | touch ${s.touchControls} | perfMode ${s.performanceMode}`,
  );
}

// Auto-rescue, once per session: sustained sub-24 fps flips performance mode
// on (no composer, no shadows, dpr 1, fixed physics step — which also stops
// the low-fps autoBalance spin). The user can still untick it in the menu,
// and that choice then sticks for the session.
let autoPerfApplied = false;

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
  const setPerformanceMode = useSettingsStore((s) => s.setPerformanceMode);
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
        onCreated={({ gl }) => logBootDiagnostics(gl)}
      >
        {/* bounds: decline only under a sustained, genuinely unplayable 24fps
            — a mid desktop at 40 never trips it. iterations stretches the
            sample past load hitches and shader-compile stutter. */}
        <PerformanceMonitor
          bounds={() => [24, 60]}
          iterations={8}
          onDecline={({ fps }) => {
            if (autoPerfApplied || useSettingsStore.getState().performanceMode) return;
            autoPerfApplied = true;
            setPerformanceMode(true);
            console.info(`[TMB] sustained ${Math.round(fps)}fps — performance mode auto-enabled`);
          }}
        />
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
