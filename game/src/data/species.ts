import type { GameRepo, MapId } from "./ids.js";
import type { Stats } from "../engine/storage.js";
import { hashString, mulberry32 } from "../engine/rng.js";
import { bodyMask } from "../gfx/creatures.js";
import type { TypeId } from "../battle/types.js";
import { MOVES } from "../battle/moves.js";
export type BodyPlan = readonly string[];
export interface Form {
  stage: 1 | 2 | 3;
  name: string;
  base: Stats;
  expYield: number;
  catchRate: number;
}
export interface Species {
  stages: 2 | 3;
  evolveAt: number[];
  forms: Form[];
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
const BLOCKED_FORM_SUBSTRINGS = ["CUM", "ASS", "TIT", "FAG", "SEX", "NIG", "FUK", "FUC", "COC", "CUN",
  "KKK", "NAZ", "RAPE", "PORN", "SLUT", "WANK", "HOE", "POO", "PEE", "DIK"];
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
  const ranked = [...sorted].sort((a, b) => b.stars - a.stars
    || b.pushedAt.localeCompare(a.pushedAt) || a.id - b.id);
  const fallback = sorted.every((repo) => FALLBACK_REPOS.some((entry) => entry.id === repo.id
    && entry.name === repo.name));
  const threeStages = new Set(fallback ? [] : ranked.slice(0, Math.ceil(sorted.length / 3)).map((repo) => repo.id));
  const used = new Set(names.values());
  return sorted.map((repo, index): Species => {
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
    const habitat: MapId[] = [["cave", "route2", "route1"][third] as MapId, "route3", "route4"];
    const stages = threeStages.has(repo.id) ? 3 : 2;
    const base = { hp: values[0], atk: values[1], def: values[2], spd: values[3], spc: values[4] };
    const catchRate = Math.max(45, 255 - Math.floor(Math.log2(repo.stars + 1) * 30));
    const expYield = Math.floor(total / 3);
    const name = names.get(repo.id)!;
    const forms: Form[] = [{ stage: 1, name, base, expYield, catchRate }];
    for (const stage of [2, 3] as const) {
      if (stage > stages) {
        break;
      }
      const suffixes = stage === 2 ? ["ON", "IX", "ARA", "EL", "OS", "UM"]
        : ["ULON", "AREX", "ITAN", "OTH", "ARCH", "ORIS"];
      let formName = "";
      const blocked = (candidate: string) => BLOCKED_FORM_SUBSTRINGS.some((part) =>
        candidate.includes(part) && !name.includes(part));
      for (let attempt = 0; attempt < suffixes.length; attempt++) {
        const suffix = suffixes[(seed + attempt) % suffixes.length];
        formName = name.slice(0, 10 - suffix.length) + suffix;
        if (!used.has(formName) && !blocked(formName)) {
          break;
        }
      }
      if (used.has(formName) || blocked(formName)) {
        throw new Error(`Evolution suffixes exhausted for ${name}`);
      }
      used.add(formName);
      const target = Math.min(stage === 2 ? 540 : 600, Math.round(total * (stage === 2 ? 1.22 : 1.42)));
      const keys = ["hp", "atk", "def", "spd", "spc"] as const;
      const shares = keys.map((key) => base[key] * target / total);
      const grown = shares.map((share) => Math.min(150, Math.floor(share)));
      const order = keys.map((_, slot) => slot).sort((a, b) =>
        shares[b] - Math.floor(shares[b]) - (shares[a] - Math.floor(shares[a])) || a - b);
      let remaining = target - grown.reduce((sum, value) => sum + value, 0);
      while (remaining > 0) {
        for (const slot of order) {
          if (remaining && grown[slot] < 150) {
            grown[slot]++;
            remaining--;
          }
        }
      }
      forms.push({ stage, name: formName,
        base: { hp: grown[0], atk: grown[1], def: grown[2], spd: grown[3], spc: grown[4] },
        expYield: expYield * (stage === 2 ? 1.3 : 1.6),
        catchRate: Math.max(stage === 2 ? 30 : 15, Math.floor(catchRate * (stage === 2 ? 0.6 : 0.35))) });
    }
    return { stages, forms, evolveAt: stages === 3 ? [16 + seed % 5, 32 + seed % 5] : [18 + seed % 5],
      id: repo.id, dex: index + 1, name: names.get(repo.id)!, repo, type,
      base, catchRate, expYield,
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

export function formOf(species: Species, stage: 1 | 2 | 3): Form {
  return species.forms[stage - 1];
}
export function stageCount(species: Species): 2 | 3 {
  return species.stages;
}
export function evolutionLevels(species: Species): readonly number[] {
  return species.evolveAt;
}
export function stageAt(species: Species, level: number): 1 | 2 | 3 {
  return (1 + species.evolveAt.filter((threshold) => level >= threshold).length) as 1 | 2 | 3;
}
