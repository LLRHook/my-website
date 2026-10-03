import { describe, expect, it, vi } from "vitest";
import type { Dir, MapId } from "../data/ids.js";
import { buildSpecies, FALLBACK_REPOS, stageAt } from "../data/species.js";
import { trainerParty } from "../data/trainers.js";
import { DEFAULT_OPTIONS, lastCenter, reconcileFlags, visitCenter } from "../engine/storage.js";
import { canMove, connectionDestination, VECTORS, walkable } from "./map.js";
import { MAPS } from "./maps/index.js";
import { makeCenter, makeMart } from "./maps/interiors.js";
import { createNpcs } from "./npc.js";
import { newGame } from "./overworld.js";
import { runScript, type ScriptHost } from "./script.js";

const BADGES = ["badge:merge", "badge:pipeline", "badge:release"];

function reaches(mapId: MapId, start: { x: number; y: number }, target: { x: number; y: number },
  flags: readonly string[]): boolean {
  const map = MAPS[mapId];
  const queue = [start];
  const seen = new Set<string>();
  const npcs = createNpcs(map, flags);
  for (let index = 0; index < queue.length; index++) {
    const point = queue[index];
    const key = `${point.x},${point.y}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    if (point.x === target.x && point.y === target.y) {
      return true;
    }
    for (const [dir, [dx, dy]] of Object.entries(VECTORS)) {
      if (canMove(map, point.x, point.y, dir as Dir, npcs)) {
        queue.push({ x: point.x + dx, y: point.y + dy });
      }
    }
  }
  return false;
}

describe("region gates", () => {
  for (const [id, mapId, required] of [
    ["warden", "cave", ["badge:merge"]], ["ranger", "bay", ["badge:pipeline"]],
    ["guard", "ridge", BADGES],
  ] as const) {
    it(`${id} blocks without its badges, steps aside once and stays aside after reload`, async () => {
      const map = MAPS[mapId];
      const def = map.npcs.find((npc) => npc.id === id)!;
      const state = newGame("DEV", { ...DEFAULT_OPTIONS });
      const host: ScriptHost = {
        state, mon: "TEST", say: vi.fn(async () => {}), ask: vi.fn(async () => true),
        give: vi.fn(), heal: vi.fn(async () => {}), move: vi.fn(async () => {}), face: vi.fn(),
        battle: vi.fn(async () => {}), starter: vi.fn(async () => {}), open: vi.fn(),
        mart: vi.fn(async () => {}), pc: vi.fn(async () => {}), music: vi.fn(), wait: vi.fn(async () => {}),
      };
      expect(canMove(map, def.x, def.y + 1, "up", createNpcs(map))).toBe(false);
      await runScript(def.script, host);
      expect(host.move).not.toHaveBeenCalled();
      for (const badge of required) {
        state.flags = required.filter((flag) => flag !== badge);
        await runScript(def.script, host);
        expect(host.move).not.toHaveBeenCalled();
      }
      state.flags = [...required];
      await runScript(def.script, host);
      expect(host.move).toHaveBeenCalledExactlyOnceWith(id, ["right"]);
      expect(state.flags).toContain(`gate:${id}`);
      const loaded = createNpcs(map, state.flags);
      expect(loaded.find((npc) => npc.id === id)?.x).toBe(def.x + 1);
      expect(walkable(map, def.x + 1, def.y)).toBe(true);
      expect(canMove(map, def.x, def.y + 1, "up", loaded)).toBe(true);
      await runScript(def.script, host);
      expect(host.move).toHaveBeenCalledTimes(1);
    });
  }
  it("hides the lab Professor during the final challenge and restores him after the win", () => {
    expect(createNpcs(MAPS.lab, ["badge:release"]).some((npc) => npc.id === "prof")).toBe(false);
    expect(createNpcs(MAPS.lab, ["badge:release", "champion"]).some((npc) => npc.id === "prof")).toBe(true);
  });
  it("the ladder, mountain entrance and Tower door have no way around their gates", () => {
    for (const [id, map, start, target] of [
      ["warden", "cave", { x: 9, y: 18 }, { x: 9, y: 3 }],
      ["ranger", "bay", { x: 11, y: 20 }, { x: 11, y: 0 }],
      ["guard", "ridge", { x: 11, y: 20 }, { x: 11, y: 2 }],
    ] as const) {
      expect(reaches(map, start, target, []), id).toBe(false);
      expect(reaches(map, start, target, [...BADGES, `gate:${id}`]), id).toBe(true);
    }
  });
});

describe("Centers and legacy flags", () => {
  it("migrates old flags, is idempotent and prefers the newest explicit Center", () => {
    const migrated = reconcileFlags(["badge", "lastCenter", "defeated:rhea"]);
    expect(migrated).toEqual(["defeated:rhea", "badge:merge", "lastCenter:center"]);
    expect(reconcileFlags(migrated)).toEqual(migrated);
    expect(reconcileFlags(["lastCenter", "lastCenter:ridgeCenter", "lastCenter:bayCenter"]))
      .toEqual(["lastCenter:bayCenter"]);
  });
  it("blackout selects home or the last visited Center, with one flag kept", () => {
    const save = newGame("DEV", { ...DEFAULT_OPTIONS });
    expect(lastCenter(save.flags)).toBe("bedroom");
    expect(lastCenter(["lastCenter"])).toBe("center");
    for (const id of ["center", "ridgeCenter", "bayCenter"] as const) {
      visitCenter(save, id);
      expect(lastCenter(save.flags)).toBe(id);
      expect(save.flags.filter((flag) => flag.startsWith("lastCenter:"))).toEqual([`lastCenter:${id}`]);
    }
    visitCenter(save, "tower");
    expect(lastCenter(save.flags)).toBe("bayCenter");
  });
  it("Commit interiors are unchanged and all factory return doors are paired", () => {
    expect(makeCenter("center", "commit", { x: 5, y: 7 })).toEqual(MAPS.center);
    expect(makeMart("mart", "commit", { x: 17, y: 7 })).toEqual(MAPS.mart);
    expect(MAPS.center.tiles).toEqual([
      "#pppppppppp#", "#BIupKpIpuC#", "#_______h__#", "#_ttttttt__#",
      "#__________#", "#Pnn____nnP#", "#__________#", "#####D######",
    ]);
  });
});

describe("region teams and habitats", () => {
  it("gives leaders and gates their own designs and varies adjacent route trainer archetypes", () => {
    for (const [map, id] of [["pipeGym", "otto"], ["releaseGym", "mira"],
      ["cave", "warden"], ["bay", "ranger"], ["ridge", "guard"]] as const) {
      expect(MAPS[map].npcs.find((npc) => npc.id === id)?.sprite).toBe(id);
    }
    const archetypes = new Set<string>();
    for (const map of [MAPS.route3, MAPS.route4, MAPS.pipeGym, MAPS.releaseGym, MAPS.tower]) {
      const trainers = map.npcs.filter((npc) => npc.trainer);
      for (let index = 0; index < trainers.length; index++) {
        expect(trainers[index].sprite).not.toBe("trainer");
        if (index) {
          expect(trainers[index].sprite).not.toBe(trainers[index - 1].sprite);
        }
        archetypes.add(trainers[index].sprite);
      }
    }
    for (const sprite of ["hiker", "sailor", "skier", "ace"]) {
      expect(archetypes.has(sprite)).toBe(true);
    }
  });
  it("star picks sort by stars, then newest push, and wrap on small payloads", () => {
    const species = buildSpecies([
      { ...FALLBACK_REPOS[0], id: 20, stars: 4, pushedAt: "2026-01-01" },
      { ...FALLBACK_REPOS[1], id: 30, stars: 7, pushedAt: "2024-01-01" },
      { ...FALLBACK_REPOS[2], id: 40, stars: 4, pushedAt: "2025-01-01" },
    ]);
    const champion = MAPS.tower.npcs.find((npc) => npc.id === "champion")!;
    expect(trainerParty(champion, species).map((mon) => mon.species)).toEqual([30, 20, 40, 30, 20, 40]);
    expect(trainerParty(champion, [])).toEqual([]);
  });
  it("leaders have the exact parties and rewards and every stage comes from stageAt", () => {
    const species = buildSpecies(FALLBACK_REPOS);
    for (const [map, id, levels, picks, reward] of [
      [MAPS.pipeGym, "otto", [22, 23, 24, 25], ["star:5", "star:6", "mixed", "star:2"], 1500],
      [MAPS.releaseGym, "mira", [30, 31, 32, 33, 34], ["star:4", "mixed", "star:3", "mixed", "star:1"], 2500],
      [MAPS.tower, "champion", [36, 37, 38, 39, 40, 42],
        ["star:1", "star:2", "star:3", "star:4", "star:5", "star:6"], 4000],
    ] as const) {
      const npc = map.npcs.find((npc) => npc.id === id)!;
      expect(npc.trainer?.party.map((entry) => entry.pick)).toEqual(picks);
      expect(npc.trainer?.reward).toBe(reward);
      const team = trainerParty(npc, species);
      expect(team.map((mon) => mon.level)).toEqual(levels);
      for (const mon of team) {
        expect(mon.stage).toBe(stageAt(species.find((entry) => entry.id === mon.species)!, mon.level));
        expect(mon.hp).toBeGreaterThan(0);
        expect(mon.moves.length).toBeGreaterThan(0);
      }
    }
  });
  it("all species keep their original third and can be caught on both late routes", () => {
    const species = buildSpecies(FALLBACK_REPOS);
    expect(new Set(species.map((entry) => entry.habitat[0]))).toEqual(new Set(["route1", "route2", "cave"]));
    for (const entry of species) {
      expect(entry.habitat.slice(1)).toEqual(["route3", "route4"]);
    }
  });
});

describe("region travel", () => {
  it("connections are reciprocal and every usable edge lands on walkable ground", () => {
    for (const map of Object.values(MAPS)) {
      for (const [dir, link] of Object.entries(map.connections ?? {})) {
        const opposite = { up: "down", down: "up", left: "right", right: "left" } as const;
        expect(MAPS[link.to].connections?.[opposite[dir as Dir]])
          .toEqual({ to: map.id, offset: link.offset === 0 ? 0 : -link.offset });
        const horizontal = dir === "left" || dir === "right";
        for (let index = 0; index < (horizontal ? map.height : map.width); index++) {
          const x = horizontal ? dir === "left" ? 0 : map.width - 1 : index;
          const y = horizontal ? index : dir === "up" ? 0 : map.height - 1;
          if (walkable(map, x, y)) {
            const [dx, dy] = VECTORS[dir as Dir];
            expect(connectionDestination(map, dir as Dir, x + dx, y + dy, MAPS), `${map.id}:${x},${y}`)
              .not.toBeNull();
          }
        }
      }
    }
  });
  it("the deploy maze needs exactly five pads; wrong pads return to the entrance", () => {
    const map = MAPS.releaseGym;
    const queue = [{ x: 2, y: 14, pads: 0 }];
    const visited = new Map<string, number>();
    const reached: number[] = [];
    for (let index = 0; index < queue.length; index++) {
      const point = queue[index];
      const key = `${point.x},${point.y}`;
      if ((visited.get(key) ?? Infinity) <= point.pads) {
        continue;
      }
      visited.set(key, point.pads);
      if (point.x === 8 && point.y === 3) {
        reached.push(point.pads);
      }
      for (const [dir, [dx, dy]] of Object.entries(VECTORS)) {
        if (!canMove(map, point.x, point.y, dir as Dir, map.npcs)) {
          continue;
        }
        const x = point.x + dx;
        const y = point.y + dy;
        const warp = map.warps.find((warp) => warp.x === x && warp.y === y);
        if (warp && warp.to !== map.id) {
          continue;
        }
        queue.push(warp ? { x: warp.tx, y: warp.ty, pads: point.pads + 1 } : { x, y, pads: point.pads });
      }
    }
    expect(Math.min(...reached)).toBe(5);
    const returns = map.warps.filter((warp) => warp.to === map.id && warp.tx === 2 && warp.ty === 14);
    expect(returns).toHaveLength(6);
  });
  it("a saved player behind Pipeline barriers can always return via downhill service ledges", () => {
    for (const y of [4, 7, 10]) {
      expect(canMove(MAPS.pipeGym, 10, y - 1, "down")).toBe(true);
      expect(walkable(MAPS.pipeGym, 10, y + 1)).toBe(true);
      expect(canMove(MAPS.pipeGym, 10, y + 1, "up")).toBe(false);
    }
  });
});
