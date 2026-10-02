import type { Input } from "../engine/input.js";
import type { Scene, SceneStack } from "../engine/scenes.js";
import type { Screen } from "../engine/screen.js";
import { drawSmallText, measureSmallText } from "../gfx/font.js";
import { windowFrame } from "../gfx/ui.js";
import { QUEST_TEXT } from "../data/text.js";
export class DiplomaScene implements Scene {
  readonly id = "menu";
  constructor(private readonly input: Input, private readonly stack: SceneStack, private readonly name: string,
    private readonly count: number) {}
  update(): void {
    if (this.input.pressed("a") || this.input.pressed("b")) {
      this.stack.pop();
    }
  }
  draw(screen: Screen): void {
    screen.fill(14);
    windowFrame(screen, 6, 6, 148, 132);
    screen.fill(4, 12, 12, 136, 2);
    screen.fill(4, 12, 128, 136, 2);
    const lines = QUEST_TEXT.diploma(this.name, this.count);
    lines.forEach((line, index) => drawSmallText(screen, line, (160 - measureSmallText(line)) / 2,
      24 + index * 11, 1));
  }
}
