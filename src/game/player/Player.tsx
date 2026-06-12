import { useEffect } from 'react';
import Ecctrl from 'ecctrl';
import { useProfileStore } from '../../stores/profileStore';
import { useSettingsStore } from '../../stores/settingsStore';
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
  const scene = useSceneStore((s) => s.scene);
  const controlScheme = useSettingsStore((s) => s.controlScheme);
  const debugTools = useSettingsStore((s) => s.debugTools);
  const classic = controlScheme === 'keyboard';
  // re-render on character switch so the model swaps (subscription only)
  useProfileStore((s) => s.character);

  // After a settings-driven remount, restore the stashed position so the
  // scheme toggle doesn't teleport you to the scene spawn.
  useEffect(() => {
    const pending = runtime.pendingReposition;
    if (!pending) return;
    runtime.pendingReposition = null;
    const body = runtime.player?.group;
    if (body) {
      body.setTranslation(pending, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  });

  return (
    <Ecctrl
      key={`${scene}:${controlScheme}:${debugTools ? 'dbg' : 'plain'}`}
      ref={(handle) => {
        runtime.player = handle;
      }}
      {...movementConfig}
      position={SCENE_SPAWN[scene]}
      characterInitDir={SCENE_FACING[scene]}
      camInitDir={{ x: 0, y: SCENE_FACING[scene] }}
      maxVelLimit={movementConfig.maxVelLimit * speedMult}
      // ccd: first-load shader-compile hitches make physics take one huge step
      // (rapier clamps it to 0.5s) — enough for the falling spawn capsule to
      // tunnel through the floor. Continuous collision detection sweeps the
      // motion path instead.
      ccd
      mode={classic ? undefined : 'CameraBasedMovement'}
      turnSpeed={classic ? turnSpeed.classic : turnSpeed.cameraSteered}
      debug={debugTools}
    >
      <PlayerModel />
      <PlayerCombat />
    </Ecctrl>
  );
}
