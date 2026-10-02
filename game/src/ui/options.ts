import type { Options } from "../data/ids.js";
import { TEXT } from "../data/text.js";
import type { Audio } from "../engine/audio.js";
import type { Input } from "../engine/input.js";
import type { Scene, SceneStack } from "../engine/scenes.js";
import type { Screen } from "../engine/screen.js";
import { writeOptions } from "../engine/storage.js";
import { drawText } from "../gfx/font.js";
import { Menu } from "./menu.js";

export class OptionsScene implements Scene {
  readonly id = "menu";
  private readonly labels: string[] = [];
  private readonly menu: Menu;

  constructor(private readonly input: Input, private readonly audio: Audio,
    private readonly stack: SceneStack, private readonly options: Options) {
    this.refresh();
    this.menu = new Menu(this.labels, (index) => index === 4 ? stack.pop() : this.change(1), () =>
      stack.pop(), (effect) => audio.sfx(effect), 5);
  }

  private refresh(): void {
    this.labels.splice(0, this.labels.length, `${TEXT.speed}  ${this.options.textSpeed.toUpperCase()}`,
      `${TEXT.music} ${this.options.music}`, `${TEXT.sfx}   ${this.options.sfx}`,
      `${TEXT.animations} ${this.options.anims ? TEXT.on : TEXT.off}`, TEXT.back);
  }

  private change(direction: number): void {
    const index = this.menu.selected;
    if (index === 0) {
      const speeds = ["slow", "mid", "fast"] as const;
      this.options.textSpeed = speeds[(speeds.indexOf(this.options.textSpeed) + direction + 3) % 3];
    } else if (index === 1 || index === 2) {
      const key = index === 1 ? "music" : "sfx";
      this.options[key] = Math.max(0, Math.min(10, this.options[key] + direction));
    } else if (index === 3) {
      this.options.anims = !this.options.anims;
    } else {
      return;
    }
    writeOptions(this.options);
    this.audio.setOptions(this.options);
    this.refresh();
  }

  update(): void {
    this.menu.update(this.input);
    const direction = this.input.repeat("right") ? 1 : this.input.repeat("left") ? -1 : 0;
    if (direction) {
      this.change(direction);
      this.audio.sfx("cursor");
    }
  }

  draw(screen: Screen): void {
    screen.fill(6);
    screen.fill(1, 0, 0, 160, 27);
    drawText(screen, TEXT.options, 52, 10, 5);
    this.menu.draw(screen, 4, 35, 152);
    drawText(screen, TEXT.optionsHelp, 8, 131, 1);
  }
}
