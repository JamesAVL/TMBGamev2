import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { ensureAudio } from '../audio/sfx';
import { CLASSIC_CONTROLS } from '../debug/flags';

// Click the canvas to capture the mouse for steering; Esc (browser-native)
// releases it. ecctrl's follow-cam reads movementX/Y whenever the pointer is
// locked, so no further wiring is needed. While unlocked, drag-to-orbit still
// works as a fallback.
export function PointerLockOnClick() {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    if (CLASSIC_CONTROLS) return;
    const el = gl.domElement;
    const requestLock = () => {
      ensureAudio(); // user gesture — unlocks the Web Audio context
      if (document.pointerLockElement !== el) el.requestPointerLock();
    };
    const noMenu = (e: Event) => e.preventDefault();
    el.addEventListener('click', requestLock);
    el.addEventListener('contextmenu', noMenu);
    return () => {
      el.removeEventListener('click', requestLock);
      el.removeEventListener('contextmenu', noMenu);
      if (document.pointerLockElement === el) document.exitPointerLock();
    };
  }, [gl]);

  return null;
}
