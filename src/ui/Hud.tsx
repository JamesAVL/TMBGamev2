import { CLASSIC_CONTROLS } from '../debug/flags';
import { usePlayerStore } from '../stores/playerStore';
import { usePointerLock } from './usePointerLock';

export function Hud() {
  const locked = usePointerLock();
  const hp = usePlayerStore((s) => s.hp);
  const maxHp = usePlayerStore((s) => s.maxHp);
  const dead = usePlayerStore((s) => s.dead);
  const hitCount = usePlayerStore((s) => s.hitCount);

  return (
    <div className="hud">
      {/* keyed by hitCount so the animation replays on every hit */}
      {hitCount > 0 && <div key={hitCount} className="hud-damage-flash" />}
      <div className="hud-title">
        <h1>THE MIGHTY BOOSH RPG</h1>
        <p>
          Step 2 — Fight (greybox). The roads out here charge a toll, and the collector is keen.
        </p>
      </div>
      <div className="hud-hp" aria-label={`health ${hp} of ${maxHp}`}>
        {Array.from({ length: maxHp }, (_, i) => (
          <span key={i} className={i < hp ? 'hud-hp-pip' : 'hud-hp-pip lost'} />
        ))}
      </div>
      {dead && (
        <div className="hud-death">
          <h2>EELED.</h2>
          <p>The road takes its toll. Back in a tick…</p>
        </div>
      )}
      {!CLASSIC_CONTROLS && !locked && !dead && (
        <div className="hud-lock-prompt">click to take control</div>
      )}
      <div className="hud-controls">
        {CLASSIC_CONTROLS ? (
          <>
            <div>
              <kbd>W</kbd>
              <kbd>A</kbd>
              <kbd>S</kbd>
              <kbd>D</kbd> / arrows — move &nbsp;·&nbsp; <kbd>Shift</kbd> — sprint &nbsp;·&nbsp;{' '}
              <kbd>Space</kbd> — jump &nbsp;·&nbsp; <kbd>F</kbd> — swipe
            </div>
            <div>drag mouse — orbit camera &nbsp;·&nbsp; scroll — zoom</div>
          </>
        ) : (
          <>
            <div>
              mouse — steer &nbsp;·&nbsp; click — swipe &nbsp;·&nbsp; <kbd>W</kbd>
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
