import type { Dir } from "../data/ids.js";
import { VECTORS, canMove, type GameMap, type NpcDef } from "./map.js";

export interface NpcState extends NpcDef {
  homeX: number;
  homeY: number;
  px: number;
  py: number;
  frame: number;
}
export function createNpcs(map: GameMap): NpcState[] {
  return map.npcs.map((npc) => ({ ...npc, homeX: npc.x, homeY: npc.y, px: npc.x * 16, py: npc.y * 16, frame: 0 }));
}
export function trainerSees(map: GameMap, npc: NpcDef, x: number, y: number,
  occupied: readonly { x: number; y: number }[] = []): boolean {
  if (!npc.trainer) {
    return false;
  }
  const [dx, dy] = VECTORS[npc.dir];
  for (let step = 1; step <= npc.trainer.sight; step++) {
    const tx = npc.x + dx * step;
    const ty = npc.y + dy * step;
    if (!canMove(map, tx - dx, ty - dy, npc.dir, occupied)) {
      return false;
    }
    if (tx === x && ty === y) {
      return true;
    }
  }
  return false;
}
export function faceToward(npc: { x: number; y: number }, x: number, y: number): Dir {
  return Math.abs(x - npc.x) > Math.abs(y - npc.y)
    ? x > npc.x ? "right" : "left" : y > npc.y ? "down" : "up";
}
export function wander(npc: NpcState, map: GameMap, dir: Dir,
  occupied: readonly { x: number; y: number }[]): void {
  npc.dir = dir;
  const [dx, dy] = VECTORS[dir];
  if (canMove(map, npc.x, npc.y, dir, occupied)
    && Math.abs(npc.x + dx - npc.homeX) <= 2 && Math.abs(npc.y + dy - npc.homeY) <= 2) {
    npc.x += dx;
    npc.y += dy;
  }
}
