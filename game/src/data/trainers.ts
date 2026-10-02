import type { Species } from "./species.js";
import type { NpcDef } from "../world/map.js";
import type { Codeling } from "../engine/storage.js";
import { createCodeling } from "../battle/stats.js";
import { hashString, mulberry32 } from "../engine/rng.js";
export function trainerParty(npc: NpcDef, species: readonly Species[]): Codeling[] {
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
  return (npc.trainer?.party ?? []).map((entry, index) => {
    const pick = ordered.find((mon) => mon.type === entry.pick.toLowerCase())
      ?? ordered[(hashString(npc.id) + index) % ordered.length];
    return createCodeling(pick, entry.level, rng);
  });
}
