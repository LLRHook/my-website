import { speciesById, formOf, type Species } from "../data/species.js";
import type { SaveV1 } from "../engine/storage.js";
import type { Input } from "../engine/input.js";
import type { Audio } from "../engine/audio.js";
import type { Scene, SceneStack } from "../engine/scenes.js";
import type { Screen } from "../engine/screen.js";
import { drawCompactText, drawSmallText } from "../gfx/font.js";
import { creatureIcon } from "../gfx/creatures.js";
import { windowFrame } from "../gfx/ui.js";
import { stats } from "../battle/stats.js";
import { Menu } from "./menu.js";
import { SummaryScene } from "./summary.js";
import { BagScene } from "./bag.js";
export class PartyScene implements Scene {
  readonly id = "menu";
  private menu?: Menu;
  private selected = 0;
  private reorder?: number;
  constructor(private readonly input: Input, private readonly audio: Audio, private readonly stack: SceneStack,
    private readonly state: SaveV1, private readonly species: readonly Species[]) {}
  update(): void {
    if (this.menu) {
      this.menu.update(this.input);
      return;
    }
    if (this.input.pressed("b")) {
      this.stack.pop();
    }
    if (!this.state.party.length) {
      return;
    }
    const direction = this.input.repeat("down") ? 1 : this.input.repeat("up") ? -1 : 0;
    if (direction) {
      this.selected = (this.selected + direction + this.state.party.length) % this.state.party.length;
      this.audio.sfx("cursor");
    }
    if (this.input.pressed("a")) {
      if (this.reorder !== undefined) {
        [this.state.party[this.selected], this.state.party[this.reorder]] =
          [this.state.party[this.reorder], this.state.party[this.selected]];
        this.reorder = undefined;
        return;
      }
      this.menu = new Menu(["SUMMARY", "REORDER", "USE ITEM", "BACK"], (index) => {
        this.menu = undefined;
        const mon = this.state.party[this.selected];
        if (index === 0) {
          const species = speciesById(this.species, mon.species)!;
          this.stack.push(new SummaryScene(this.input, this.stack, mon, species));
        } else if (index === 1) {
          this.reorder = this.selected;
        } else if (index === 2) {
          this.stack.push(new BagScene(this.input, this.audio, this.stack, this.state, this.species, this.selected));
        }
      }, () => { this.menu = undefined; }, (effect) => this.audio.sfx(effect));
    }
  }
  draw(screen: Screen): void {
    screen.describe(`Party: ${this.state.party.map((mon) =>
      formOf(speciesById(this.species, mon.species)!, mon.stage).name).join(" / ")}`);
    screen.fill(14);
    windowFrame(screen, 4, 4, 152, 136);
    drawSmallText(screen, this.reorder === undefined ? "CODELINGS" : "CHOOSE NEW POSITION", 12, 12, 1);
    this.state.party.forEach((mon, index) => {
      const species = speciesById(this.species, mon.species)!;
      const y = 25 + index * 17;
      if (this.selected === index) {
        screen.fill(7, 9, y, 142, 17);
      }
      if (this.selected === index) {
        drawSmallText(screen, "▶", 10, y + 4, 1);
      }
      screen.blit(creatureIcon(species, mon.stage), 0, 0, 16, 16, 18, y);
      drawSmallText(screen, formOf(species, mon.stage).name, 38, y, 1);
      drawCompactText(screen, `Lv${mon.level}`, 126, y + 1, 1);
      const max = stats(formOf(species, mon.stage).base, mon.ivs, mon.level).hp;
      screen.fill(1, 38, y + 10, 54, 5);
      screen.fill(6, 39, y + 11, 52, 3);
      screen.fill(mon.hp / max > 0.2 ? 9 : 24, 39, y + 11, Math.ceil(mon.hp / max * 52), 3);
      drawCompactText(screen, `${mon.hp}/${max}`, 98, y + 10, 1);
      if (mon.status) {
        drawCompactText(screen, mon.status.slice(0, 3), 134, y + 10, 1);
      }
    });
    if (!this.state.party.length) {
      drawSmallText(screen, "Visit the lab for a friend.", 12, 56, 1);
    }
    drawSmallText(screen, "A: CHOOSE  B: BACK", 28, 130, 1);
    this.menu?.draw(screen, 32, 65, 120);
  }
}
