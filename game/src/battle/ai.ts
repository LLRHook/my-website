import type { Codeling } from "../engine/storage.js";
import { MOVES } from "./moves.js";
import { effectiveness, type TypeId } from "./types.js";
export function chooseMove(mon: Codeling, target: TypeId, trainer: boolean, rng: () => number): number {
  const usable = mon.moves.map((entry, index) => ({ index, entry })).filter(({ entry }) => entry.pp > 0);
  if (!usable.length) {
    return -1;
  }
  const weights = usable.map(({ entry }) => {
    const move = MOVES[entry.id];
    return trainer ? (move.category === "status" ? 2 : effectiveness(move.type, target) * 3) : 1;
  });
  let roll = rng() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < usable.length; i++) {
    roll -= weights[i];
    if (roll < 0) {
      return usable[i].index;
    }
  }
  return usable.at(-1)!.index;
}
