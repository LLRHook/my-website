import type { RematchId } from "../world/postgame.js";
import type { Species } from "./species.js";
import type { NpcDef } from "../world/map.js";
import type { Codeling } from "../engine/storage.js";
import { createCodeling } from "../battle/stats.js";
import { hashString, mulberry32 } from "../engine/rng.js";
export function trainerParty(npc: NpcDef, species: readonly Species[]): Codeling[] {
  if (!species.length) {
    return [];
  }
  const rng = mulberry32(hashString(npc.id));
  const choices: Species[] = [];
  const ordered = [...species].sort((a, b) => a.id - b.id);
  for (const mon of ordered) {
    if (!choices.some((entry) => entry.type === mon.type)) {
      choices.push(mon);
    }
  }
  if (npc.id === "rhea") {
    return [12, 13, 14].map((level, index) =>
      createCodeling(choices[index % choices.length], level, rng));
  }
  return pickedParty(npc.id, npc.trainer?.party ?? [], species, rng);
}

function pickedParty(id: string, entries: readonly { level: number; pick: string }[],
  species: readonly Species[], rng: () => number): Codeling[] {
  const ranked = [...species].sort((a, b) => b.repo.stars - a.repo.stars
    || b.repo.pushedAt.localeCompare(a.repo.pushedAt) || a.id - b.id);
  const ordered = [...species].sort((a, b) => a.id - b.id);
  return entries.map((entry, index) => {
    const rank = /^star:([1-9]\d*)$/.exec(entry.pick);
    const pick = rank ? ranked[(Number(rank[1]) - 1) % ranked.length]
      : ordered.find((mon) => mon.type === entry.pick.toLowerCase())
        ?? ordered[(hashString(id) + index) % ordered.length];
    return createCodeling(pick, entry.level, rng);
  });
}

export function rematchParty(id: RematchId, species: readonly Species[], rng: () => number): Codeling[] {
  if (!species.length) {
    return [];
  }
  const first = { rhea: 40, otto: 45, mira: 50, prof: 58 }[id];
  const entries = ["star:1", "star:3", "mixed", "star:5", "mixed", "star:2"]
    .map((pick, index) => ({ pick, level: first + index }));
  return pickedParty(`rematch-${id}`, entries, species, rng);
}
