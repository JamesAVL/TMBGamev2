import { useState } from 'react';
import { useUiStore } from '../stores/uiStore';
import { relockPointer } from './actions';
import { hasSave, wipeSaveAndReload } from './saveWipe';

export function TitleScreen() {
  const phase = useUiStore((s) => s.phase);
  const [confirmWipe, setConfirmWipe] = useState(false);

  if (phase !== 'title') return null;

  const saved = hasSave();

  const begin = () => {
    useUiStore.getState().setPhase('playing');
    relockPointer(); // the click is the user gesture
  };

  return (
    <div className="title-screen">
      <div className="title-card">
        <p className="title-over">an unlicensed jaunt through</p>
        <h1>
          THE MIGHTY BOOSH
          <span>RPG</span>
        </h1>
        <p className="title-under">come for the tundra, stay for the tat</p>
        <div className="title-actions">
          <button className="title-primary" onClick={begin}>
            {saved ? 'continue' : 'begin'}
          </button>
          {saved &&
            (confirmWipe ? (
              <button className="title-danger" onClick={wipeSaveAndReload}>
                really wipe everything?
              </button>
            ) : (
              <button onClick={() => setConfirmWipe(true)}>new game</button>
            ))}
        </div>
        <p className="title-foot">
          mouse steers · click sprays/throws · Q switches · T skills · P menu
        </p>
      </div>
    </div>
  );
}
