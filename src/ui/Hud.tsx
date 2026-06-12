import { useCallback, useEffect, useRef, useState } from 'react';
import { CLASSIC_CONTROLS } from '../debug/flags';
import { sfx } from '../audio/sfx';
import {
  BOSS_LOCK_LINE,
  COMPOSURE_HINTS,
  KILL_QUIPS,
  LOW_HP_QUIPS,
  OFFSCREEN_QUIPS,
  SWITCH_LINES,
  TUNDRA_ENTRY_EXCHANGES,
} from '../game/dialogue/banter';
import { nabooLines } from '../game/dialogue/naboo';
import { SKILLS, type SkillOwner } from '../game/progression/skills';
import { TRINKETS } from '../game/progression/trinkets';
import { useHubStore } from '../stores/hubStore';
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

const pick = <T,>(arr: T[]): T | undefined => arr[Math.floor(Math.random() * arr.length)];

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

const SKILL_GROUPS: { owner: SkillOwner; title: string }[] = [
  { owner: 'shared', title: 'SHARED' },
  { owner: 'vince', title: 'VINCE — THE CAN' },
  { owner: 'howard', title: 'HOWARD — THE COLLECTION' },
];

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
        {SKILL_GROUPS.map((group) => (
          <div key={group.owner}>
            <div className="hud-skill-group">{group.title}</div>
            {SKILLS.filter((d) => d.owner === group.owner).map((def) => {
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
        ))}
      </div>
      <button className="hud-skills-close" onClick={close}>
        done — back to it (T)
      </button>
    </div>
  );
}

function NabooDialog() {
  const open = useHubStore((s) => s.dialogOpen);
  // remounts per open, so the line index starts fresh without effect-set-state
  return open ? <NabooDialogInner /> : null;
}

function NabooDialogInner() {
  const clears = useHubStore((s) => s.tundraClears);
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    document.exitPointerLock();
  }, []);

  const lines = nabooLines(clears);
  const line = lines[Math.min(lineIdx, lines.length - 1)]!;
  const last = lineIdx >= lines.length - 1;

  const close = () => {
    useHubStore.getState().setDialogOpen(false);
    relockPointer();
  };

  return (
    <div className="hud-dialog">
      <div className="hud-dialog-box">
        <div className="hud-dialog-name">NABOO</div>
        <p className="hud-dialog-line">{line}</p>
        <div className="hud-dialog-actions">
          {!last && (
            <button onClick={() => setLineIdx((i) => i + 1)}>
              … <kbd>E</kbd>
            </button>
          )}
          {last && (
            <>
              <button
                onClick={() => {
                  useHubStore.getState().setDialogOpen(false);
                  useHubStore.getState().setShopOpen(true);
                }}
              >
                browse the tat
              </button>
              <button onClick={close}>later</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TatShop() {
  const open = useHubStore((s) => s.shopOpen);
  const shrapnel = useHubStore((s) => s.shrapnel);
  const trinkets = useHubStore((s) => s.trinkets);

  useEffect(() => {
    if (open) document.exitPointerLock();
  }, [open]);

  if (!open) return null;

  const close = () => {
    useHubStore.getState().setShopOpen(false);
    relockPointer();
  };

  return (
    <div className="hud-skills">
      <h3>THE TAT</h3>
      <p>{shrapnel} shrapnel — Naboo watches you browse</p>
      <div className="hud-skills-list">
        {TRINKETS.map((def) => {
          const owned = Boolean(trinkets[def.id]);
          const affordable = shrapnel >= def.price;
          return (
            <div key={def.id} className="hud-skill-row">
              <div className="hud-skill-info">
                <span className="hud-skill-name">{def.name}</span>
                <span className="hud-skill-blurb">{def.blurb}</span>
                <span className="hud-skill-value">{def.effect}</span>
              </div>
              {owned ? (
                <span className="hud-trinket-owned">owned</span>
              ) : (
                <button
                  className="hud-trinket-buy"
                  disabled={!affordable}
                  onClick={() => useHubStore.getState().buyTrinket(def.id)}
                >
                  {def.price}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <button className="hud-skills-close" onClick={close}>
        done — back to it
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
  const nearNaboo = useHubStore((s) => s.nearNaboo);
  const shrapnel = useHubStore((s) => s.shrapnel);

  const [bubble, setBubble] = useState<{ id: number; text: string } | null>(null);
  const bubbleSeq = useRef(0);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showBubble = useCallback((text: string, holdMs = 2600) => {
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    setBubble({ id: bubbleSeq.current++, text });
    bubbleTimer.current = setTimeout(() => setBubble(null), holdMs);
  }, []);

  // T toggles the skills panel; Q swaps legends (keydown is a user
  // activation, so both paths may re-capture the pointer).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'KeyT') {
        if (usePlayerStore.getState().dead) return; // no spending from beyond
        const hubT = useHubStore.getState();
        if (hubT.dialogOpen || hubT.shopOpen) return; // Naboo is talking
        const run = useRunStore.getState();
        const opening = !run.panelOpen;
        run.setPanelOpen(opening);
        if (opening) document.exitPointerLock();
        else relockPointer();
        return;
      }
      if (e.code === 'KeyE') {
        const hub = useHubStore.getState();
        if (hub.shopOpen) return; // buttons handle the shop
        if (hub.dialogOpen) return; // dialog advances via its button
        if (hub.nearNaboo && useSceneStore.getState().scene === 'hub') {
          hub.setDialogOpen(true);
          document.exitPointerLock();
        }
        return;
      }
      if (e.code === 'KeyQ') {
        const run = useRunStore.getState();
        const hubQ = useHubStore.getState();
        if (run.panelOpen || hubQ.dialogOpen || hubQ.shopOpen) return;
        if (usePlayerStore.getState().dead) return;
        const boss = useCombatStore.getState().enemies['blackfrost'];
        if (boss?.alive && boss.aggro) {
          showBubble(BOSS_LOCK_LINE);
          return;
        }
        // The other legend is just off-screen — the swap happens in place.
        useProfileStore.getState().switchCharacter();
        sfx.spend();
        const incoming = useProfileStore.getState().character;
        const line = pick(SWITCH_LINES[incoming]);
        if (line) showBubble(line);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showBubble]);

  // The absent legend keeps up a presence: ambient quips on a loose timer…
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.45) return;
      if (useRunStore.getState().panelOpen || usePlayerStore.getState().dead) return;
      const absent = useProfileStore.getState().character === 'vince' ? 'howard' : 'vince';
      const line = pick(OFFSCREEN_QUIPS[absent]);
      if (line) showBubble(line);
    }, 28000);
    return () => clearInterval(interval);
  }, [showBubble]);

  // …a heckle when you're nearly done (once per scrape)…
  useEffect(() => {
    return usePlayerStore.subscribe((s, prev) => {
      if (s.dead || s.hp > 2 || prev.hp <= 2) return;
      const absent = useProfileStore.getState().character === 'vince' ? 'howard' : 'vince';
      const line = pick(LOW_HP_QUIPS[absent]);
      if (line) showBubble(line);
    });
  }, [showBubble]);

  // …and the odd review of your kills.
  useEffect(() => {
    let lastQuipAt = 0;
    return useRunStore.subscribe((s, prev) => {
      const gained = s.level > prev.level || s.xp > prev.xp;
      if (!gained) return;
      if (Date.now() - lastQuipAt < 20000 || Math.random() > 0.18) return;
      lastQuipAt = Date.now();
      const absent = useProfileStore.getState().character === 'vince' ? 'howard' : 'vince';
      const line = pick(KILL_QUIPS[absent]);
      if (line) showBubble(line);
    });
  }, [showBubble]);

  // Level-up is unambiguous: a point banked, and where to spend it.
  useEffect(() => {
    return useRunStore.subscribe((s, prev) => {
      if (s.level > prev.level) showBubble('+1 skill point — press T to spend it', 2400);
    });
  }, [showBubble]);

  // Hits clinking off the boss's composure → the absent legend explains.
  useEffect(() => {
    let lastHintAt = 0;
    return useCombatStore.subscribe((s, prev) => {
      if (s.lastImmuneHitAt === prev.lastImmuneHitAt) return;
      if (Date.now() - lastHintAt < 20000) return;
      lastHintAt = Date.now();
      const absent = useProfileStore.getState().character === 'vince' ? 'howard' : 'vince';
      showBubble(COMPOSURE_HINTS[absent], 3400);
    });
  }, [showBubble]);

  // Realm-entry exchange: one line, then the reply
  useEffect(() => {
    if (scene !== 'tundra') return;
    const exchange = pick(TUNDRA_ENTRY_EXCHANGES);
    if (!exchange) return;
    showBubble(exchange[0], 2300);
    const t = setTimeout(() => showBubble(exchange[1]), 2500);
    return () => clearTimeout(t);
  }, [scene, showBubble]);

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
      {bubble && (
        <div key={bubble.id} className="hud-bubble">
          {bubble.text}
        </div>
      )}
      <div className="hud-shrapnel">{shrapnel} shrapnel</div>
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
      {nearNaboo && scene === 'hub' && (
        <div className="hud-talk-prompt">
          <kbd>E</kbd> — talk to Naboo
        </div>
      )}
      <NabooDialog />
      <TatShop />
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
              drag mouse — orbit camera &nbsp;·&nbsp; scroll — zoom &nbsp;·&nbsp; <kbd>Q</kbd> —
              switch &nbsp;·&nbsp; <kbd>T</kbd> — skills
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
              <kbd>Q</kbd> — switch legend &nbsp;·&nbsp; <kbd>T</kbd> — skills &nbsp;·&nbsp;{' '}
              <kbd>Esc</kbd> — release mouse
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
