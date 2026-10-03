import { speciesById, formOf, type Species } from "../data/species.js";
import type { SaveV1 } from "../engine/storage.js";
import type { Input } from "../engine/input.js";
import type { Audio } from "../engine/audio.js";
import type { Scene, SceneStack } from "../engine/scenes.js";
import type { Screen } from "../engine/screen.js";
import { drawSmallText } from "../gfx/font.js";
import { Menu } from "./menu.js";
export class PcBoxScene implements Scene {
  readonly id = "menu";
  private menu: Menu;
  private box = false;
  private message = "SELECT: PARTY / BOX";
  constructor(private readonly input: Input, private readonly audio: Audio, private readonly stack: SceneStack,
    private readonly state: SaveV1, private readonly species: readonly Species[]) {
    this.menu = this.makeMenu();
  }
  private makeMenu(): Menu {
    const list = this.box ? this.state.box : this.state.party;
    const entries = list.map((mon) => {
      const species = speciesById(this.species, mon.species)!;
      return `${formOf(species, mon.stage).name} L${mon.level}`;
    });
    return new Menu([...entries,
      "BACK"], (index) => {
      if (index === list.length) {
        this.stack.pop();
      } else if ((!this.box && list.length <= 1) || (this.box && this.state.party.length >= 6)) {
        this.message = this.box ? "Your party is full." : "Keep one friend with you.";
      } else {
        const mon = list.splice(index, 1)[0];
        (this.box ? this.state.party : this.state.box).push(mon);
        this.message = this.box ? "Withdrawn." : "Deposited safely.";
        this.menu = this.makeMenu();
      }
    }, () => this.stack.pop(), (effect) => this.audio.sfx(effect), 6);
  }
  update(): void {
    if (this.input.pressed("select")) {
      this.box = !this.box;
      this.menu = this.makeMenu();
    } else {
      this.menu.update(this.input);
    }
  }
  draw(screen: Screen): void {
    screen.fill(14);
    drawSmallText(screen, this.box ? "BOX: WITHDRAW" : "PARTY: DEPOSIT", 12, 12, 6);
    this.menu.draw(screen, 4, 27, 152);
    drawSmallText(screen, this.message, 12, 130, 6);
  }
}
