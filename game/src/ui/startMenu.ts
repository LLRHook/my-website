import { TEXT, WORLD_TEXT as T } from "../data/text.js";
import type { Audio } from "../engine/audio.js";
import type { Input } from "../engine/input.js";
import type { Scene, SceneStack } from "../engine/scenes.js";
import type { Screen } from "../engine/screen.js";
import { writeOptions, writeSave, type SaveV1 } from "../engine/storage.js";
import type { Species } from "../data/species.js";
import { CodexScene } from "./codex.js";
import { PartyScene } from "./party.js";
import { BagScene } from "./bag.js";
import { Menu } from "./menu.js";
import { OptionsScene } from "./options.js";
import { PlaceholderScene } from "./placeholder.js";
import { TrainerCardScene } from "./trainerCard.js";

export class StartMenuScene implements Scene {
  readonly id = "menu";
  private readonly menu: Menu;
  constructor(input: Input, audio: Audio, stack: SceneStack, state: SaveV1,
    private readonly background: (screen: Screen) => void, species: readonly Species[], fallback = false) {
    const entries = [T.codex, T.party, T.bag, state.name, T.save, TEXT.options, T.exit];
    this.menu = new Menu(entries, (index) => {
      if (index <= 2) {
        stack.push(index === 0 ? new CodexScene(input, audio, stack, state, species, fallback)
          : index === 1 ? new PartyScene(input, audio, stack, state, species)
          : new BagScene(input, audio, stack, state, species));
      } else if (index === 3) {
        stack.push(new TrainerCardScene(input, stack, state, species.length));
      } else if (index === 4) {
        const saved = writeSave(state);
        if (saved) {
          writeOptions(state.options);
          audio.sfx("save");
        }
        stack.push(new PlaceholderScene(input, stack, T.save, saved ? T.saved : T.saveFailed));
      } else if (index === 5) {
        stack.push(new OptionsScene(input, audio, stack, state.options));
      } else {
        stack.pop();
      }
    }, () => stack.pop(), (effect) => audio.sfx(effect), 7);
    this.input = input;
  }
  private readonly input: Input;
  update(): void {
    this.menu.update(this.input);
  }
  draw(screen: Screen): void {
    this.background(screen);
    this.menu.draw(screen, 40, 12, 112);
  }
}
