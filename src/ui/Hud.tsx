import { CLASSIC_CONTROLS } from '../debug/flags';
import { usePointerLock } from './usePointerLock';

export function Hud() {
  const locked = usePointerLock();

  return (
    <div className="hud">
      <div className="hud-title">
        <h1>THE MIGHTY BOOSH RPG</h1>
        <p>
          Step 1 — Move (greybox). An unlicensed jaunt through the unswept corners of the cosmos.
        </p>
      </div>
      {!CLASSIC_CONTROLS && !locked && <div className="hud-lock-prompt">click to take control</div>}
      <div className="hud-controls">
        {CLASSIC_CONTROLS ? (
          <>
            <div>
              <kbd>W</kbd>
              <kbd>A</kbd>
              <kbd>S</kbd>
              <kbd>D</kbd> / arrows — move &nbsp;·&nbsp; <kbd>Shift</kbd> — sprint &nbsp;·&nbsp;{' '}
              <kbd>Space</kbd> — jump
            </div>
            <div>drag mouse — orbit camera &nbsp;·&nbsp; scroll — zoom</div>
          </>
        ) : (
          <>
            <div>
              mouse — steer &nbsp;·&nbsp; <kbd>W</kbd>
              <kbd>S</kbd> — forward/back &nbsp;·&nbsp; <kbd>A</kbd>
              <kbd>D</kbd> — strafe
            </div>
            <div>
              <kbd>Shift</kbd> — sprint &nbsp;·&nbsp; <kbd>Space</kbd> — jump &nbsp;·&nbsp; scroll —
              zoom &nbsp;·&nbsp; <kbd>Esc</kbd> — release mouse
            </div>
          </>
        )}
        {import.meta.env.DEV && (
          <div className="hud-debug-hint">
            ?debug — tuning panels &nbsp;·&nbsp; ?classic — old control scheme
          </div>
        )}
      </div>
    </div>
  );
}
