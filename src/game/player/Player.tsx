import Ecctrl from 'ecctrl';
import { CLASSIC_CONTROLS, DEBUG } from '../../debug/flags';
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
  return (
    <Ecctrl
      ref={(handle) => {
        runtime.player = handle;
      }}
      {...movementConfig}
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
