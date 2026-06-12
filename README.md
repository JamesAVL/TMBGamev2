# TMBGamev2 — The Mighty Boosh RPG

A personal, single-player 3D action-RPG themed around _The Mighty Boosh_.
See `claude.md` for the full brief, tech stack, and build roadmap.

## Status

**Step 1 — Move**: an `ecctrl` character controller in a greybox movement
playground. Walk, sprint, and jump around ramps, stairs, platforms, gaps,
a narrow beam, and camera-collision corridors to judge the movement feel.

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

WASD / arrows — move · Shift — sprint · Space — jump ·
drag mouse — orbit camera · scroll — zoom
