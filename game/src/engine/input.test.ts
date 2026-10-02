import { describe, expect, it } from "vitest";
import { resolveDpad } from "./input.js";

describe("sliding D-pad", () => {
  it.each([
    [0, 0, null], [18, 0, null], [19, 0, "right"], [-40, 10, "left"],
    [10, -40, "up"], [10, 40, "down"], [40, 40, "down"], [40, -40, "up"],
  ] as const)("resolves (%s, %s) to %s", (dx, dy, direction) => {
    expect(resolveDpad(dx, dy, 100)).toBe(direction);
  });
  it("scales the dead zone with the control and rejects an empty zone", () => {
    expect(resolveDpad(20, 0, 132)).toBeNull();
    expect(resolveDpad(24, 0, 132)).toBe("right");
    expect(resolveDpad(24, 0, 0)).toBeNull();
  });
});
