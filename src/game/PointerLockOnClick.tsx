import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { ensureAudio } from '../audio/sfx';
import { useSettingsStore } from '../stores/settingsStore';

// Click the canvas to capture the mouse for steering; Esc (browser-native)
// releases it. ecctrl's follow-cam reads movementX/Y whenever the pointer is
// locked, so no further wiring is needed. While unlocked, drag-to-orbit still
// works as a fallback. No lock in the keyboard scheme or under touch controls
// (ecctrl's own touch-drag steers the camera there) — but every scheme keeps
// the first-gesture audio unlock.
export function PointerLockOnClick() {
  const gl = useThree((state) => state.gl);
  const scheme = useSettingsStore((s) => s.controlScheme);
  const touch = useSettingsStore((s) => s.touchControls);

  useEffect(() => {
    const el = gl.domElement;
    const noMenu = (e: Event) => e.preventDefault();
    el.addEventListener('contextmenu', noMenu);
    el.addEventListener('pointerdown', ensureAudio);
    if (scheme !== 'mouse' || touch) {
      return () => {
        el.removeEventListener('contextmenu', noMenu);
        el.removeEventListener('pointerdown', ensureAudio);
      };
    }
    const requestLock = () => {
      ensureAudio(); // user gesture — unlocks the Web Audio context
      if (document.pointerLockElement !== el) el.requestPointerLock();
    };
    el.addEventListener('click', requestLock);
    return () => {
      el.removeEventListener('click', requestLock);
      el.removeEventListener('contextmenu', noMenu);
      el.removeEventListener('pointerdown', ensureAudio);
      if (document.pointerLockElement === el) document.exitPointerLock();
    };
  }, [gl, scheme, touch]);

  return null;
}
