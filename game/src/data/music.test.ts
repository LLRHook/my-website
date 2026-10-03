import { describe, expect, it } from "vitest";
import { EVOLVE, EVOLVE_SUCCESS, MUSIC } from "./music.js";

it("every original overworld score has four synchronized looping channels", () => {
  for (const [name, channels] of Object.entries(MUSIC)) {
    if (name === "title") {
      continue;
    }
    expect(channels).toHaveLength(4);
    const duration = channels[0].duration;
    for (const channel of channels) {
      expect(channel.duration).toBeCloseTo(duration, 6);
      expect(channel.loopStart).toBe(0);
      expect(channel.notes.length).toBeGreaterThan(0);
    }
  }
});

describe("original evolution scores", () => {
  it("synchronizes four chip channels for a six-second build and success cue", () => {
    expect(EVOLVE).toHaveLength(4);
    expect(EVOLVE_SUCCESS).toHaveLength(4);
    expect(EVOLVE.map((track) => track.duration)).toEqual([4, 4, 4, 4]);
    expect(EVOLVE_SUCCESS.map((track) => track.duration)).toEqual([2, 2, 2, 2]);
    expect(EVOLVE[0].notes.at(-1)!.midi).toBeGreaterThan(EVOLVE[0].notes[0].midi!);
  });
});
