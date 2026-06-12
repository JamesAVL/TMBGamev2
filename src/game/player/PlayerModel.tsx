import { useGLTF } from '@react-three/drei';
import { EcctrlAnimation } from 'ecctrl';
import { useProfileStore } from '../../stores/profileStore';
import { KayLegend } from './KayLegend';

// One body, two legends — now rigged and animated (KayKit Adventurers, CC0;
// see CREDITS.md). The slim caped Rogue plays Vince, the robed (de-hatted)
// Mage plays Howard. Physics capsule is identical; the look and the attack
// style change with the character.

const VINCE_URL = '/models/kaykit/adventurers/Rogue.glb';
const HOWARD_URL = '/models/kaykit/adventurers/Mage.glb';
// Module-scope preload: both legends fetch at boot (Q can switch any time),
// so neither suspends the Physics boundary mid-game.
useGLTF.preload(VINCE_URL);
useGLTF.preload(HOWARD_URL);

// Every character in the pack ships the same clip names, so one set serves
// both legends (useGame.initializeAnimationSet only ever takes the first).
const ANIMATION_SET = {
  idle: 'Idle',
  walk: 'Walking_A',
  run: 'Running_A',
  jump: 'Jump_Start',
  jumpIdle: 'Jump_Idle',
  jumpLand: 'Jump_Land',
  fall: 'Jump_Idle',
  action1: 'Throw', // Howard: the record leaves his hand
  action2: 'Spellcast_Shoot', // Vince: a one-handed blast of hairspray
};

export function PlayerModel() {
  const character = useProfileStore((s) => s.character);
  const url = character === 'vince' ? VINCE_URL : HOWARD_URL;
  // key remounts EcctrlAnimation on switch so the mixer rebinds to the new rig
  return (
    <EcctrlAnimation key={character} characterURL={url} animationSet={ANIMATION_SET}>
      <KayLegend url={url} />
    </EcctrlAnimation>
  );
}
