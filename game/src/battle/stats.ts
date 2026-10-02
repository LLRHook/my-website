import type { Codeling, Stats } from "../engine/storage.js";
import type { Species } from "../data/species.js";
import { MOVES } from "./moves.js";
export function stats(base: Stats, ivs: Stats, level: number): Stats {
  const stat = (key: keyof Stats) => Math.floor((2 * base[key] + ivs[key]) * level / 100)
    + (key === "hp" ? level + 10 : 5);
  return { hp: stat("hp"), atk: stat("atk"), def: stat("def"), spd: stat("spd"), spc: stat("spc") };
}
export const expForLevel = (level: number): number => level ** 3;
export const expGain = (yieldExp: number, level: number, trainer = false, participants = 1): number =>
  Math.floor(Math.floor(yieldExp * level / 7) * (trainer ? 1.5 : 1) / participants);
export const stageMultiplier = (stage: number): number => stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
export function createCodeling(species: Species, level: number, rng: () => number): Codeling {
  const iv = () => Math.floor(rng() * 32);
  const ivs = { hp: iv(), atk: iv(), def: iv(), spd: iv(), spc: iv() };
  const moves = species.learnset.filter((entry) => entry.level <= level).slice(-4)
    .map((entry) => ({ id: entry.move, pp: MOVES[entry.move].pp }));
  return { uid: `${species.id}-${Math.floor(rng() * 0xffffffff).toString(16)}`, species: species.id,
    level, exp: expForLevel(level), hp: stats(species.base, ivs, level).hp, ivs, moves, status: null };
}
