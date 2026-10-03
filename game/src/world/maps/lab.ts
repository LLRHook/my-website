import { REGION_TEXT as R, WORLD_TEXT as T } from "../../data/text.js";
import type { GameMap } from "../map.js";
export const lab: GameMap = {
  id: "lab",
  name: "IVANOV LAB",
  music: "lab",
  width: 10,
  height: 12,
  outdoor: false,
  tiles: [
    "#pppppppp#",
    "#BBuKIuBB#",
    "#_______C#",
    "#________#",
    "#_tooot__#",
    "#________#",
    "#________#",
    "#________#",
    "#P_rr_dmP#",
    "#__rr_H__#",
    "#________#",
    "####D#####",
  ],
  warps: [
    {
      "x": 4,
      "y": 11,
      "to": "sterling",
      "tx": 14,
      "ty": 8,
      "dir": "down"
    },
  ],
  npcs: [
    {
      id: "prof",
      trainer: { name: "Prof. Ivanov", party: [], sight: 0, reward: 4000, lose: R.championLose },
      x: 4,
      y: 6,
      sprite: "prof",
      dir: "down",
      movement: "static",
      script: [
        {
          if: "hasCodex",
          then: [
            {
              say: T.profAgain
            }
          ],
          else: [
            {
              say: T.prof
            },
            {
              starter: true
            }

          ]
        }
      ]
    },
    {
      id: "nell",
      x: 2,
      y: 7,
      sprite: "aide",
      dir: "down",
      movement: "look",
      script: [
        {
          if: "badge:release", then: [{ say: R.profAway }], else: [{ say: T.aide1 }]
        }
      ]
    },
    {
      id: "oren",
      x: 7,
      y: 3,
      sprite: "aide",
      dir: "down",
      movement: "look",
      script: [
        {
          say: T.aide2
        }
      ]
    },
  ],
  signs: [
    {
      x: 3,
      y: 5,
      text: T.starter
    },
    {
      x: 4,
      y: 5,
      text: T.starter
    },
    {
      x: 5,
      y: 5,
      text: T.starter
    },
    {
      x: 1,
      y: 2,
      text: T.books
    },
  ]
};
