// Debug tooling (leva panels, physics wireframe, perf HUD) is gated behind a
// `?debug` URL flag so the normal game view stays clean, in dev and preview alike.
export const DEBUG = new URLSearchParams(window.location.search).has('debug');

// `?classic` restores the original control scheme (drag-to-orbit camera, character
// turns toward travel direction) for A/B feel comparison against mouse-steering.
export const CLASSIC_CONTROLS = new URLSearchParams(window.location.search).has('classic');
