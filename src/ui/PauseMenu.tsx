import { setMasterVolume } from '../audio/sfx';
import { runtime } from '../game/combat/runtime';
import { isMouseScheme, useSettingsStore } from '../stores/settingsStore';
import { useSceneStore } from '../stores/sceneStore';
import { useUiStore } from '../stores/uiStore';
import { wipeSaveAndReload } from './saveWipe';
import { useState } from 'react';

function relock() {
  if (!isMouseScheme()) return;
  document.querySelector<HTMLCanvasElement>('#game-canvas canvas')?.requestPointerLock();
}

export function PauseMenu() {
  const open = useUiStore((s) => s.pauseOpen);
  const volume = useSettingsStore((s) => s.volume);
  const performanceMode = useSettingsStore((s) => s.performanceMode);
  const controlScheme = useSettingsStore((s) => s.controlScheme);
  const touchControls = useSettingsStore((s) => s.touchControls);
  const debugTools = useSettingsStore((s) => s.debugTools);
  const scene = useSceneStore((s) => s.scene);
  const [confirmWipe, setConfirmWipe] = useState(false);

  if (!open) return null;

  const close = () => {
    useUiStore.getState().setPauseOpen(false);
    setConfirmWipe(false);
    relock();
  };

  const switchScheme = (scheme: 'mouse' | 'keyboard') => {
    if (scheme === useSettingsStore.getState().controlScheme) return;
    // stash the body position so the remount doesn't teleport to spawn
    const body = runtime.player?.group;
    if (body) {
      const t = body.translation();
      runtime.pendingReposition = { x: t.x, y: t.y, z: t.z };
    }
    useSettingsStore.getState().setControlScheme(scheme);
  };

  return (
    <div className="pause-menu">
      <div className="pause-card">
        <h3>PAUSED</h3>

        <label className="pause-row">
          <span>volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              useSettingsStore.getState().setVolume(v);
              setMasterVolume(v);
            }}
          />
        </label>

        <div className="pause-row">
          <span>movement</span>
          <div className="pause-toggle">
            <button
              className={controlScheme === 'mouse' ? 'active' : ''}
              onClick={() => switchScheme('mouse')}
            >
              mouse-steered
            </button>
            <button
              className={controlScheme === 'keyboard' ? 'active' : ''}
              onClick={() => switchScheme('keyboard')}
            >
              keyboard + drag cam
            </button>
          </div>
        </div>

        <label className="pause-row">
          <span>touch controls</span>
          <input
            type="checkbox"
            checked={touchControls}
            onChange={(e) => useSettingsStore.getState().setTouchControls(e.target.checked)}
          />
        </label>

        <label className="pause-row">
          <span>performance mode</span>
          <input
            type="checkbox"
            checked={performanceMode}
            onChange={(e) => useSettingsStore.getState().setPerformanceMode(e.target.checked)}
          />
        </label>

        <label className="pause-row">
          <span>debug tools</span>
          <input
            type="checkbox"
            checked={debugTools}
            onChange={(e) => useSettingsStore.getState().setDebugTools(e.target.checked)}
          />
        </label>

        <div className="pause-actions">
          <button className="title-primary" onClick={close}>
            resume (P)
          </button>
          {scene !== 'hub' && (
            <button
              onClick={() => {
                useUiStore.getState().setPauseOpen(false);
                useSceneStore.getState().setScene('hub');
              }}
            >
              return to the shop
            </button>
          )}
          {confirmWipe ? (
            <button className="title-danger" onClick={wipeSaveAndReload}>
              really wipe everything?
            </button>
          ) : (
            <button onClick={() => setConfirmWipe(true)}>new game</button>
          )}
        </div>

        <p className="title-foot">
          mouse — steer · click — attack · Q — switch · T — skills · right-click — talk
        </p>
      </div>
    </div>
  );
}
