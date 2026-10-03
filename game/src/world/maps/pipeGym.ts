import { REGION_TEXT as R } from "../../data/text.js";
import type { GameMap } from "../map.js";
import { trainer } from "./regionHelpers.js";

export const pipeGym: GameMap = {
  id: "pipeGym", name: R.pipeGym, music: "gym", width: 12, height: 16, outdoor: false,
  tiles: [
    "#pppppppppp#", "#NNuKppuCNN#", "#__________#", "#N___rr____#",
    "#|||||||||v#", "#X_________#", "#____rr____#", "#|||||||||v#",
    "#X_________#", "#____rr____#", "#|||||||||v#", "#Y_________#",
    "#__________#", "#__1_2_3___#", "#S_________#", "#####D######",
  ],
  warps: [{ x: 5, y: 15, to: "bay", tx: 5, ty: 14, dir: "down" }],
  npcs: [
    trainer("cleo", 2, 9, "right", [20, 20], ["go", "mixed"], R.pipeA, R.pipeALose, 650),
    trainer("jules", 9, 6, "left", [21, 22], ["typescript", "mixed"], R.pipeB, R.pipeBLose, 700),
    trainer("otto", 5, 2, "down", [22, 23, 24, 25], ["star:5", "star:6", "mixed", "star:2"],
      R.otto, R.ottoLose, 1500, 1),
  ],
  signs: [{ x: 1, y: 14, text: R.pipelineSign }],
};
