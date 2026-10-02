import { describe, expect, it } from "vitest";
import { buildSpecies, FALLBACK_REPOS, starterCandidates } from "../data/species.js";
import type { Species } from "../data/species.js";
import { mulberry32 } from "../engine/rng.js";
import { DEFAULT_OPTIONS, validSave } from "../engine/storage.js";
import type { Codeling } from "../engine/storage.js";
import { newGame } from "../world/overworld.js";
import { TYPES, effectiveness } from "./types.js";
import { MOVES } from "./moves.js";
import { createCodeling, expForLevel, expGain, stageMultiplier, stats } from "./stats.js";
import { damage } from "./damage.js";
import { catchShakes, catchValue, runOdds } from "./catch.js";
import { Battle } from "./battle.js";
import { chooseMove } from "./ai.js";
import { applyItem } from "../data/items.js";
import { trainerParty } from "../data/trainers.js";
import { gym } from "../world/maps/gym.js";

const species = buildSpecies(FALLBACK_REPOS);
const make = (entry: Species, level = 5): Codeling => createCodeling(entry, level, mulberry32(entry.id));
const fight = (party = [make(species[0])], foes = [make(species[1])], trainer?: string) =>
  new Battle({ party, foes, species, bag: { forkBall: 20, patch: 2 }, trainer }, () => 0.9);

describe("Codeling species", () => {
  it("is deterministic independently of payload order", () => {
    expect(buildSpecies([...FALLBACK_REPOS].reverse())).toEqual(species);
  });
  it("uses a playable fallback for an empty payload", () => {
    expect(buildSpecies([])).toEqual(species);
  });
  it("assigns every species a habitat, valid moves and bounded data", () => {
    const repos = Array.from({ length: 40 }, (_, index) => ({ ...FALLBACK_REPOS[index % 3],
      id: index + 1, name: `project-${index}-long-title`, stars: index * 300,
      pushedAt: `2026-${String(index % 12 + 1).padStart(2, "0")}-01` }));
    for (const entry of buildSpecies(repos)) {
      const total = Object.values(entry.base).reduce((a, b) => a + b, 0);
      expect(entry.name.length).toBeLessThanOrEqual(10);
      expect(total).toBeGreaterThanOrEqual(300);
      expect(total).toBeLessThanOrEqual(480);
      expect(Object.values(entry.base).every((value) => value >= 45 && value <= 110)).toBe(true);
      expect(entry.catchRate).toBeGreaterThanOrEqual(45);
      expect(entry.catchRate).toBeLessThanOrEqual(255);
      expect(entry.habitat).toHaveLength(1);
      expect(entry.learnset.map((learn) => learn.level)).toEqual(
        entry.learnset.map((learn) => learn.level).sort((a, b) => a - b));
      expect(entry.learnset.every((learn) => MOVES[learn.move])).toBe(true);
    }
  });
  it("orders the Codex and habitats from oldest to newest", () => {
    expect(species.map((entry) => entry.dex)).toEqual([1, 2, 3]);
    expect(species.map((entry) => entry.habitat[0])).toEqual(["cave", "route2", "route1"]);
  });
  it("picks highest stars with distinct types and recency ties", () => {
    const list = buildSpecies([...FALLBACK_REPOS, { ...FALLBACK_REPOS[0], id: 4,
      name: "more-python", stars: 100 }]);
    const candidates = starterCandidates(list);
    expect(candidates[0].id).toBe(4);
    expect(new Set(candidates.map((entry) => entry.type)).size).toBe(3);
  });
  it("gives Rhea distinct types and levels 12, 13, 14", () => {
    const party = trainerParty(gym.npcs.find((npc) => npc.id === "rhea")!, species);
    expect(party.map((mon) => mon.level)).toEqual([12, 13, 14]);
    expect(new Set(party.map((mon) => species.find((s) => s.id === mon.species)!.type)).size).toBe(3);
  });
});
describe("type chart and moves", () => {
  it("has reciprocal advantages, self resistance and neutral Normal", () => {
    const cycle = ["typescript", "javascript", "python", "shell", "go", "java", "csharp", "swift", "dart"] as const;
    cycle.forEach((type, index) => {
      const next = cycle[(index + 1) % cycle.length];
      expect(effectiveness(type, next)).toBe(2);
      expect(effectiveness(next, type)).toBe(0.5);
      expect(effectiveness(type, type)).toBe(0.5);
    });
    for (const a of TYPES) {
      expect(effectiveness(a, "normal")).toBe(1);
      expect(effectiveness("normal", a)).toBe(1);
      for (const b of TYPES) {
        expect([0.5, 1, 2]).toContain(effectiveness(a, b));
      }
    }
  });
  it("has six original moves per type and eight shared moves", () => {
    for (const type of TYPES) {
      const moves = Object.values(MOVES).filter((move) => move.type === type);
      expect(moves).toHaveLength(type === "normal" ? 8 : 6);
      expect(moves.every((move) => move.name.length <= 12)).toBe(true);
      expect(moves.every((move) => move.accuracy > 0 && move.pp > 0)).toBe(true);
    }
  });
});
describe("worked formulas", () => {
  const base = { hp: 80, atk: 80, def: 80, spd: 80, spc: 80 };
  const ivs = { hp: 20, atk: 20, def: 20, spd: 20, spc: 20 };
  it("calculates level 50 stats and EXP exactly", () => {
    expect(stats(base, ivs, 50)).toEqual({ hp: 150, atk: 95, def: 95, spd: 95, spc: 95 });
    expect(expForLevel(10)).toBe(1000);
    expect(expGain(100, 14, false, 2)).toBe(100);
    expect(expGain(100, 14, true, 2)).toBe(150);
    expect(stageMultiplier(-2)).toBe(0.5);
    expect(stageMultiplier(2)).toBe(2);
  });
  it("calculates neutral, STAB, super effective and critical damage", () => {
    const values = { hp: 100, atk: 100, def: 100, spd: 100, spc: 100 };
    const move = { ...MOVES["soft-tap"], power: 50, type: "typescript" as const };
    expect(damage(50, move, values, values, "normal", "normal", () => 0.99).damage).toBe(24);
    expect(damage(50, move, values, values, "typescript", "javascript", () => 0.99).damage).toBe(72);
    const rolls = [0, 0.99];
    expect(damage(50, move, values, values, "typescript", "javascript", () => rolls.shift()!, 0.25, 4)
      .damage).toBe(108);
  });
  it("raises catch odds with lower HP, status and better balls", () => {
    expect(catchValue(100, 10, 100)).toBeGreaterThan(catchValue(100, 90, 100));
    expect(catchValue(100, 90, 100, 1, "blocked")).toBeGreaterThan(catchValue(100, 90, 100));
    expect(catchValue(100, 90, 100, 1, "frozen")).toBeGreaterThan(catchValue(100, 90, 100, 1, "blocked"));
    expect(catchValue(100, 90, 100, 1.5)).toBeGreaterThan(catchValue(100, 90, 100));
    expect(catchShakes(255, () => 0.99)).toBe(4);
    expect(catchShakes(1, () => 0.99)).toBe(0);
  });
  it("raises run odds on each attempt and with speed", () => {
    expect(runOdds(20, 50, 2)).toBeGreaterThan(runOdds(20, 50, 1));
    expect(runOdds(50, 50, 1)).toBeGreaterThan(runOdds(20, 50, 1));
    expect(runOdds(500, 1, 1)).toBe(1);
  });
});
describe("battle state machine", () => {
  it("resolves equal speed with the provided RNG", () => {
    const mon = make(species[0]);
    mon.moves = [{ id: "soft-tap", pp: 10 }];
    const foe = structuredClone(mon);
    const battle = new Battle({ party: [mon], foes: [foe], species, bag: {} }, () => 0.9);
    battle.choose({ kind: "fight", move: 0 });
    expect(battle.step().find((event) => event.kind === "move")).toMatchObject({ side: 1 });
  });
  it("gives shared-prefix repositories distinct readable names within ten characters", () => {
    const names = ["claude-hud", "claude-code-tools", "claude-memory", "claude-memory-tool", "the-memory-app"];
    const repos = names.map((name, index) => ({ ...FALLBACK_REPOS[0], id: index + 100, name }));
    const list = buildSpecies(repos);
    expect(new Set(list.map((entry) => entry.name)).size).toBe(names.length);
    expect(list.every((entry) => entry.name.length <= 10 && entry.name !== "CLAUDE")).toBe(true);
    expect(list.find((entry) => entry.repo.name === "claude-hud")!.name).toBe("HUD");
    expect(buildSpecies([...repos].reverse())).toEqual(list);
  });
  it("runs from wild battles after increasing the attempt odds", () => {
    const mon = make(species[0]);
    const foe = make(species[0]);
    foe.status = "frozen";
    const battle = new Battle({ party: [mon], foes: [foe], species, bag: {} }, () => 0.9);
    for (let attempt = 0; attempt < 8 && !battle.result; attempt++) {
      battle.choose({ kind: "run" });
      battle.step();
    }
    expect(battle.result).toBe("run");
  });
  it("blocked turns consume no PP and confusion can cause a self-hit", () => {
    const mon = make(species[0], 40);
    const foe = make(species[0], 40);
    mon.moves = [{ id: "soft-tap", pp: 10 }];
    foe.moves = [{ id: "focus", pp: 10 }];
    mon.status = "blocked";
    const battle = new Battle({ party: [mon], foes: [foe], species, bag: {} }, () => 0);
    battle.choose({ kind: "fight", move: 0 });
    expect(battle.step()).toContainEqual({ kind: "message", text: `${species[0].name} is blocked!` });
    expect(mon.moves[0].pp).toBe(10);
    mon.status = null;
    foe.moves = [{ id: "queue-haze", pp: 10 }];
    battle.choose({ kind: "fight", move: 0 });
    battle.step();
    battle.choose({ kind: "fight", move: 0 });
    expect(battle.step().some((event) => event.kind === "message" && event.text.includes("tangled"))).toBe(true);
  });
  it("emits HP changes for healing items and consumes them once", () => {
    const battle = fight();
    battle.mon(0).hp = 1;
    battle.mon(1).status = "frozen";
    battle.choose({ kind: "item", item: "patch", target: 0 });
    expect(battle.step().some((event) => event.kind === "hp" && event.to > event.from)).toBe(true);
    expect(battle.config.bag.patch).toBe(1);
  });
  it("Rhea switches only after seeing a super-effective move that would now faint her member", () => {
    const python = species[0];
    const shell: Species = { ...species[1], id: 99, type: "shell", base: { ...species[1].base, hp: 110 } };
    const pool = [...species, shell];
    const mon = make(python, 40);
    mon.moves = [{ id: "tuple-tap", pp: 25 }];
    const foes = [make(shell, 40), make(species[1], 40)];
    foes.forEach((foe) => { foe.moves = [{ id: "focus", pp: 15 }]; });
    const battle = new Battle({ party: [mon], foes, species: pool, bag: {}, trainer: "Rhea", rhea: true }, () => 0.9);
    battle.choose({ kind: "fight", move: 0 });
    expect(battle.step().some((event) => event.kind === "switch")).toBe(false);
    foes[0].hp = 1;
    battle.choose({ kind: "fight", move: 0 });
    expect(battle.step()).toContainEqual({ kind: "switch", side: 1, index: 1 });
  });
  it("orders priority before speed and consumes PP", () => {
    const battle = fight();
    battle.mon(0).moves = [{ id: "quick-nudge", pp: 10 }];
    battle.mon(1).moves = [{ id: "soft-tap", pp: 10 }];
    battle.mon(0).ivs.spd = 0;
    battle.mon(1).ivs.spd = 31;
    battle.choose({ kind: "fight", move: 0 });
    const events = battle.step().filter((event) => event.kind === "move");
    expect(events[0]).toMatchObject({ side: 0 });
    expect(battle.mon(0).moves[0].pp).toBe(9);
  });
  it("uses speed without priority and seeded RNG for ties", () => {
    const battle = fight([make(species[0], 30)], [make(species[0], 5)]);
    battle.mon(0).moves = [{ id: "soft-tap", pp: 10 }];
    battle.mon(1).moves = [{ id: "soft-tap", pp: 10 }];
    battle.choose({ kind: "fight", move: 0 });
    expect(battle.step().find((event) => event.kind === "move")).toMatchObject({ side: 0 });
  });
  it("forces a living switch on player faint and loses with an empty team", () => {
    const battle = fight([make(species[0]), make(species[2])], [make(species[1], 40)]);
    battle.mon(0).hp = 1;
    battle.mon(1).moves = [{ id: "soft-tap", pp: 20 }];
    battle.choose({ kind: "fight", move: 0 });
    expect(battle.step().some((event) => event.kind === "faint")).toBe(true);
    expect(battle.forcedSwitch).toBe(true);
    expect(battle.choose({ kind: "run" })).toBe(false);
    expect(battle.choose({ kind: "switch", index: 1 })).toBe(true);
    battle.step();
    expect(battle.active[0]).toBe(1);
    const losing = fight([make(species[0])], [make(species[1], 40)]);
    losing.mon(0).hp = 1;
    losing.mon(1).moves = [{ id: "soft-tap", pp: 20 }];
    losing.choose({ kind: "fight", move: 0 });
    expect(losing.step()).toContainEqual({ kind: "end", result: "lose" });
  });
  it("ticks deprecated damage and thaws frozen within three turns", () => {
    const battle = fight([make(species[0], 40)], [make(species[1], 40)]);
    battle.mon(0).status = "deprecated";
    battle.mon(1).status = "frozen";
    battle.mon(0).moves = [{ id: "focus", pp: 10 }];
    const before = battle.mon(0).hp;
    for (let i = 0; i < 3; i++) {
      battle.choose({ kind: "fight", move: 0 });
      battle.step();
    }
    expect(battle.mon(0).hp).toBe(before - 3 * Math.floor(battle.stats(battle.mon(0)).hp / 8));
    expect(battle.mon(1).status).toBeNull();
  });
  it("handles catches with four checks and consumes the ball", () => {
    const battle = new Battle({ party: [make(species[0])], foes: [make(species[1])], species,
      bag: { forkBall: 1 } }, () => 0);
    battle.choose({ kind: "ball", item: "forkBall" });
    expect(battle.step()).toContainEqual({ kind: "shake", count: 4, caught: true });
    expect(battle.result).toBe("caught");
    expect(battle.config.bag.forkBall).toBe(0);
    expect(battle.choose({ kind: "run" })).toBe(false);
  });
  it("rejects trainer catches and runs without spending items", () => {
    const battle = fight(undefined, undefined, "Tess");
    battle.choose({ kind: "ball", item: "forkBall" });
    expect(battle.step().every((event) => event.kind === "message")).toBe(true);
    expect(battle.config.bag.forkBall).toBe(20);
    battle.choose({ kind: "run" });
    expect(battle.step().every((event) => event.kind === "message")).toBe(true);
    expect(battle.result).toBeUndefined();
  });
  it("awards EXP, levels up, prompts for a fifth move, and ends after learning", () => {
    const mon = make(species[0]);
    mon.exp = expForLevel(6) - 1;
    mon.moves = [{ id: "quick-nudge", pp: 10 }, ...mon.moves.slice(0, 3)];
    const foe = make(species[1]);
    foe.hp = 1;
    const battle = fight([mon], [foe]);
    battle.choose({ kind: "fight", move: 0 });
    const events = battle.step();
    expect(events.some((event) => event.kind === "exp")).toBe(true);
    expect(mon.level).toBe(6);
    expect(events.some((event) => event.kind === "hp" && event.side === 0
      && event.to === mon.hp && event.to > event.from)).toBe(true);
    expect(battle.pendingLearn).toBeDefined();
    const move = battle.pendingLearn!.move;
    battle.choose({ kind: "learn", slot: 2 });
    expect(battle.step()).toContainEqual({ kind: "end", result: "win" });
    expect(mon.moves[2].id).toBe(move);
  });
  it("splits EXP only among living participants", () => {
    const party = [make(species[0], 15), make(species[2], 15)];
    const foe = make(species[1]);
    const battle = fight(party, [foe]);
    battle.choose({ kind: "switch", index: 1 });
    battle.step();
    party[1].moves = [{ id: "quick-nudge", pp: 10 }];
    foe.hp = 1;
    const before = party.map((mon) => mon.exp);
    battle.choose({ kind: "fight", move: 0 });
    battle.step();
    expect(party.map((mon, index) => mon.exp - before[index])).toEqual(
      [expGain(species[1].expYield, 5, false, 2), expGain(species[1].expYield, 5, false, 2)]);
  });
  it("offers shift switching before the next trainer member", () => {
    const foe = make(species[1]);
    foe.hp = 1;
    const battle = fight([make(species[0], 20)], [foe, make(species[2])], "Tess");
    battle.mon(0).moves = [{ id: "quick-nudge", pp: 20 }];
    battle.choose({ kind: "fight", move: 0 });
    expect(battle.step().some((event) => event.kind === "shift")).toBe(true);
    battle.choose({ kind: "fight", move: -1 });
    expect(battle.step().some((event) => event.kind === "switch")).toBe(true);
    expect(battle.mon(1).species).toBe(species[2].id);
  });
});
it("AI chooses only usable moves and weights type advantage for trainers", () => {
  const mon = make(species[0]);
  mon.moves = [{ id: "soft-tap", pp: 0 }, { id: "tuple-tap", pp: 10 }, { id: "alias-knock", pp: 10 }];
  let pythonChoices = 0;
  const rng = mulberry32(88);
  for (let draw = 0; draw < 1000; draw++) {
    const move = chooseMove(mon, "shell", true, rng);
    expect(move).not.toBe(0);
    if (move === 1) {
      pythonChoices++;
    }
  }
  expect(pythonChoices).toBeGreaterThan(600);
  mon.moves.forEach((move) => { move.pp = 0; });
  expect(chooseMove(mon, "shell", false, rng)).toBe(-1);
});
it("round-trips real generated party data in the save schema", () => {
  const save = newGame("DEV", { ...DEFAULT_OPTIONS });
  save.party.push(make(species[0]));
  save.box.push(make(species[1], 12));
  save.seen = [1, 2];
  save.caught = [1, 2];
  const roundTrip: unknown = JSON.parse(JSON.stringify(save));
  expect(validSave(roundTrip)).toBe(true);
  expect(roundTrip).toEqual(save);
  expect(save.coins).toBe(500);
});
it("applies healing, status cures and revive with conventional restrictions", () => {
  const mon = make(species[0]);
  mon.hp = 0;
  expect(applyItem("patch", mon, 40)).toBe(false);
  expect(applyItem("rollback", mon, 40)).toBe(true);
  expect(mon.hp).toBe(20);
  mon.status = "blocked";
  expect(applyItem("fullRebuild", mon, 40)).toBe(true);
  expect([mon.hp, mon.status]).toEqual([40, null]);
});
