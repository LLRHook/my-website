import { REGION_TEXT as R } from "../../data/text.js";
import type { GameMap } from "../map.js";
import { trainer } from "./regionHelpers.js";

export const tower: GameMap = {
  id: "tower", name: R.tower, music: "tower", width: 12, height: 18, outdoor: false,
  tiles: [
    "#pppppppppp#",
    "#BBuKppuCBB#",
    "#;;rrrrrr;;#",
    "#;krrrrrrk;#",
    "#x;;;rr;;;x#",
    "#{;;;rr;;;{#",
    "#;;;;rr;;;;#",
    "#x;yyrr;;;x#",
    "#;;;;rr;;;;#",
    "#;;;;rr;;;;#",
    "#x;;;rryy;x#",
    "#{;;;rr;;;{#",
    "#;;;;rr;;;;#",
    "#x;;;rr;;;x#",
    "#;;;;rr;;;;#",
    "#;;S;rr;;;;#",
    "#x;\\;rr;\\;x#",
    "#####D######",
  ],
  warps: [{ x: 5, y: 17, to: "ridge", tx: 11, ty: 2, dir: "down" }],
  npcs: [
    trainer("ash", 2, 12, "right", [34, 35, 35], ["star:6", "mixed", "star:4"], R.aceA, R.aceALose, 1400, 4),
    trainer("iris", 9, 8, "left", [35, 36, 36], ["star:5", "mixed", "star:3"], R.aceB, R.aceBLose, 1500, 4),
    trainer("champion", 5, 2, "down", [36, 37, 38, 39, 40, 42],
      ["star:1", "star:2", "star:3", "star:4", "star:5", "star:6"], R.champion, R.championLose, 4000, 1),
  ],
  signs: [{ x: 3, y: 15, text: R.towerSign }],
};
