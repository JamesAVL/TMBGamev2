import { useCombatStore } from '../../stores/combatStore';
import { FrostBailiff } from './FrostBailiff';
import { Hitcher } from './Hitcher';

// Renders whatever the combat store currently holds (scene spawns + waves).
// The Black Frost is bespoke and rendered by the Tundra realm itself.
export function Enemies() {
  const enemies = useCombatStore((s) => s.enemies);
  return (
    <>
      {Object.entries(enemies).map(([id, e]) => {
        if (e.kind === 'hitcher') return <Hitcher key={id} id={id} />;
        if (e.kind === 'bailiff') return <FrostBailiff key={id} id={id} />;
        return null;
      })}
    </>
  );
}
