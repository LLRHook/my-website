import type { Codeling } from "../engine/storage.js";
import { formOf, type Species } from "../data/species.js";
import type { Input } from "../engine/input.js";
import type { Scene, SceneStack } from "../engine/scenes.js";
import type { Screen } from "../engine/screen.js";
import { drawCompactText, drawSmallText } from "../gfx/font.js";
import { drawCreature } from "../gfx/creatures.js";
import { windowFrame } from "../gfx/ui.js";
import { expForLevel, stats } from "../battle/stats.js";
import { MOVES } from "../battle/moves.js";
export class SummaryScene implements Scene {
  readonly id = "menu";
  private page = 0;
  constructor(private readonly input: Input, private readonly stack: SceneStack,
    private readonly mon: Codeling, private readonly species: Species) {}
  update(): void {
    if (this.input.pressed("b")) {
      this.stack.pop();
    }
    if (this.input.pressed("a") || this.input.repeat("right") || this.input.repeat("left")) {
      this.page = 1 - this.page;
    }
  }
  draw(screen: Screen): void {
    screen.describe(`Summary: ${formOf(this.species, this.mon.stage).name}`);
    screen.fill(14);
    windowFrame(screen, 4, 4, 152, 136);
    drawSmallText(screen, `${formOf(this.species, this.mon.stage).name} L${this.mon.level}`, 12, 13, 1);
    const sprite = drawCreature(this.species.sprite.seed, this.species.sprite.body, this.species.type,
      "front", this.mon.stage);
    screen.blit(sprite, 0, 0, 32, 32, 12, 28);
    drawSmallText(screen, this.species.type.toUpperCase(), 52, 31, 1);
    drawSmallText(screen, this.mon.status?.toUpperCase() ?? "READY", 52, 43, 1);
    const values = stats(formOf(this.species, this.mon.stage).base, this.mon.ivs, this.mon.level);
    drawSmallText(screen, `HP ${this.mon.hp}/${values.hp}`, 52, 55, 1);
    if (this.page === 0) {
      drawSmallText(screen, `ATK ${values.atk}  DEF ${values.def}`, 12, 73, 1);
      drawSmallText(screen, `SPD ${values.spd}  SPC ${values.spc}`, 12, 86, 1);
      drawSmallText(screen, `NEXT ${this.mon.level === 100 ? 0 : expForLevel(this.mon.level + 1) - this.mon.exp} EXP`,
        12, 99, 1);
      drawSmallText(screen, this.species.repo.name.slice(0, 22), 12, 112, 1);
    } else {
      this.mon.moves.forEach((entry, index) => {
        const move = MOVES[entry.id];
        const y = 68 + index * 15;
        drawSmallText(screen, move.name, 12, y, 1);
        drawCompactText(screen, `${entry.pp}/${move.pp}`, 124, y + 1, 1);
        drawCompactText(screen, move.type, 12, y + 9, 1);
      });
    }
    drawSmallText(screen, "A: PAGE   B: BACK", 28, 130, 1);
  }
}
