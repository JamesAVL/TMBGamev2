# Mighty Boosh RPG — Game Brief & Build Plan

## What this is
A personal, single-player 3D action-RPG themed around *The Mighty Boosh*. Built for the author's own use, not for distribution. The aim is a deep, character-driven experience with satisfying upgrade mechanics — explicitly **not** an idle/incremental clicker. Desktop web first; treat mobile as a lower-fidelity tier.

---

## Creative direction
The game is themed around the world, tone and characters of *The Mighty Boosh*: surreal, absurdist, adult British alt-comedy.

**You (Claude Code) have broad creative latitude.** Invent the specific realms, encounters, enemies, upgrades, quests, character roles and dialogue yourself, in the spirit of the show. Propose ideas and build them — they'll be reviewed and refined each increment. Lean into the surreal; the weirder and more characterful, the better.

Guardrails (these shape *how*, not *whether*):
- Write **original dialogue** in the characters' voices. Do not reproduce actual episode scripts, and do not reproduce the show's songs or "crimps" word-for-word.
- Create **visual assets** (models, textures, art) that evoke the show's handmade, lo-fi, collage aesthetic — papier-mâché, felt, deliberately artificial sets.
- Keep the tone adult and surreal, true to the source.

---

## Game structure — hub-and-realms action-RPG
- A **hub** the player returns to between runs (a shop / base) where characters live, give quests, and react to progress.
- **Realms**: varied, self-contained surreal levels reached from the hub. Each has its own mechanics, enemies, and a memorable character-boss.
- A **run** = entering a realm, fighting through it, getting stronger, and either clearing it or dying.

---

## Progression system
Depth comes from upgrades being *choices* and from several systems interlocking — never just "bigger number."

1. **Upgrades are choices, not multipliers.** Branching skills that define a playstyle; the fun is in builds and synergies.
2. **Systems interlock.** Combat skills, gear/loot, crafting, character relationships and world unlocks each feed the others.
3. **Player skill matters.** Aiming, dodging and timing mean progress isn't only the numbers.

Two progression layers (no prestige/reset mechanic):
- **In-run:** gain XP, level up mid-realm, and choose one of three upgrades each level.
- **Meta (across runs):** earn a permanent currency, spend it on a meta skill-tree and unlocks, and deepen relationships with hub characters whose storylines advance as you return. The long-game hook is "what build can I pull off, and what happens next with these people" — not a reset.

### Curve maths (starting points to tune)
- Cost curve: `cost(n) = base * m^n`, with `m` around 1.07–1.15. Scale enemy difficulty and player power together so time-to-next-level stays roughly flat — constant flow, never a wall.
- Soft caps / diminishing returns: `effective = x / (x + k)` for stats like crit chance or dodge, so nothing runs away.
- Reward rhythm: guaranteed progress every level, plus occasional variable surprises (crits, rare drops).

---

## Build roadmap — mechanics-first, prove the feel at each step
Do not move to the next step until the current one feels good.

1. **Move** — a controllable character (`ecctrl`) that feels good to move around an empty greybox space. Camera and basic physics. Nothing else.
2. **Fight** — one attack, one enemy type, hit/damage/death with juicy feedback (hit flash, knockback, sound). The core loop's heartbeat must feel satisfying.
3. **One realm** — a single handcrafted level playable start to finish: a few rooms/waves of enemies, an objective, an exit.
4. **Upgrades** — in-run XP and level-ups with the choose-one-of-three picks; the beginnings of a skill tree.
5. **The hub** — the shop you return to, one character (a mentor / quest-giver), and permanent meta-upgrades, closing the run → hub → stronger-run loop.
6. **Breadth (level by level)** — now expand: new realms (each with its own mechanic and character-boss), more characters and relationships, companions, gear/loot, crafting, audio/music, UI polish. Build and refine one realm/system at a time.

Steps 1–5 build the engine. Step 6 onward is the iterative, level-by-level content phase — each addition reviewed and tuned before the next.

---

## Tech stack (fixed foundation)

| Layer | Choice |
|---|---|
| Language | TypeScript (strict) |
| Build / dev | Vite |
| Package manager | npm |
| UI framework | React 18+ |
| 3D renderer | React Three Fiber (R3F) |
| 3D engine | Three.js (prefer the WebGPU renderer, fall back to WebGL2) |

Core libraries (the pmndrs ecosystem, `github.com/pmndrs`):
- `@react-three/drei` — helpers, loaders, cameras, controls, shaders.
- `@react-three/rapier` — physics. Single-threaded Wasm by default, so no special hosting headers needed.
- `@react-three/postprocessing` — bloom, outline, colour grading (most of the visual "style").
- `ecctrl` — ready-made character controller; use it rather than hand-rolling one.
- `zustand` — state management. Keep game state here, not in React state.
- `miniplex` — optional lightweight ECS if entity-component depth helps.

Asset pipeline:
- glTF / GLB for all 3D models; compress with Draco (meshes), KTX2 / Basis (textures), meshopt.
- `gltfjsx` (pmndrs CLI) — convert a `.glb` into a typed R3F component. Standard model-import workflow.

Audio: Howler.js or Web Audio (drei `PositionalAudio` for spatial). `Tone.js` optional for procedural / musical set-pieces.

Dev tooling: `leva` (runtime tweaking), `r3f-perf` (perf HUD), ESLint, Prettier.

Persistence: IndexedDB / OPFS for single-player saves (no backend needed). Supabase or Firebase only if cloud saves are ever wanted.

Optional dynamic dialogue: NPC lines can be generated at runtime via the Anthropic Messages API for a reactive feel. Inside an Anthropic artifact the sandbox handles auth; in a real deployed build, never expose an API key in browser code — proxy through a small serverless function. Docs: https://docs.claude.com/en/api/overview

Deploy: any static host (Vercel preferred).

---

## Resources & licence rules
Bring in any public repo, library, model, texture, sound or font that fits — encouraged — subject to:

Hygiene: maintain `CREDITS.md` listing every third-party asset — name, author, licence, source URL.

Recommended asset wells: Kenney.nl (CC0), Quaternius (CC0), Poly Pizza, Poly Haven (CC0), ambientCG (CC0), Sketchfab (filter to CC0/CC-BY), Mixamo (free rigged characters + animations), OpenGameArt, Freesound, Pixabay, Google Fonts.

Anchor repos: `github.com/pmndrs` (R3F, drei, rapier, zustand, postprocessing, ecctrl, gltfjsx, miniplex); `github.com/mrdoob/three.js` (engine + examples); `github.com/KhronosGroup/glTF-Sample-Assets`.

---

## Conventions for Claude Code
1. Game state lives in `zustand`, not React state. Per-frame logic goes in `useFrame`, never in React re-renders.
2. One component per entity type; import models as `gltfjsx`-generated typed components.
3. TypeScript strict mode throughout.
4. Maintain `CREDITS.md` for every third-party asset and its licence.
5. Build in the order above — prove each step feels good before adding the next. Propose Boosh-themed content ideas for each increment and wait for review before expanding.
