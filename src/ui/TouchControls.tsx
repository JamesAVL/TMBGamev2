import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useJoystickControls } from 'ecctrl';
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

// Touch overlay — a PURE DOM joystick (no second WebGL canvas, unlike ecctrl's
// EcctrlJoystick) that feeds ecctrl's useJoystickControls store directly, plus
// DOM action buttons that call the same shared verbs as the keyboard. Player.tsx
// runs ecctrl in its default mode while touch is on, so joystick angle steers
// camera-relative (push up = away from camera = forward).

const JOY_RADIUS = 60; // px the knob travels from centre; full deflection = sprint

export function TouchControls({ showBubble }: { showBubble: (text: string) => void }) {
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

  const hidden = !touch || phase !== 'playing' || pauseOpen || panelOpen || dialogOpen || shopOpen;

  // A menu opening (or death) eats the pointerup — release everything the
  // controls might be holding so the character doesn't march or auto-fire.
  useEffect(() => {
    if (hidden || dead) {
      useJoystickControls.getState().resetJoystick();
      useJoystickControls.getState().releaseAllButtons();
      runtime.attackHeld = false;
    }
  }, [hidden, dead]);

  if (hidden) return null;

  return (
    <>
      <TouchJoystick />
      {!dead && (
        <TouchButtons
          character={character}
          nearNaboo={nearNaboo}
          inHub={scene === 'hub'}
          showBubble={showBubble}
        />
      )}
    </>
  );
}

function TouchJoystick() {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const activeId = useRef<number | null>(null);

  const update = (clientX: number, clientY: number) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const len = Math.hypot(dx, dy);
    const clamped = Math.min(len, JOY_RADIUS);
    const norm = clamped / JOY_RADIUS;
    // Screen Y points down; ecctrl wants a maths angle (up = +), so negate dy.
    const ang = Math.atan2(-dy, dx);
    if (knobRef.current) {
      const kx = len > 0 ? (dx / len) * clamped : 0;
      const ky = len > 0 ? (dy / len) * clamped : 0;
      knobRef.current.style.transform = `translate(${kx}px, ${ky}px)`;
    }
    // ecctrl only needs dis > 0 to move; runState (full deflection) sprints.
    useJoystickControls.getState().setJoystick(norm, ang, norm > 0.85);
  };

  const recentre = () => {
    activeId.current = null;
    useJoystickControls.getState().resetJoystick();
    if (knobRef.current) knobRef.current.style.transform = 'translate(0px, 0px)';
  };

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (activeId.current !== null) return;
    e.preventDefault();
    e.stopPropagation();
    activeId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    ensureAudio(); // first touch is the user gesture that wakes Web Audio
    update(e.clientX, e.clientY);
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== activeId.current) return;
    e.preventDefault();
    e.stopPropagation();
    update(e.clientX, e.clientY);
  };
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== activeId.current) return;
    e.stopPropagation();
    recentre();
  };

  return (
    <div
      ref={baseRef}
      className="touch-joystick"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <div ref={knobRef} className="touch-joystick-knob" />
    </div>
  );
}

function TouchButtons({
  character,
  nearNaboo,
  inHub,
  showBubble,
}: {
  character: 'vince' | 'howard';
  nearNaboo: boolean;
  inHub: boolean;
  showBubble: (text: string) => void;
}) {
  const tap = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  return (
    <div className="touch-controls">
      <div className="touch-row">
        {nearNaboo && inHub && (
          <button
            className="touch-btn small talk"
            onPointerDown={(e) => {
              tap(e);
              talkToNaboo();
            }}
          >
            TALK
          </button>
        )}
        <button
          className="touch-btn small"
          onPointerDown={(e) => {
            tap(e);
            const line = switchLegend();
            if (line) showBubble(line);
          }}
        >
          SWITCH
        </button>
        <button
          className="touch-btn small"
          onPointerDown={(e) => {
            tap(e);
            toggleSkills();
          }}
        >
          SKILLS
        </button>
      </div>
      <div className="touch-row">
        <button
          className="touch-btn jump"
          onPointerDown={(e) => {
            tap(e);
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
            tap(e);
            ensureAudio();
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
