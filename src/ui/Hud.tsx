export function Hud() {
  return (
    <div className="hud">
      <div className="hud-title">
        <h1>THE MIGHTY BOOSH RPG</h1>
        <p>
          Step 1 — Move (greybox). An unlicensed jaunt through the unswept corners of the cosmos.
        </p>
      </div>
      <div className="hud-controls">
        <div>
          <kbd>W</kbd>
          <kbd>A</kbd>
          <kbd>S</kbd>
          <kbd>D</kbd> / arrows — move &nbsp;·&nbsp; <kbd>Shift</kbd> — sprint &nbsp;·&nbsp;{' '}
          <kbd>Space</kbd> — jump
        </div>
        <div>drag mouse — orbit camera &nbsp;·&nbsp; scroll — zoom</div>
        {import.meta.env.DEV && (
          <div className="hud-debug-hint">append ?debug for tuning panels</div>
        )}
      </div>
    </div>
  );
}
