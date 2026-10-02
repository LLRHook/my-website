import { WORLD_TEXT as T } from "../../data/text.js";
import type { GameMap } from "../map.js";
export const route2: GameMap = {
  id: "route2",
  name: "ROUTE 2",
  music: "route",
  width: 30,
  height: 16,
  outdoor: true,
  tiles: [
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "T..........~~~~..............T",
    "T.ggggggZ..~~~~...ggggg..OOOOT",
    "T.ggggggn.===~~...ggggOZ.OOOOT",
    "T.gggggg..F~~~~...gggggl.OOOOT",
    "T.gggggg...~~~~...ggggg.::SQ.T",
    "T..........~~~~..FFFFFF.::::.T",
    "T..S.......~~~~.........::::.T",
    "::::::::::======::::::::::::::",
    "::::::::::======::::::::::::::",
    "T..........~~~~....ggggggg...T",
    "T..........~~~~....ggggggg...T",
    "T..ffff....~~~~....ggggggg...T",
    "T..........~~~~....ggggggg..fT",
    "T..........~~~~...........Zi.T",
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
  ],
  overhead: [
    "                              ",
    "                              ",
    "                              ",
    "                              ",
    "                              ",
    "                              ",
    "                              ",
    "                              ",
    "                              ",
    "                              ",
    "                              ",
    "                              ",
    "                              ",
    "                              ",
    "                              ",
    "                              "
  ],
  warps: [
    {
      "x": 27,
      "y": 5,
      "to": "cave",
      "tx": 9,
      "ty": 18,
      "dir": "up"
    },
  ],
  npcs: [
    {
      id: "nia",
      x: 9,
      y: 6,
      sprite: "trainer",
      dir: "down",
      movement: "static",
      script: [
        {
          say: T.r2a
        },
        {
          battle: "nia"
        }
      ],
      trainer: {
        name: "Bridgekeeper Nia",
        party: [
          {
            level: 8,
            pick: "mixed"
          }
        ],
        sight: 4,
        reward: 160,
        lose: T.r2aLose
      }
    },
    {
      id: "sol",
      x: 20,
      y: 8,
      sprite: "trainer",
      dir: "left",
      movement: "static",
      script: [
        {
          say: T.r2b
        },
        {
          battle: "sol"
        }
      ],
      trainer: {
        name: "Mapper Sol",
        party: [
          {
            level: 10,
            pick: "mixed"
          }
        ],
        sight: 4,
        reward: 180,
        lose: T.r2bLose
      }
    },
    {
      id: "wren",
      x: 26,
      y: 11,
      sprite: "trainer",
      dir: "up",
      movement: "static",
      script: [
        {
          say: T.r2c
        },
        {
          battle: "wren"
        }
      ],
      trainer: {
        name: "Hiker Wren",
        party: [
          {
            level: 12,
            pick: "mixed"
          }
        ],
        sight: 3,
        reward: 200,
        lose: T.r2cLose
      }
    },
  ],
  signs: [
    {
      x: 3,
      y: 7,
      text: T.route2Sign
    },
    {
      x: 26,
      y: 5,
      text: T.caveSign
    },
  ],
  encounters: {
    rate: 0.15,
    minLevel: 8,
    maxLevel: 12
  },
  connections: {
    left: {
      to: "commit",
      offset: 0
    }
  }
};
