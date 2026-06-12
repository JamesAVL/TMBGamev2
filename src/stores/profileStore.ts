import { create } from 'zustand';

// The legends travel together. `character` is whoever you're controlling;
// Q swaps. The other follows (and never fights — that's your job).
export type CharacterId = 'vince' | 'howard';

type ProfileState = {
  character: CharacterId;
  setCharacter: (character: CharacterId) => void;
  switchCharacter: () => void;
};

export const useProfileStore = create<ProfileState>()((set) => ({
  character: 'vince',
  setCharacter: (character) => set({ character }),
  switchCharacter: () => set((s) => ({ character: s.character === 'vince' ? 'howard' : 'vince' })),
}));
