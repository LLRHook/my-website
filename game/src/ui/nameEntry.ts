import { WORLD_TEXT as T } from "../data/text.js";
import type { Input } from "../engine/input.js";
import type { Scene } from "../engine/scenes.js";
import type { Screen } from "../engine/screen.js";
import { drawSmallText, drawText } from "../gfx/font.js";
import { drawSprite } from "../gfx/sprites.js";
import { windowFrame } from "../gfx/ui.js";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ-";
export class NameEntryScene implements Scene {
  readonly id = "intro";
  private name = "DEV";
  private cursor = 27;
  private edited = false;
  private fading = 0;

  constructor(private readonly input: Input, private readonly accept: (name: string) => void) {
  }
  update(): void {
    if (this.fading) {
      this.fading++;
      if (this.fading >= 24) {
        this.accept(this.name || "DEV");
      }
      return;
    }
    const dx = this.input.repeat("right") ? 1 : this.input.repeat("left") ? -1 : 0;
    const dy = this.input.repeat("down") ? 7 : this.input.repeat("up") ? -7 : 0;
    this.cursor = (this.cursor + dx + dy + 28) % 28;
    if (this.input.pressed("b")) {
      this.name = this.name.slice(0, -1);
      this.edited = true;
    }
    if (this.input.pressed("start") || this.input.pressed("a") && this.cursor === 27) {
      this.fading = 1;
    } else if (this.input.pressed("a")) {
      if (!this.edited) {
        this.name = "";
        this.edited = true;
      }
      if (this.name.length < 7) {
        this.name += LETTERS[this.cursor];
      }
    }
  }
  draw(screen: Screen): void {
    screen.fill(6);
    windowFrame(screen, 8, 8, 144, 44);
    drawSmallText(screen, T.namePrompt, 52, 16, 1);
    drawSprite(screen, "player", "down", 0, 20, 25);
    drawText(screen, this.name.padEnd(7, "_"), 52, 33, 1);
    windowFrame(screen, 8, 59, 144, 65);
    for (let index = 0; index < 28; index++) {
      const x = 20 + index % 7 * 18 - (index === 27 ? 5 : 0);
      const y = 68 + Math.floor(index / 7) * 13;
      if (index === this.cursor) {
        screen.fill(1, x - 2, y - 2, index === 27 ? 27 : 12, 11);
      }
      drawSmallText(screen, index === 27 ? T.nameDone : LETTERS[index], x, y, index === this.cursor ? 5 : 0);
    }
    drawSmallText(screen, T.nameHelp, 32, 132, 1);
    screen.fadeToBlack(this.fading ? this.fading / 24 : 0);
  }
}
