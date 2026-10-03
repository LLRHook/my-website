import { REGION_TEXT as R } from "../../data/text.js";
import type { GameMap } from "../map.js";
import { gate } from "./regionHelpers.js";
import { makeCenter, makeMart } from "./interiors.js";

export const ridgeCenter = makeCenter("ridgeCenter", "ridge", { x: 5, y: 8 });
export const ridgeMart = makeMart("ridgeMart", "ridge", { x: 17, y: 8 });

export const ridge: GameMap = {
  id: "ridge", name: R.ridge, music: "ridge", width: 24, height: 22, outdoor: true,
  tiles: [
    "%%%%%%%%RRRRRRRR%%%%%%%%",
    "%*******RRRRRRRR*******%",
    "%**OO***WWWDWWWW***OO**%",
    "+^*****7***:*%S**7****^(",
    "+*^^**7****:%:****7^^**(",
    "%^*^^**7***:::***7^**^^%",
    "%**RRhRR**8:::*RRRRR***%",
    "%**RRRRR***::8*RRRRR***%",
    "%**WWDWW*!8:::!WWDWW***%",
    "%^***S::::::::::::S***^%",
    "%****::::::S:::::::****%",
    "%^^***nn***::8***nS**^^%",
    "+*^^*****78:::7*****^**(",
    "+^*^O******::8***F?F*^^(",
    "%**RRRRR***:::***OO****%",
    "%**RRRRR**8:::****O****%",
    "%**WWDWW*!*::8!*FFFFF**%",
    "%^***S::::::::*F99999F^%",
    "%*^^******8::S*F99999F*%",
    "+^*^^****7*::*7F99999F^(",
    "+****O*****::8***FFF^**(",
    "%%%%%%%%%%%::%%%%%%%%%%%",
  ],
  connections: { down: { to: "route4", offset: -2 } },
  warps: [
    { x: 5, y: 8, to: "ridgeCenter", tx: 5, ty: 7, dir: "up" },
    { x: 17, y: 8, to: "ridgeMart", tx: 4, ty: 7, dir: "up" },
    { x: 5, y: 16, to: "releaseGym", tx: 2, ty: 15, dir: "up" },
    { x: 11, y: 2, to: "tower", tx: 5, ty: 17, dir: "up" },
  ],
  npcs: [
    gate("guard", 11, 3, ["badge:merge", "badge:pipeline", "badge:release"], R.guard, R.guardOpen),
    { id: "sweeper", x: 8, y: 10, sprite: "townsfolk", dir: "down", movement: "look",
      script: [{ say: R.ridgeTrivia1 }] },
    { id: "reader", x: 16, y: 12, sprite: "aide", dir: "left", movement: "look",
      script: [{ say: R.ridgeTrivia2 }] },
    { id: "watcher", x: 9, y: 4, sprite: "townsfolk", dir: "up", movement: "look",
      script: [{ say: R.ridgeTrivia3 }] },
    { id: "tea", x: 8, y: 18, sprite: "townsfolk", dir: "up", movement: "look",
      script: [{ say: R.ridgeTrivia4 }] },
  ],
  signs: [{ x: 13, y: 18, text: R.ridgeSign }, { x: 5, y: 9, text: R.ridgeSign },
    { x: 18, y: 9, text: R.ridgeSign }, { x: 5, y: 17, text: R.releaseGym },
    { x: 14, y: 3, text: R.towerSign }, { x: 11, y: 10, text: R.ridgeSign },
    { x: 18, y: 11, text: R.lookoutSign }],
};
