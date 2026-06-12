import { create } from 'zustand';

// Frame state: the title gate and the pause menu. Not persisted — the title
// greets every load.
type UiState = {
  phase: 'title' | 'playing';
  pauseOpen: boolean;
  setPhase: (phase: 'title' | 'playing') => void;
  setPauseOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>()((set) => ({
  phase: 'title',
  pauseOpen: false,
  setPhase: (phase) => set({ phase }),
  setPauseOpen: (pauseOpen) => set({ pauseOpen }),
}));
