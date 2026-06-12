import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// The legends travel together. `character` is whoever you're controlling;
// Q swaps. The other is just off-screen, doing their fringe.
export type CharacterId = 'vince' | 'howard';

type ProfileState = {
  character: CharacterId;
  setCharacter: (character: CharacterId) => void;
  switchCharacter: () => void;
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      character: 'vince',
      setCharacter: (character) => set({ character }),
      switchCharacter: () =>
        set((s) => ({ character: s.character === 'vince' ? 'howard' : 'vince' })),
    }),
    { name: 'tmb-profile', partialize: (s) => ({ character: s.character }) },
  ),
);
