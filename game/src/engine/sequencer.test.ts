import { describe, expect, it } from "vitest";
import { parseMml, Sequencer, TITLE_THEME } from "./sequencer.js";

describe("MML", () => {
  it("parses notes, octaves, accidentals, length, tempo, volume, and duty", () => {
    const track = parseMml("t120 o4 l8 v7 @1 c d+ e- >c4 <b");
    expect(track.notes.map((note) => note.midi)).toEqual([60, 63, 63, 72, 71]);
    expect(track.notes.map((note) => note.duration)).toEqual([0.25, 0.25, 0.25, 0.5, 0.25]);
    expect(track.notes.every((note) => note.volume === 7 && note.duty === 1)).toBe(true);
    expect(track.duration).toBe(1.5);
  });
  it("parses dotted lengths, rests, and ties", () => {
    const track = parseMml("c4. & c8 r4 c4..");
    expect(track.notes).toHaveLength(3);
    expect(track.notes[0].duration).toBe(1);
    expect(track.notes[1]).toMatchObject({
      midi: null, time: 1, duration: 0.5
    });
    expect(track.notes[2].duration).toBe(0.875);
  });
  it("expands nested and default-count loops and records the loop point", () => {
    const track = parseMml("r4 L [[c8 d8]2 e4]3");
    expect(track.notes).toHaveLength(16);
    expect(track.loopStart).toBe(0.5);
    expect(track.duration).toBe(5);
    expect(parseMml("[c4]").notes).toHaveLength(2);
  });
  it.each(["", "[c4", "]", "c0", "t0 c", "o9 c", "@3 c", "v16 c", "c & d", "c &", "[c]65", "?",
    "L"])("rejects malformed MML: %s", (src) => {
    expect(() => parseMml(src)).toThrow();
  });
  it("has four synchronized title channels looping for 30–40 seconds", () => {
    expect(TITLE_THEME).toHaveLength(4);
    expect(TITLE_THEME.map((track) => track.duration)).toEqual([32, 32, 32, 32]);
    expect(TITLE_THEME.every((track) => track.loopStart === 0)).toBe(true);
  });
  it("schedules notes ahead and restarts at the loop point", () => {
    const calls: number[] = [];
    const player = {
      time: 0, note: (_channel: number, _note: unknown, when: number) => {
        calls.push(when);
      }
    };
    const sequencer = new Sequencer(player, [parseMml("r8 L c8")]);
    sequencer.update();
    expect(calls).toEqual([]);
    player.time = 0.25;
    sequencer.update();
    expect(calls).toEqual([0.29]);
    player.time = 0.5;
    sequencer.update();
    expect(calls[1]).toBeCloseTo(0.54);
  });
});
