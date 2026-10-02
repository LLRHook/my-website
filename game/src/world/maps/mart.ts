import { WORLD_TEXT as T } from "../../data/text.js";
import type { GameMap } from "../map.js";
export const mart: GameMap = {
  id: "mart",
  name: "PIP MART",
  music: "town",
  width: 10,
  height: 8,
  outdoor: false,
  tiles: [
    "#pppppppp#",
    "#XXKpuXXX#",
    "#________#",
    "#ttttttt_#",
    "#________#",
    "#XX____XP#",
    "#________#",
    "####D#####",
  ],
  warps: [
    {
      "x": 4,
      "y": 7,
      "to": "commit",
      "tx": 17,
      "ty": 7,
      "dir": "down"
    },
  ],
  npcs: [
    {
      id: "pip",
      x: 4,
      y: 2,
      sprite: "clerk",
      dir: "down",
      movement: "static",
      script: [
        {
          say: T.clerk
        },
        {
          mart: true
        }
      ]
    },
  ],
  signs: [
    {
      x: 1,
      y: 2,
      text: T.mart
    },
  ]
};
