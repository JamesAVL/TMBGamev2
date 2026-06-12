import { EcctrlJoystick, useJoystickControls } from 'ecctrl';
import { useEffect } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ensureAudio } from '../audio/sfx';
import { runtime } from '../game/combat/runtime';
import { useHubStore } from '../stores/hubStore';
import { usePlayerStore } from '../stores/playerStore';
import { useProfileStore } from '../stores/profileStore';
import { useRunStore } from '../stores/runStore';
import { useSceneStore } from '../stores/sceneStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useUiStore } from '../stores/uiStore';
import { switchLegend, talkToNaboo, toggleSkills } from './actions';

// Touch overlay, two halves:
//  - TouchJoystick: ecctrl's own joystick canvas (bottom-left). Its zustand
//    store feeds Ecctrl's frame loop directly — no remount, no synthetic keys.
//  - TouchButtons: DOM action buttons (bottom-right) that call the same
//    shared actions as the keyboard. ATTACK holds a runtime flag that
//    PlayerCombat consumes, so holding it auto-fires at the weapon cooldown.

export function TouchJoystick() {
  const touch = useSettingsStore((s) => s.touchControls);
  const phase = useUiStore((s) => s.phase);
  const pauseOpen = useUiStore((s) => s.pauseOpen);
  const panelOpen = useRunStore((s) => s.panelOpen);
  const dialogOpen = useHubStore((s) => s.dialogOpen);
  const shopOpen = useHubStore((s) => s.shopOpen);
  const hidden = !touch || phase !== 'playing' || pauseOpen || panelOpen || dialogOpen || shopOpen;

  // A drag interrupted by a menu never gets its pointerup — zero the stick
  // so the character doesn't keep marching on resume.
  useEffect(() => {
    if (hidden) useJoystickControls.getState().resetJoystick();
  }, [hidden]);

  if (!touch) return null;
  // display:none (not unmount): the joystick owns a WebGL context, and
  // re-creating one per menu visit would exhaust mobile Safari's budget.
  return (
    <div style={{ display: hidden ? 'none' : 'block' }}>
      <EcctrlJoystick buttonNumber={0} joystickHeightAndWidth={170} />
    </div>
  );
}

export function TouchButtons({ showBubble }: { showBubble: (text: string) => void }) {
  const touch = useSettingsStore((s) => s.touchControls);
  const phase = useUiStore((s) => s.phase);
  const pauseOpen = useUiStore((s) => s.pauseOpen);
  const panelOpen = useRunStore((s) => s.panelOpen);
  const dialogOpen = useHubStore((s) => s.dialogOpen);
  const shopOpen = useHubStore((s) => s.shopOpen);
  const dead = usePlayerStore((s) => s.dead);
  const character = useProfileStore((s) => s.character);
  const nearNaboo = useHubStore((s) => s.nearNaboo);
  const scene = useSceneStore((s) => s.scene);

  const hidden =
    !touch || phase !== 'playing' || pauseOpen || panelOpen || dialogOpen || shopOpen || dead;

  // Buttons can vanish mid-press (menu opens, death) — their pointerup is
  // lost, so release everything they might be holding.
  useEffect(() => {
    if (hidden) {
      runtime.attackHeld = false;
      useJoystickControls.getState().releaseAllButtons();
    }
  }, [hidden]);

  if (hidden) return null;

  const capture = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  return (
    <div className="touch-controls">
      <div className="touch-row">
        {nearNaboo && scene === 'hub' && (
          <button className="touch-btn small talk" onPointerDown={talkToNaboo}>
            TALK
          </button>
        )}
        <button
          className="touch-btn small"
          onPointerDown={() => {
            const line = switchLegend();
            if (line) showBubble(line);
          }}
        >
          SWITCH
        </button>
        <button className="touch-btn small" onPointerDown={toggleSkills}>
          SKILLS
        </button>
      </div>
      <div className="touch-row">
        <button
          className="touch-btn jump"
          onPointerDown={(e) => {
            capture(e);
            useJoystickControls.getState().pressButton1();
          }}
          onPointerUp={() => useJoystickControls.getState().releaseAllButtons()}
          onPointerCancel={() => useJoystickControls.getState().releaseAllButtons()}
        >
          JUMP
        </button>
        <button
          className="touch-btn attack"
          onPointerDown={(e) => {
            capture(e);
            ensureAudio(); // a press is a user gesture — wake the audio
            runtime.attackHeld = true;
          }}
          onPointerUp={() => {
            runtime.attackHeld = false;
          }}
          onPointerCancel={() => {
            runtime.attackHeld = false;
          }}
        >
          {character === 'vince' ? 'SPRAY' : 'THROW'}
        </button>
      </div>
    </div>
  );
}
