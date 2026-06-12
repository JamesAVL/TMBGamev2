import { CLASSIC_CONTROLS } from '../debug/flags';
import { useCombatStore } from '../stores/combatStore';
import { usePlayerStore } from '../stores/playerStore';
import { useSceneStore } from '../stores/sceneStore';
import { usePointerLock } from './usePointerLock';

function BossBar() {
  const boss = useCombatStore((s) => s.enemies['blackfrost']);
  if (!boss || !boss.aggro || !boss.alive) return null;
  return (
    <div className="hud-boss">
      <div className="hud-boss-name">
        THE BLACK FROST
        {boss.invulnerable && <span className="hud-boss-tag">composure intact</span>}
      </div>
      <div className="hud-boss-track">
        <div className="hud-boss-fill" style={{ width: `${(boss.hp / boss.maxHp) * 100}%` }} />
      </div>
    </div>
  );
}

export function Hud() {
  const locked = usePointerLock();
  const hp = usePlayerStore((s) => s.hp);
  const maxHp = usePlayerStore((s) => s.maxHp);
  const dead = usePlayerStore((s) => s.dead);
  const hitCount = usePlayerStore((s) => s.hitCount);
  const scene = useSceneStore((s) => s.scene);
  const objective = useSceneStore((s) => s.objective);
  const phase = useSceneStore((s) => s.tundra.phase);

  return (
    <div className="hud">
      {/* keyed by hitCount so the animation replays on every hit */}
      {hitCount > 0 && <div key={hitCount} className="hud-damage-flash" />}
      <div className="hud-title">
        <h1>THE MIGHTY BOOSH RPG</h1>
        <p>
          {scene === 'tundra'
            ? 'The Tundra. Bring a coat. Bring two.'
            : 'The range — a quiet place to hit things.'}
        </p>
      </div>
      {objective && <div className="hud-objective">{objective}</div>}
      <BossBar />
      <div className="hud-hp" aria-label={`health ${hp} of ${maxHp}`}>
        {Array.from({ length: maxHp }, (_, i) => (
          <span key={i} className={i < hp ? 'hud-hp-pip' : 'hud-hp-pip lost'} />
        ))}
      </div>
      {scene === 'tundra' && phase === 'cleared' && (
        <div className="hud-banner">THE EGG OF MANTUMBI IS YOURS</div>
      )}
      {dead && (
        <div className="hud-death">
          <h2>{scene === 'tundra' ? 'FROZEN OUT.' : 'EELED.'}</h2>
          <p>
            {scene === 'tundra'
              ? 'An offering to the Frost. Home you go…'
              : 'The road takes its toll. Back in a tick…'}
          </p>
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
