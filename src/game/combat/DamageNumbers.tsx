import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type * as THREE from 'three';
import { damagePops, DMG_LIFE, DMG_POOL, DMG_RISE } from './damagePopups';
import { runtime } from './runtime';

// Floating combat text: every hit (and freeze) made legible. Fixed pool,
// imperative updates — no React churn per hit.
export function DamageNumbers() {
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const divRefs = useRef<(HTMLDivElement | null)[]>([]);

  useFrame(() => {
    const now = runtime.time;
    for (let i = 0; i < DMG_POOL; i++) {
      const pop = damagePops[i]!;
      const group = groupRefs.current[i];
      const div = divRefs.current[i];
      if (!group || !div) continue;
      const age = now - pop.born;
      if (!pop.active || age > DMG_LIFE || age < 0) {
        pop.active = false;
        if (div.style.display !== 'none') div.style.display = 'none';
        continue;
      }
      group.position.set(pop.x, pop.y + age * DMG_RISE, pop.z);
      div.style.display = 'block';
      div.style.opacity = String(1 - age / DMG_LIFE);
      if (div.textContent !== pop.text) div.textContent = pop.text;
      const cls = `dmg-pop ${pop.kind}`;
      if (div.className !== cls) div.className = cls;
    }
  });

  return (
    <>
      {Array.from({ length: DMG_POOL }, (_, i) => (
        <group
          key={i}
          ref={(g) => {
            groupRefs.current[i] = g;
          }}
        >
          <Html center zIndexRange={[5, 0]}>
            <div
              ref={(d) => {
                divRefs.current[i] = d;
              }}
              className="dmg-pop"
              style={{ display: 'none' }}
            />
          </Html>
        </group>
      ))}
    </>
  );
}
