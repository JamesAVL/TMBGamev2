import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { getGradientMap } from '../look/toon';
import { runtime } from '../combat/runtime';

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

export type HeldProp = 'spraycan' | 'record';

// A small toon-shaded prop seated in the right hand. Sizes/orientation are in
// the rig's LOCAL (pre-scale) units; tune visually.
function makeHeldProp(kind: HeldProp): THREE.Object3D {
  const grad = getGradientMap();
  const group = new THREE.Group();
  if (kind === 'spraycan') {
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.46, 14),
      new THREE.MeshToonMaterial({ gradientMap: grad, color: '#e8e4da' }),
    );
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.06, 0.1, 14),
      new THREE.MeshToonMaterial({ gradientMap: grad, color: '#d84f9a' }),
    );
    cap.position.y = 0.28;
    group.add(body, cap);
  } else {
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.26, 0.04, 22),
      new THREE.MeshToonMaterial({ gradientMap: grad, color: '#141414' }),
    );
    const label = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.044, 16),
      new THREE.MeshToonMaterial({ gradientMap: grad, color: '#c4a86a' }),
    );
    group.add(disc, label);
    group.rotation.z = Math.PI / 2; // disc held on edge in the fist
  }
  // handslot.r's +Y points out of the grip (where the rig's weapons stand), so
  // lift the prop along it to clear the fist.
  group.position.y = 0.12;
  group.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });
  return group;
}

export function KayLegend({ url, held }: { url: string; held?: HeldProp }) {
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
    // Seat the held prop in the right hand synchronously (part of the model
    // before it renders, so it reliably shows and rides the animated hand).
    if (held) {
      const hand = root.getObjectByName('handslot.r') ?? root.getObjectByName('hand.r');
      if (hand) hand.add(makeHeldProp(held));
    }
    return root;
  }, [scene, held]);

  // Publish the right-hand node so PlayerCombat can park the spray cone at the
  // (animated) hand. Cleared on unmount so a legend swap can't strand it.
  useEffect(() => {
    const hand = model.getObjectByName('handslot.r') ?? model.getObjectByName('hand.r') ?? null;
    runtime.playerHand = hand;
    return () => {
      if (runtime.playerHand === hand) runtime.playerHand = null;
    };
  }, [model]);

  return <primitive object={model} />;
}
