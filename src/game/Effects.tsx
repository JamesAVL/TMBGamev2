import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  Noise,
  Vignette,
} from '@react-three/postprocessing';

// The collage finish: bloom for the glows, then a gentle grade — saturation
// lift, a touch of contrast, vignette, and film grain. luminanceThreshold 1
// keeps bloom to emissives only (eyes, embers, telegraphs).
export function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur luminanceThreshold={1} intensity={0.8} />
      <HueSaturation saturation={0.15} />
      <BrightnessContrast contrast={0.06} />
      <Vignette darkness={0.55} offset={0.3} />
      <Noise premultiply opacity={0.35} />
    </EffectComposer>
  );
}
