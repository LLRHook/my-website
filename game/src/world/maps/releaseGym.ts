import { REGION_TEXT as R } from "../../data/text.js";
import type { GameMap } from "../map.js";
import { trainer } from "./regionHelpers.js";

export const releaseGym: GameMap = {
  id: "releaseGym", name: R.releaseGym, music: "gym", width: 12, height: 16, outdoor: false,
  tiles: [
    "#pppppppppp#",
    "#NNuKppuCNN#",
    "#k##k#_k__k#",
    "######_rrr_#",
    "#@_@_#_____#",
    "#___{#{_rr_#",
    "#____#_@___#",
    "##k#####k###",
    "#@_@y#___@y#",
    "#_rr_#{_rr_#",
    "#____#_@__{#",
    "####k#####k#",
    "#@_@y#___@y#",
    "#_rr{#__rr_#",
    "#_S_\\#_@___#",
    "##D####\\####",
  ],
  warps: [
    { x: 2, y: 15, to: "ridge", tx: 5, ty: 16, dir: "down" },
    { x: 3, y: 12, to: "releaseGym", tx: 8, ty: 13, dir: "up" },
    { x: 9, y: 12, to: "releaseGym", tx: 2, ty: 9, dir: "up" },
    { x: 3, y: 8, to: "releaseGym", tx: 8, ty: 9, dir: "up" },
    { x: 9, y: 8, to: "releaseGym", tx: 2, ty: 5, dir: "up" },
    { x: 3, y: 4, to: "releaseGym", tx: 8, ty: 5, dir: "up" },
    ...[{ x: 1, y: 12 }, { x: 7, y: 14 }, { x: 1, y: 8 }, { x: 7, y: 10 },
      { x: 1, y: 4 }, { x: 7, y: 6 }].map(({ x, y }) => ({
      x, y, to: "releaseGym" as const, tx: 2, ty: 14, dir: "up" as const,
    })),
  ],
  npcs: [
    trainer("tavi", 2, 8, "down", [28, 29], ["swift", "mixed"], R.releaseA, R.releaseALose, 1000, 1),
    trainer("pax", 8, 4, "down", [29, 30], ["shell", "mixed"], R.releaseB, R.releaseBLose, 1100, 1),
    trainer("mira", 8, 2, "down", [30, 31, 32, 33, 34], ["star:4", "mixed", "star:3", "mixed", "star:1"],
      R.mira, R.miraLose, 2500, 1),
  ],
  signs: [{ x: 2, y: 14, text: R.deploySign }],
};
