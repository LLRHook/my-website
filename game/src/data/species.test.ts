import { describe, expect, it } from "vitest";
import { buildSpecies, originSpecies, evolutionLevels, FALLBACK_REPOS,
  formOf, stageAt, stageCount } from "./species.js";
import { hashString } from "../engine/rng.js";
import { createCodeling, stats } from "../battle/stats.js";

const repos = Array.from({ length: 31 }, (_, index) => ({ ...FALLBACK_REPOS[index % 3],
  id: index + 100, name: `companion-${index}`, stars: index % 5,
  pushedAt: `2026-09-${String(index + 1).padStart(2, "0")}` }));
const species = buildSpecies(repos);

describe("repository evolution lines", () => {
  it("ranks the top third by stars then recency and keeps fallback lines at two", () => {
    const ranked = [...repos].sort((a, b) => b.stars - a.stars || b.pushedAt.localeCompare(a.pushedAt));
    expect(species.filter((entry) => stageCount(entry) === 3).map((entry) => entry.id).sort()).toEqual(
      ranked.slice(0, 11).map((repo) => repo.id).sort());
    expect(buildSpecies([]).every((entry) => stageCount(entry) === 2)).toBe(true);
    expect(buildSpecies(FALLBACK_REPOS).every((entry) => stageCount(entry) === 2)).toBe(true);
    expect(buildSpecies([...repos].reverse())).toEqual(species);
  });
  it("derives seeded levels and stageAt at each boundary", () => {
    for (const entry of species) {
      const offset = entry.sprite.seed % 5;
      expect(evolutionLevels(entry)).toEqual(entry.stages === 3 ? [16 + offset, 32 + offset] : [18 + offset]);
      expect(stageAt(entry, 1)).toBe(1);
      entry.evolveAt.forEach((level, index) => {
        expect(stageAt(entry, level - 1)).toBe(index + 1);
        expect(stageAt(entry, level)).toBe(index + 2);
      });
      expect(stageAt(entry, 100)).toBe(entry.stages);
    }
  });
  it("keeps all form names unique and at most ten characters", () => {
    const names = species.flatMap((entry) => entry.forms.map((form) => form.name));
    expect(new Set(names).size).toBe(names.length);
    expect(names.every((name) => name.length <= 10 && name.length > 0)).toBe(true);
  });
  it("preserves stage one and distributes exact growth totals under the stat cap", () => {
    for (const entry of species) {
      expect(formOf(entry, 1)).toEqual({ stage: 1, name: entry.name, base: entry.base,
        expYield: entry.expYield, catchRate: entry.catchRate });
      const total = Object.values(entry.base).reduce((sum, value) => sum + value, 0);
      for (const form of entry.forms.slice(1)) {
        const factor = form.stage === 2 ? 1.22 : 1.42;
        expect(Object.values(form.base).reduce((sum, value) => sum + value, 0)).toBe(
          Math.min(form.stage === 2 ? 540 : 600, Math.round(total * factor)));
        expect(Object.values(form.base).every((value) => value <= 150)).toBe(true);
        expect(form.expYield).toBe(entry.expYield * (form.stage === 2 ? 1.3 : 1.6));
        expect(form.catchRate).toBe(Math.max(form.stage === 2 ? 30 : 15,
          Math.floor(entry.catchRate * (form.stage === 2 ? 0.6 : 0.35))));
        expect(stats(form.base, { hp: 0, atk: 0, def: 0, spd: 0, spc: 0 }, 50).hp).toBeGreaterThan(
          stats(entry.base, { hp: 0, atk: 0, def: 0, spd: 0, spc: 0 }, 50).hp);
      }
    }
  });
  it("creates wild and trainer individuals in their level's form with matching HP", () => {
    for (const entry of species) {
      for (const level of [1, ...entry.evolveAt]) {
        const mon = createCodeling(entry, level, () => 0.5);
        expect(mon.stage).toBe(stageAt(entry, level));
        expect(mon.hp).toBe(stats(formOf(entry, mon.stage).base, mon.ivs, level).hp);
      }
    }
  });
});


it("skips suffixes that introduce blocked substrings at the join", () => {
  // Pick a safe base ending in C whose first suffix is UM, creating the blocked join CUM.
  const name = Array.from({ length: 100 }, (_, index) => `twig${index}c`)
    .find((candidate) => hashString(candidate) % 6 === 5)!;
  const entry = buildSpecies([{ ...FALLBACK_REPOS[0], id: 1000, name }])[0];
  expect(entry.forms[1].name).toBe(entry.name + "ON");
  expect(entry.forms[1].name).not.toContain("CUM");
  // An inherited substring is allowed, as specified; only newly introduced substrings are blocked.
  const inherited = Array.from({ length: 100 }, (_, index) => `cum${index}`)
    .find((candidate) => hashString(candidate) % 6 === 5)!;
  const existing = buildSpecies([{ ...FALLBACK_REPOS[0], id: 1001, name: inherited }])[0];
  expect(existing.forms[1].name).toBe(existing.name + "UM");
});

it("gives ORIGIN the four strongest normal damaging moves at level one", () => {
  expect(originSpecies().learnset).toEqual([
    { level: 1, move: "hard-reset" },
    { level: 1, move: "repo-pulse" },
    { level: 1, move: "byte-bash" },
    { level: 1, move: "last-resort" },
  ]);
});
