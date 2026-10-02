import { WORLD_TEXT as T } from "../../data/text.js";
import type { GameMap } from "../map.js";
export const commit: GameMap = {
  id: "commit",
  name: "COMMIT CITY",
  music: "town",
  width: 24,
  height: 22,
  outdoor: true,
  tiles: [
    "TTTTTTTTTTT::TTTTTTTTTTT",
    "T..........::..........T",
    "T.FFFFF....::..........T",
    "T..ffff....::..........T",
    "T..........::..........T",
    "T..RRhRR...::..RRRRR...T",
    "T..RRRRR...::..RRRRR...T",
    "T..WWDWW...::..WWDWW...T",
    "T..LS:::::::::::S::L::::",
    "T..::::::::::S::::::::::",
    "T....:.....::.::::::Z:.T",
    "T....:..n..::.:n::::::.T",
    "T....:..nRRRRR::~~j~::.T",
    "T....:...RRRRR::~~~~:L.T",
    "T........WWDWW::::::::.T",
    "T..RRRR.::S::::fffff::.T",
    "T..RRRR.:::::::::::....T",
    "T..WWDW....::.......ff.T",
    "T....S.....::.......ff.T",
    "T..M.......::.......ff.T",
    "T..........::..Z.......T",
    "TTTTTTTTTTT::TTTTTTTTTTT",
  ],
  overhead: [
    "                        ",
    "                        ",
    "                        ",
    "                        ",
    "                        ",
    "                        ",
    "                        ",
    "                        ",
    "                        ",
    "                        ",
    "                        ",
    "                        ",
    "                        ",
    "                        ",
    "                        ",
    "                        ",
    "                        ",
    "                        ",
    "                        ",
    "                        ",
    "                        ",
    "                        "
  ],
  warps: [
    {
      "x": 5,
      "y": 7,
      "to": "center",
      "tx": 5,
      "ty": 7,
      "dir": "up"
    },
    {
      "x": 17,
      "y": 7,
      "to": "mart",
      "tx": 4,
      "ty": 7,
      "dir": "up"
    },
    {
      "x": 11,
      "y": 14,
      "to": "gym",
      "tx": 4,
      "ty": 13,
      "dir": "up"
    },
  ],
  npcs: [
    {
      id: "ellis",
      x: 8,
      y: 9,
      sprite: "townsfolk",
      dir: "down",
      movement: "wander",
      script: [
        {
          say: T.ellis
        }
      ]
    },
    {
      id: "suri",
      x: 18,
      y: 11,
      sprite: "townsfolk",
      dir: "down",
      movement: "look",
      script: [
        {
          say: T.suri
        }
      ]
    },
    {
      id: "ivo",
      x: 15,
      y: 18,
      sprite: "townsfolk",
      dir: "down",
      movement: "wander",
      script: [
        {
          say: T.ivo
        }
      ]
    },
  ],
  signs: [
    {
      x: 13,
      y: 9,
      text: T.commitSign
    },
    {
      x: 4,
      y: 8,
      text: T.centerSign
    },
    {
      x: 16,
      y: 8,
      text: T.martSign
    },
    {
      x: 10,
      y: 15,
      text: T.gymSign
    },
    {
      x: 5,
      y: 18,
      text: T.library
    },
  ],
  connections: {
    down: {
      to: "route1",
      offset: -2
    },
    right: {
      to: "route2",
      offset: 0
    }
  }
};
