import { speciesById, type Species } from "../data/species.js";
import type { Codeling } from "../engine/storage.js";
import type { BattleResult } from "./battle.js";

export function pendingEvolutions(party: readonly Codeling[], species: readonly Species[],
  levelledUp: ReadonlySet<string>, result: BattleResult): { uid: string; to: 2 | 3 }[] {
  if (result !== "win" && result !== "caught") {
    return [];
  }
  const pending: { uid: string; to: 2 | 3 }[] = [];
  for (const mon of party) {
    const entry = speciesById(species, mon.species);
    if (entry && levelledUp.has(mon.uid) && mon.stage < entry.stages
      && mon.level >= entry.evolveAt[mon.stage - 1]) {
      pending.push({ uid: mon.uid, to: (mon.stage + 1) as 2 | 3 });
    }
  }
  return pending;
}
