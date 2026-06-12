import { Clone, useGLTF } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';

// KayKit Dungeon Remastered props (Kay Lousberg, CC0 — see CREDITS.md).
// Loaded from /public, deep-cloned per instance; `physical` wraps the prop
// in a fixed cuboid collider so it blocks movement.

const BASE = '/models/kaykit/';

export type KayPropName =
  | 'shelf_large'
  | 'shelf_small'
  | 'barrel_large_decorated'
  | 'barrel_small_stack'
  | 'box_small_decorated'
  | 'box_stacked'
  | 'crates_stacked'
  | 'bottle_A_labeled_green'
  | 'bottle_B_brown'
  | 'candle_triple'
  | 'banner_patternA_red'
  | 'chest_gold'
  | 'keg_decorated'
  | 'coin_stack_medium'
  | 'pillar_decorated'
  | 'column'
  | 'table_long'
  | 'chair'
  | 'rubble_large'
  | 'rubble_half';

export function KayProp({
  name,
  position,
  rotation,
  scale = 1,
  physical = false,
}: {
  name: KayPropName;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  physical?: boolean;
}) {
  const { scene } = useGLTF(`${BASE}${name}.glb`);
  const content = <Clone object={scene} castShadow receiveShadow scale={scale} />;
  if (!physical) {
    return (
      <group position={position} rotation={rotation}>
        {content}
      </group>
    );
  }
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={rotation}>
      {content}
    </RigidBody>
  );
}
