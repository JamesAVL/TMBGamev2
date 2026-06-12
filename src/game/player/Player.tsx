import Ecctrl from 'ecctrl';
import { DEBUG } from '../../debug/flags';
import { movementConfig } from './movementConfig';
import { PlayerModel } from './PlayerModel';

// ecctrl owns the default camera (drag to orbit, scroll to zoom) — never add
// OrbitControls or a makeDefault camera elsewhere, they'd fight it.
export function Player() {
  return (
    <Ecctrl {...movementConfig} debug={DEBUG}>
      <PlayerModel />
    </Ecctrl>
  );
}
