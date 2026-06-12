import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Player-facing settings, persisted. URL flags (?classic, ?debug) survive
// only as one-time initialisers for back-compat.
export type ControlScheme = 'mouse' | 'keyboard';

const params = new URLSearchParams(window.location.search);

// First-run defaults only — persisted choices always win. A touch screen gets
// the overlay controls and the lighter renderer out of the box.
const touchDetected = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

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
      performanceMode: touchDetected,
      controlScheme: params.has('classic') ? 'keyboard' : 'mouse',
      touchControls: touchDetected,
      debugTools: params.has('debug'),
      setVolume: (volume) => set({ volume: Math.min(1, Math.max(0, volume)) }),
      setPerformanceMode: (performanceMode) => set({ performanceMode }),
      setControlScheme: (controlScheme) => set({ controlScheme }),
      setTouchControls: (touchControls) => set({ touchControls }),
      setDebugTools: (debugTools) => set({ debugTools }),
    }),
    {
      name: 'tmb-settings',
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
