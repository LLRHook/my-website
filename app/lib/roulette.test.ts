import { afterEach, describe, expect, it, vi } from "vitest";
import { drawPocketIndex, frameIndex, pocketAngle, ringPoint, ROULETTE_POCKETS, spinPlan, spinState } from "./roulette";
import { SCENE } from "./room-scene";

afterEach(() => vi.unstubAllGlobals());

function samples(...values: number[]) {
  let index = 0;
  const random = vi.fn((array: Uint32Array) => {
    array[0] = values[Math.min(index++, values.length - 1)];
    return array;
  });
  vi.stubGlobal("crypto", { getRandomValues: random });
  return random;
}

describe("projected roulette", () => {
  it("wraps sprite frames in both directions without negative indices", () => {
    const { frames, frameStep } = SCENE.roulette;
    for (let index = -frames * 2; index <= frames * 2; index++) {
      expect(frameIndex(index * frameStep)).toBe((index % frames + frames) % frames);
      expect(frameIndex(index * frameStep)).toBeGreaterThanOrEqual(0);
    }
    expect(frameIndex(frameStep * .6)).toBe(1);
    expect(frameIndex(frameStep * .4)).toBe(0);
  });

  it.each(ROULETTE_POCKETS.map((_, index) => index))("lands at pocket %i with scale one", (index) => {
    const plan = spinPlan(index);
    const state = spinState(plan, index, 1);
    expect(state.rotor).toBe(plan.rotorEnd);
    expect(state.angle).toBe(pocketAngle(index, plan.rotorEnd));
    expect(state.scale).toBe(1);
    const before = spinState(plan, index, .72 - 1e-12);
    const at = spinState(plan, index, .72);
    expect(Math.abs(before.angle - at.angle)).toBeLessThan(1e-9);
    expect(at.scale).toBe(SCENE.roulette.trackScale);
    expect(spinState(plan, index, .82).scale).toBe(1);
  });

  it("projects angle zero to center plus u", () => {
    const { center, u } = SCENE.roulette;
    expect(ringPoint(0, 1)).toEqual([center[0] + u[0], center[1] + u[1]]);
  });

  it("plans six ball turns and the specified signed rotor travel", () => {
    const plan = spinPlan(2);
    expect(plan.ballTurns).toBe(6);
    expect(plan.rotorEnd).toBe(Math.sign(SCENE.roulette.frameStep) * (3 + 2 * .37 % 1) * 2 * Math.PI);
  });

  it("keeps the single-zero numbered and color layout", () => {
    expect(ROULETTE_POCKETS.map((p) => p.number).sort((a, b) => a - b)).toEqual(Array.from({ length: 37 }, (_, i) => i));
    expect(ROULETTE_POCKETS.filter((p) => p.color === "red").map((p) => p.number).sort((a, b) => a - b)).toEqual([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
    expect(ROULETTE_POCKETS.filter((p) => p.color === "green").map((p) => p.number)).toEqual([0]);
  });

  it("maps every accepted integer residue to one pocket", () => {
    for (let raw = 0; raw < 74; raw++) {
      samples(raw);
      expect(drawPocketIndex()).toBe(raw % 37);
    }
    samples(4_294_967_288);
    expect(drawPocketIndex()).toBe(36);
  });

  it("rejects the incomplete uint32 tail", () => {
    for (let raw = 4_294_967_289; raw <= 4_294_967_295; raw++) {
      const random = samples(raw, 0);
      expect(drawPocketIndex()).toBe(0);
      expect(random).toHaveBeenCalledTimes(2);
    }
  });
});
