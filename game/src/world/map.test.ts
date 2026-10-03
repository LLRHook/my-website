import { describe, expect, it } from "vitest";
import type { Dir, MapId } from "../data/ids.js";
import { TILE_DEFS, lightAt, remap } from "../gfx/tiles.js";
import { createNpcs } from "./npc.js";
import { MAPS } from "./maps/index.js";
import { VECTORS, canMove, connectionDestination, inBounds, walkable } from "./map.js";

const directions = Object.keys(VECTORS) as Dir[];
describe("authored maps", () => {
  for (const map of Object.values(MAPS)) {
    it(`${map.id}: dimensions, legend, positions and paired warps`, () => {
      expect(map.tiles).toHaveLength(map.height);
      for (const row of map.tiles) {
        expect(row).toHaveLength(map.width);
        for (const tile of row) {
          expect(TILE_DEFS[tile], `Unknown ${tile}`).toBeDefined();
        }
      }
      if (map.overhead) {
        expect(map.overhead).toHaveLength(map.height);
        map.overhead.forEach((row) => {
          expect(row).toHaveLength(map.width);
          [...row].forEach((tile) => expect(tile === " " || !!TILE_DEFS[tile]).toBe(true));
        });
      }
      for (const point of [...map.npcs, ...map.signs, ...map.warps]) {
        expect(walkable(map, point.x, point.y), `${map.id} ${point.x},${point.y}`).toBe(true);
      }
      for (const warp of map.warps) {
        const target = MAPS[warp.to];
        expect(walkable(target, warp.tx, warp.ty)).toBe(true);
        if (warp.to === map.id) {
          expect(map.tiles[warp.y][warp.x]).toBe("@");
          continue;
        }
        expect(target.warps.some((back) => back.x === warp.tx && back.y === warp.ty && back.to === map.id
          && back.tx === warp.x && back.ty === warp.y)).toBe(true);
      }
    });
  }
  it("bedroom, lab, gym and every map are reachable via walkable tiles, warps and connections", () => {
    const queue: { map: MapId; x: number; y: number }[] = [{ map: "bedroom", x: 4, y: 4 }];
    const visited = new Set<string>();
    const maps = new Set<MapId>();
    for (let index = 0; index < queue.length; index++) {
      const point = queue[index];
      const key = `${point.map}:${point.x}:${point.y}`;
      if (visited.has(key)) {
        continue;
      }
      visited.add(key);
      maps.add(point.map);
      const original = MAPS[point.map];
      const map = original.id === "pipeGym" ? { ...original,
        tiles: original.tiles.map((row) => row.replaceAll("|", "/")),
      } : original;
      const npcs = createNpcs(map, ["gate:warden", "gate:ranger", "gate:guard"]);
      for (const dir of directions) {
        const [dx, dy] = VECTORS[dir];
        const x = point.x + dx;
        const y = point.y + dy;
        if (canMove(map, point.x, point.y, dir, npcs)) {
          const hop = map.tiles[y][x] === "v" ? 1 : 0;
          if (walkable(map, x + dx * hop, y + dy * hop)) {
            queue.push({ map: point.map, x: x + dx * hop, y: y + dy * hop });
          }
        } else if (!inBounds(map, x, y)) {
          const connection = connectionDestination(map, dir, x, y, MAPS);
          if (connection) {
            queue.push(connection);
          }
        }
      }
      map.warps.filter((warp) => warp.x === point.x && warp.y === point.y)
        .forEach((warp) => queue.push({ map: warp.to, x: warp.tx, y: warp.ty }));
    }
    expect(maps).toEqual(new Set(Object.keys(MAPS)));
    expect(visited.has("lab:4:7")).toBe(true);
    expect(visited.has("gym:4:3")).toBe(true);
    expect(visited.has("tower:5:3")).toBe(true);
    expect(visited.has("releaseGym:8:3")).toBe(true);
  });
});
describe("movement and palette", () => {
  it("walls, NPCs and out-of-bounds positions block movement", () => {
    expect(canMove(MAPS.bedroom, 4, 2, "up")).toBe(false);
    expect(canMove(MAPS.bedroom, 4, 4, "down")).toBe(true);
    expect(canMove(MAPS.lab, 4, 7, "up", MAPS.lab.npcs)).toBe(false);
    expect(walkable(MAPS.bedroom, -1, 3)).toBe(false);
  });
  it("ledges are south-only", () => {
    expect(canMove(MAPS.route1, 4, 20, "down")).toBe(true);
    expect(canMove(MAPS.route1, 4, 22, "up")).toBe(false);
  });
  it("clock boundaries and crisp palette remaps", () => {
    expect([6, 7, 16, 17, 19, 20].map(lightAt)).toEqual(["night", "day", "day", "dusk", "dusk", "night"]);
    for (const tile of Object.values(TILE_DEFS)) {
      expect(tile.colours.length).toBeLessThanOrEqual(4);
      for (const index of tile.colours) {
        expect(remap(index, "night")).toBeGreaterThanOrEqual(0);
        expect(remap(index, "night")).toBeLessThan(32);
      }
    }
  });
});
