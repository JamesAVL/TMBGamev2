import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Player-facing settings, persisted. URL flags (?classic, ?debug) survive
// only as one-time initialisers for back-compat.
export type ControlScheme = 'mouse' | 'keyboard';

const params = new URLSearchParams(window.location.search);

// First-run defaults only — persisted choices always win. "pointer: coarse"
// means the PRIMARY pointer is a finger (phone/tablet) — it stays false on
// touchscreen laptops and desktops, unlike ontouchstart/maxTouchPoints, which
// are true there too and forced the joystick onto mouse-driven machines.
const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

type SettingsState = {
  volume: number; // 0..1 master
  performanceMode: boolean; // lower dpr, no shadows, no composer
  controlScheme: ControlScheme;
  touchControls: boolean; // on-screen joystick + action buttons
  debugTools: boolean; // leva panels, perf HUD, physics wireframe
  setVolume: (v: number) => void;
  setPerformanceMode: (on: boolean) => void;
  setControlScheme: (scheme: ControlScheme) => void;
  setTouchControls: (on: boolean) => void;
  setDebugTools: (on: boolean) => void;
};

// The persisted slice — partialize writes it, migrate must return it.
type PersistedSettings = {
  volume: number;
  performanceMode: boolean;
  controlScheme: ControlScheme;
  touchControls: boolean;
  debugTools: boolean;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      volume: 0.5,
      performanceMode: coarsePointer,
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
      // v0 (zustand's implicit default — every existing save says version: 0)
      // derived touch from ontouchstart/maxTouchPoints, which misfires on
      // touchscreen laptops, and predates any intentional touch choice.
      version: 1,
      migrate: (persistedState, version) => {
        const old = persistedState as PersistedSettings;
        if (version === 0) {
          return {
            ...old,
            // Re-derive: v0's touchControls was never a user decision.
            touchControls: coarsePointer,
            // Phones that saved performanceMode: false before touch support
            // existed get the lighter renderer they were always meant to have.
            performanceMode: old.performanceMode || coarsePointer,
          };
        }
        return old;
      },
      partialize: (s): PersistedSettings => ({
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
