import type { Codeling } from "../engine/storage.js";
import type { Audio } from "../engine/audio.js";
import type { Input } from "../engine/input.js";
import type { Screen } from "../engine/screen.js";
import { MOVES } from "../battle/moves.js";
import { drawSmallText } from "../gfx/font.js";
import { windowFrame } from "../gfx/ui.js";
import { Menu } from "./menu.js";

export class LearnMoveMenu {
  readonly menu: Menu;
  constructor(mon: Codeling, private readonly move: string, audio: Audio, complete: (slot: number) => void) {
    this.menu = new Menu([...mon.moves.map((entry) => MOVES[entry.id].name), "KEEP OLD MOVES"],
      (slot) => complete(slot === mon.moves.length ? -1 : slot), () => complete(-1),
      (effect) => audio.sfx(effect), 4);
  }
  update(input: Input): void {
    this.menu.update(input);
  }
  draw(screen: Screen): void {
    this.menu.draw(screen, 4, 70, 152);
    windowFrame(screen, 4, 51, 152, 28);
    drawSmallText(screen, `Learn ${MOVES[this.move].name}?`, 12, 57, 1);
    drawSmallText(screen, "Choose a move to forget.", 12, 69, 1);
  }
}
