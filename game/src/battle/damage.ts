import type { Stats } from "../engine/storage.js";
import type { Move } from "./moves.js";
import { effectiveness, type TypeId } from "./types.js";
export interface DamageResult { damage: number; critical: boolean; multiplier: number }
export function damage(level: number, move: Move, attack: Stats, defense: Stats, attacker: TypeId,
  defender: TypeId, rng: () => number, attackStage = 1, defenseStage = 1): DamageResult {
  const critical = rng() < 1 / 16;
  const key = move.category === "physical" ? "atk" : "spc";
  const def = move.category === "physical" ? "def" : "spc";
  const a = attack[key] * (critical ? 1 : attackStage);
  const d = defense[def] * (critical ? 1 : defenseStage);
  const base = Math.floor(Math.floor(Math.floor(2 * level / 5 + 2) * move.power * a / d) / 50) + 2;
  const multiplier = effectiveness(move.type, defender);
  const roll = (85 + Math.floor(rng() * 16)) / 100;
  return { damage: Math.max(1, Math.floor(base * (attacker === move.type ? 1.5 : 1)
    * multiplier * (critical ? 1.5 : 1) * roll)), critical, multiplier };
}
