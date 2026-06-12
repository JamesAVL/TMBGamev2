import { Leva } from 'leva';
import { DEBUG } from './debug/flags';
import { GameCanvas } from './game/GameCanvas';
import { Hud } from './ui/Hud';

export default function App() {
  return (
    <>
      {/* Single leva root, shared by ecctrl's debug panel and our Debug folder */}
      <Leva hidden={!DEBUG} collapsed />
      <GameCanvas />
      <Hud />
    </>
  );
}
