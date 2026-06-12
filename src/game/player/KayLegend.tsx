import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';

// A KayKit Adventurer dressed for the Boosh: rigged body only — every
// hand-slot weapon and the wizard hat stay hidden (the legends' attacks are
// the spray cone and the record projectiles, drawn by PlayerCombat).
// Materials stay as authored (same treatment as the KayProp shop clutter,
// which already reads right under the look pass).
const HIDDEN_NODES = new Set([
  'Knife',
  'Knife_Offhand',
  '1H_Crossbow',
  '2H_Crossbow',
  'Throwable',
  'Spellbook',
  'Spellbook_open',
  '1H_Wand',
  '2H_Staff',
  'Mage_Hat',
  '1H_Sword',
  '1H_Sword_Offhand',
  '2H_Sword',
  'Badge_Shield',
  'Rectangle_Shield',
  'Round_Shield',
  'Spike_Shield',
]);

// The capsule: ecctrl's default 0.35 half-height + 0.3 radius floats 0.3 above
// ground, so visual feet belong at -0.95 from the body centre (where the old
// primitive legends stood). Height matches their silhouette, hair included.
const TARGET_HEIGHT = 1.45;
const FOOT_Y = -0.95;

export function KayLegend({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const model = useMemo(() => {
    // SkeletonUtils.clone keeps bones/skinning intact (drei's cache holds the
    // original; the player can remount per legend without cross-mutation)
    const root = skeletonClone(scene);
    root.traverse((obj) => {
      if (HIDDEN_NODES.has(obj.name)) obj.visible = false;
      if ((obj as THREE.Mesh).isMesh) obj.castShadow = true;
    });
    // Self-calibrate: measure the bind pose, normalise to game height, and
    // plant the feet on the capsule's ground line — no per-pack magic numbers.
    const box = new THREE.Box3().setFromObject(root);
    const height = Math.max(0.001, box.max.y - box.min.y);
    const s = TARGET_HEIGHT / height;
    root.scale.setScalar(s);
    root.position.y = FOOT_Y - box.min.y * s;
    return root;
  }, [scene]);
  return <primitive object={model} />;
}
