import { useEffect } from 'react';
import { CLASSIC_CONTROLS } from '../debug/flags';
import { SKILLS } from '../game/progression/skills';
import { useCombatStore } from '../stores/combatStore';
import { usePlayerStore } from '../stores/playerStore';
import { useProfileStore } from '../stores/profileStore';
import { useRunStore } from '../stores/runStore';
import { useSceneStore } from '../stores/sceneStore';
import { usePointerLock } from './usePointerLock';

function relockPointer() {
  if (CLASSIC_CONTROLS) return;
  const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas canvas');
  canvas?.requestPointerLock();
}

function XpBar() {
  const xp = useRunStore((s) => s.xp);
  const xpToNext = useRunStore((s) => s.xpToNext);
  const level = useRunStore((s) => s.level);
  const unspent = useRunStore((s) => s.unspentPoints);
  return (
    <div className="hud-xp">
      <span className="hud-xp-level">{level + 1}</span>
      <div className="hud-xp-track">
        <div className="hud-xp-fill" style={{ width: `${(xp / xpToNext) * 100}%` }} />
      </div>
      {unspent > 0 && (
        <span className="hud-xp-points">
          +{unspent} — <kbd>T</kbd>
        </span>
      )}
    </div>
  );
}

function SkillsPanel() {
  const open = useRunStore((s) => s.panelOpen);
  const points = useRunStore((s) => s.points);
  const unspent = useRunStore((s) => s.unspentPoints);

  // Free the mouse while the panel is up
  useEffect(() => {
    if (open) document.exitPointerLock();
  }, [open]);

  if (!open) return null;

  const close = () => {
    useRunStore.getState().setPanelOpen(false);
    relockPointer();
  };

  return (
    <div className="hud-skills">
      <h3>SKILLS</h3>
      <p>
        {unspent > 0
          ? `${unspent} point${unspent > 1 ? 's' : ''} to spend — the run remembers`
          : 'no points to spend — go and earn some'}
      </p>
      <div className="hud-skills-list">
        {SKILLS.map((def) => {
          const n = points[def.id] ?? 0;
          const maxed = n >= def.maxPoints;
          const canSpend = unspent > 0 && !maxed;
          return (
            <div key={def.id} className="hud-skill-row">
              <div className="hud-skill-info">
                <span className="hud-skill-name">{def.name}</span>
                <span className="hud-skill-blurb">{def.blurb}</span>
                <span className="hud-skill-value">
                  {def.valueLabel(n)}
                  {!maxed && <span className="hud-skill-next"> → {def.valueLabel(n + 1)}</span>}
                </span>
              </div>
              <div className="hud-skill-pips">
                {Array.from({ length: def.maxPoints }, (_, i) => (
                  <span key={i} className={i < n ? 'hud-skill-pip filled' : 'hud-skill-pip'} />
                ))}
              </div>
              <button
                className="hud-skill-spend"
                disabled={!canSpend}
                onClick={() => useRunStore.getState().spendPoint(def.id)}
              >
                +
              </button>
            </div>
          );
        })}
      </div>
      <button className="hud-skills-close" onClick={close}>
        done — back to it (T)
      </button>
    </div>
  );
}

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
  const character = useProfileStore((s) => s.character);

  // T toggles the skills panel (keydown counts as a user activation, so the
  // close path can re-capture the pointer).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyT' || e.repeat) return;
      const run = useRunStore.getState();
      const opening = !run.panelOpen;
      run.setPanelOpen(opening);
      if (opening) document.exitPointerLock();
      else relockPointer();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

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
          {' · '}playing {character === 'vince' ? 'VINCE' : 'HOWARD'}
        </p>
      </div>
      {objective && <div className="hud-objective">{objective}</div>}
      <BossBar />
      <XpBar />
      <SkillsPanel />
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
          <h2>{scene === 'tundra' ? 'FROZEN OUT.' : 'SAVAGED.'}</h2>
          <p>
            {scene === 'tundra'
              ? 'An offering to the Frost. Home you go…'
              : 'The pack takes your buttons. Back in a tick…'}
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
              <kbd>Space</kbd> — jump &nbsp;·&nbsp; <kbd>F</kbd> —{' '}
              {character === 'vince' ? 'spray' : 'throw'}
            </div>
            <div>
              drag mouse — orbit camera &nbsp;·&nbsp; scroll — zoom &nbsp;·&nbsp; <kbd>T</kbd> —
              skills
            </div>
          </>
        ) : (
          <>
            <div>
              mouse — steer &nbsp;·&nbsp; click — {character === 'vince' ? 'spray' : 'throw'}{' '}
              &nbsp;·&nbsp; <kbd>W</kbd>
              <kbd>S</kbd> — forward/back &nbsp;·&nbsp; <kbd>A</kbd>
              <kbd>D</kbd> — strafe
            </div>
            <div>
              <kbd>Shift</kbd> — sprint &nbsp;·&nbsp; <kbd>Space</kbd> — jump &nbsp;·&nbsp;{' '}
              <kbd>T</kbd> — skills &nbsp;·&nbsp; <kbd>Esc</kbd> — release mouse
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
