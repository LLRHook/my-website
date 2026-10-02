import type { Input } from "../engine/input.js";
import type { Scene, SceneStack } from "../engine/scenes.js";
import type { Screen } from "../engine/screen.js";
import { drawSmallText, measureSmallText } from "../gfx/font.js";
import { wrapText } from "./textbox.js";
import { windowFrame } from "../gfx/ui.js";

export class PlaceholderScene implements Scene {
  readonly id: "menu" | "codex";
  constructor(private readonly input: Input, private readonly stack: SceneStack,
    private readonly title: string, private readonly text: string, codex = false) {
    this.id = codex ? "codex" : "menu";
  }
  update(): void {
    if (this.input.pressed("a") || this.input.pressed("b") || this.input.pressed("start")) {
      this.stack.pop();
    }
  }
  draw(screen: Screen): void {
    screen.fill(6);
    windowFrame(screen, 8, 8, 144, 128);
    drawSmallText(screen, this.title, (160 - measureSmallText(this.title)) / 2, 20, 1);
    wrapText(this.text, 22).forEach((line, index) => {
      drawSmallText(screen, line, (160 - measureSmallText(line)) / 2, 52 + index * 16, 0);
    });
  }
}
