import type { Options } from "../data/ids.js";
import type { Input } from "../engine/input.js";
import type { Screen } from "../engine/screen.js";
import { drawText } from "../gfx/font.js";
import { windowFrame } from "../gfx/ui.js";

export function wrapText(text: string, cols: number): string[] {
  if (!Number.isInteger(cols) || cols < 1) {
    throw new RangeError("Columns must be a positive integer");
  }
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.trim().split(/\s+/).filter(Boolean)) {
      let remaining = [...word];
      if (line && [...line].length + 1 + remaining.length <= cols) {
        line += ` ${word}`;
        continue;
      }
      if (line) {
        lines.push(line);
        line = "";
      }
      while (remaining.length > cols) {
        lines.push(remaining.slice(0, cols).join(""));
        remaining = remaining.slice(cols);
      }
      line = remaining.join("");
    }
    lines.push(line);
  }
  return lines;
}

export class Textbox {
  private readonly lines: string[];
  private page = 0;
  private revealed = 0;
  private frames = 0;

  constructor(text: string, private readonly options: Options, private readonly complete: () => void) {
    this.lines = wrapText(text, 18);
  }

  update(input: Input): void {
    this.frames++;
    const length = this.lines.slice(this.page, this.page + 2).join("").length;
    const delay = {
      slow: 5, mid: 3, fast: 1
    }[this.options.textSpeed];
    if (this.frames % delay === 0) {
      this.revealed = Math.min(length, this.revealed + 1);
    }
    if (input.pressed("a") || input.pressed("b") || input.pressed("start")) {
      if (this.revealed < length) {
        this.revealed = length;
      } else if (this.page + 2 < this.lines.length) {
        this.page += 2;
        this.revealed = 0;
      } else {
        this.complete();
      }
    }
  }

  draw(screen: Screen): void {
    windowFrame(screen, 0, 104, 160, 40);
    const first = this.lines[this.page] ?? "";
    const second = this.lines[this.page + 1] ?? "";
    drawText(screen, [...first].slice(0, this.revealed).join(""), 8, 113);
    drawText(screen, [...second].slice(0, Math.max(0, this.revealed - first.length)).join(""), 8, 124);
    if (this.revealed >= first.length + second.length && (screen.reducedMotion || this.frames % 60 < 30)) {
      drawText(screen, "▼", 148, 135);
    }
  }
}
