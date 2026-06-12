import { useEffect, useRef } from 'react';
import { sfx } from '../audio/sfx';
import { useCombatStore } from '../stores/combatStore';
import { usePlayerStore } from '../stores/playerStore';
import { useSceneStore, type SceneId } from '../stores/sceneStore';
import { runtime } from './combat/runtime';
import { GREYBOX_SPAWNS } from './enemies/spawns';
import { TUNDRA_PLACED } from './world/tundra/tundraSpawns';

const SCENE_SPAWN: Record<SceneId, [number, number, number]> = {
  greybox: [0, 4, 0],
  tundra: [0, 3, 32],
};

const SCENE_OBJECTIVE: Record<SceneId, string> = {
  greybox: 'The range. A cold doorway hums to the south.',
  tundra: 'Head north. The Parka People keep something precious.',
};

const SCENE_ENEMIES: Record<SceneId, typeof GREYBOX_SPAWNS> = {
  greybox: GREYBOX_SPAWNS,
  tundra: TUNDRA_PLACED,
};

// On scene change: reset the run — teleport the player, restore hp,
// install the scene's enemies, set the opening objective.
export function SceneManager() {
  const scene = useSceneStore((s) => s.scene);
  const firstRun = useRef(true);

  useEffect(() => {
    const [x, y, z] = SCENE_SPAWN[scene];
    const body = runtime.player?.group;
    if (body) {
      body.setTranslation({ x, y, z }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
    usePlayerStore.getState().respawnPlayer();
    useCombatStore.getState().setEnemies(SCENE_ENEMIES[scene]);
    useSceneStore.getState().setObjective(SCENE_OBJECTIVE[scene]);
    if (!firstRun.current) sfx.portal();
    firstRun.current = false;
  }, [scene]);

  return null;
}
