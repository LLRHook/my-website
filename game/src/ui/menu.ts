import type { Input } from "../engine/input.js";
import type { Screen } from "../engine/screen.js";
import type { Sfx } from "../engine/audio.js";
import { drawText } from "../gfx/font.js";
import { windowFrame } from "../gfx/ui.js";

export class Menu {
  selected = 0;
  private scroll = 0;

  constructor(readonly entries: readonly string[], private readonly select: (index: number) => void,
    private readonly cancel: () => void, private readonly sound: (effect: Sfx) => void, readonly visibleRows = 4) {
    if (!entries.length) {
      throw new Error("Menu requires an entry");
    }
  }

  update(input: Input): void {
    const direction = input.repeat("down") ? 1 : input.repeat("up") ? -1 : 0;
    if (direction) {
      this.selected = (this.selected + direction + this.entries.length) % this.entries.length;
      this.scroll = Math.max(0, Math.min(this.scroll, this.selected));
      if (this.selected >= this.scroll + this.visibleRows) {
        this.scroll = this.selected - this.visibleRows + 1;
      }
      this.sound("cursor");
    }
    if (input.pressed("b")) {
      this.sound("cancel");
      this.cancel();
    } else if (input.pressed("a") || input.pressed("start")) {
      this.sound("confirm");
      this.select(this.selected);
    }
  }

  draw(screen: Screen, x = 32, y = 64, width = 112): void {
    const count = Math.min(this.visibleRows, this.entries.length);
    windowFrame(screen, x, y, width, count * 14 + 14);
    for (let row = 0; row < count; row++) {
      const index = this.scroll + row;
      if (index === this.selected) {
        drawText(screen, "▶", x + 7, y + 9 + row * 14, 1);
      }
      drawText(screen, this.entries[index], x + 20, y + 9 + row * 14, 1);
    }
  }
}
