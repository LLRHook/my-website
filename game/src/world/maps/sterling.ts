import { WORLD_TEXT as T } from "../../data/text.js";
import type { GameMap } from "../map.js";
export const sterling: GameMap = {
  id: "sterling",
  name: "STERLING TOWN",
  music: "town",
  width: 20,
  height: 18,
  outdoor: true,
  tiles: [
    "TTTTTTTTT::TTTTTTTTT",
    "T........::........T",
    "T.RRRR...::...~~~~.T",
    "T.RRRR..S::..S~~~~.T",
    "T.WDWW...::...~~~~.T",
    "T........::........T",
    "T.Z......::.RRRRR..T",
    "T..RRRRR.::LRRRRR..T",
    "T..RRRRR.::.WSDWW..T",
    "T..WWDWW::::::::L..T",
    "T..MS::::::::ffff..T",
    "T........::.nffff..T",
    "T........::.f::..Z.T",
    "T.FFFFF..::..RRRR..T",
    "T.fffffl.::..RRRR..T",
    "T.fffff..::..WDWW..T",
    "T..O.....::........T",
    "TTTTTTTTT::TTTTTTTTT",
  ],
  overhead: [
    "                    ",
    "                    ",
    "                    ",
    "                    ",
    "                    ",
    "                    ",
    "                    ",
    "                    ",
    "                    ",
    "                    ",
    "                    ",
    "                    ",
    "                    ",
    "                    ",
    "                    ",
    "                    ",
    "                    ",
    "                    "
  ],
  warps: [
    {
      "x": 5,
      "y": 9,
      "to": "house",
      "tx": 3,
      "ty": 7,
      "dir": "down"
    },
    {
      "x": 14,
      "y": 8,
      "to": "lab",
      "tx": 4,
      "ty": 11,
      "dir": "up"
    },
  ],
  npcs: [
    {
      id: "mara",
      x: 6,
      y: 12,
      sprite: "townsfolk",
      dir: "down",
      movement: "wander",
      script: [
        {
          say: T.mara
        }
      ]
    },
    {
      id: "tobin",
      x: 12,
      y: 4,
      sprite: "townsfolk",
      dir: "down",
      movement: "look",
      script: [
        {
          say: T.tobin
        }
      ]
    },
  ],
  signs: [
    {
      x: 8,
      y: 3,
      text: T.sterlingSign
    },
    {
      x: 13,
      y: 8,
      text: T.labSign
    },
    {
      x: 4,
      y: 10,
      text: T.houseSign
    },
    {
      x: 13,
      y: 3,
      text: T.pondSign
    },
  ],
  connections: {
    up: {
      to: "route1",
      offset: 0
    }
  }
};
