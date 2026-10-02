import { describe, expect, it } from "vitest";
import { hashString, mulberry32 } from "./rng.js";

describe("seeded random numbers", () => {
  it("reproduces a sequence and stays in [0, 1)", () => {
    const first = mulberry32(2026);
    const second = mulberry32(2026);
    const values = Array.from({
      length: 1000
    }, () => first());
    expect(values).toEqual(Array.from({
      length: 1000
    }, () => second()));
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(values).not.toEqual(Array.from({
      length: 1000
    }, mulberry32(2027)));
  });
  it("matches the mulberry32 reference sequence", () => {
    expect(mulberry32(1)()).toBe(0.6270739405881613);
  });
  it("hashes names deterministically with FNV-1a", () => {
    expect(hashString("hello")).toBe(1335831723);
    expect(hashString("")).toBe(2166136261);
    expect(hashString("repo")).toBe(hashString("repo"));
    expect(hashString("repo")).not.toBe(hashString("Repo"));
  });
});
