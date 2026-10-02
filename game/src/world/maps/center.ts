import { WORLD_TEXT as T } from "../../data/text.js";
import type { GameMap } from "../map.js";
export const center: GameMap = {
  id: "center",
  name: "CODELING CENTER",
  music: "center",
  width: 12,
  height: 8,
  outdoor: false,
  tiles: [
    "#pppppppppp#",
    "#BIupKpIpuC#",
    "#_______h__#",
    "#_ttttttt__#",
    "#__________#",
    "#Pnn____nnP#",
    "#__________#",
    "#####D######",
  ],
  warps: [
    {
      "x": 5,
      "y": 7,
      "to": "commit",
      "tx": 5,
      "ty": 7,
      "dir": "down"
    },
  ],
  npcs: [
    {
      id: "ada",
      x: 5,
      y: 2,
      sprite: "medic",
      dir: "down",
      movement: "static",
      script: [
        {
          say: T.ada
        },
        {
          heal: true
        },
        {
          say: T.healed
        }
      ]
    },
  ],
  signs: [
    {
      x: 10,
      y: 2,
      text: T.box
    },
    {
      x: 1,
      y: 2,
      text: T.books
    },
  ]
};
