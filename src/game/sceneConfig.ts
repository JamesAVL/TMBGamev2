import type { SceneId } from '../stores/sceneStore';

export const SCENE_SPAWN: Record<SceneId, [number, number, number]> = {
  greybox: [0, 4, 0],
  tundra: [0, 3, 32],
};

// Yaw in radians for character AND camera at scene entry, so you arrive
// facing the action (0 faces +z/south; π faces −z/north).
export const SCENE_FACING: Record<SceneId, number> = {
  greybox: 0,
  tundra: Math.PI, // the run heads north
};
