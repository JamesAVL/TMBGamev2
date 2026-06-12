# TMBGamev2 — The Mighty Boosh RPG

A personal, single-player 3D action-RPG themed around _The Mighty Boosh_.
See `claude.md` for the full brief, tech stack, and build roadmap.

## Status

**The Duo update**: Vince and Howard adventure as a pair — press **Q** to
switch who's on (with a handover line); the other stays just off-screen,
keeping up a stream of quips, heckles when you're nearly dead, and reviews of
your kills. Boss fights lock the switch. **Vince** sprays a glitter cone
(skills: Extra Hold lingering mist, Wide Nozzle); **Howard** throws jazz
records (skills: Rare Pressing — gold, double damage, pierces; Strong Arm).
Level-ups bank skill points; press **T** to spend them across shared and
per-legend skills with soft-capped stacking. The greybox range is patrolled
by **Mod Wolves** — upright gents in navy suits, pocket squares, and wolf
heads. THE TUNDRA run: Parka People waves, the Black Frost (break his
composure with brazier embers — records work too), then claim the Egg of
Mantumbi. All audio is synthesized Web Audio and all art is original
primitives — no third-party assets yet. Lore reference: the Mighty Boosh
fandom wiki; all dialogue is original.

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
