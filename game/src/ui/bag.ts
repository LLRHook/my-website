import type { ItemId } from "../data/ids.js";
import { ITEMS, applyItem } from "../data/items.js";
import type { Species } from "../data/species.js";
import type { SaveV1 } from "../engine/storage.js";
import type { Input } from "../engine/input.js";
import type { Audio } from "../engine/audio.js";
import type { Scene, SceneStack } from "../engine/scenes.js";
import type { Screen } from "../engine/screen.js";
import { drawSmallText } from "../gfx/font.js";
import { windowFrame } from "../gfx/ui.js";
import { stats } from "../battle/stats.js";
import { Menu } from "./menu.js";
export class BagScene implements Scene {
  readonly id = "menu";
  private menu: Menu;
  private targetMenu?: Menu;
  private message = "Select an item.";
  private ids: ItemId[] = [];
  constructor(private readonly input: Input, private readonly audio: Audio, private readonly stack: SceneStack,
    private readonly state: SaveV1, private readonly species: readonly Species[], private readonly target?: number,
    private readonly battleUse?: (id: ItemId, target: number) => void) {
    this.menu = this.makeMenu();
  }
  private makeMenu(): Menu {
    this.ids = (Object.keys(ITEMS) as ItemId[]).filter((id) => (this.state.bag[id] ?? 0) > 0);
    return new Menu([...this.ids.map((id) => `${ITEMS[id].name} x${this.state.bag[id]}`), "BACK"], (index) => {
      const id = this.ids[index];
      if (!id) {
        this.stack.pop();
        return;
      }
      if (id === "forkBall" || id === "greatFork") {
        if (this.battleUse) {
          this.stack.pop();
          this.battleUse(id, 0);
        } else {
          this.message = "Use a fork in a wild battle.";
        }
        return;
      }
      if (this.target !== undefined) {
        this.apply(id, this.target);
      } else {
        this.targetMenu = new Menu([...this.state.party.map((mon) =>
          this.species.find((entry) => entry.id === mon.species)!.name), "BACK"], (target) => {
          this.targetMenu = undefined;
          if (target < this.state.party.length) {
            this.apply(id, target);
          }
        }, () => { this.targetMenu = undefined; }, (effect) => this.audio.sfx(effect));
      }
    }, () => this.stack.pop(), (effect) => this.audio.sfx(effect), 5);
  }
  private apply(id: ItemId, target: number): void {
    if (this.battleUse) {
      this.stack.pop();
      this.battleUse(id, target);
      return;
    }
    const mon = this.state.party[target];
    const species = this.species.find((entry) => entry.id === mon.species)!;
    if (applyItem(id, mon, stats(species.base, mon.ivs, mon.level).hp)) {
      this.state.bag[id]!--;
      this.audio.sfx("item");
      this.message = "Fix applied!";
      this.menu = this.makeMenu();
    } else {
      this.message = "That would have no effect.";
    }
  }
  update(): void {
    (this.targetMenu ?? this.menu).update(this.input);
  }
  draw(screen: Screen): void {
    screen.describe(`Bag: ${(this.targetMenu ?? this.menu).entries.join(" / ")}`);
    screen.fill(14);
    drawSmallText(screen, `BAG    COINS ${this.state.coins}`, 12, 8, 6);
    this.menu.draw(screen, 4, 22, 152);
    windowFrame(screen, 4, 108, 152, 32);
    const id = this.ids[this.menu.selected];
    const text = this.message === "Select an item." && id ? ITEMS[id].description : this.message;
    drawSmallText(screen, text.slice(0, 23), 10, 115, 1);
    drawSmallText(screen, text.slice(23, 46), 10, 126, 1);
    this.targetMenu?.draw(screen, 20, 38, 136);
  }
}
