import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sfx } from '../audio/sfx';
import {
  computeTrinketMods,
  TRINKETS,
  type TrinketId,
  type TrinketMods,
} from '../game/progression/trinkets';
import { usePlayerStore } from './playerStore';

// The Nabootique's books: shrapnel (the across-runs currency), trinkets
// owned, and how far Naboo's storyline has come. Persisted.

type HubState = {
  shrapnel: number;
  trinkets: Partial<Record<TrinketId, boolean>>;
  mods: TrinketMods;
  tundraClears: number;
  // transient UI state (not persisted)
  nearNaboo: boolean;
  dialogOpen: boolean;
  shopOpen: boolean;
  earnShrapnel: (amount: number) => void;
  buyTrinket: (id: TrinketId) => void;
  recordClear: () => void;
  setNearNaboo: (near: boolean) => void;
  setDialogOpen: (open: boolean) => void;
  setShopOpen: (open: boolean) => void;
};

export const useHubStore = create<HubState>()(
  persist(
    (set, get) => ({
      shrapnel: 0,
      trinkets: {},
      mods: computeTrinketMods({}),
      tundraClears: 0,
      nearNaboo: false,
      dialogOpen: false,
      shopOpen: false,
      earnShrapnel: (amount) => set((s) => ({ shrapnel: s.shrapnel + amount })),
      buyTrinket: (id) => {
        const s = get();
        const def = TRINKETS.find((t) => t.id === id);
        if (!def || s.trinkets[id] || s.shrapnel < def.price) return;
        const trinkets = { ...s.trinkets, [id]: true };
        if (id === 'poloTin') {
          usePlayerStore.getState().addMaxHp(1);
          usePlayerStore.getState().heal(1);
        }
        set({
          shrapnel: s.shrapnel - def.price,
          trinkets,
          mods: computeTrinketMods(trinkets),
        });
        sfx.treasure();
      },
      recordClear: () => set((s) => ({ tundraClears: s.tundraClears + 1 })),
      setNearNaboo: (nearNaboo) => set({ nearNaboo }),
      setDialogOpen: (dialogOpen) => set({ dialogOpen }),
      setShopOpen: (shopOpen) => set({ shopOpen }),
    }),
    {
      name: 'tmb-hub',
      partialize: (s) => ({
        shrapnel: s.shrapnel,
        trinkets: s.trinkets,
        tundraClears: s.tundraClears,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<HubState>;
        const trinkets = p.trinkets ?? {};
        return {
          ...current,
          ...p,
          trinkets,
          mods: computeTrinketMods(trinkets),
          nearNaboo: false,
          dialogOpen: false,
          shopOpen: false,
        };
      },
    },
  ),
);

// Re-apply the Polo Tin's max-hp bonus after rehydration (playerStore derives).
if (useHubStore.getState().trinkets.poloTin) {
  usePlayerStore.getState().addMaxHp(1);
}
