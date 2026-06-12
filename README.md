# TMBGamev2 — The Mighty Boosh RPG

A personal, single-player 3D action-RPG themed around _The Mighty Boosh_.
See `claude.md` for the full brief, tech stack, and build roadmap.

## Status

**Step 3 — One realm**: a doorway in the greybox range now leads to THE
TUNDRA — a glacier-walled run with sliding ice, crosswind gusts, Frost
Bailiff skirmishes, a three-wave arena behind an ice gate, and a boss: the
Black Frost, a velvet-voiced cold front who can only be hurt while brazier
embers have broken his composure. Clear it for the way home; die and the
Tundra keeps your deposit. All audio is synthesized Web Audio and all art is
original primitives — no third-party assets yet.

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
