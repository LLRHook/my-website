import { expect, it } from "vitest";
import { MUSIC } from "./music.js";

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
