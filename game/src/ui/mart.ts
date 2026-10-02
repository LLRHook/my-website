import { ITEMS } from "../data/items.js";
import type { ItemId } from "../data/ids.js";
import type { SaveV1 } from "../engine/storage.js";
import type { Input } from "../engine/input.js";
import type { Audio } from "../engine/audio.js";
import type { Scene, SceneStack } from "../engine/scenes.js";
import type { Screen } from "../engine/screen.js";
import { drawSmallText } from "../gfx/font.js";
import { Menu } from "./menu.js";
export class MartScene implements Scene {
  readonly id = "menu";
  private menu: Menu;
  private selling = false;
  private message = "SELECT: BUY / SELL";
  private readonly ids = Object.keys(ITEMS) as ItemId[];
  constructor(private readonly input: Input, private readonly audio: Audio, private readonly stack: SceneStack,
    private readonly state: SaveV1) {
    this.menu = this.makeMenu();
  }
  private makeMenu(): Menu {
    return new Menu([...this.ids.map((id) => `${ITEMS[id].name} ${Math.floor(ITEMS[id].price
      / (this.selling ? 2 : 1))}`), "BACK"], (index) => {
      const id = this.ids[index];
      if (!id) {
        this.stack.pop();
        return;
      }
      const price = Math.floor(ITEMS[id].price / (this.selling ? 2 : 1));
      if (this.selling) {
        if ((this.state.bag[id] ?? 0) > 0) {
          this.state.bag[id]!--;
          this.state.coins += price;
          this.message = "Sold. Thank you!";
        } else {
          this.message = "You have none to sell.";
        }
      } else if (this.state.coins >= price) {
        this.state.coins -= price;
        this.state.bag[id] = (this.state.bag[id] ?? 0) + 1;
        this.message = "Packed in your bag.";
        this.audio.sfx("item");
      } else {
        this.message = "You need more coins.";
      }
    }, () => this.stack.pop(), (effect) => this.audio.sfx(effect), 6);
  }
  update(): void {
    if (this.input.pressed("select")) {
      this.selling = !this.selling;
      this.menu = this.makeMenu();
    } else {
      this.menu.update(this.input);
    }
  }
  draw(screen: Screen): void {
    screen.fill(14);
    drawSmallText(screen, `${this.selling ? "SELL" : "BUY"}    COINS ${this.state.coins}`, 12, 9, 6);
    this.menu.draw(screen, 4, 22, 152);
    drawSmallText(screen, this.message, 12, 123, 6);
    const id = this.ids[this.menu.selected];
    if (id) {
      drawSmallText(screen, `OWNED ${this.state.bag[id] ?? 0}`, 12, 133, 6);
    }
  }
}
