import { Leva } from 'leva';
import { GameCanvas } from './game/GameCanvas';
import { useSettingsStore } from './stores/settingsStore';
import { Hud } from './ui/Hud';
import { PauseMenu } from './ui/PauseMenu';
import { TitleScreen } from './ui/TitleScreen';
import { TouchJoystick } from './ui/TouchControls';

export default function App() {
  const debugTools = useSettingsStore((s) => s.debugTools);
  return (
    <>
      {/* Single leva root, shared by ecctrl's debug panel and our Debug folder */}
      <Leva hidden={!debugTools} collapsed />
      <GameCanvas />
      {/* outside .hud — the joystick canvas needs its own pointer events */}
      <TouchJoystick />
      <Hud />
      <PauseMenu />
      <TitleScreen />
    </>
  );
}
