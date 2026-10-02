import { WORLD_TEXT as T } from "../../data/text.js";
import type { GameMap } from "../map.js";
export const house: GameMap = {
  id: "house",
  name: "GRAN'S HOUSE",
  music: "town",
  width: 8,
  height: 8,
  outdoor: false,
  tiles: [
    "#pppppp#",
    "#JUEuKP#",
    "#_____s#",
    "#zzH___#",
    "#Vtt___#",
    "#_H_rr_#",
    "#______#",
    "###D####",
  ],
  warps: [
    {
      "x": 6,
      "y": 2,
      "to": "bedroom",
      "tx": 6,
      "ty": 2,
      "dir": "down"
    },
    {
      "x": 3,
      "y": 7,
      "to": "sterling",
      "tx": 5,
      "ty": 9,
      "dir": "down"
    },
  ],
  npcs: [
    {
      id: "gran",
      x: 5,
      y: 4,
      sprite: "gran",
      dir: "left",
      movement: "look",
      script: [
        {
          if: "granGift",
          then: [
            {
              say: T.granAgain
            }
          ],
          else: [
            {
              say: T.gran
            },
            {
              give: "patch",
              qty: 2
            },
            {
              flag: "granGift",
              set: true
            }
          ]
        }
      ]
    },
  ],
  signs: [
    {
      x: 1,
      y: 2,
      text: T.books
    },
  ]
};
