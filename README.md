# TMBGamev2 — The Mighty Boosh RPG

A personal, single-player 3D action-RPG themed around _The Mighty Boosh_.
See `claude.md` for the full brief, tech stack, and build roadmap.

## Status

**Step 4+ — Skills, two legends, and the pack**: play as **Vince** (hairspray
cone of weaponised glamour) or **Howard** (thrown jazz records) — swap on the
dressing pads near spawn. Level-ups bank skill points; press **T** to spend
them across eight Boosh-flavoured skills (damage, attack speed, max hp, move
speed, reach, crit, jump, regen) with soft-capped stacking. The greybox range
is patrolled by **Mod Wolves** (the Hitcher is benched, destined for boss
billing). THE TUNDRA run: Parka People waves, the Black Frost (break his
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
