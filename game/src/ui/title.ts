import type { GameRepo, Options } from "../data/ids.js";
import { TEXT } from "../data/text.js";
import type { Audio } from "../engine/audio.js";
import type { Input } from "../engine/input.js";
import type { Scene, SceneStack } from "../engine/scenes.js";
import type { Screen } from "../engine/screen.js";
import { loadSave, reconcileSpecies, type SaveV1 } from "../engine/storage.js";
import { drawSmallText, drawText, measureSmallText, measureText } from "../gfx/font.js";
import { buildSpecies } from "../data/species.js";
import { drawCreature } from "../gfx/creatures.js";
import { pixels } from "../gfx/pixels.js";
import { Menu } from "./menu.js";
import { OptionsScene } from "./options.js";
import { professorPortrait } from "../gfx/sprites.js";
import { OverworldScene, newGame } from "../world/overworld.js";
import { NameEntryScene } from "./nameEntry.js";
import { Textbox } from "./textbox.js";

const CLOUD = [
  "................................", "........wwwwww..................", "......wwwwwwwwww................",
  ".....wwwwwwwwwwww...wwww.........", "...wwwwwwwwwwwwwwwwwwwwww.......", "..wwwwwwwwwwwwwwwwwwwwwwwww.....",
  ".wwwwwwwwwwwwwwwwwwwwwwwwwwww...", ".wwwwwwwwwwwwwwwwwwwwwwwwwwww...", "..ssssssssssssssssssssssssss....",
  "....ssssssssssssssssssssss......", "................................", "................................",
] as const;

interface TitleArt {
  cloud: HTMLCanvasElement;
  hills: HTMLCanvasElement;
}

let art: TitleArt | undefined;

function titleArt(): TitleArt {
  return art ??= {
    cloud: pixels(CLOUD, {
      w: 5, s: 12
    }),
    hills: pixels(Array.from({
      length: 40
    }, (_, y) => Array.from({
      length: 160
    }, (_, x) => {
      const ridge = 10 + Math.round(Math.sin(x / 22) * 8 + Math.cos(x / 13) * 4);
      return y < ridge ? "." : y < ridge + 3 ? "l" : "d";
    }).join("")), {
      l: 8, d: 9
    }),
  };
}

function drawLogo(screen: Screen, y: number): void {
  const x = Math.round((160 - measureSmallText(TEXT.logo, 2)) / 2);
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [0, 2]]) {
    drawSmallText(screen, TEXT.logo, x + dx, y + dy, 0, 2);
  }

  drawSmallText(screen, TEXT.logo, x, y - 1, 4, 2);

  drawSmallText(screen, TEXT.logo, x, y + 1, 1, 2);
}

function drawSubtitle(screen: Screen, y: number): void {
  const x = Math.round((160 - measureSmallText(TEXT.subtitle)) / 2);

  drawSmallText(screen, TEXT.subtitle, x, y, 1);
}

export class TitleScene implements Scene {
  readonly id = "title";
  private frames = 0;
  private menu?: Menu;
  private transition = 0;
  private continuing = false;
  private readonly save: SaveV1 | null;
  private readonly art = titleArt();
  private readonly species;

  constructor(private readonly input: Input, private readonly audio: Audio,
    private readonly stack: SceneStack, private readonly options: Options,
    private readonly repos: readonly GameRepo[], private readonly root: HTMLElement, private readonly hour?: number,
    private readonly rng: () => number = Math.random, private readonly forceEncounter = false) {
    const list = buildSpecies([...repos]);
    this.species = list[Math.floor(rng() * list.length)];
    const save = loadSave();
    const ids = new Set(list.map((species) => species.id));
    this.save = save ? reconcileSpecies(save, ids) : null;
  }

  enter(): void {
    this.frames = 0;
    this.audio.play("title");
  }

  update(): void {
    this.frames++;
    if (this.transition) {
      this.transition++;
      if (this.transition > 24) {
        if (this.continuing && this.save) {
          Object.assign(this.options, this.save.options);
          this.stack.replace(new OverworldScene(this.input, this.audio, this.stack, this.root,
            { ...this.save, options: this.options }, this.repos, this.hour, this.rng, this.forceEncounter));
        } else {
          this.stack.replace(new IntroScene(this.input, this.audio, this.options, () => {
            this.stack.replace(new NameEntryScene(this.input, (name) => {
              this.stack.replace(new OverworldScene(this.input, this.audio, this.stack, this.root,
                newGame(name, this.options), this.repos, this.hour, this.rng, this.forceEncounter));
            }));
          }));
        }
      }
      return;
    }
    if (this.menu) {
      this.menu.update(this.input);
      return;
    }
    if (this.input.pressed("start") || this.input.pressed("a")) {
      this.audio.sfx("confirm");
      const entries = this.save ? [TEXT.newGame, TEXT.continue, TEXT.options] : [TEXT.newGame, TEXT.options];
      this.menu = new Menu(entries, (index) => {
        if (entries[index] === TEXT.options) {
          this.stack.push(new OptionsScene(this.input, this.audio, this.stack, this.options));
        } else {
          this.continuing = entries[index] === TEXT.continue;
          this.transition = 1;
        }
      }, () => {
        this.menu = undefined;
      }, (effect) => this.audio.sfx(effect));
    }
  }

  draw(screen: Screen): void {
    const motion = screen.reducedMotion ? 0 : this.frames;
    screen.fill(12);
    for (const [offset, y] of [[20, 8], [94, 56], [170, 19]]) {
      const x = ((offset - Math.floor(motion / 12)) % 208 + 208) % 208 - 32;
      screen.blit(this.art.cloud, 0, 0, 32, 12, x, y);
    }
    const scroll = Math.floor(motion / 24) % 160;
    screen.blit(this.art.hills, 0, 0, 160, 40, -scroll, 73);
    screen.blit(this.art.hills, 0, 0, 160, 40, 160 - scroll, 73);
    screen.fill(9, 0, 110, 160, 7);
    screen.fill(10, 0, 116, 160, 28);
    const bob = screen.reducedMotion ? 0 : Math.round(Math.sin(this.frames / 45));
    drawLogo(screen, 24 + bob);
    drawSubtitle(screen, 47);
    const walkX = screen.reducedMotion ? 72 : ((Math.floor(this.frames / 5) + 56) % 184) - 16;
    const step = screen.reducedMotion ? 0 : Math.floor(this.frames / 12) % 2;
    const creature = drawCreature(this.species.sprite.seed, this.species.sprite.body, this.species.type, "front");
    screen.blit(creature, 0, 0, 32, 32, walkX, (this.menu ? 95 : 76) - step);
    if (!this.menu) {
      const width = measureSmallText(this.species.name);
      const nameX = Math.max(6, Math.min(154 - width, walkX + 16 - width / 2));
      screen.fill(10, nameX - 2, 108, width + 4, 12);
      screen.fill(6, nameX - 1, 109, width + 2, 10);
      drawSmallText(screen, this.species.name, nameX, 111, 1);
    }
    if (!this.menu && (screen.reducedMotion || this.frames % 90 < 60)) {
      drawText(screen, TEXT.start, Math.round((160 - measureText(TEXT.start)) / 2), 122, 4);
    }
    drawSmallText(screen, TEXT.copyright, Math.round((160 - measureSmallText(TEXT.copyright)) / 2), 133, 6);
    this.menu?.draw(screen, (160 - 112) / 2, 64, 112);
    screen.fadeToBlack(this.transition ? (screen.reducedMotion ? 1 : this.transition / 24) : 0);
  }
}

class IntroScene implements Scene {
  readonly id = "intro";
  private frames = 0;
  private readonly textbox: Textbox;
  private readonly portrait = professorPortrait();

  constructor(private readonly input: Input, audio: Audio, options: Options, complete: () => void) {
    audio.play("intro");
    this.textbox = new Textbox(TEXT.intro, options, complete);
  }
  update(): void {
    this.frames++;
    this.textbox.update(this.input);
  }
  draw(screen: Screen): void {
    screen.fill(6);
    screen.fill(7, 24, 84, 112, 8);
    screen.blit(this.portrait, 0, 0, 48, 64, 56, 20);
    drawSmallText(screen, "PROF. IVANOV", 45, 93, 1);
    this.textbox.draw(screen);
    screen.fadeFromBlack(screen.reducedMotion ? 1 : Math.min(1, this.frames / 24));
  }
}
