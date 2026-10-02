import { WORLD_TEXT as T } from "../../data/text.js";
import type { GameMap } from "../map.js";
export const route1: GameMap = {
  id: "route1",
  name: "ROUTE 1",
  music: "route",
  width: 20,
  height: 36,
  outdoor: true,
  tiles: [
    "TTTTTTTTT::TTTTTTTTT",
    "T........::........T",
    "T..ggg...::........T",
    "T.ggggg..::S.......T",
    "T..gg:g..::........T",
    "T........::...~~...T",
    "T...Znn..::...~~...T",
    "T.....S::::...~~...T",
    "T..l..:::::...~~.O.T",
    "T.FFFF...::........T",
    "T........::........T",
    "T..TT....::..ggg...T",
    "T........::.ggggg..T",
    "T........::.gg::gg.T",
    "T........::.gg::.g.T",
    "T..Z.....::..ggggg.T",
    "T...O....::....gg..T",
    "T........::........T",
    "T........::::::::..T",
    "T........::::::::..T",
    "T........::........T",
    "T.vvvvv..::.vvv....T",
    "T........::........T",
    "T..ggg...::........T",
    "T.ggigg:.::........T",
    "T.gggg::.::........T",
    "T..gg.gg.::.....Z..T",
    "T...ggg..::....l...T",
    "T........::........T",
    "T...:::::::........T",
    "T...:::::::......TTT",
    "T........::........T",
    "T..fff...::S.......T",
    "T........::........T",
    "T........::........T",
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
    "                    ",
    "                    "
  ],
  warps: [],
  npcs: [
    {
      id: "leni",
      x: 6,
      y: 30,
      sprite: "trainer",
      dir: "right",
      movement: "static",
      script: [
        {
          say: T.r1a
        },
        {
          battle: "leni"
        }
      ],
      trainer: {
        name: "Scout Leni",
        party: [
          {
            level: 4,
            pick: "mixed"
          }
        ],
        sight: 5,
        reward: 80,
        lose: T.r1aLose
      }
    },
    {
      id: "kit",
      x: 14,
      y: 19,
      sprite: "trainer",
      dir: "left",
      movement: "static",
      script: [
        {
          say: T.r1b
        },
        {
          battle: "kit"
        }
      ],
      trainer: {
        name: "Runner Kit",
        party: [
          {
            level: 6,
            pick: "mixed"
          }
        ],
        sight: 5,
        reward: 100,
        lose: T.r1bLose
      }
    },
  ],
  signs: [
    { x: 6, y: 7, text: T.routeRest },
    { x: 11, y: 3, text: T.routeField },
    {
      x: 11,
      y: 32,
      text: T.route1Sign
    },
    {
      x: 4,
      y: 24,
      text: T.item
    },
  ],
  encounters: {
    rate: 0.12,
    minLevel: 2,
    maxLevel: 6
  },
  connections: {
    down: {
      to: "sterling",
      offset: 0
    },
    up: {
      to: "commit",
      offset: 2
    }
  }
};
