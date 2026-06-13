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
  const touchControls = useSettingsStore((s) => s.touchControls);
  const debugTools = useSettingsStore((s) => s.debugTools);
  // Touch runs ecctrl's default mode (joystick steers camera-relative); only
  // CameraBasedMovement ignores the joystick angle. So touch == classic here.
  const classic = controlScheme === 'keyboard' || touchControls;
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
      key={`${scene}:${controlScheme}:${touchControls ? 'touch' : 'std'}:${debugTools ? 'dbg' : 'plain'}`}
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
      animated
      // autoBalance applies a fixed per-frame yaw torque that goes unstable at
      // low FPS (the old "spinning character"); off on touch locks the capsule
      // rotations instead, so phones can never spin regardless of frame rate.
      autoBalance={!touchControls}
      mode={classic ? undefined : 'CameraBasedMovement'}
      turnSpeed={classic ? turnSpeed.classic : turnSpeed.cameraSteered}
      debug={debugTools}
    >
      <PlayerModel />
      <PlayerCombat />
    </Ecctrl>
  );
}
