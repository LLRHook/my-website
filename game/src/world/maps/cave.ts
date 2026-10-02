import { WORLD_TEXT as T } from "../../data/text.js";
import type { GameMap } from "../map.js";
export const cave: GameMap = {
  id: "cave",
  name: "STACK CAVE",
  music: "cave",
  width: 20,
  height: 20,
  outdoor: false,
  tiles: [
    "AAAAAAAAAAAAAAAAAAAA",
    "AccccccccccccccccccA",
    "AccccccccccccccccccA",
    "AccOOOOOcsccccccGccA",
    "AccOOOOOcccccccccccA",
    "AccccccccccsAAAAcccA",
    "AccccccccccccccccccA",
    "AcGGcccccccccccccccA",
    "AcccccccccccccccGOcA",
    "AcccccccwwwccccccccA",
    "AcOOOOccwccccccccccA",
    "AcOOOOccccccOOOOOccA",
    "AcOOOOccccccOOOOOccA",
    "AccccccccccccccccccA",
    "AcccccccccGOcccccccA",
    "AcccccOOcccccccccccA",
    "AOOOccOOccccccccOOcA",
    "AcccccccccccccccOOcA",
    "AccccccccscccccccccA",
    "AAAAAAAAAAAAAAAAAAAA",
  ],
  warps: [
    {
      "x": 9,
      "y": 18,
      "to": "route2",
      "tx": 27,
      "ty": 5,
      "dir": "down"
    },
  ],
  npcs: [],
  signs: [
    {
      x: 9,
      y: 3,
      text: T.ladder
    },
  ],
  encounters: {
    rate: 0.1,
    minLevel: 10,
    maxLevel: 15
  }
};
