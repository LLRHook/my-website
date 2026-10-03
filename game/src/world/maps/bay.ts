import { REGION_TEXT as R } from "../../data/text.js";
import type { GameMap } from "../map.js";
import { gate } from "./regionHelpers.js";
import { makeCenter, makeMart } from "./interiors.js";

export const bayCenter = makeCenter("bayCenter", "bay", { x: 5, y: 7 });
export const bayMart = makeMart("bayMart", "bay", { x: 15, y: 7 });

export const bay: GameMap = {
  id: "bay", name: R.bay, music: "bay", width: 26, height: 22, outdoor: true,
  tiles: [
    "TTTTTTTTTTT:TTTTTTTTTT~~~~",
    "TTTTT.....T:.T....TTT~~~~~",
    "T..ff.....T:TT.....~[~~~~~",
    "T..fff....T:.T....~~]~~~~~",
    "T.........:::....,,~}~~~~~",
    "T..RRhRR..:::RRRRR,,~~~~~~",
    "T..RRRRR..:::RRRRR,,~~~~~~",
    "T..WWDWW..:::WWDWW,,~~~~~~",
    "T....S:::::::::::S,,~~~~~~",
    "T....:::::::S::::,,,~~~~~~",
    "T..ff...n..::..nn,,))))))~",
    "T...f......::....,,)~~~~~~",
    "T..RRRRR...::....,,)~~$~~~",
    "T..RRRRR...::....,,)~~~~~~",
    "T..WWDWW...::....,,)))))~~",
    "T....S:::::::::::,,~~~~~~~",
    "T..O.:...RRRR....,,~~$~~~~",
    "T....:...RRRR....,,,~~~~~~",
    "T..ff:...WWDW....,,,,~~~~~",
    "T...f::::::S:::::,,,,~~~~~",
    "TT...O.....::..ff.,,,,~~~~",
    "TTTTTTTTTTT::TTTTTTTT~~~~~",
  ],
  connections: { down: { to: "route3", offset: 0 }, up: { to: "route4", offset: -2 } },
  warps: [
    { x: 5, y: 7, to: "bayCenter", tx: 5, ty: 7, dir: "up" },
    { x: 15, y: 7, to: "bayMart", tx: 4, ty: 7, dir: "up" },
    { x: 5, y: 14, to: "pipeGym", tx: 5, ty: 15, dir: "up" },
    { x: 11, y: 18, to: "bayHouse", tx: 3, ty: 7, dir: "up" },
  ],
  npcs: [
    gate("ranger", 11, 1, ["badge:pipeline"], R.ranger, R.rangerOpen),
    { id: "ferry", x: 20, y: 10, sprite: "townsfolk", dir: "left", movement: "look",
      script: [{ say: R.bayTrivia1 }] },
    { id: "dockhand", x: 19, y: 14, sprite: "townsfolk", dir: "right", movement: "look",
      script: [{ say: R.bayTrivia2 }] },
    { id: "keeper", x: 16, y: 4, sprite: "aide", dir: "right", movement: "look",
      script: [{ say: R.bayTrivia3 }] },
    { id: "beach", x: 17, y: 19, sprite: "townsfolk", dir: "left", movement: "look",
      script: [{ say: R.bayTrivia4 }] },
  ],
  signs: [
    { x: 12, y: 9, text: R.baySign }, { x: 5, y: 8, text: R.baySign },
    { x: 17, y: 8, text: R.lighthouse }, { x: 5, y: 15, text: R.pipeGym },
    { x: 11, y: 19, text: R.houseShelf }, { x: 18, y: 10, text: R.docks },
  ],
};

export const bayHouse: GameMap = {
  id: "bayHouse", name: R.bayHouse, music: "town", width: 8, height: 8, outdoor: false,
  tiles: ["#pppppp#", "#BBuKuB#", "#_____C#", "#_H_d__#", "#_rr___#", "#Prr_zP#", "#______#", "###D####"],
  warps: [{ x: 3, y: 7, to: "bay", tx: 11, ty: 18, dir: "down" }],
  npcs: [{ id: "oldDev", x: 4, y: 4, sprite: "gran", dir: "left", movement: "static",
    script: [{ say: R.oldDev }] }],
  signs: [{ x: 1, y: 2, text: R.houseShelf }],
};
