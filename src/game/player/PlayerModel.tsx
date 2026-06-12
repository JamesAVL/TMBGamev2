import { useProfileStore } from '../../stores/profileStore';
import { HowardModel } from './HowardModel';
import { VinceModel } from './VinceModel';

// One body, two legends. Physics capsule is identical; only the look and the
// attack style change with the character.
export function PlayerModel() {
  const character = useProfileStore((s) => s.character);
  return character === 'vince' ? <VinceModel /> : <HowardModel />;
}
