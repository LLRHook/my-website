import type { Dir, ItemId } from "../../data/ids.js";
import { REGION_TEXT as R } from "../../data/text.js";
import type { NpcDef } from "../map.js";
import type { Script } from "../script.js";
import type { SpriteId } from "../../gfx/sprites.js";

const TRAINER_SPRITES: Readonly<Record<keyof typeof R.names, SpriteId>> = {
  otto: "otto", mira: "mira", champion: "prof", cleo: "ace", jules: "sailor", tavi: "skier", pax: "ace",
  ash: "ace", iris: "skier", fern: "hiker", beck: "sailor", rue: "ace",
  hal: "hiker", bree: "sailor", dell: "ace", skye: "skier",
};

export function trainer(id: keyof typeof R.names, x: number, y: number, dir: Dir,
  levels: readonly number[], picks: readonly string[], say: string, lose: string, reward: number,
  sight = 3): NpcDef {
  return {
    id, x, y, dir, sprite: TRAINER_SPRITES[id], movement: "static",
    script: [{ say }, { battle: id }],
    trainer: { name: R.names[id], party: levels.map((level, index) => ({ level, pick: picks[index] })),
      lose, reward, sight },
  };
}

export function gate(id: "warden" | "ranger" | "guard", x: number, y: number,
  badges: readonly string[], closed: string, open: string): NpcDef {
  let script: Script = [{ say: open }, { move: id, path: ["right"] }, { flag: `gate:${id}`, set: true }];
  for (const badge of [...badges].reverse()) {
    script = [{ if: badge, then: script, else: [{ say: closed }] }];
  }
  return {
    id, x, y, sprite: id, dir: "down", movement: "static",
    script: [{ if: `gate:${id}`, then: [{ say: R.aside }], else: script }],
  };
}

export function item(id: string, x: number, y: number, give: ItemId, qty: number, text: string): NpcDef {
  return {
    id, x, y, sprite: "townsfolk", dir: "down", movement: "static",
    script: [{ if: `item:${id}`, then: [], else: [
      { say: text }, { give, qty }, { flag: `item:${id}`, set: true },
    ] }],
  };
}
