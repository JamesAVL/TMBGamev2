import { Bloom, EffectComposer } from '@react-three/postprocessing';

// luminanceThreshold 1 means only emissive intensities above 1 bloom — the
// Hitcher's polo-mint eye and the swipe arc, nothing else.
export function Effects() {
  return (
    // 4x MSAA instead of the default 8x — visually near-identical, much cheaper
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur luminanceThreshold={1} intensity={0.8} />
    </EffectComposer>
  );
}
