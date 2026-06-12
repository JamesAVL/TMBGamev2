import { create } from 'zustand';

// Who you're playing. Chosen on the greybox dressing pads for now; the hub
// wardrobe will own (and persist) this later.
export type CharacterId = 'vince' | 'howard';

type ProfileState = {
  character: CharacterId;
  setCharacter: (character: CharacterId) => void;
};

export const useProfileStore = create<ProfileState>()((set) => ({
  character: 'vince',
  setCharacter: (character) => set({ character }),
}));
