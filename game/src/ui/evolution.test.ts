import { afterEach, describe, expect, it, vi } from "vitest";
import { buildSpecies, formOf } from "../data/species.js";
import { createCodeling, stats } from "../battle/stats.js";
import { MOVES } from "../battle/moves.js";
import { DEFAULT_OPTIONS } from "../engine/storage.js";
import type { Input, Button } from "../engine/input.js";
import type { Audio } from "../engine/audio.js";
import type { SceneStack } from "../engine/scenes.js";
import { newGame } from "../world/overworld.js";
import { EvolutionScene } from "./evolution.js";

const entry = buildSpecies([])[0];
function fixture(hp = 10, reduced = false) {
  vi.stubGlobal("matchMedia", () => ({ matches: reduced }));
  let button: Button | undefined;
  const input = { pressed: (candidate: Button) => candidate === button,
    repeat: () => false } as unknown as Input;
  const play = vi.fn();
  const audio = { play, cry: vi.fn(), sfx: vi.fn() } as unknown as Audio;
  const pop = vi.fn();
  const stack = { pop } as unknown as SceneStack;
  const mon = { ...createCodeling(entry, entry.evolveAt[0], () => 0.5), stage: 1 as const, hp };
  const state = newGame("DEV", { ...DEFAULT_OPTIONS, textSpeed: "fast" });
  const scene = new EvolutionScene(input, audio, stack, state, mon, entry, 2);
  scene.enter();
  const tick = (count: number, pressed?: Button) => {
    button = pressed;
    for (let frame = 0; frame < count; frame++) {
      scene.update();
    }
    button = undefined;
  };
  // Reveal and acknowledge the start text with A.
  tick(2, "a");
  return { scene, mon, tick, pop, play };
}
afterEach(() => vi.unstubAllGlobals());
describe("evolution scene", () => {
  it("cancels only during animation and leaves stage and HP unchanged", () => {
    const { mon, tick, pop } = fixture();
    tick(60);
    tick(1, "b");
    expect(mon.stage).toBe(1);
    expect(mon.hp).toBe(10);
    tick(4, "a");
    expect(pop).toHaveBeenCalledOnce();
  });
  it.each([0, 10])("keeps HP damage, including fainted HP %s, and offers the strong move", (hp) => {
    const { mon, tick, pop, play } = fixture(hp);
    const oldMax = stats(formOf(entry, 1).base, mon.ivs, mon.level).hp;
    const nextMax = stats(formOf(entry, 2).base, mon.ivs, mon.level).hp;
    tick(240);
    expect(mon.stage).toBe(2);
    expect(mon.hp).toBe(hp === 0 ? 0 : nextMax - (oldMax - hp));
    expect(play).toHaveBeenCalledWith("evolveSuccess");
    tick(120);
    tick(8, "a");
    const strong = Object.values(MOVES).filter((move) => move.type === entry.type)[4];
    expect(mon.moves.some((move) => move.id === strong.id)).toBe(true);
    expect(pop).toHaveBeenCalledOnce();
  });
  it("uses a single short fade under reduced motion", () => {
    const { mon, tick } = fixture(10, true);
    tick(59);
    expect(mon.stage).toBe(1);
    tick(1);
    expect(mon.stage).toBe(2);
  });
  it("can keep old moves and skips an already-known strong move", () => {
    const { mon, tick, pop } = fixture();
    const original = structuredClone(mon.moves);
    tick(240);
    tick(120);
    tick(6, "a");
    tick(1, "b");
    expect(mon.moves).toEqual(original);
    expect(pop).toHaveBeenCalledOnce();
    const known = fixture();
    const strong = Object.values(MOVES).filter((move) => move.type === entry.type)[4];
    known.mon.moves[0] = { id: strong.id, pp: strong.pp };
    known.tick(240);
    known.tick(120);
    known.tick(8, "a");
    expect(known.pop).toHaveBeenCalledOnce();
  });
});
