import Ecctrl from 'ecctrl';
import { CLASSIC_CONTROLS, DEBUG } from '../../debug/flags';
import { useHubStore } from '../../stores/hubStore';
import { useProfileStore } from '../../stores/profileStore';
import { useRunStore } from '../../stores/runStore';
import { useSceneStore } from '../../stores/sceneStore';
import { runtime } from '../combat/runtime';
import { SCENE_FACING, SCENE_SPAWN } from '../sceneConfig';
import { movementConfig, turnSpeed } from './movementConfig';
import { PlayerCombat } from './PlayerCombat';
import { PlayerModel } from './PlayerModel';

// ecctrl owns the default camera (steered by mouse, scroll to zoom) — never add
// OrbitControls or a makeDefault camera elsewhere, they'd fight it.
// Default scheme: CameraBasedMovement — the character faces the camera heading,
// so the mouse steers and A/D strafe. ?classic restores drag-to-orbit with the
// character turning toward travel direction.
// Remounted per scene (key) so spawn position and facing re-initialise cleanly.
export function Player() {
  // Run upgrades scale movement; Ecctrl re-renders with new props on pick
  // (rare), and its frame loop reads the latest values.
  const speedMult = useRunStore((s) => s.stats.shared.speedMult);
  const jumpMult = useHubStore((s) => s.mods.jumpMult); // Moon Rock
  const scene = useSceneStore((s) => s.scene);
  // re-render on character switch so the model swaps (subscription only)
  useProfileStore((s) => s.character);

  return (
    <Ecctrl
      key={scene}
      ref={(handle) => {
        runtime.player = handle;
      }}
      {...movementConfig}
      position={SCENE_SPAWN[scene]}
      characterInitDir={SCENE_FACING[scene]}
      camInitDir={{ x: 0, y: SCENE_FACING[scene] }}
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
