import { Menu } from "./menu.js";
import { TEXT } from "../data/text.js";
import type { Sfx } from "../engine/audio.js";

export class YesNo extends Menu {

  constructor(answer: (yes: boolean) => void, sound: (effect: Sfx) => void) {
    super([TEXT.yes, TEXT.no], (index) => answer(index === 0), () => answer(false), sound);
  }
}
