import { useEffect, useRef } from 'react';
import { sfx } from '../audio/sfx';
import { useCombatStore } from '../stores/combatStore';
import { useSceneStore, type SceneId } from '../stores/sceneStore';
import { clearProjectiles } from './combat/projectilePool';
import { GREYBOX_SPAWNS } from './enemies/spawns';
import { TUNDRA_PLACED } from './world/tundra/tundraSpawns';

const SCENE_OBJECTIVE: Record<SceneId, string> = {
  greybox: 'The range. A cold doorway hums to the south.',
  tundra: 'Head north. The Parka People keep something precious.',
};

const SCENE_ENEMIES: Record<SceneId, typeof GREYBOX_SPAWNS> = {
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
    if (!firstRun.current) sfx.portal();
    firstRun.current = false;
  }, [scene]);

  return null;
}
