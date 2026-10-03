import { describe, expect, it } from "vitest";
import { pressSwitch } from "./pipeline.js";

describe("pipeline stages", () => {
  it("opens exactly one barrier per stage, in order", () => {
    const lint = pressSwitch(0, "lint");
    expect(lint).toEqual({ state: 1, opened: 1, reset: false });
    const test = pressSwitch(lint.state, "test");
    expect(test).toEqual({ state: 2, opened: 2, reset: false });
    expect(pressSwitch(test.state, "build")).toEqual({ state: 3, opened: 3, reset: false });
  });
  it("a wrong or repeated stage resets every barrier", () => {
    expect(pressSwitch(0, "test")).toEqual({ state: 0, opened: 0, reset: true });
    expect(pressSwitch(1, "lint")).toEqual({ state: 0, opened: 0, reset: true });
    expect(pressSwitch(2, "test")).toEqual({ state: 0, opened: 0, reset: true });
  });
  it("a completed pipeline remains open until the visit ends", () => {
    expect(pressSwitch(3, "lint")).toEqual({ state: 3, opened: 3, reset: false });
  });
});
