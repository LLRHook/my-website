import type { Species } from "../data/species.js";
import type { Input } from "../engine/input.js";
import type { Audio } from "../engine/audio.js";
import type { Scene, SceneStack } from "../engine/scenes.js";
import type { Screen } from "../engine/screen.js";
import { drawSmallText, measureSmallText } from "../gfx/font.js";
import { drawCreature } from "../gfx/creatures.js";
import { windowFrame } from "../gfx/ui.js";
import { wrapText } from "./textbox.js";
import { YesNo } from "./yesno.js";
export class StarterScene implements Scene {
  readonly id = "menu";
  private selected: number;
  private titlePage = 0;
  private yesno?: YesNo;
  constructor(private readonly input: Input, private readonly audio: Audio, private readonly stack: SceneStack,
    private readonly candidates: readonly Species[], private readonly chosen: (species: Species) => void,
    initial = 0) {
    this.selected = Math.min(initial, candidates.length - 1);
  }
  update(): void {
    if (this.yesno) {
      this.yesno.update(this.input);
      return;
    }
    const dir = this.input.repeat("right") ? 1 : this.input.repeat("left") ? -1 : 0;
    if (dir) {
      this.selected = (this.selected + dir + this.candidates.length) % this.candidates.length;
      this.titlePage = 0;
      this.audio.cry(this.candidates[this.selected].sprite.seed);
    }
    if (this.input.pressed("select")) {
      const count = Math.max(1, Math.ceil(wrapText(this.candidates[this.selected].repo.title, 22).length / 2));
      this.titlePage = (this.titlePage + 1) % count;
    }
    if (this.input.pressed("a")) {
      this.yesno = new YesNo((yes) => {
        this.yesno = undefined;
        if (yes) {
          this.stack.pop();
          this.chosen(this.candidates[this.selected]);
        }
      }, (effect) => this.audio.sfx(effect));
    }
  }
  draw(screen: Screen): void {
    screen.fill(14);
    windowFrame(screen, 4, 4, 152, 136);
    drawSmallText(screen, "CHOOSE A FIRST FRIEND", 20, 13, 1);
    const species = this.candidates[this.selected];
    this.candidates.forEach((entry, index) => {
      const x = 16 + index * 48;
      screen.blit(drawCreature(entry.sprite.seed, entry.sprite.body, entry.type, "front"), 0, 0, 32, 32, x, 28);
      if (index === this.selected) {
        screen.fill(4, x, 64, 32, 2);
      }
    });
    const title = wrapText(species.repo.title, 22);
    const pageLines = title.slice(this.titlePage * 2, this.titlePage * 2 + 2);
    const lines = [species.name, species.type.toUpperCase(), ...pageLines];
    lines.forEach((line, index) =>
      drawSmallText(screen, line, (160 - measureSmallText(line)) / 2, 70 + index * 11, 1));
    if (title.length > 2) {
      drawSmallText(screen, `${this.titlePage + 1}/${Math.ceil(title.length / 2)}`, 130, 70, 1);
    }
    drawSmallText(screen, "LEFT/RIGHT: CHOOSE", 29, 117, 1);
    drawSmallText(screen, "A: TAKE  SELECT: TITLE", 17, 130, 1);
    this.yesno?.draw(screen, 88, 46, 64);
  }
}
