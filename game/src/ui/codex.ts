import type { Species } from "../data/species.js";
import type { SaveV1 } from "../engine/storage.js";
import type { Input } from "../engine/input.js";
import type { Audio } from "../engine/audio.js";
import type { Scene, SceneStack } from "../engine/scenes.js";
import type { Screen } from "../engine/screen.js";
import { drawSmallText } from "../gfx/font.js";
import { drawCreature } from "../gfx/creatures.js";
import { forkBall, windowFrame } from "../gfx/ui.js";
import { Menu } from "./menu.js";
import { YesNo } from "./yesno.js";
import { codexFlavour } from "../data/text.js";
export class CodexScene implements Scene {
  readonly id = "codex";
  private readonly menu: Menu;
  private entry?: Species;
  private page = 0;
  private yesno?: YesNo;
  private link?: string;
  constructor(private readonly input: Input, private readonly audio: Audio, private readonly stack: SceneStack,
    private readonly state: SaveV1, private readonly species: readonly Species[], private readonly fallback = false) {
    this.menu = new Menu(species.map((entry) => `${String(entry.dex).padStart(3, "0")}   ${
      state.seen.includes(entry.id) ? entry.name : "?????"}`),
    (index) => {
      if (state.seen.includes(species[index].id)) {
        this.entry = species[index];
        this.page = 0;
        this.audio.cry(this.entry.sprite.seed);
      }
    }, () => stack.pop(), (effect) => audio.sfx(effect), 7);
  }
  update(): void {
    if (this.yesno) {
      this.yesno.update(this.input);
      return;
    }
    if (!this.entry) {
      this.menu.update(this.input);
      return;
    }
    if (this.input.pressed("b")) {
      this.entry = undefined;
      return;
    }
    const direction = this.input.repeat("right") ? 1 : this.input.repeat("left") ? -1 : 0;
    if (direction) {
      const pages = this.pages(this.entry);
      this.page = (this.page + direction + pages.length) % pages.length;
    }
    if (this.input.pressed("a") && this.state.caught.includes(this.entry.id)) {
      this.confirm(this.entry.repo.url);
    } else if (this.input.pressed("select") && this.state.caught.includes(this.entry.id)
      && /^https?:\/\//i.test(this.entry.repo.homepage ?? "")) {
      this.confirm(this.entry.repo.homepage!);
    }
  }
  private confirm(url: string): void {
    this.link = url;
    this.yesno = new YesNo((yes) => {
      this.yesno = undefined;
      if (yes) {
        window.open(url, "_blank", "noopener");
      }
    }, (effect) => this.audio.sfx(effect));
  }
  private pages(entry: Species): string[][] {
    const text = `${entry.repo.description} ${codexFlavour(entry.type, entry.sprite.seed)}`;
    const lines: string[] = [];
    let line = "";
    for (const word of text.split(/\s+/)) {
      for (let start = 0; start < word.length; start += 22) {
        const piece = word.slice(start, start + 22);
        if (line.length + piece.length + 1 > 22) {
          lines.push(line);
          line = "";
        }
        line += (line ? " " : "") + piece;
      }
    }
    if (line) {
      lines.push(line);
    }
    return Array.from({ length: Math.max(1, Math.ceil(lines.length / 3)) },
      (_, index) => lines.slice(index * 3, index * 3 + 3));
  }
  draw(screen: Screen): void {
    screen.describe(this.yesno ? "Codex: Open on GitHub? YES / NO"
      : this.entry ? `Codex entry: ${this.entry.name}. A: Open on GitHub. SELECT: Open demo.`
      : "Codex list. A: Entry. B: Back.");
    screen.fill(14);
    drawSmallText(screen, `CODEX ${this.state.caught.length}/${this.species.length}`, 12, 7, 6);
    if (!this.entry) {
      this.menu.draw(screen, 4, 20, 152);
      for (let row = 0; row < 7; row++) {
        const entry = this.species[this.menu.firstVisible + row];
        if (entry && this.state.caught.includes(entry.id)) {
          forkBall(screen, 49, 29 + row * 14);
        }
      }
      drawSmallText(screen, this.fallback ? "Repo list did not load." : "A: ENTRY  B: BACK", 12, 133, 6);
      return;
    }
    const entry = this.entry;
    windowFrame(screen, 4, 19, 152, 121);
    const sprite = drawCreature(entry.sprite.seed, entry.sprite.body, entry.type, "front");
    const ctx = screen.context;
    ctx.save();
    if (!this.state.caught.includes(entry.id)) {
      ctx.filter = "brightness(0)";
    }
    screen.blit(sprite, 0, 0, 32, 32, 12, 27);
    ctx.restore();
    drawSmallText(screen, entry.name, 52, 27, 1);
    drawSmallText(screen, entry.type.toUpperCase(), 52, 38, 1);
    drawSmallText(screen, `STARS ${entry.repo.stars}`, 52, 49, 1);
    drawSmallText(screen, entry.repo.pushedAt.slice(0, 10), 52, 60, 1);
    const pages = this.pages(entry);
    pages[this.page].forEach((line, index) => drawSmallText(screen, line, 12, 76 + index * 10, 1));
    drawSmallText(screen, `< ${this.page + 1}/${pages.length} >`, 60, 108, 1);
    drawSmallText(screen, "A: OPEN ON GITHUB", 12, 119, 1);
    if (entry.repo.homepage) {
      drawSmallText(screen, "SELECT: OPEN DEMO", 12, 130, 1);
    }
    if (this.yesno) {
      windowFrame(screen, 4, 94, 152, 46);
      drawSmallText(screen, this.link === entry.repo.url ? "Open on GitHub?" : "Open demo?", 12, 102, 1);
      this.yesno.draw(screen, 88, 48, 64);
    }
  }
}
