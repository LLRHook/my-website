import { WORLD_TEXT as T } from "../../data/text.js";
import type { GameMap } from "../map.js";
export const gym: GameMap = {
  id: "gym",
  name: "MERGE GYM",
  music: "gym",
  width: 10,
  height: 14,
  outdoor: false,
  tiles: [
    "#pppppppp#",
    "#NNupKuNN#",
    "#________#",
    "#________#",
    "#__a<<<a_#",
    "#______a_#",
    "#______a_#",
    "#_>>>>>a_#",
    "#________#",
    "#OO____OO#",
    "#________#",
    "#Y>>>>a_Y#",
    "#_S______#",
    "####D#####",
  ],
  warps: [
    {
      "x": 4,
      "y": 13,
      "to": "commit",
      "tx": 11,
      "ty": 14,
      "dir": "down"
    },
  ],
  npcs: [
    {
      id: "tess",
      x: 2,
      y: 8,
      sprite: "trainer",
      dir: "right",
      movement: "static",
      script: [
        {
          say: T.gymA
        },
        {
          battle: "tess"
        }
      ],
      trainer: {
        name: "Tester Tess",
        party: [
          {
            level: 10,
            pick: "mixed"
          }
        ],
        sight: 4,
        reward: 200,
        lose: T.gymALose
      }
    },
    {
      id: "bram",
      x: 6,
      y: 5,
      sprite: "trainer",
      dir: "left",
      movement: "static",
      script: [
        {
          say: T.gymB
        },
        {
          battle: "bram"
        }
      ],
      trainer: {
        name: "Builder Bram",
        party: [
          {
            level: 11,
            pick: "mixed"
          }
        ],
        sight: 3,
        reward: 250,
        lose: T.gymBLose
      }
    },
    {
      id: "rhea",
      x: 4,
      y: 2,
      sprite: "rhea",
      dir: "down",
      movement: "static",
      script: [
        {
          say: T.rhea
        },
        {
          battle: "rhea"
        }
      ],
      trainer: {
        name: "Reviewer Rhea",
        party: [
          {
            level: 12,
            pick: "mixed"
          },
          {
            level: 13,
            pick: "mixed"
          },
          {
            level: 14,
            pick: "mixed"
          }
        ],
        sight: 3,
        reward: 500,
        lose: T.rheaLose
      }
    },
  ],
  signs: [
    {
      x: 2,
      y: 12,
      text: T.gymSign
    },
  ]
};
