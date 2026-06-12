import { Hitcher } from './Hitcher';
import { HITCHER_SPAWNS } from './spawns';

export function Enemies() {
  return (
    <>
      {HITCHER_SPAWNS.map((spawn) => (
        <Hitcher key={spawn.id} spawn={spawn} />
      ))}
    </>
  );
}
