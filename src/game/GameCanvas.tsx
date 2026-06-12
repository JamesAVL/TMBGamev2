import { lazy, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { useControls } from 'leva';
import { DEBUG } from '../debug/flags';
import { useCombatStore } from '../stores/combatStore';
import { useRunStore } from '../stores/runStore';
import { useSceneStore } from '../stores/sceneStore';
import { keyboardMap } from './controls';
import { Effects } from './Effects';
import { Enemies } from './enemies/Enemies';
import { GameClock } from './GameClock';
import { PointerLockOnClick } from './PointerLockOnClick';
import { Player } from './player/Player';
import { SceneManager } from './SceneManager';
import { Lights } from './world/Lights';
import { Playground } from './world/Playground';
import { TundraRealm } from './world/tundra/TundraRealm';

// Lazy so r3f-perf (and its nested drei copy) code-splits out of the normal path.
const Perf = lazy(() => import('r3f-perf').then((m) => ({ default: m.Perf })));

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
  // Brief freeze-frame when a swipe connects — cheap, very effective punch.
  // Level-up picks pause the whole sim until a card is chosen.
  const hitStop = useCombatStore((s) => s.hitStopActive);
  const pendingPick = useRunStore((s) => s.pendingChoices !== null);
  const scene = useSceneStore((s) => s.scene);

  return (
    <div id="game-canvas">
      {/* dpr capped at 1.5: full retina/4K resolution + bloom is the main
          frame-rate cost. Canvas antialias off — the EffectComposer renders
          offscreen with its own MSAA, so canvas MSAA is pure waste. */}
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ fov: 55, near: 0.1, far: 300 }}
        gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      >
        {scene === 'greybox' && (
          <>
            <color attach="background" args={['#1b1e2b']} />
            <fog attach="fog" args={['#1b1e2b', 35, 120]} />
            <Lights />
          </>
        )}
        <PointerLockOnClick />
        {DEBUG && perfHud && (
          <Suspense fallback={null}>
            <Perf position="top-left" />
          </Suspense>
        )}
        {/* Suspense: rapier's wasm init suspends on first load.
            timeStep="vary" matches ecctrl's canonical setup (its defaults were
            tuned under it); revisit fixed 1/60 + interpolation if combat ever
            needs determinism or high-refresh consistency. */}
        <Suspense fallback={null}>
          <Physics
            timeStep={fixedTimestep ? 1 / 60 : 'vary'}
            paused={hitStop || pendingPick}
            debug={DEBUG && physicsWireframe}
          >
            <GameClock />
            <KeyboardControls map={keyboardMap}>
              <Player />
            </KeyboardControls>
            <SceneManager />
            <Enemies />
            {scene === 'greybox' ? <Playground /> : <TundraRealm />}
          </Physics>
        </Suspense>
        <Effects />
      </Canvas>
    </div>
  );
}
