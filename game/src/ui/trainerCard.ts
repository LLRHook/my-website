import { DiplomaScene } from "./diploma.js";
import { WORLD_TEXT as T } from "../data/text.js";
import type { Input } from "../engine/input.js";
import type { Scene, SceneStack } from "../engine/scenes.js";
import type { Screen } from "../engine/screen.js";
import type { SaveV1 } from "../engine/storage.js";
import { drawSmallText, drawText } from "../gfx/font.js";
import { drawSprite } from "../gfx/sprites.js";
import { windowFrame } from "../gfx/ui.js";

export class TrainerCardScene implements Scene {
  readonly id = "menu";
  constructor(private readonly input: Input, private readonly stack: SceneStack, private readonly state: SaveV1,
    private readonly count = 0) {
  }
  update(): void {
    if (this.input.pressed("select") && this.state.flags.includes("diploma")) {
      this.stack.push(new DiplomaScene(this.input, this.stack, this.state.name, this.count));
      return;
    }
    if (this.input.pressed("a") || this.input.pressed("b") || this.input.pressed("start")) {
      this.stack.pop();
    }
  }
  draw(screen: Screen): void {
    screen.fill(1);
    windowFrame(screen, 8, 8, 144, 128);
    drawSmallText(screen, T.card, 44, 17, 1);
    drawSprite(screen, "player", "down", 0, 121, 36);
    drawText(screen, this.state.name, 20, 39, 1);
    const minutes = Math.floor(this.state.playTimeSec / 60);
    const time = `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
    const rows = [
      `${T.badgeLabel} ${this.state.flags.includes("badge") ? T.yesBadge : T.noBadge}`,
      `${T.seenLabel} ${this.state.seen.length}   ${T.caughtLabel} ${this.state.caught.length}`,
      `${T.coinsLabel} ${this.state.coins}`, `${T.timeLabel} ${time}`,
    ];
    if (this.state.flags.includes("diploma")) {
      drawSmallText(screen, "SELECT: DIPLOMA", 20, 122, 1);
    }
    rows.forEach((row, index) => drawSmallText(screen, row, 20, 65 + index * 15, 0));
  }
}
