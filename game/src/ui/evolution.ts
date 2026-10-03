import { formOf, type Species } from "../data/species.js";
import { BATTLE_TEXT, EVOLUTION_TEXT, evolutionText } from "../data/text.js";
import type { Codeling, SaveV1 } from "../engine/storage.js";
import type { Input } from "../engine/input.js";
import type { Audio } from "../engine/audio.js";
import type { Scene, SceneStack } from "../engine/scenes.js";
import type { Screen } from "../engine/screen.js";
import { stats } from "../battle/stats.js";
import { MOVES } from "../battle/moves.js";
import { drawCreature } from "../gfx/creatures.js";
import { drawSmallText } from "../gfx/font.js";
import { Textbox } from "./textbox.js";
import { LearnMoveMenu } from "./learnMove.js";

export class EvolutionScene implements Scene {
  readonly id = "evolution";
  private readonly from: 1 | 2 | 3;
  private readonly reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  private phase: "start" | "animation" | "success" | "cancelled" | "learn" = "start";
  private frame = 0;
  private textbox?: Textbox;
  private learn?: LearnMoveMenu;
  constructor(private readonly input: Input, private readonly audio: Audio, private readonly stack: SceneStack,
    private readonly state: SaveV1, private readonly mon: Codeling, private readonly species: Species,
    private readonly to: 2 | 3) {
    this.from = mon.stage;
  }
  enter(): void {
    this.message(EVOLUTION_TEXT.start, () => {
      this.phase = "animation";
      this.frame = 0;
      this.audio.play("evolve");
    });
  }
  private get motion(): boolean {
    return this.state.options.anims && !this.reduced;
  }
  private message(text: string, complete: () => void): void {
    this.textbox = new Textbox(evolutionText(text, formOf(this.species, this.from).name,
      formOf(this.species, this.to).name), this.state.options, () => {
      this.textbox = undefined;
      complete();
    });
  }
  update(): void {
    if (this.phase === "animation") {
      if (this.input.pressed("b")) {
        this.phase = "cancelled";
        this.audio.sfx("cancel");
        this.message(EVOLUTION_TEXT.cancelled, () => this.stack.pop());
        return;
      }
      this.frame++;
      if (this.frame >= (this.motion ? 240 : 60)) {
        this.evolve();
      }
      return;
    }
    if (this.phase === "success" && this.frame < 120) {
      this.frame++;
      return;
    }
    if (this.textbox) {
      this.textbox.update(this.input);
    } else {
      this.learn?.update(this.input);
    }
  }
  private evolve(): void {
    const oldMax = stats(formOf(this.species, this.from).base, this.mon.ivs, this.mon.level).hp;
    const newMax = stats(formOf(this.species, this.to).base, this.mon.ivs, this.mon.level).hp;
    this.mon.hp = this.mon.hp === 0 ? 0 : Math.max(1, newMax - (oldMax - this.mon.hp));
    this.mon.stage = this.to;
    this.phase = "success";
    this.frame = 0;
    this.audio.play("evolveSuccess");
    this.audio.cry(this.species.sprite.seed);
    this.message(EVOLUTION_TEXT.success, () => this.learnStrongMove());
  }
  private learnStrongMove(): void {
    const strong = Object.values(MOVES).filter((move) => move.type === this.species.type)[4];
    if (this.mon.moves.some((move) => move.id === strong.id)) {
      this.stack.pop();
      return;
    }
    const learned = () => {
      this.learn = undefined;
      this.textbox = new Textbox(BATTLE_TEXT.learned(formOf(this.species, this.to).name, strong.name),
        this.state.options, () => this.stack.pop());
    };
    this.phase = "learn";
    if (this.mon.moves.length < 4) {
      this.mon.moves.push({ id: strong.id, pp: strong.pp });
      learned();
    } else {
      this.learn = new LearnMoveMenu(this.mon, strong.id, this.audio, (slot) => {
        if (slot < 0) {
          this.stack.pop();
        } else {
          this.mon.moves[slot] = { id: strong.id, pp: strong.pp };
          learned();
        }
      });
    }
  }
  draw(screen: Screen): void {
    const description = this.textbox?.text ?? this.learn?.menu.entries.join(" / ") ?? "B: Cancel";
    screen.describe(`Evolution ${this.phase}: ${description}`);
    screen.fill(1);
    const ctx = screen.context;
    const old = drawCreature(this.species.sprite.seed, this.species.sprite.body, this.species.type, "front", this.from);
    const next = drawCreature(this.species.sprite.seed, this.species.sprite.body, this.species.type, "front", this.to);
    ctx.save();
    if (this.phase === "animation" && this.motion) {
      const interval = Math.max(3, 24 - Math.floor(this.frame / 11));
      ctx.filter = "brightness(0) invert(1)";
      ctx.drawImage(Math.floor(this.frame / interval) % 2 ? next : old, 64, 38);
    } else if (this.phase === "animation") {
      ctx.globalAlpha = 1 - this.frame / 60;
      ctx.drawImage(old, 64, 38);
      ctx.globalAlpha = this.frame / 60;
      ctx.drawImage(next, 64, 38);
    } else {
      ctx.drawImage(this.phase === "start" || this.phase === "cancelled" ? old : next, 64, 38);
    }
    ctx.restore();
    if (this.phase === "animation") {
      drawSmallText(screen, "B: CANCEL", 54, 90, 6);
    }
    this.textbox?.draw(screen);
    this.learn?.draw(screen);
    screen.whiteFlash(this.motion && this.phase === "success" && this.frame < 18 ? 1 - this.frame / 18 : 0);
    screen.fadeToBlack(0);
  }
}
