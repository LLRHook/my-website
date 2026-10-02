import { WORLD_TEXT as T } from "../../data/text.js";
import type { GameMap } from "../map.js";
export const bedroom: GameMap = {
  id: "bedroom",
  name: "YOUR ROOM",
  music: "town",
  width: 8,
  height: 8,
  outdoor: false,
  tiles: [
    "#pppppp#",
    "#bNpVCP#",
    "#e____s#",
    "#______#",
    "#__rr__#",
    "#BBrr__#",
    "#______#",
    "########",
  ],
  warps: [
    {
      "x": 6,
      "y": 2,
      "to": "house",
      "tx": 6,
      "ty": 2,
      "dir": "down"
    },
  ],
  npcs: [],
  signs: [
    {
      x: 1,
      y: 3,
      text: T.bed
    },
    {
      x: 4,
      y: 2,
      text: T.tv
    },
    {
      x: 5,
      y: 2,
      text: T.pcHome
    },
    {
      x: 1,
      y: 6,
      text: T.books
    },
  ]
};
