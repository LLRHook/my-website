import type { Status } from "../data/ids.js";
import { TYPES, type TypeId } from "./types.js";
export type StageStat = "atk" | "def" | "spd" | "spc" | "accuracy";
export interface Effect {
  stage?: { stat: StageStat; amount: number; target: "self" | "foe" };
  status?: Status | "confused";
  chance?: number;
  heal?: number;
  drain?: number;
  priority?: number;
  multi?: boolean;
  recoil?: number;
}
export interface Move {
  id: string;
  name: string;
  type: TypeId;
  power: number;
  accuracy: number;
  pp: number;
  category: "physical" | "special" | "status";
  effect?: Effect;
}
const names: Record<TypeId, readonly string[]> = {
  python: ["Tuple Tap", "Indent Bite", "Slice Coil", "Yield Fang", "Venom Loop", "Lazy Bind"],
  javascript: ["Event Ember", "Scope Spark", "Promise Heat", "Closure Fire", "Async Blaze", "Queue Haze"],
  typescript: ["Alias Knock", "Tuple Brick", "Narrow Beam", "Generic Wall", "Compile Slam", "Guard Rise"],
  go: ["Buffer Bump", "Rune Nudge", "Worker Rush", "Channel Wave", "Parallel Ram", "Mutex Hold"],
  swift: ["Label Peck", "Option Wing", "Closure Gust", "Value Dive", "Swift Squall", "Safe Roost"],
  shell: ["Echo Claw", "Pipe Pinch", "Redirect Ram", "Glob Crush", "Shell Siege", "Grep Stare"],
  dart: ["Arrow Flick", "Future Fin", "Stream Lance", "Isolate Jet", "Cascade Dart", "Await Chill"],
  csharp: ["Linq Shard", "Brace Chip", "Delegate Ray", "Query Prism", "Crystal Task", "Nullable Fog"],
  java: ["Bean Bonk", "Class Puff", "Thread Steam", "Heap Hammer", "Jit Boiler", "Cache Rest"],
  normal: ["Soft Tap", "Quick Nudge", "Byte Bash", "Repo Pulse", "Hard Reset", "Focus", "Repair", "Last Resort"],
};
const powers = [30, 40, 60, 70, 95, 0, 0, 50];
const effects: readonly (Effect | undefined)[] = [undefined, { priority: 1 }, { multi: true },
  { drain: 0.5 }, { recoil: 0.25 }, { stage: { stat: "atk", amount: 1, target: "self" } },
  { heal: 0.5 }, { recoil: 0.25 }];
const status: Partial<Record<TypeId, Effect>> = {
  python: { status: "deprecated", chance: 1 }, javascript: { status: "confused", chance: 1 },
  typescript: { stage: { stat: "def", amount: 2, target: "self" } },
  go: { status: "blocked", chance: 1 }, swift: { heal: 0.5 },
  shell: { stage: { stat: "accuracy", amount: -1, target: "foe" } },
  dart: { status: "frozen", chance: 1 }, csharp: { stage: { stat: "spc", amount: -2, target: "foe" } },
  java: { heal: 0.5 },
};
export const MOVES: Readonly<Record<string, Move>> = Object.fromEntries(TYPES.flatMap((type) =>
  names[type].map((name, index): [string, Move] => {
    const id = name.toLowerCase().replaceAll(" ", "-");
    return [id, { id, name, type, power: powers[index], accuracy: index === 4 ? 85 : 100,
      pp: index === 4 ? 10 : index >= 5 ? 15 : 25,
      category: powers[index] === 0 ? "status" : index % 2 ? "special" : "physical",
      effect: index === 5 && type !== "normal" ? status[type] : effects[index] }];
  })));
export const STRUGGLE: Move = { id: "struggle", name: "Last Byte", type: "normal", power: 50,
  accuracy: 100, pp: 1, category: "physical", effect: { recoil: 0.25 } };
