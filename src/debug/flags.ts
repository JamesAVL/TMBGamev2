// Debug tooling (leva panels, physics wireframe, perf HUD) is gated behind a
// `?debug` URL flag so the normal game view stays clean, in dev and preview alike.
export const DEBUG = new URLSearchParams(window.location.search).has('debug');
