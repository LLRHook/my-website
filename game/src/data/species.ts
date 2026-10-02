import type { GameRepo, MapId } from "./ids.js";
import type { Stats } from "../engine/storage.js";
import { hashString, mulberry32 } from "../engine/rng.js";
import { bodyMask } from "../gfx/creatures.js";
import type { TypeId } from "../battle/types.js";
import { MOVES } from "../battle/moves.js";
export type BodyPlan = readonly string[];
export interface Species {
  id: number;
  dex: number;
  name: string;
  repo: GameRepo;
  type: TypeId;
  base: Stats;
  catchRate: number;
  expYield: number;
  learnset: { level: number; move: string }[];
  habitat: MapId[];
  rarity: number;
  sprite: { seed: number; body: BodyPlan };
}
export const FALLBACK_REPOS: GameRepo[] = ["Sitebud", "Pagewing", "Linkstone"].map((name, index) => ({
  id: index + 1, name, title: name, description: "A little companion from Victor's corner of the web.",
  language: ["Python", "Swift", "TypeScript"][index], stars: 0, pushedAt: `2020-01-0${index + 1}`,
  url: "https://github.com/LLRHook", homepage: null,
}));
const languages: Record<string, TypeId> = { python: "python", javascript: "javascript", typescript: "typescript",
  go: "go", swift: "swift", shell: "shell", dart: "dart", "c#": "csharp", java: "java" };
function speciesNames(repos: readonly GameRepo[]): Map<number, string> {
  const common = new Set(["app", "tool", "the", "my", "a", "an", "to", "for", "of", "project", "code",
    "helper", "printer", "converter", "fix", "guide", "what", "made", "me"]);
  const words = repos.map((repo) => repo.name.replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  const prefixes = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const parts of words) {
    prefixes.set(parts[0], (prefixes.get(parts[0]) ?? 0) + 1);
    for (const part of new Set(parts)) {
      counts.set(part, (counts.get(part) ?? 0) + 1);
    }
  }
  const used = new Set<string>();
  const names = new Map<number, string>();
  // Resolve collisions by repo id, independently of input order or Codex chronology.
  const ordered = repos.map((repo, index) => ({ repo, parts: words[index] })).sort((a, b) => a.repo.id - b.repo.id);
  for (const { repo, parts } of ordered) {
    const meaningful = parts.filter((word, index) => !common.has(word)
      && !(index === 0 && parts.length > 1 && (prefixes.get(word) ?? 0) > 1));
    const fallback = parts.filter((word, index) => !(index === 0 && parts.length > 1
      && (prefixes.get(word) ?? 0) > 1));
    const ranked = [...(meaningful.length ? meaningful : fallback.length ? fallback : parts)].sort((a, b) =>
      (counts.get(a) ?? 0) - (counts.get(b) ?? 0) || b.length - a.length || parts.indexOf(a) - parts.indexOf(b));
    const stem = (ranked[0] ?? "codeling").toUpperCase();
    let name = stem.slice(0, 10);
    if (used.has(name)) {
      const syllable = parts.filter((word) => word !== ranked[0] && !common.has(word))
        .map((word) => word.slice(0, 2)).join("").toUpperCase();
      const suffix = syllable.slice(0, 3) || repo.id.toString(36).toUpperCase();
      name = stem.slice(0, 10 - suffix.length) + suffix;
    }
    let attempt = 0;
    while (used.has(name)) {
      const suffix = repo.id.toString(36).toUpperCase() + (attempt ? attempt.toString(36).toUpperCase() : "");
      name = stem.slice(0, Math.max(1, 10 - suffix.length)) + suffix.slice(-9);
      attempt++;
    }
    used.add(name);
    names.set(repo.id, name);
  }
  return names;
}
export function buildSpecies(repos: GameRepo[]): Species[] {
  const sorted = [...(repos.length ? repos : FALLBACK_REPOS)]
    .sort((a, b) => a.pushedAt.localeCompare(b.pushedAt) || a.id - b.id);
  const names = speciesNames(sorted);
  return sorted.map((repo, index) => {
    const seed = hashString(repo.name);
    const rng = mulberry32(seed);
    const type = languages[(repo.language ?? "").toLowerCase()] ?? "normal";
    const values = Array.from({ length: 5 }, () => 45 + Math.floor(rng() * 25));
    const target = Math.min(480, 300 + Math.floor(90 * index / Math.max(1, sorted.length - 1))
      + Math.floor(Math.log2(repo.stars + 1) * 10));
    let total = values.reduce((a, b) => a + b, 0);
    while (total < target) {
      const slot = Math.floor(rng() * 5);
      if (values[slot] < 110) {
        values[slot]++;
        total++;
      }
    }
    const typed = Object.values(MOVES).filter((move) => move.type === type);
    const normal = Object.values(MOVES).filter((move) => move.type === "normal");
    const initial = type === "normal" ? typed.slice(0, 4) : [normal[0], typed[0], typed[1], typed[5]];
    const learnset = initial.map((move) => ({ level: 1, move: move.id }));
    let level = 6;
    for (const move of [...typed.slice(2, 5), ...normal.slice(2)]) {
      learnset.push({ level, move: move.id });
      level += 5 + Math.floor(rng() * 4);
    }
    const third = Math.min(2, Math.floor(index * 3 / sorted.length));
    const habitat: MapId[] = [["cave", "route2", "route1"][third] as MapId];
    return { id: repo.id, dex: index + 1, name: names.get(repo.id)!, repo, type,
      base: { hp: values[0], atk: values[1], def: values[2], spd: values[3], spc: values[4] },
      catchRate: Math.max(45, 255 - Math.floor(Math.log2(repo.stars + 1) * 30)), expYield: Math.floor(total / 3),
      learnset, habitat, rarity: 10 + Math.floor(index * 90 / sorted.length), sprite: { seed, body: bodyMask(type) } };
  });
}
export function starterCandidates(species: readonly Species[]): Species[] {
  const sorted = [...species].sort((a, b) => b.repo.stars - a.repo.stars
    || b.repo.pushedAt.localeCompare(a.repo.pushedAt) || a.id - b.id);
  const result: Species[] = [];
  for (const candidate of sorted) {
    if (!result.some((entry) => entry.type === candidate.type)) {
      result.push(candidate);
    }
    if (result.length === 3) {
      return result;
    }
  }
  for (const candidate of sorted) {
    if (!result.includes(candidate) && result.length < 3) {
      result.push(candidate);
    }
  }
  return result;
}
