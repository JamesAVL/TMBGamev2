# TMBGamev2 — The Mighty Boosh RPG

A personal, single-player 3D action-RPG themed around _The Mighty Boosh_.
See `claude.md` for the full brief, tech stack, and build roadmap.

## Status

**Step 2 — Fight**: the greybox movement playground now has its first enemy —
the Hitcher, a green cockney toll-collector with a glowing polo-mint eye.
Swipe him with a click; he winds up, lunges, and knocks you about. Hit flash,
knockback, hit-stop, synthesized sound, death and respawn included. All audio
is synthesized Web Audio and all art is original primitives — no third-party
assets yet.

## Prerequisites

- Node.js >= 22.12
- npm

## Scripts

| Command                | What it does                 |
| ---------------------- | ---------------------------- |
| `npm run dev`          | Vite dev server              |
| `npm run build`        | Typecheck + production build |
| `npm run preview`      | Serve the production build   |
| `npm run typecheck`    | TypeScript project check     |
| `npm run lint`         | ESLint                       |
| `npm run format`       | Prettier write               |
| `npm run format:check` | Prettier check               |

## Debug / tuning

Append `?debug` to the URL to get the leva tuning panels (ecctrl movement
parameters, physics wireframe toggle) and the r3f-perf HUD.

## Controls

Click the game to capture the mouse, then:

mouse — steer · click — swipe (F also works) · W/S — forward/back ·
A/D — strafe · Shift — sprint · Space — jump · scroll — zoom ·
Esc — release mouse

Append `?classic` to the URL for the original scheme (drag-to-orbit camera,
character turns toward travel direction) to A/B the two feels.
