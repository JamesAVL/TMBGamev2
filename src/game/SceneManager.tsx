import { useEffect, useRef } from 'react';
import { sfx } from '../audio/sfx';
import { useCombatStore } from '../stores/combatStore';
import { useHubStore } from '../stores/hubStore';
import { usePlayerStore } from '../stores/playerStore';
import { useSceneStore, type SceneId } from '../stores/sceneStore';
import { clearProjectiles } from './combat/projectilePool';
import { GREYBOX_SPAWNS } from './enemies/spawns';
import { TUNDRA_PLACED } from './world/tundra/tundraSpawns';

const SCENE_OBJECTIVE: Record<SceneId, string> = {
  hub: 'The Nabootique. Naboo has opinions and inventory.',
  greybox: 'The training range. Wolves included, free of charge.',
  tundra: 'Head north. The Parka People keep something precious.',
};

const SCENE_ENEMIES: Record<SceneId, typeof GREYBOX_SPAWNS> = {
  hub: [], // no biting in the shop
  greybox: GREYBOX_SPAWNS,
  tundra: TUNDRA_PLACED,
};

// On scene change: install the scene's enemies and objective. The player body
// remounts itself at the scene spawn (Player keys on the scene); skills and
// XP persist — progression is yours to keep.
export function SceneManager() {
  const scene = useSceneStore((s) => s.scene);
  const firstRun = useRef(true);

  useEffect(() => {
    clearProjectiles(); // no records sail between worlds
    useCombatStore.getState().setEnemies(SCENE_ENEMIES[scene]);
    useSceneStore.getState().setObjective(SCENE_OBJECTIVE[scene]);
    useHubStore.getState().setDialogOpen(false);
    useHubStore.getState().setShopOpen(false);
    useHubStore.getState().setNearNaboo(false);
    // The Mirror Ball arms once per realm entry
    if (scene === 'tundra' && useHubStore.getState().mods.hasMirrorBall) {
      usePlayerStore.getState().armMirror();
    }
    if (!firstRun.current) sfx.portal();
    firstRun.current = false;
  }, [scene]);

  return null;
}
