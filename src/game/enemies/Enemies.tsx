import { useCombatStore } from '../../stores/combatStore';
import { Hitcher } from './Hitcher';
import { ModWolf } from './ModWolf';
import { ParkaPerson } from './ParkaPerson';

// Renders whatever the combat store currently holds (scene spawns + waves).
// The Black Frost is bespoke and rendered by the Tundra realm itself.
export function Enemies() {
  const enemies = useCombatStore((s) => s.enemies);
  return (
    <>
      {Object.entries(enemies).map(([id, e]) => {
        if (e.kind === 'modwolf') return <ModWolf key={id} id={id} />;
        if (e.kind === 'hitcher') return <Hitcher key={id} id={id} />;
        if (e.kind === 'parka') return <ParkaPerson key={id} id={id} />;
        return null;
      })}
    </>
  );
}
