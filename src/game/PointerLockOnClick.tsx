import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
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
      if (document.pointerLockElement !== el) el.requestPointerLock();
    };
    el.addEventListener('click', requestLock);
    return () => {
      el.removeEventListener('click', requestLock);
      if (document.pointerLockElement === el) document.exitPointerLock();
    };
  }, [gl]);

  return null;
}
