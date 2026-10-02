import type { Dir, MapId, TrackId } from "../data/ids.js";
import type { SpriteId } from "../gfx/sprites.js";
import { TILE_DEFS } from "../gfx/tiles.js";
import type { Script } from "./script.js";

export interface NpcDef {
  id: string;
  x: number;
  y: number;
  sprite: SpriteId;
  dir: Dir;
  movement: "static" | "look" | "wander";
  script: Script;
  trainer?: {
    name: string;
    party: { level: number; pick: string }[];
    sight: number;
    reward: number;
    lose: string;
  };
}
export interface GameMap {
  id: MapId;
  name: string;
  music: TrackId;
  width: number;
  height: number;
  tiles: string[];
  overhead?: string[];
  outdoor: boolean;
  encounters?: { rate: number; minLevel: number; maxLevel: number };
  warps: { x: number; y: number; to: MapId; tx: number; ty: number; dir: Dir }[];
  npcs: NpcDef[];
  signs: { x: number; y: number; text: string }[];
  connections?: Partial<Record<Dir, { to: MapId; offset: number }>>;
}
export const VECTORS: Readonly<Record<Dir, readonly [number, number]>> = {
  up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0],
};
export const OPPOSITE: Readonly<Record<Dir, Dir>> = {
  up: "down", down: "up", left: "right", right: "left",
};
export function inBounds(map: GameMap, x: number, y: number): boolean {
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < map.width && y < map.height;
}
export function walkable(map: GameMap, x: number, y: number): boolean {
  return inBounds(map, x, y) && (TILE_DEFS[map.tiles[y][x]]?.walkable ?? false);
}
export function canMove(map: GameMap, x: number, y: number, dir: Dir,
  occupied: readonly { x: number; y: number }[] = []): boolean {
  const [dx, dy] = VECTORS[dir];
  const tx = x + dx;
  const ty = y + dy;
  return walkable(map, tx, ty) && (map.tiles[ty][tx] !== "v" || dir === "down")
    && !occupied.some((npc) => npc.x === tx && npc.y === ty);
}

export function connectionDestination(map: GameMap, dir: Dir, x: number, y: number,
  maps: Readonly<Record<MapId, GameMap>>): { map: MapId; x: number; y: number } | null {
  const connection = map.connections?.[dir];
  if (!connection) {
    return null;
  }
  const target = maps[connection.to];
  const tx = dir === "left" ? target.width - 1 : dir === "right" ? 0 : x + connection.offset;
  const ty = dir === "up" ? target.height - 1 : dir === "down" ? 0 : y + connection.offset;
  return walkable(target, tx, ty) ? { map: target.id, x: tx, y: ty } : null;
}
