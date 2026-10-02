import { describe, expect, it } from "vitest";
import { wrapText } from "./textbox.js";

describe("text wrapping", () => {
  it("wraps dialogue into eighteen columns without losing words", () => {
    const text = "Your journey begins in part 2.";
    const lines = wrapText(text, 18);
    expect(lines).toEqual(["Your journey", "begins in part 2."]);
    expect(lines.join(" ")).toBe(text);
  });
  it.each(["x".repeat(80), "word ".repeat(80), "é★♪".repeat(30), "",
    "a\n\nb"])("never exceeds eighteen columns: %s", (text) => {
    expect(wrapText(text, 18).every((line) => [...line].length <= 18)).toBe(true);
  });
  it("splits long words without losing characters", () => {
    expect(wrapText("abcdefghijklmnopqrstuv", 18)).toEqual(["abcdefghijklmnopqr", "stuv"]);
  });
  it("preserves explicit paragraphs and normalizes whitespace", () => {
    expect(wrapText("a   b\n\nc", 18)).toEqual(["a b", "", "c"]);
  });
  it.each([0, -1, 1.5, NaN])("rejects an invalid width: %s", (width) => {
    expect(() => wrapText("text", width)).toThrow(RangeError);
  });
});
