import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Player-facing settings, persisted. URL flags (?classic, ?debug) survive
// only as one-time initialisers for back-compat.
export type ControlScheme = 'mouse' | 'keyboard';

const params = new URLSearchParams(window.location.search);

// First-run default only — persisted choices always win. "pointer: coarse"
// means the PRIMARY pointer is a finger (phone/tablet); it stays false on
// touchscreen laptops/desktops, unlike ontouchstart/maxTouchPoints, which
// misfired there and forced the joystick onto mouse machines.
const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

type SettingsState = {
  volume: number; // 0..1 master
  performanceMode: boolean; // lower dpr, no shadows
  controlScheme: ControlScheme;
  touchControls: boolean; // on-screen joystick + action buttons
  debugTools: boolean; // leva panels, perf HUD, physics wireframe
  setVolume: (v: number) => void;
  setPerformanceMode: (on: boolean) => void;
  setControlScheme: (scheme: ControlScheme) => void;
  setTouchControls: (on: boolean) => void;
  setDebugTools: (on: boolean) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      volume: 0.5,
      performanceMode: false,
      controlScheme: params.has('classic') ? 'keyboard' : 'mouse',
      touchControls: coarsePointer,
      debugTools: params.has('debug'),
      setVolume: (volume) => set({ volume: Math.min(1, Math.max(0, volume)) }),
      setPerformanceMode: (performanceMode) => set({ performanceMode }),
      setControlScheme: (controlScheme) => set({ controlScheme }),
      setTouchControls: (touchControls) => set({ touchControls }),
      setDebugTools: (debugTools) => set({ debugTools }),
    }),
    {
      name: 'tmb-settings',
      // No version/migrate: a returning user's storage simply lacks
      // touchControls, and zustand's shallow merge falls back to the
      // coarsePointer default above.
      partialize: (s) => ({
        volume: s.volume,
        performanceMode: s.performanceMode,
        controlScheme: s.controlScheme,
        touchControls: s.touchControls,
        debugTools: s.debugTools,
      }),
    },
  ),
);

export const isMouseScheme = () => useSettingsStore.getState().controlScheme === 'mouse';
