import { describe, expect, it } from "vitest";
import { boxStyle, srcSet, variantFor } from "./room-scene";

describe("room scene", () => {
  it.each([
    [false, true, "day_lamp_on"],
    [false, false, "day_lamp_off"],
    [true, true, "night_lamp_on"],
    [true, false, "night_lamp_off"],
  ] as const)("selects lighting for night=%s lamp=%s", (night, lamp, variant) => {
    expect(variantFor(night, lamp)).toBe(variant);
  });

  it("builds the encoded responsive source set", () => {
    expect(srcSet("night_lamp_off", "avif")).toBe(
      "/room/night_lamp_off-1280.avif 1280w, /room/night_lamp_off-1920.avif 1920w, /room/night_lamp_off-2560.avif 2560w",
    );
    expect(srcSet("day_lamp_on", "webp")).toBe(
      "/room/day_lamp_on-1280.webp 1280w, /room/day_lamp_on-1920.webp 1920w, /room/day_lamp_on-2560.webp 2560w",
    );
  });

  it("converts normalized boxes to percentages", () => {
    expect(boxStyle({ x: .1, y: .2, w: .3, h: .4 })).toEqual({
      left: "10%",
      top: "20%",
      width: "30%",
      height: "40%",
    });
  });
});
