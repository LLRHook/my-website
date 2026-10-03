import { describe, expect, it } from "vitest";
import { buildSpecies, FALLBACK_REPOS } from "../data/species.js";
import { createCodeling } from "./stats.js";
import { pendingEvolutions } from "./evolution.js";

const species = buildSpecies(FALLBACK_REPOS.map((repo) => ({ ...repo, id: repo.id + 100 })));
const entry = species.find((candidate) => candidate.stages === 3)!;
const ready = () => ({ ...createCodeling(entry, entry.evolveAt[0], () => 0.5), stage: 1 as const });
describe("post-battle evolution checks", () => {
  it("requires a level-up and a win or catch", () => {
    const mon = ready();
    for (const result of ["win", "caught"] as const) {
      expect(pendingEvolutions([mon], species, new Set([mon.uid]), result)).toEqual([{ uid: mon.uid, to: 2 }]);
      expect(pendingEvolutions([mon], species, new Set(), result)).toEqual([]);
    }
    for (const result of ["lose", "run"] as const) {
      expect(pendingEvolutions([mon], species, new Set([mon.uid]), result)).toEqual([]);
    }
  });
  it("retries a cancelled stage only after the next level-up", () => {
    const mon = ready();
    expect(pendingEvolutions([mon], species, new Set([mon.uid]), "win")).toHaveLength(1);
    expect(mon.stage).toBe(1);
    expect(pendingEvolutions([mon], species, new Set(), "win")).toEqual([]);
    mon.level++;
    expect(pendingEvolutions([mon], species, new Set([mon.uid]), "win")).toEqual([{ uid: mon.uid, to: 2 }]);
  });
  it("checks thresholds, final stages, missing species and party order", () => {
    const first = ready();
    const second = { ...ready(), uid: "second", stage: 2 as const, level: entry.evolveAt[1] };
    const levelled = new Set([first.uid, second.uid]);
    expect(pendingEvolutions([second, first], species, levelled, "win")).toEqual([
      { uid: second.uid, to: 3 }, { uid: first.uid, to: 2 }]);
    first.level--;
    expect(pendingEvolutions([first], species, levelled, "win")).toEqual([]);
    expect(pendingEvolutions([{ ...second, stage: 3 }], species, levelled, "win")).toEqual([]);
    expect(pendingEvolutions([second], [], levelled, "win")).toEqual([]);
  });
});
