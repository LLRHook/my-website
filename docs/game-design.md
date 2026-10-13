# Codelings: the Projects page game

The Projects page hosts a playable 8-bit monster-collecting RPG in the style of
late-1990s handheld games. Every public repository listed on the page is one
Codeling species. Catching a Codeling registers it in the Codex, which shows the
repository card and opens it on GitHub. The HTML table stays below the game as the
crawlable, no-JavaScript, screen-reader version of the same data.

All art, music, names, story and text are original. Never copy names, sprites,
maps, music or text from any Nintendo / Game Freak / The Pokémon Company product.
"Codeling", "Fork Ball", "Codex" and the rest are this game's own vocabulary.

## 1. Platform and delivery

- Source: `game/src/**/*.ts`, strictly type-checked with `game/tsconfig.json`
  before esbuild bundles and minifies it into one ESM file, `public/game/main.js`.
  The bundle targets ES2022 and Safari 15, without source maps or legal comments.
  Import specifiers retain `.js` extensions in the TypeScript source.
- `public/game/` is generated and gitignored. `game/build.mjs` removes stale output
  before bundling and logs the output size in bytes. `package.json`: `build:game`
  (`tsc -p game/tsconfig.json --noEmit && node game/build.mjs`), `build` runs
  `build:game` then `next build`, `dev:game` uses esbuild context watch mode and
  logs each rebuild's size.
- `next.config.js` adds a content-derived, 10-hex-character SHA-256 `?v=` query
  to the game script URL at config load (a missing file uses the plain URL) and
  inlines the stylesheet in every page. Production serves the script with
  `public, max-age=31536000, immutable`; images, icons and the resume PDF use
  `public, max-age=86400, stale-while-revalidate=604800`.
- Only `/projects` loads JavaScript: `<script type="module" src="/game/main.js?v=<hash>">`
  at the end of `<body>`. `next.config.js` adds a header rule for `/projects`,
  after the catch-all, overriding the CSP with `script-src 'self'` (everything
  else identical). Every other route allows only the speculation rules JSON
  (`script-src <origin>/speculation-rules`) and has zero `<script>` tags.
- `page()` in `app/lib/html.ts` gains an optional `scripts?: string[]` (module
  script URLs, rendered just before `</body>`). Only the Projects route passes it.
- Repository data reaches the game through one attribute, escaped with `esc()`:
  `<div id="game" class="handheld" data-repos="…JSON…">`. Payload shape:

  ```ts
  interface GameRepo {
    id: number; name: string; title: string; description: string;
    language: string | null; stars: number; pushedAt: string;
    url: string; homepage: string | null;
  }
  ```

  It is built from the same filtered, presented, sorted list as the table.
  `homepage` is kept only when it is HTTP(S). Empty list: the game still runs
  with a fallback species set (§5.1) and the Codex says the list did not load.
- The game root exposes `data-scene` (`loading | title | intro | overworld |
  battle | menu | codex | ending`) and `data-ready` once booted. These are the
  E2E hooks; there are no JS globals.
- No JavaScript: the handheld shows a static "Press START requires JavaScript;
  every project is in the table below" screen (CSS hides it once
  `data-ready` is set).

## 2. Presentation

- Internal resolution 160x144, 8x8 tiles composed into 16x16 metatiles; the
  overworld view is 10x9 metatiles. Rendering goes to an offscreen 160x144
  canvas, then is drawn to the visible canvas at the largest integer scale that
  fits (CSS `image-rendering: pixelated`). Tiles, sprites and font glyphs are
  rasterized once into atlas canvases at boot.
- Palette: one master palette of 32 colours defined in `gfx/palette.ts`, chosen
  to sit next to the site (navy `#000080`, maroon `#800000`, silver `#c0c0c0`,
  yellow `#ffff00` among them, plus greens, browns, skin tones, water blues).
  Each 8x8 tile and each sprite uses at most 4 colours (one may be transparent),
  in the manner of colour handhelds of the era.
- Handheld bezel: pure CSS in `public/retro.css`, an original design (silver
  shell, navy screen surround, "VI-BOY" wordmark, maroon A/B, black D-pad,
  START/SELECT pills). The control buttons are real `<button>`s with
  `aria-label`s, driven by pointer events, sized for thumbs, shown on every
  device. Keyboard legend under the device; coarse touch pointers get a touch hint.
- PLAY FULLSCREEN pins the silver shell to the viewport, locks page scrolling,
  and uses the Fullscreen API where available. The CSS overlay also works on
  iPhone Safari. EXIT, Esc and browser fullscreen exit restore the page.
  Safe-area padding protects the controls. Resize, orientation and visual viewport
  changes select the largest integer screen scale that fits the screen and controls.
  Portrait places controls below the screen; landscape places the D-pad left,
  A/B right and START/SELECT beneath the screen.
- Fixed 60 Hz simulation with an accumulator on `requestAnimationFrame`; pauses
  when the tab is hidden or less than 25% of the device is visible outside fullscreen.
  Music mutes during the pause. `prefers-reduced-motion`: no screen shake, no flashes,
  instant battle transition.
- `aria-label` on the canvas describes the game and points to the table.

## 3. Input

Keyboard, gamepad (standard mapping) and the on-screen buttons all feed one `Input` with `isDown`,
`pressed` (edge) and key repeat for menus.

| Action | Keys | Gamepad |
|---|---|---|
| Move | Arrows, WASD | D-pad, left stick |
| A | Z, Space | A (0) |
| B (hold to run) | X, Backspace, Shift | B (1) |
| START | Enter | Start (9) |
| SELECT | Tab | Back (8) |

Keys are captured (default prevented) only while the game has focus: clicking
or tapping the device focuses it; Esc or clicking outside releases it, so page
scrolling still works outside fullscreen.

The D-pad captures a pointer across the whole zone. A thumb beyond a dead zone
of 18% of the zone width selects the dominant axis; sliding changes direction
without lifting. A/B and START/SELECT capture independent pointers, so holding B
while steering runs. Controls and screen prevent touch scrolling, zoom and callouts.
Audio resumes on pointerdown, pointerup and touchend. HAPTICS defaults to ON,
including existing saves without the field, and can be toggled in Options on any
device. Supported browsers vibrate for 8ms on each on-screen press.

## 4. Engine modules (`game/src/`)

```
main.ts                 boot: read payload, build species, atlases, input, audio, scene stack, loop
engine/loop.ts          fixed-step loop, visibility pause
engine/input.ts         Input (keyboard, gamepad, touch buttons, focus capture)
engine/screen.ts        Screen: offscreen canvas, blit(atlas, sx, sy, w, h, dx, dy, flip), fill, fade/flash
engine/scenes.ts        Scene interface { update(dt), draw(screen), enter?(), exit?() }, SceneStack push/pop/replace
engine/rng.ts           seeded RNG (mulberry32) + hashString
engine/storage.ts       save/load/clear, versioned (§8)
engine/audio.ts         WebAudio chip synth: 2 pulse (duty 12.5/25/50%), triangle, noise; master/music/sfx gains
engine/sequencer.ts     plays tracks written in a small MML (§9)
gfx/palette.ts          master palette
gfx/pixels.ts           parse string pixel art (char -> palette index) to canvas; mirror helpers
gfx/font.ts             8x8 bitmap font (ASCII 32-126 + ▶ ▼ ♂ ♀ é ★ …), text measuring, drawText
gfx/tiles.ts            8x8 tile art + 16x16 metatile definitions, animated tile frames
gfx/sprites.ts          16x16 characters, 4 directions x 3 walk frames
gfx/creatures.ts        procedural Codeling sprites (§5.3)
gfx/ui.ts               window frames, HP/EXP bars, type badges, Fork Ball icons
ui/textbox.ts           typewriter text box: word wrap, 2 lines of 18 chars, ▼ prompt, speed option
ui/menu.ts              generic vertical/grid menu with ▶ cursor, scrolling lists
ui/yesno.ts, ui/nameEntry.ts, ui/title.ts, ui/startMenu.ts, ui/party.ts,
ui/summary.ts, ui/bag.ts, ui/codex.ts, ui/trainerCard.ts, ui/options.ts, ui/pcBox.ts, ui/mart.ts
world/map.ts            GameMap types, loader, collision, warps
world/maps/*.ts         one file per map (§6)
world/overworld.ts      overworld scene: camera, grid movement, NPC update, interactions, encounters
world/npc.ts            NPC movement (static/look/wander), trainer sight lines
world/script.ts         event script interpreter (§7)
battle/types.ts         TypeId, type chart
battle/moves.ts         move data
battle/stats.ts         stat, EXP and level formulas
battle/damage.ts        damage, accuracy, crits, status
battle/catch.ts         catch formula
battle/ai.ts            opponent move choice
battle/battle.ts        pure battle state machine (no drawing) emitting events
battle/battleScene.ts   draws the battle and animates battle.ts events
data/species.ts         GameRepo[] -> Species[] (§5)
data/items.ts, data/trainers.ts, data/text.ts (all dialogue)
```

Logic modules (`rng`, `stats`, `damage`, `catch`, `types`, `battle`, `species`,
`storage` serialization, `script`, map validation, text wrap, MML parser) are
pure and unit-tested with Vitest under `game/src/**/*.test.ts` (add the glob to
`vitest.config.ts`).

### 4.1 Shared ids (`data/ids.ts`)

```ts
type Dir = "up" | "down" | "left" | "right";
type MapId = "bedroom" | "house" | "sterling" | "lab" | "route1" | "commit"
  | "center" | "mart" | "gym" | "route2" | "cave";
type ItemId = "forkBall" | "greatFork" | "patch" | "hotfix" | "fullRebuild" | "rollback" | "linter";
type MoveId = string;   // kebab-case, e.g. "goroutine-rush"
type Status = "blocked" | "deprecated" | "frozen";
interface Options { textSpeed: "slow" | "mid" | "fast"; music: number; sfx: number; anims: boolean }
```

Option defaults: `mid`, music 6, SFX 7, animations on. Before a save exists
options live in `localStorage["codelings.options.v1"]`; once saved, the save's
copy is authoritative and both are written.

## 5. Codelings

### 5.1 Species from repositories

`buildSpecies(repos: GameRepo[]): Species[]`, deterministic per repository
(seed `hashString(repo.name)`), so a Codeling looks and plays the same on every
visit and the save stays valid.

```ts
type TypeId = "python" | "javascript" | "typescript" | "go" | "swift"
  | "shell" | "dart" | "csharp" | "java" | "normal";
interface Stats { hp: number; atk: number; def: number; spd: number; spc: number }
interface Species {
  id: number;            // repo id
  dex: number;           // 1-based Codex number, ordered by repo creation proxy: oldest pushedAt first
  name: string;          // display name, upper case, max 10 chars (truncate smartly at word/camel boundaries)
  repo: GameRepo;
  type: TypeId;          // from language; unknown/null -> "normal"
  base: Stats;           // 45..110 each, total 300..480; stars and recency raise the total
  catchRate: number;     // 45..255, more stars -> rarer
  expYield: number;
  learnset: { level: number; move: MoveId }[];  // 4 at level 1-ish, then every 5-8 levels
  habitat: MapId[];      // where it can appear wild (§6)
  rarity: number;        // encounter weight; recent pushes common, old repos rare
  sprite: { seed: number; body: BodyPlan };
}
```

If the payload is empty, `FALLBACK_REPOS` (three placeholder species named
after the site itself, pointing at the GitHub profile) keep the game playable.

### 5.2 Types

Language types plus Normal. Chart (`2` super effective, `0.5` not very, `1`
otherwise; immunities none):

- TypeScript > JavaScript (types catch bugs), JavaScript > Python, Python > Shell,
  Shell > Go, Go > Java, Java > C#, C# > Swift, Swift > Dart, Dart > TypeScript.
  Each pair is also `0.5` in reverse.
- Every type resists itself (`0.5`). Normal is neutral to and from all.

### 5.3 Procedural sprites

`drawCreature(seed, body, type, facing: "front" | "back"): HTMLCanvasElement`,
32x32 (front, opponent side) and 32x32 back view (player side, no face).

- One body plan per type (`BodyPlan` = a 16x32 half-mask of cells: always body,
  maybe body, always empty, eye anchor), mirrored for symmetry, randomised by the
  seed. Plans are distinct silhouettes: e.g. Python serpentine, Go round gopher-
  like burrower (original, not the Go mascot), Shell armoured crab, Swift bird,
  Dart dart-shaped fish, TypeScript blocky golem, JavaScript flame sprite,
  C# crystal, Java steam-kettle beast, Normal blob.
- Passes: mask -> body fill (type's 3-colour ramp) -> lighting (top-left
  highlight, bottom-right shade) -> 1px dark outline -> eyes (2 styles x seed)
  and a type-specific accent (spots, stripes, horns). At most 4 colours.
- Same seed always gives the same sprite. Back view uses the same silhouette.

### 5.4 Moves

Each type has 6 moves (2 weak, 2 mid, 1 strong, 1 status) and Normal has 8
shared moves. Names are themed on the language's culture (e.g. Go:
"Goroutine Rush", "Channel Block"; Shell: "Pipe Slam", "Grep Glare"; TypeScript:
"Type Guard", "Strict Mode"). `Move = { id, name (<=12 chars), type, power,
accuracy, pp, category: "physical" | "special" | "status", effect? }`, effects:
stat stages (+/-1, +/-2 on atk/def/spd/spc/accuracy), status chance, heal
fraction, drain, priority +1, multi-hit 2-5, recoil.

Status conditions: `BLOCKED` (25% chance to lose the turn, speed halved),
`DEPRECATED` (1/8 max HP damage per turn), `FROZEN` (cannot act, 1-3 turns),
`CONFUSED` volatile (2-5 turns, 1/3 self-hit).

### 5.5 Formulas

- Stats: `floor(((2*base + iv) * L) / 100) + 5`, HP `floor(((2*base + iv) * L) / 100) + L + 10`, IVs 0-31 seeded per caught individual.
- EXP: medium-fast curve `L^3`. Gain `floor(expYield * L_foe / 7)`, x1.5 vs trainers, split among participants.
- Damage: `floor(floor(floor(2*L/5+2) * power * A/D) / 50) + 2`, then STAB 1.5, type
  multiplier, crit (1/16, x1.5, ignores stat stages), random 85-100%.
- Stat stages -6..+6 with the classic 2/(2+n) multipliers.
- Catch: `a = ((3*maxHp - 2*hp) * catchRate * ball * status) / (3*maxHp)`, status bonus
  2 for FROZEN, 1.5 for BLOCKED/DEPRECATED; shake checks as in the era (4 checks,
  `b = 1048560 / sqrt(sqrt(16711680 / a))`), each shake animated.
- Run from wild: speed-based odds, increasing each attempt. Cannot run from trainers.

### 5.6 Evolution (FEAT-1790991962)

Every repository species is a line of forms. The Codex keeps one entry per
repository; forms are stages of that entry.

- Stage count: species ranked by stars (desc, ties by newer `pushedAt`); the top
  third (rounded up, at least 1 when 3+ species exist) have 3 stages, all others
  2. Fallback species have 2.
- Evolution levels: 3-stage lines evolve at `16 + seed % 5` and `32 + seed % 5`;
  2-stage lines at `18 + seed % 5`.
- `formOf(species, stage): Form` (pure, `data/species.ts`), with
  `Form = { stage: 1 | 2 | 3; name: string; base: Stats; expYield: number;
  catchRate: number }`. Stage 1 returns the species' own values.
  - Name: stage suffix chosen by seed from `["ON", "IX", "ARA", "EL", "OS", "UM"]`
    (stage 2) and `["ULON", "AREX", "ITAN", "OTH", "ARCH", "ORIS"]` (stage 3),
    appended to the stage 1 name truncated so the total is at most 10 chars. On a
    collision with any other form name, or when the result contains a blocked
    substring that the stage 1 name does not (`CUM`, `ASS`, `TIT`, `FAG`,
    `SEX`, `NIG`, `FUK`, `FUC`, `COC`, `CUN`, `KKK`, `NAZ`, `RAPE`, `PORN`,
    `SLUT`, `WANK`, `HOE`, `POO`, `PEE`, `DIK`), try the next suffix
    (wrapping); names stay unique across every form of every species.
  - Stats: stage 2 total `min(540, round(total * 1.22))`, stage 3
    `min(600, round(total * 1.42))`, distributed in proportion to the stage 1
    stats (largest remainders), each at most 150.
  - `expYield` x1.3 / x1.6; `catchRate` `max(30, floor(rate * 0.6))` /
    `max(15, floor(rate * 0.35))`.
- `stageAt(species, level)`: the highest stage whose level is <= `level`. Wild
  and trainer Codelings use `stageAt` for their level.
- Sprites: `drawCreature(seed, body, type, facing, stage = 1)`. Stage 1 is
  pixel-identical to the pre-evolution sprite. Identity carries through ramp,
  eye style, mouth, markings and every earlier feature. The silhouette changes
  visibly: stage 2 switches to the next sub-silhouette variant of the type
  (`(seed + 1) % 3`) with stage-2 proportions (taller or wider within the
  frame) and adds a second seeded feature; stage 3 keeps the stage 2
  silhouette, doubles feature size (longer horns, bigger fins), adds a third
  feature and plating/crest markings. Silhouettes scale uniformly, keep a 1px
  margin left/right/top and never flatten into a slab. Consecutive stages must
  differ at a glance: at least 25% of the union of their opaque pixels differs.
  At most 4 colours; back view cropped as today; cache key includes the stage.
- Moves: on evolving, the form queues the type's strong move (the type's power
  slot used today for "strong") if not known, through the normal learn flow.
- Trigger: after a battle that ends in a win or a catch, each party member that
  levelled up in that battle and has `level >= next evolution level` evolves, in
  party order. Losing or running never triggers. Scene `ui/evolution.ts`: text
  "What? {MON} is evolving!", the sprite alternates between the old and new form
  as white silhouettes at an accelerating rate for about 4s with the new
  `evolve` track; B cancels ("{MON} stopped evolving.") and the check repeats
  after the next battle in which it levels up. Success: cry, flash, "{MON}
  evolved into {NEW}!", then any queued move learn. Animations off or reduced
  motion: a single fade between forms.
- Codeling gains `stage: 1 | 2 | 3` (save: optional, missing => 1, so old saves
  stay valid). Party, summary, PC box, battle HUD and sprites use the form name,
  stats and sprite. Stats use `formOf(...).base` in the existing formula.
- Codex: entry shows the highest stage owned (party or box), else stage 1; the
  entry page lists the line as `NAME > NAME2 > NAME3` with unowned stages shown
  as `?????` and the evolution levels as "LV 16".
- Tests (Vitest): stage count rule, evolution levels, form name uniqueness and
  length across the live-like fixture, stat totals and caps, `stageAt`, the
  evolution check (levelled-up-only, win/catch only, cancel retries), save
  without `stage` loads as 1. E2E: the test reads the first 3-stage species
  and its first evolution level `L` from the payload, injects a save on Route 1
  whose lead Codeling is that species at level `L - 1` with `exp = L^3 - 1`, uses
  `?seed=1&encounter=1`, wins one wild battle with FIGHT, reaches
  `data-scene="evolution"`, and afterwards the party shows the stage 2 name.

## 6. World

Maps are `GameMap` data, one metatile character per cell:

```ts
interface GameMap {
  id: MapId; name: string; music: TrackId; width: number; height: number;
  tiles: string[];                      // rows of metatile chars (legend in gfx/tiles.ts)
  overhead?: string[];                  // tree tops, roofs drawn over the player
  outdoor: boolean;                     // day/night tint by local clock outdoors only
  encounters?: { rate: number; minLevel: number; maxLevel: number }; // per tall-grass / cave step
  warps: { x: number; y: number; to: MapId; tx: number; ty: number; dir: Dir }[];
  npcs: NpcDef[];
  signs: { x: number; y: number; text: string }[];
  connections?: Partial<Record<Dir, { to: MapId; offset: number }>>; // seamless edges
}
interface NpcDef {
  id: string; x: number; y: number; sprite: SpriteId; dir: Dir;
  movement: "static" | "look" | "wander"; script: Script;
  trainer?: { name: string; party: { level: number; pick: string }[]; sight: number; reward: number; lose: string };
}
```

Maps (sizes in metatiles, approximate):

1. `bedroom` (8x8) player's room: bed, PC (shows "Projects are listed on this page; this PC holds your box"), TV, plant, stairs.
2. `house` (8x8) ground floor: mum-equivalent "Gran" NPC gives Patches, door.
3. `sterling` Sterling Town (20x18): player house, Prof. Ivanov's lab, two houses, pond, signs, flowers, fence. Exits north to Route 1 only after receiving a starter.
4. `lab` (10x12): Prof. Ivanov (glasses, black hair, black jacket, like the site portrait), aides, bookshelves, three starter Fork Balls on a table.
5. `route1` (20x36): tall grass patches, ledges (one-way jumps), two trainers, sign, item ball (Fork Balls). Wild levels 2-6.
6. `commit` Commit City (24x22): Codeling Center, Mart, Merge Gym, library house, NPCs with project trivia, fountain, exits to Route 2.
7. `center` (12x8): healer "Medic Ada", healing machine animation, PC box terminal.
8. `mart` (10x8): clerk with buy/sell menu.
9. `gym` (10x14): two trainers, leader "Reviewer Rhea" (types: mixed, levels 12-14), green-check badge, puzzle: arrow floor tiles.
10. `route2` (30x16): water, bridge, more grass (levels 8-12), three trainers, entrance to Stack Cave.
11. `cave` Stack Cave (20x20): dark cave floor encounters (levels 10-15), boulders, ladder, rare old repositories prefer this habitat.

Habitats: species are distributed across `route1`, `route2`, `cave` by recency
(newest on Route 1, oldest in the cave) so all are catchable; tall grass on each
route draws from its own list with `rarity` weights. With fewer than four species,
only the **chosen** starter is excluded from wild encounters; the other starter
candidates remain catchable. The chosen starter is already registered as caught.
With four or more species, every species, including all starter candidates,
appears in the wild. This exception keeps a small-payload Codex completable.

Overworld rules: grid movement 16px per step at 1px/frame walking, 2px/frame
running (B); 3-frame walk cycle; turning in place on tap; bump sound on walls;
ledges hop with a shadow; doors/stairs warp with a fade; tall grass rustles over
the player's feet; animated water, flowers and the Center sign; NPCs wander
within 2 tiles and face the player when talked to; trainers spot the player in
a straight line (`!` balloon, walk up, dialogue, battle); signs and objects use A.

Story: wake in the bedroom, go downstairs, try to leave town north, Prof.
Ivanov stops you, lab: pick one of three starters (the three highest-star
species of distinct types; ties by recency), receive the Codex and 5 Fork Balls.
Goal: register every Codeling (every project), earn three badges and beat the
Champion (§6.1). Beating the Champion plays the ending: Prof. Ivanov thanks the player, credits roll
(game by Victor Ivanov; links offered: Resume, Contact, GitHub). Completing the
Codex gives a diploma screen. Play continues after the ending.

### 6.1 Region expansion (FEAT-1790991963)

The journey continues north from Stack Cave through two towns and two gyms to the
Champion. Three badges in order; the Champion replaces Rhea as the ending trigger.

New `MapId`s: `route3`, `bay`, `bayCenter`, `bayMart`, `bayHouse`, `pipeGym`,
`route4`, `ridge`, `ridgeCenter`, `ridgeMart`, `releaseGym`, `tower`.
Existing `center`/`mart` stay Commit City's. Center and Mart interiors are built
by one factory in `world/maps/interiors.ts` (`makeCenter(id, town, door)`,
`makeMart(id, town, door)`; every Mart sells the §8 stock) so each town has its own interior ids with
correct return warps; the Commit interiors use the same factory with their
current layout and coordinates unchanged.

1. `cave`: the ladder at (9,3) becomes a warp to `route3` (south end). A "Cave
   Warden" NPC stands on (9,4) until the player holds `badge:merge` ("The upper
   shelf is for badge holders."), then steps aside (moves to (10,4)).
2. `route3` (24x30, outdoor, track `route`): forest ascent with irregular grass,
   two ledges, a stream with a bridge, 3 trainers (levels 14-18), item balls
   (Great Fork x2, Hotfix), a hidden item, signs; encounters 0.14, levels 14-19.
   North connection to `bay`.
3. `bay` Branch Bay (26x22, outdoor, new track `bay`): harbour town on the
   east shore with docks, a lighthouse (decor), boats (decor), sand and water
   edges, Center, Mart, Pipeline Gym, `bayHouse` (enterable), 4 NPCs with
   project-themed trivia, signs. North connection to `route4`.
4. `pipeGym` Pipeline Gym (12x16, track `gym`): puzzle "pipeline stages": three
   floor switches labelled LINT, TEST, BUILD (new switch metatiles: up/down
   states) and three barrier rows (new barrier metatile, solid while closed).
   Pressing the switches in order LINT > TEST > BUILD opens the barriers one
   by one; a wrong switch closes all and resets (buzz SFX). Two trainers
   (levels 20-22). Leader "Ops Otto" (party 4: levels 22, 23, 24, 25, picks
   `star:5`, `star:6`, `mixed`, `star:2`), reward 1500, badge `badge:pipeline`
   (art: green pipeline). Switch state is per visit (not saved).
5. `route4` Release Road (20x40, outdoor, new track `mountain`): mountain
   switchbacks with ledges, a river crossing on a long bridge, rock clusters,
   a short tunnel segment (cave tiles, no encounters), 4 trainers (levels
   24-28), item balls (Full Rebuild, Rollback, Great Fork x3); encounters
   0.15, levels 22-28. A ranger NPC blocks the south entrance from `bay` until
   `badge:pipeline`. North connection to `ridge`.
6. `ridge` Release Ridge (24x22, outdoor, new track `ridge`): snowy mountain
   town (new snow ground/tree variants, same palette rules), Center, Mart,
   Release Gym, the Main Branch Tower entrance at the north edge, 4 NPCs.
7. `releaseGym` Release Gym (12x16, track `gym`): puzzle "deploy pads":
   teleport pads (new pad metatile) are warps within the same map; a maze of
   pads where some lead back to the start; a sign hints "Tag, then ship.". Two
   trainers (levels 28-30). Leader "Maintainer Mira" (party 5: levels 30, 31,
   32, 33, 34; picks `star:4`, `mixed`, `star:3`, `mixed`, `star:1`), reward
   2500, badge `badge:release` (art: tag).
8. `tower` Main Branch Tower (12x18, track new `tower`): a guard at the door
   requires all three badges; inside, two ace trainers (levels 34-36) in a
   hall, then the Champion: Prof. Ivanov ("You have met every one of my
   projects. Show me what they can do.") with 6 Codelings, levels 36, 37, 38,
   39, 40, 42, picks `star:1`..`star:6` (wrapping when fewer species), stages
   by `stageAt`. Battle track new `champion`. Winning sets `champion`, plays
   the existing ending (credits text adds the three badges), then returns the
   player to the tower entrance in `ridge`.
9. `lab`: after `badge:release` the aide says the Prof. went to Main Branch
   Tower; the Prof. NPC is hidden from the lab after that until `champion`.

Rules:

- Trainer `pick` grammar adds `star:<n>` (n-th species by stars, desc, ties by
  newer push, wrapping). Rhea's special case stays.
- Wild species: route1/route2/cave keep today's thirds. `route3` and `route4`
  draw from every species (rarity-weighted), so the Codex can be completed late.
  Stage by `stageAt(level)`.
- Badges: flags `badge:merge`, `badge:pipeline`, `badge:release`; storage
  reconciliation maps the old `badge` flag to `badge:merge`. Rhea now grants the
  badge with the badge jingle and a hint ("The next gym is past Stack Cave.")
  instead of the ending.
- Black out returns to the last visited Center: flag `lastCenter:<mapId>`
  (one kept, replaced on each visit); old `lastCenter` maps to `center`.
- Trainer card: three badge slots (check, pipeline, tag; empty slot outline when
  missing) and a CHAMPION star after `champion`.
- New tracks (original, MML): `bay`, `mountain`, `ridge`, `tower`, `champion`.
  New SFX: `switch`, `buzz`, `teleport`.
- Save: `validSave` accepts the new map ids.
- Tests (Vitest): every new map rectangular, warps/connections land on walkable
  tiles in bounds and are reciprocal where expected, the full graph from
  `bedroom` reaches `tower`, gates (warden, ranger, guard) block without flags
  and open with them, `star:<n>` picks, Pipeline switch logic (order, reset),
  blackout center selection, old-flag migration. E2E (seeded saves injected with
  `loadGameModules`): enter `bay` and `ridge` from their routes, start the Otto,
  Mira and Champion battles (`data-scene="battle"`), and a Champion win (forced
  via a test save at high level with `?seed=1`) reaches the ending.

### 6.2 Post-game (FEAT-1790991964)

Nothing here is reachable before `champion`.

- Rematches: Rhea, Otto, Mira and Prof. Ivanov (now back in the lab) offer a
  rematch once per local calendar day (flag `rematch:<id>:<YYYY-MM-DD>`, only
  the latest kept per id). Parties are 6 Codelings: Rhea 40-45, Otto 45-50,
  Mira 50-55, Prof. 58-63, picks spread by `star:<n>` and `mixed`, stages by
  `stageAt`. Rewards x2.
- Legendary: a sealed door in Stack Cave (new door metatile at the cave's west
  wall) opens after `champion` into `vault` (10x10, cave track, no random
  encounters). ORIGIN, a unique Codeling not from a repository: id `0` (repository
  and fallback ids are positive; save validation accepts `0` for species, seen
  and caught ids), type `normal`,
  base total 600, catch rate 3, level 50, 3-stage-style sprite with a gold ramp
  (seeded, distinct), stands visible on a pedestal; A starts the battle with the
  `champion` track. If it faints or the player runs, it returns when the vault
  is re-entered; once caught it is gone (flag `origin`). Codex: entry `000`
  after seen, opens the GitHub profile; it does not count toward the diploma.
- Side quests (state in flags `quest:<id>:<state>`):
  1. "Lost keyboard": Old Dev in `bayHouse` lost his keyboard on Route 3; a
     hidden spot there (post-game only) gives "OLD KEYBOARD"; returning it pays
     1000 coins and 3 Hotfix.
  2. "Evolved, please": a Collector in `ridge` asks to see an evolved (stage 2+)
     Codeling in the party; pays 5 Great Fork.
  3. "Codex milestones": the lab aide rewards 25%, 50% and 100% caught (repo
     species only): 5 Great Fork; 3 Full Rebuild; 3000 coins and 3 Rollback.
- Tests (Vitest): post-game gating for every element, rematch daily cooldown and
  parties, ORIGIN species constraints and Codex exclusion from the diploma,
  quest state transitions and rewards. E2E: a post-game seeded save enters
  `vault` and starts the ORIGIN battle.

## 7. Scripts and dialogue

`Script = Command[]`; `Command` is one of `{ say }`, `{ ask, yes, no }`,
`{ give: ItemId, qty }`, `{ heal }`, `{ flag, set }`, `{ if: flag, then, else }`,
`{ move: npcId, path }`, `{ face }`, `{ battle: trainerId }`, `{ starter }`,
`{ open: "resume" | "contact" | "github" | repoUrl }`, `{ mart }`, `{ pc }`,
`{ music }`, `{ wait }`. All strings live in `data/text.ts`. Text placeholders:
`{PLAYER}` and `{MON}` (a Codeling name) only. Opening an external page always asks YES/NO first, then calls
`window.open(url, "_blank", "noopener")`.

Dialogue tone: warm, lightly funny, about software (merge conflicts, flaky
tests, code review), never about real people other than Victor.

## 8. Menus and saving

- Title: animated logo "CODELINGS" with "Victor's Repo Quest", a Codeling
  walking across, PRESS START, menu NEW GAME / CONTINUE (when a save exists) /
  OPTIONS. Intro by Prof. Ivanov, then name entry (letter grid, max 7 chars,
  default "DEV").
- START menu: CODEX, CODELINGS, BAG, {PLAYER} (trainer card: name, badge, Codex
  seen/caught, play time, coins), SAVE, OPTIONS, EXIT.
- CODEX: list of all species by number (seen shows silhouette and name, caught
  shows sprite); entry page: sprite, type, stars ★, last update date,
  description word-wrapped and paged, "OPEN ON GITHUB" and (if any) "OPEN DEMO".
- CODELINGS: party of up to 6, reorder, summary (stats, moves with PP and type,
  EXP to next level, repo name), use item on.
- BAG: items with quantities. Items: Fork Ball (1x), Great Fork (1.5x), Patch
  (+20 HP), Hotfix (+60 HP), Full Rebuild (full HP + status), Rollback (revive
  50%), Linter (cure status). Coins from trainers; Mart sells them.
- PC box in the Center: deposit/withdraw (party >= 1 always).
- Options: text speed (slow/mid/fast), music volume 0-10, SFX volume 0-10,
  battle animations on/off. Stored with the save and separately before a save exists.
- Save: `localStorage["codelings.save.v1"]`, JSON, schema below, validated on
  load (corrupt or unknown version -> treated as no save, never crash). Species
  missing from the current payload are skipped.

```ts
interface SaveV1 {
  v: 1; name: string; map: MapId; x: number; y: number; dir: Dir;
  party: Codeling[]; box: Codeling[]; bag: Partial<Record<ItemId, number>>;
  coins: number; flags: string[]; seen: number[]; caught: number[];
  playTimeSec: number; options: Options;
}
interface Codeling {
  uid: string; species: number; level: number; exp: number; hp: number;
  ivs: Stats; moves: { id: MoveId; pp: number }[]; status: Status | null;
}
```

## 9. Battle

- Transition: flash then a tile-wipe spiral (instant under reduced motion).
- Layout: foe platform top-right with name, level, HP bar (green/yellow/red);
  player platform bottom-left with back sprite, HP numbers and EXP bar; text box
  bottom; main menu FIGHT / BAG / TEAM / RUN; move menu with PP and type.
- Animations: sprites slide in, ball throw and pop, per-type hit effects
  (small particle sets), damage blink, HP bar drains at 1px/frame, faint drop
  with cry, EXP bar fill, level-up stat window, learning a 5th move asks which
  to forget, catch shakes (0-3) then click or burst.
- Cries: each species has a seeded 0.4s synth cry.
- Trainer battles: trainer sprite slides in, party ball indicator, "sends out",
  switch offered on foe faint (shift style), reward coins, defeat text.
- Losing: black out, return to the last Center (or home) with half coins.
- `battle.ts` is a pure state machine: `new Battle(sides, rng)`,
  `choose(action)`, `step(): BattleEvent[]`; the scene animates events. Speed
  order with priority, ties by RNG.

## 10. Audio

Original chiptunes only, written in a small MML parsed by `engine/sequencer.ts`
(`t` tempo, `o` octave, `l` default length, notes `c d e f g a b` with `+/-`,
lengths, dots, ties, `r` rests, `v` volume, `@` duty, `[ ]n` loops, `L` loop
point). Tracks: title, intro/prof, town, route, cave, lab, center, gym, wild
battle, trainer battle, gym battle, victory, heal jingle, item get, level up,
badge, ending/credits. SFX: cursor, confirm, cancel, bump, door, ledge, grass,
hit (normal/super/weak), faint, ball throw/shake/catch, run, save.
Audio context starts on the first player input; music and SFX volumes follow
the options; muted while the tab is hidden.

## 11. Tests

- Vitest: formulas, type chart symmetry rules, species determinism and
  constraints (name length, stat totals, every species has a habitat), catch
  odds monotonicity, battle state machine (turn order, fainting, switching,
  status ticks, run), save round-trip and corrupt-save handling, script
  interpreter, MML parser, every map rectangular with valid warps/NPCs inside
  bounds and reachable starter/lab/gym, text wrapping within 18 columns.
- Playwright (`e2e/game.spec.ts`, Chromium + WebKit): `/projects` has the game
  and the table; CSP there allows `'self'` scripts; every other page still has
  no executable script source and 0 scripts; boot reaches `data-scene="title"` with no
  console errors; START leads through the intro; on-screen buttons work on a
  touch viewport; no horizontal overflow at 320px.
