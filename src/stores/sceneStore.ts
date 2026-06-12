import { create } from 'zustand';

export type SceneId = 'greybox' | 'tundra';
export type TundraPhase = 'approach' | 'waves' | 'boss' | 'egg' | 'cleared';

type TundraProgress = { phase: TundraPhase; wave: number };

type SceneState = {
  scene: SceneId;
  tundra: TundraProgress;
  objective: string;
  setScene: (scene: SceneId) => void;
  setTundra: (patch: Partial<TundraProgress>) => void;
  setObjective: (text: string) => void;
};

export const useSceneStore = create<SceneState>()((set) => ({
  scene: 'greybox',
  tundra: { phase: 'approach', wave: 0 },
  objective: '',
  setScene: (scene) =>
    set({
      scene,
      // a fresh run every time the realm is entered
      tundra: { phase: 'approach', wave: 0 },
    }),
  setTundra: (patch) => set((s) => ({ tundra: { ...s.tundra, ...patch } })),
  setObjective: (objective) => set({ objective }),
}));
