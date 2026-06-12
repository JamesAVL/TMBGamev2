import { Outlines } from '@react-three/drei';
import { useSettingsStore } from '../../stores/settingsStore';
import { OUTLINE_COLOR, OUTLINE_THICKNESS } from './toon';

// Cutout outline for big silhouettes. Place inside a <mesh>. Skipped in
// performance mode (it doubles the mesh's draw call).
export function ToonOutline({ thickness = OUTLINE_THICKNESS }: { thickness?: number }) {
  const performanceMode = useSettingsStore((s) => s.performanceMode);
  if (performanceMode) return null;
  return <Outlines thickness={thickness} color={OUTLINE_COLOR} />;
}
