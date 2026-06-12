import { useEffect, useState } from 'react';

// Whether the mouse is currently captured. Pointer lock is DOM state, not game
// state, so a local hook (not a zustand store) is the right home for it.
export function usePointerLock() {
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const onChange = () => setLocked(document.pointerLockElement != null);
    document.addEventListener('pointerlockchange', onChange);
    return () => document.removeEventListener('pointerlockchange', onChange);
  }, []);

  return locked;
}
