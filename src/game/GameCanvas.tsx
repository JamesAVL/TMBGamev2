import { lazy, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { useControls } from 'leva';
import { DEBUG } from '../debug/flags';
import { keyboardMap } from './controls';
import { Player } from './player/Player';
import { Lights } from './world/Lights';
import { Playground } from './world/Playground';

// Lazy so r3f-perf (and its nested drei copy) code-splits out of the normal path.
const Perf = lazy(() => import('r3f-perf').then((m) => ({ default: m.Perf })));

export function GameCanvas() {
  // Called unconditionally (hook rules); with the leva root hidden the
  // values simply stay at their defaults.
  const { physicsWireframe, perfHud } = useControls('Debug', {
    physicsWireframe: false,
    perfHud: true,
  });

  return (
    <div id="game-canvas">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ fov: 55, near: 0.1, far: 300 }}
        gl={{ antialias: true, powerPreference: 'high-performance', stencil: false }}
      >
        <color attach="background" args={['#1b1e2b']} />
        <fog attach="fog" args={['#1b1e2b', 35, 120]} />
        <Lights />
        {DEBUG && perfHud && (
          <Suspense fallback={null}>
            <Perf position="top-left" />
          </Suspense>
        )}
        {/* Suspense: rapier's wasm init suspends on first load.
            timeStep="vary" matches ecctrl's canonical setup (its defaults were
            tuned under it); revisit fixed 1/60 + interpolation at Step 2 for
            determinism and high-refresh-rate consistency. */}
        <Suspense fallback={null}>
          <Physics timeStep="vary" debug={DEBUG && physicsWireframe}>
            <KeyboardControls map={keyboardMap}>
              <Player />
            </KeyboardControls>
            <Playground />
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
}
