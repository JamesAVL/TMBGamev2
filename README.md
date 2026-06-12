# TMBGamev2 — The Mighty Boosh RPG

A personal, single-player 3D action-RPG themed around _The Mighty Boosh_.
See `claude.md` for the full brief, tech stack, and build roadmap.

## Status

**Step 5 — THE NABOOTIQUE**: the game now starts in the shop. Naboo holds
the counter (right-click to talk — his storyline advances as you clear
realms) and sells permanent trinkets for **euros** (+1 per kill, +25 per
Egg): the Lucky Polo, Tin of Polos, the Velvet Glove, and the Mirror Ball
(once per realm, survive a killing blow). **Right-click** (or E) to talk.
Doors lead to THE TUNDRA and the training range. Euros, trinkets, skills
and story progress all persist.

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

Toggle "debug tools" in the pause menu (P) for the leva tuning panels,
physics wireframes, and the r3f-perf HUD. (`?debug` still works as a
first-load initialiser.)

## Controls

Click the game to capture the mouse, then:

mouse — steer · click — spray/throw (F also works) · W/S — forward/back ·
A/D — strafe · Shift — sprint · Space — jump · scroll — zoom ·
Q — switch legend · T — skills · P — menu · right-click — talk ·
Esc — release mouse

The pause menu (P or the gear button) holds volume, the movement-scheme
switch (mouse-steered vs keyboard + drag camera), performance mode, debug
tools, and new game. A title screen fronts the whole thing.

Append `?classic` to the URL for the original scheme (drag-to-orbit camera,
character turns toward travel direction) to A/B the two feels.
