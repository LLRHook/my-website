import { WORLD_TEXT as T } from "../../data/text.js";
import type { MapId } from "../../data/ids.js";
import type { GameMap } from "../map.js";

export function makeCenter(id: MapId, town: MapId, door: { x: number; y: number }): GameMap {
  return {
    id,
    name: "CODELING CENTER",
    music: "center",
    width: 12,
    height: 8,
    outdoor: false,
    tiles: [
      "#pppppppppp#",
      "#BIupKpIpuC#",
      "#_______h__#",
      "#_ttttttt__#",
      "#__________#",
      "#Pnn____nnP#",
      "#__________#",
      "#####D######",
    ],
    warps: [
      {
        "x": 5,
        "y": 7,
        "to": town,
        "tx": door.x,
        "ty": door.y,
        "dir": "down"
      },
    ],
    npcs: [
      {
        id: "ada",
        x: 5,
        y: 2,
        sprite: "medic",
        dir: "down",
        movement: "static",
        script: [
          {
            say: T.ada
          },
          {
            heal: true
          },
          {
            say: T.healed
          }
        ]
      },
    ],
    signs: [
      {
        x: 10,
        y: 2,
        text: T.box
      },
      {
        x: 1,
        y: 2,
        text: T.books
      },
    ]
  };
}

export function makeMart(id: MapId, town: MapId, door: { x: number; y: number }): GameMap {
  return {
    id,
    name: "PIP MART",
    music: "town",
    width: 10,
    height: 8,
    outdoor: false,
    tiles: [
      "#pppppppp#",
      "#XXKpuXXX#",
      "#________#",
      "#ttttttt_#",
      "#________#",
      "#XX____XP#",
      "#________#",
      "####D#####",
    ],
    warps: [
      {
        "x": 4,
        "y": 7,
        "to": town,
        "tx": door.x,
        "ty": door.y,
        "dir": "down"
      },
    ],
    npcs: [
      {
        id: "pip",
        x: 4,
        y: 2,
        sprite: "clerk",
        dir: "down",
        movement: "static",
        script: [
          {
            say: T.clerk
          },
          {
            mart: true
          }
        ]
      },
    ],
    signs: [
      {
        x: 1,
        y: 2,
        text: T.mart
      },
    ]
  };
}
