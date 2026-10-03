import { REGION_TEXT as R } from "../../data/text.js";
import { gate } from "./regionHelpers.js";
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
    "AcccccccAAAAcccccccA",
    "AccOOOOOAsAcccccGccA",
    "AccOOOOOcccAcccccccA",
    "AcccccccccAsAAAAcccA",
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
    { x: 9, y: 3, to: "route3", tx: 11, ty: 28, dir: "up" },
    {
      "x": 9,
      "y": 18,
      "to": "route2",
      "tx": 27,
      "ty": 5,
      "dir": "down"
    },
  ],
  npcs: [gate("warden", 9, 4, ["badge:merge"], R.warden, R.wardenOpen)],
  signs: [],
  encounters: {
    rate: 0.1,
    minLevel: 10,
    maxLevel: 15
  }
};
