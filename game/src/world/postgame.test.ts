import { CodexScene } from "../ui/codex.js";
import { describe, expect, it, vi } from "vitest";
import { buildSpecies, FALLBACK_REPOS, originSpecies, ORIGIN_ID, speciesById, stageAt } from "../data/species.js";
import { rematchParty } from "../data/trainers.js";
import { mulberry32 } from "../engine/rng.js";
import { DEFAULT_OPTIONS, reconcileSpecies } from "../engine/storage.js";
import { Battle } from "../battle/battle.js";
import { createCodeling } from "../battle/stats.js";
import { pendingEvolutions } from "../battle/evolution.js";
import { newGame, OverworldScene } from "./overworld.js";
import type { Input } from "../engine/input.js";
import type { Audio } from "../engine/audio.js";
import { SceneStack } from "../engine/scenes.js";
import { BattleScene } from "../battle/battleScene.js";
import type { BattleResult } from "../battle/battle.js";
import { canMove } from "./map.js";
import { createNpcs } from "./npc.js";
import { MAPS } from "./maps/index.js";
import { runScript, type ScriptHost } from "./script.js";
import { diplomaComplete, keyboardSpot, localDate, markRematch, nextMilestone, postGame,
  questScript, questState, rematchAvailable, rematchScript, setQuestState } from "./postgame.js";

const species = buildSpecies(FALLBACK_REPOS);
const fixture = (flags: string[] = ["champion"]) => {
  const state = newGame("DEV", { ...DEFAULT_OPTIONS });
  state.flags = flags;
  state.party = [createCodeling(species[0], 50, mulberry32(1))];
  return state;
};
function host(state = fixture()): ScriptHost {
  return { state, mon: "TEST", say: vi.fn(async () => {}), ask: vi.fn(async () => true),
    give: vi.fn(), heal: vi.fn(async () => {}), move: vi.fn(async () => {}), face: vi.fn(),
    battle: vi.fn(async () => {}), starter: vi.fn(async () => {}), open: vi.fn(),
    mart: vi.fn(async () => {}), pc: vi.fn(async () => {}), music: vi.fn(), wait: vi.fn(async () => {}) };
}

describe("post-game rematches", () => {
  it("uses the local calendar and pads single digits", () => {
    expect(localDate(new Date(2026, 0, 2, 0, 1))).toBe("2026-01-02");
    expect(localDate(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
  });
  it.each(["rhea", "otto", "mira", "prof"] as const)("gates %s and replaces its daily flag only", (id) => {
    const flags = ["champion", "rematch:other:2026-01-01", `rematch:${id}:2026-01-01`];
    expect(rematchAvailable([], id, "2026-01-02")).toBe(false);
    expect(rematchAvailable(flags, id, "2026-01-02")).toBe(true);
    markRematch(flags, id, "2026-01-02");
    markRematch(flags, id, "2026-01-02");
    expect(rematchAvailable(flags, id, "2026-01-02")).toBe(false);
    expect(flags).toEqual(["champion", "rematch:other:2026-01-01", `rematch:${id}:2026-01-02`]);
    expect(rematchAvailable(flags, id, "2026-01-03")).toBe(true);
  });
  it.each([["rhea", 40], ["otto", 45], ["mira", 50], ["prof", 58]] as const)(
    "%s fields six appropriately evolved members from the repository pool", (id, first) => {
      const party = rematchParty(id, species, mulberry32(7));
      expect(party.map((mon) => mon.level)).toEqual(Array.from({ length: 6 }, (_, index) => first + index));
      expect(new Set(party.map((mon) => mon.species)).size).toBeGreaterThan(1);
      for (const mon of party) {
        expect(mon.stage).toBe(stageAt(speciesById(species, mon.species)!, mon.level));
        expect(mon.species).not.toBe(ORIGIN_ID);
      }
      expect(rematchParty(id, [], mulberry32(7))).toEqual([]);
    });
  it("offers YES/NO and the cooldown script never starts a battle", async () => {
    const h = host();
    await runScript(rematchScript(h.state.flags, "rhea", "2026-01-02"), h);
    expect(h.ask).toHaveBeenCalledWith(expect.stringContaining("Rematch?"));
    expect(h.battle).toHaveBeenCalledOnce();
    vi.mocked(h.ask).mockResolvedValueOnce(false);
    await runScript(rematchScript(h.state.flags, "rhea", "2026-01-02"), h);
    expect(h.battle).toHaveBeenCalledOnce();
    markRematch(h.state.flags, "rhea", "2026-01-02");
    await runScript(rematchScript(h.state.flags, "rhea", "2026-01-02"), h);
    expect(h.battle).toHaveBeenCalledOnce();
    expect(h.say).toHaveBeenLastCalledWith(expect.stringContaining("tomorrow"));
  });
});

describe("ORIGIN", () => {
  it("is deterministic, reserved, single form and outside repository generation", () => {
    const origin = originSpecies();
    expect(originSpecies()).toEqual(origin);
    expect(origin).toMatchObject({ id: 0, dex: 0, name: "ORIGIN", type: "normal", catchRate: 3,
      stages: 1, evolveAt: [], repo: { url: FALLBACK_REPOS[0].url } });
    expect(origin.forms).toHaveLength(1);
    expect(Object.values(origin.base).reduce((sum, stat) => sum + stat, 0)).toBe(600);
    expect(species.some((entry) => entry.id === ORIGIN_ID)).toBe(false);
    expect(speciesById(species, 0)).toEqual(origin);
    expect(speciesById(species, -1)).toBeUndefined();
  });
  it("resolves in battle and does not evolve or count toward the diploma", () => {
    const mon = createCodeling(originSpecies(), 50, mulberry32(2));
    const battle = new Battle({ party: [mon], foes: [mon], species, bag: {} }, mulberry32(3));
    expect(battle.name(mon)).toBe("ORIGIN");
    expect(pendingEvolutions([mon], species, new Set([mon.uid]), "win")).toEqual([]);
    expect(diplomaComplete([...species, originSpecies()], species.map((entry) => entry.id))).toBe(true);
    expect(diplomaComplete(species, [ORIGIN_ID])).toBe(false);
    const state = fixture();
    state.party = [mon];
    state.seen = [0];
    state.caught = [0];
    const loaded = reconcileSpecies(state, new Set(species.map((entry) => entry.id)));
    expect(loaded.party).toEqual([mon]);
    expect(loaded.seen).toEqual([0]);
    expect(loaded.caught).toEqual([0]);
  });

  it("shows Codex 000 only after Champion and ORIGIN has been seen", () => {
    const state = fixture([]);
    state.seen = [0];
    const root = { dataset: {} } as HTMLElement;
    const stack = new SceneStack(root);
    const codex = () => new CodexScene({} as Input, {} as Audio, stack, state, species);
    expect((Reflect.get(codex(), "species") as typeof species).map((entry) => entry.id)).not.toContain(0);
    state.flags.push("champion");
    expect((Reflect.get(codex(), "species") as typeof species)[0].dex).toBe(0);
    state.seen = [];
    expect((Reflect.get(codex(), "species") as typeof species).map((entry) => entry.id)).not.toContain(0);
  });
  it("gates the vault NPC, keeps it until caught and has no random encounters", () => {
    expect(postGame([])).toBe(false);
    expect(createNpcs(MAPS.vault, [])).toEqual([]);
    expect(createNpcs(MAPS.vault, ["champion"]).map((npc) => npc.id)).toEqual(["origin"]);
    expect(createNpcs(MAPS.vault, ["champion", "origin"])).toEqual([]);
    expect(MAPS.vault.encounters).toBeUndefined();
    expect(MAPS.vault.music).toBe("cave");
    expect(canMove(MAPS.vault, 8, 7, "left", createNpcs(MAPS.vault, ["champion"]))).toBe(true);
    expect(MAPS.vault.tiles).toHaveLength(10);
    expect(MAPS.vault.tiles.every((row) => row.length === 10)).toBe(true);
  });
});

describe("post-game side quests", () => {
  it.each(["keyboard", "evolved", "milestones"] as const)("gates %s and replaces only its own state", (id) => {
    const flags = ["champion", "unrelated"];
    expect(questState(flags, id)).toBeNull();
    setQuestState(flags, id, "started");
    setQuestState(flags, id, "done");
    expect(flags).toEqual(["champion", "unrelated", `quest:${id}:done`]);
    expect(questState(flags, id)).toBe("done");
    expect(questScript(fixture([]), id, species)).toEqual([]);
  });
  it("finds the keyboard only during the quest and pays exactly once on return", async () => {
    const h = host();
    const before = h.state.coins;
    expect(keyboardSpot([])).toEqual([]);
    expect(keyboardSpot(["champion"])).toEqual([]);
    expect(keyboardSpot(["quest:keyboard:started"])).toEqual([]);
    await runScript(questScript(h.state, "keyboard", species), h);
    expect(questState(h.state.flags, "keyboard")).toBe("started");
    await runScript(keyboardSpot(h.state.flags), h);
    expect(questState(h.state.flags, "keyboard")).toBe("found");
    expect(keyboardSpot(h.state.flags)).toEqual([]);
    await runScript(questScript(h.state, "keyboard", species), h);
    await runScript(questScript(h.state, "keyboard", species), h);
    expect(questState(h.state.flags, "keyboard")).toBe("done");
    expect(h.state.coins).toBe(before + 1000);
    expect(h.state.bag.hotfix).toBe(3);
  });
  it("requires an evolved member in the party and pays five Great Fork once", async () => {
    const h = host();
    h.state.party[0].stage = 1;
    await runScript(questScript(h.state, "evolved", species), h);
    expect(questState(h.state.flags, "evolved")).toBe("started");
    expect(h.state.bag.greatFork).toBeUndefined();
    h.state.party[0].stage = 2;
    await runScript(questScript(h.state, "evolved", species), h);
    await runScript(questScript(h.state, "evolved", species), h);
    expect(h.state.bag.greatFork).toBe(5);
    expect(questState(h.state.flags, "evolved")).toBe("done");
  });
  it("rounds thresholds up and returns only the next reached unclaimed tier", () => {
    expect(nextMilestone(1, 5, 0)).toBeNull();
    expect(nextMilestone(2, 5, 0)).toBe(1);
    expect(nextMilestone(2, 5, 1)).toBeNull();
    expect(nextMilestone(3, 5, 1)).toBe(2);
    expect(nextMilestone(4, 5, 2)).toBeNull();
    expect(nextMilestone(5, 5, 2)).toBe(3);
    expect(nextMilestone(5, 5, 3)).toBeNull();
    expect(nextMilestone(0, 0, 0)).toBeNull();
    expect(nextMilestone(1, 1, 0)).toBe(1);
  });
  it("counts repository species only and claims one milestone per talk in order", async () => {
    const h = host();
    const before = h.state.coins;
    h.state.caught = [0];
    await runScript(questScript(h.state, "milestones", species), h);
    expect(questState(h.state.flags, "milestones")).toBeNull();
    h.state.caught = [0, ...species.map((entry) => entry.id)];
    for (const tier of [1, 2, 3]) {
      await runScript(questScript(h.state, "milestones", species), h);
      expect(questState(h.state.flags, "milestones")).toBe(String(tier));
    }
    await runScript(questScript(h.state, "milestones", species), h);
    expect(h.state.bag).toEqual({ greatFork: 5, fullRebuild: 3, rollback: 3 });
    expect(h.state.coins).toBe(before + 3000);
  });
});

describe("post-game overworld integration", () => {
  function scene(flags: string[] = ["champion"], map: "vault" | "cave" = "vault") {
    const state = fixture(flags);
    Object.assign(state, { map, x: 4, y: 5 });
    const root = { dataset: {} } as HTMLElement;
    const stack = new SceneStack(root);
    const audio = { play: vi.fn(), sfx: vi.fn() } as unknown as Audio;
    const world = new OverworldScene({} as Input, audio, stack, root, state, FALLBACK_REPOS, 12, mulberry32(1));
    vi.spyOn(world, "say").mockResolvedValue();
    vi.spyOn(world, "ask").mockResolvedValue(false);
    return { state, world, stack };
  }

  async function finish(stack: SceneStack, result: BattleResult): Promise<BattleScene> {
    const battle = stack.current as BattleScene;
    expect(battle).toBeInstanceOf(BattleScene);
    const complete = Reflect.get(battle, "complete") as
      (result: BattleResult, levelledUp: ReadonlySet<string>) => Promise<void>;
    await complete(result, new Set());
    return battle;
  }

  it("blocks the cave door and redirects unauthorized vault saves", () => {
    const before = scene([], "cave");
    const closed = Reflect.get(before.world, "movementMap") as typeof MAPS.cave;
    expect(closed.tiles[6][0]).toBe("A");
    expect(closed.tiles).toEqual(MAPS.cave.tiles.map((row, y) => y === 6 ? "A" + row.slice(1) : row));
    const extraDoor = MAPS.cave.tiles.map((row, y) => y === 2 ? "0" + row.slice(1) : row);
    Reflect.set(before.world, "map", { ...MAPS.cave, tiles: extraDoor });
    expect((Reflect.get(before.world, "movementMap") as typeof MAPS.cave).tiles[2][0]).toBe("0");
    const after = scene(["champion"], "cave");
    const open = Reflect.get(after.world, "movementMap") as typeof MAPS.cave;
    expect(open.tiles[6][0]).toBe("0");
    expect(scene([]).state.map).toBe("cave");
  });

  it.each(["win", "lose"] as const)("marks a rematch and doubles its reward only after a win (%s)", async (result) => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    try {
      const { state, world, stack } = scene(["champion", "defeated:rhea"]);
      vi.spyOn(stack, "push").mockImplementation((battle) => {
        Reflect.set(stack, "scenes", [battle]);
      });
      const before = state.coins;
      const pending = world.startTrainerBattle(MAPS.gym.npcs.find((npc) => npc.id === "rhea")!);
      await finish(stack, result);
      await pending;
      expect(state.flags.some((flag) => flag.startsWith("rematch:rhea:"))).toBe(result === "win");
      expect(state.coins).toBe(result === "win" ? before + 1000 : Math.floor(before / 2));
      if (result === "win") {
        await world.startTrainerBattle(MAPS.gym.npcs.find((npc) => npc.id === "rhea")!);
        expect(stack.push).toHaveBeenCalledOnce();
      }
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it.each(["caught", "win", "run"] as const)("handles the static ORIGIN encounter (%s)", async (result) => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    try {
      const { state, world, stack } = scene();
      vi.spyOn(stack, "push").mockImplementation((battle) => {
        Reflect.set(stack, "scenes", [battle]);
      });
      const pending = world.battle("origin");
      const battle = await finish(stack, result);
      expect(battle.battle.mon(1)).toMatchObject({ species: 0, level: 50, stage: 1 });
      expect(Reflect.get(battle, "battleTrack")).toBe("champion");
      expect(battle.battle.config.trainer).toBeUndefined();
      await pending;
      expect(state.seen).toContain(0);
      expect(state.flags.includes("origin")).toBe(result === "caught");
      expect(state.caught.includes(0)).toBe(result === "caught");
      expect(state.party.some((mon) => mon.species === 0)).toBe(result === "caught");
      const npcs = Reflect.get(world, "npcs") as { id: string }[];
      expect(npcs.some((npc) => npc.id === "origin")).toBe(false);
      expect(createNpcs(MAPS.vault, state.flags).some((npc) => npc.id === "origin")).toBe(result !== "caught");
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it("does not start ORIGIN or the Professor rematch before Champion", async () => {
    const { world, stack } = scene([]);
    const push = vi.spyOn(stack, "push");
    await world.battle("origin");
    await world.startTrainerBattle(MAPS.lab.npcs.find((npc) => npc.id === "prof")!);
    expect(push).not.toHaveBeenCalled();
  });
});
