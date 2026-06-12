import Ecctrl from 'ecctrl';
import { CLASSIC_CONTROLS, DEBUG } from '../../debug/flags';
import { useRunStore } from '../../stores/runStore';
import { runtime } from '../combat/runtime';
import { movementConfig, turnSpeed } from './movementConfig';
import { PlayerCombat } from './PlayerCombat';
import { PlayerModel } from './PlayerModel';

// ecctrl owns the default camera (steered by mouse, scroll to zoom) — never add
// OrbitControls or a makeDefault camera elsewhere, they'd fight it.
// Default scheme: CameraBasedMovement — the character faces the camera heading,
// so the mouse steers and A/D strafe. ?classic restores drag-to-orbit with the
// character turning toward travel direction.
export function Player() {
  // Run upgrades scale movement; Ecctrl re-renders with new props on pick
  // (rare), and its frame loop reads the latest values.
  const speedMult = useRunStore((s) => s.stats.shared.speedMult);
  const jumpMult = useRunStore((s) => s.stats.shared.jumpMult);
  return (
    <Ecctrl
      ref={(handle) => {
        runtime.player = handle;
      }}
      {...movementConfig}
      maxVelLimit={movementConfig.maxVelLimit * speedMult}
      jumpVel={movementConfig.jumpVel * jumpMult}
      // ccd: first-load shader-compile hitches make physics take one huge step
      // (rapier clamps it to 0.5s) — enough for the falling spawn capsule to
      // tunnel through the floor. Continuous collision detection sweeps the
      // motion path instead.
      ccd
      mode={CLASSIC_CONTROLS ? undefined : 'CameraBasedMovement'}
      turnSpeed={CLASSIC_CONTROLS ? turnSpeed.classic : turnSpeed.cameraSteered}
      debug={DEBUG}
    >
      <PlayerModel />
      <PlayerCombat />
    </Ecctrl>
  );
}
