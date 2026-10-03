import { DiplomaScene } from "./diploma.js";
import { REGION_TEXT as R, WORLD_TEXT as T } from "../data/text.js";
import type { Input } from "../engine/input.js";
import type { Scene, SceneStack } from "../engine/scenes.js";
import type { Screen } from "../engine/screen.js";
import type { SaveV1 } from "../engine/storage.js";
import { drawSmallText, drawText } from "../gfx/font.js";
import { drawSprite } from "../gfx/sprites.js";
import { windowFrame } from "../gfx/ui.js";
import { pixels } from "../gfx/pixels.js";

// Original check, linked pipeline and release tag, each on a four-colour badge ramp.
const BADGES = [
  ["........", "......1.", ".....12.", ".1..12..", ".1212...", "..12....", "........", "........"],
  ["........", ".111111.", ".122221.", ".11..11.", "..1..1..", ".11..11.", ".122221.", ".111111."],
  ["..111...", ".12221..", "1222221.", "12322221", "12222221", ".122221.", "..1221..", "...11..."],
] as const;

export class TrainerCardScene implements Scene {
  readonly id = "menu";
  private readonly badgeArt = BADGES.map((rows) => pixels(rows, { "1": 10, "2": 9, "3": 5 }));
  constructor(private readonly input: Input, private readonly stack: SceneStack, private readonly state: SaveV1,
    private readonly count = 0) {
  }
  update(): void {
    if (this.input.pressed("select") && this.state.flags.includes("diploma")) {
      this.stack.push(new DiplomaScene(this.input, this.stack, this.state.name, this.count));
      return;
    }
    if (this.input.pressed("a") || this.input.pressed("b") || this.input.pressed("start")) {
      this.stack.pop();
    }
  }
  draw(screen: Screen): void {
    const champion = this.state.flags.includes("champion") ? ` / ${R.championLabel}` : "";
    screen.describe(`${T.card}: ${this.state.name}${champion}`);
    screen.fill(1);
    windowFrame(screen, 8, 8, 144, 128);
    drawSmallText(screen, T.card, 44, 17, 1);
    drawSprite(screen, "player", "down", 0, 121, 36);
    drawText(screen, this.state.name, 20, 39, 1);
    const minutes = Math.floor(this.state.playTimeSec / 60);
    const time = `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
    const rows = [
      `${T.seenLabel} ${this.state.seen.length}   ${T.caughtLabel} ${this.state.caught.length}`,
      `${T.coinsLabel} ${this.state.coins}`, `${T.timeLabel} ${time}`,
    ];
    drawSmallText(screen, R.badges, 20, 60, 1);
    ["merge", "pipeline", "release"].forEach((badge, index) => {
      const x = 65 + index * 24;
      screen.fill(28, x, 57, 18, 18);
      screen.fill(6, x + 1, 58, 16, 16);
      if (this.state.flags.includes(`badge:${badge}`)) {
        const art = this.badgeArt[index];
        screen.blit(art, 0, 0, 8, 8, x + 5, 62);
      }
    });
    if (this.state.flags.includes("champion")) {
      drawSmallText(screen, `★ ${R.championLabel}`, 20, 116, 1);
    }
    if (this.state.flags.includes("diploma")) {
      drawSmallText(screen, "SELECT: DIPLOMA", 20, 126, 1);
    }
    rows.forEach((row, index) => drawSmallText(screen, row, 20, 82 + index * 11, 0));
  }
}
