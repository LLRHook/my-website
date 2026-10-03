import type { Input } from "../engine/input.js";
import type { Audio } from "../engine/audio.js";
import type { Scene, SceneStack } from "../engine/scenes.js";
import type { Screen } from "../engine/screen.js";
import { drawSmallText, measureSmallText } from "../gfx/font.js";
import { Menu } from "./menu.js";
import { YesNo } from "./yesno.js";
import { CREDITS, REGION_TEXT as R } from "../data/text.js";
export class EndingScene implements Scene {
  readonly id = "ending";
  private frames = 0;
  private menu?: Menu;
  private yesno?: YesNo;
  private readonly lines = CREDITS;
  constructor(private readonly input: Input, private readonly audio: Audio, private readonly stack: SceneStack) {}
  enter(): void {
    this.audio.play("ending");
  }
  update(): void {
    this.frames++;
    if (this.yesno) {
      this.yesno.update(this.input);
      return;
    }
    if (this.menu) {
      this.menu.update(this.input);
      return;
    }
    if (this.frames > (144 + this.lines.length * 18) * 4 || this.input.pressed("a")) {
      const urls = ["/resume", "/contact", "https://github.com/LLRHook"];
      this.menu = new Menu(["RESUME", "CONTACT", "GITHUB", "KEEP PLAYING"], (index) => {
        if (index === 3) {
          this.stack.pop();
        } else {
          this.yesno = new YesNo((yes) => {
            this.yesno = undefined;
            if (yes) {
              window.open(urls[index], "_blank", "noopener");
            }
          }, (effect) => this.audio.sfx(effect));
        }
      }, () => this.stack.pop(), (effect) => this.audio.sfx(effect));
    }
  }
  draw(screen: Screen): void {
    screen.describe(this.menu ? R.endingMenuLabel : R.endingLabel);
    screen.fill(1);
    const scroll = Math.floor(this.frames / 4);
    this.lines.forEach((line, index) => {
      const y = 144 + index * 18 - scroll;
      if (y > -8 && y < 144) {
        drawSmallText(screen, line, (160 - measureSmallText(line)) / 2, y, 6);
      }
    });
    this.menu?.draw(screen, 16, 40, 128);
    if (this.yesno) {
      drawSmallText(screen, "Open this page?", 34, 22, 6);
      this.yesno.draw(screen, 48, 60, 64);
    }
  }
}
