import { BATTLE_TEXT as T } from "../data/text.js";
import type { ItemId } from "../data/ids.js";
import type { SaveV1 } from "../engine/storage.js";
import type { Input } from "../engine/input.js";
import type { Audio } from "../engine/audio.js";
import type { Scene, SceneStack } from "../engine/scenes.js";
import type { Screen } from "../engine/screen.js";
import { drawCompactText, drawSmallText } from "../gfx/font.js";
import { CREATURE_RAMPS, drawCreature } from "../gfx/creatures.js";
import { drawSprite } from "../gfx/sprites.js";
import { forkBall, groundPlatform, windowFrame } from "../gfx/ui.js";
import { BagScene } from "../ui/bag.js";
import { Menu } from "../ui/menu.js";
import { Textbox } from "../ui/textbox.js";
import { formOf } from "../data/species.js";
import { LearnMoveMenu } from "../ui/learnMove.js";
import { MOVES } from "./moves.js";
import { expForLevel, stats } from "./stats.js";
import { Battle, type BattleAction, type BattleEvent, type BattleResult } from "./battle.js";

function spiralTiles(): [number, number][] {
  const tiles: [number, number][] = [];
  let left = 0;
  let right = 9;
  let top = 0;
  let bottom = 8;
  while (left <= right && top <= bottom) {
    for (let x = left; x <= right; x++) {
      tiles.push([x, top]);
    }
    top++;
    for (let y = top; y <= bottom; y++) {
      tiles.push([right, y]);
    }
    right--;
    if (top <= bottom) {
      for (let x = right; x >= left; x--) {
        tiles.push([x, bottom]);
      }
      bottom--;
    }
    if (left <= right) {
      for (let y = bottom; y >= top; y--) {
        tiles.push([left, y]);
      }
      left++;
    }
  }
  return tiles;
}
const SPIRAL = spiralTiles();
export class BattleScene implements Scene {
  readonly id = "battle";
  private menu?: Menu;
  private learn?: LearnMoveMenu;
  private mode: "main" | "moves" | "team" | "learn" = "main";
  private textbox?: Textbox;
  private queue: BattleEvent[] = [];
  private frames = 0;
  private animation = 0;
  private event?: BattleEvent;
  private hp = [0, 0];
  private readonly displayActive = [0, 0];
  private readonly displayLevels: number[][];
  private readonly displayExp: number[];
  private expTarget = 0;
  private fainted = [false, false];
  private ended?: Extract<BattleEvent, { kind: "end" }>;
  private readonly reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  constructor(private readonly input: Input, private readonly audio: Audio, private readonly stack: SceneStack,
    readonly battle: Battle, private readonly state: SaveV1,
    private readonly complete: (result: BattleResult, levelledUp: ReadonlySet<string>) => void) {
    this.hp = [battle.mon(0).hp, battle.mon(1).hp];
    this.displayActive[0] = battle.active[0];
    this.displayLevels = [battle.config.party.map((mon) => mon.level), battle.config.foes.map((mon) => mon.level)];
    this.displayExp = battle.config.party.map((mon) => mon.exp);
  }
  enter(): void {
    this.audio.play(this.battle.config.rhea ? "leader" : this.battle.config.trainer ? "trainer" : "wild");
    this.audio.cry(this.battle.species(this.battle.mon(1)).sprite.seed);
    this.queue.push({ kind: "message", text: this.battle.config.trainer
      ? T.trainer(this.battle.config.trainer, this.battle.name(this.battle.mon(1)))
      : T.wild(this.battle.name(this.battle.mon(1))) });
    this.animation = this.motion ? 24 : 0;
  }
  private get motion(): boolean {
    return this.state.options.anims && !this.reduced;
  }
  private choose(action: BattleAction): void {
    if (this.battle.choose(action)) {
      this.menu = undefined;
      this.learn = undefined;
      this.queue.push(...this.battle.step());
    }
  }
  private mainMenu(): void {
    this.mode = "main";
    this.menu = new Menu(["FIGHT", "BAG", "TEAM", "RUN"], (index) => {
      if (index === 0) {
        this.movesMenu();
      } else if (index === 1) {
        this.stack.push(new BagScene(this.input, this.audio, this.stack, this.state,
          this.battle.config.species, undefined, (item: ItemId, target) => {
            this.choose(item === "forkBall" || item === "greatFork"
              ? { kind: "ball", item } : { kind: "item", item, target });
          }));
      } else if (index === 2) {
        this.teamMenu();
      } else {
        this.choose({ kind: "run" });
      }
    }, () => {}, (effect) => this.audio.sfx(effect), 4, 2);
  }
  private movesMenu(): void {
    this.mode = "moves";
    const usable = this.battle.mon(0).moves.some((move) => move.pp > 0);
    const entries = usable ? this.battle.mon(0).moves.map((move) => MOVES[move.id].name) : ["Last Byte"];
    this.menu = new Menu(entries, (move) => this.choose({ kind: "fight", move: usable ? move : -1 }),
      () => this.mainMenu(), (effect) => this.audio.sfx(effect));
  }
  private teamMenu(): void {
    this.mode = "team";
    this.menu = new Menu(this.state.party.map((mon) =>
      `${this.battle.name(mon)} ${mon.hp ? "L" + mon.level : "FNT"}`),
    (index) => this.choose({ kind: "switch", index }), () => {
      if (!this.battle.forcedSwitch) {
        if (this.battle.mon(1).hp === 0) {
          this.choose({ kind: "fight", move: -1 });
        } else {
          this.mainMenu();
        }
      }
    }, (effect) => this.audio.sfx(effect), 4);
  }
  private learnMenu(): void {
    this.mode = "learn";
    const pending = this.battle.pendingLearn!;
    this.learn = new LearnMoveMenu(this.state.party[pending.index], pending.move, this.audio,
      (slot) => this.choose({ kind: "learn", slot }));
    this.menu = this.learn.menu;
  }
  update(): void {
    this.frames++;
    if (this.animation > 0) {
      this.animation--;
      if (this.event?.kind === "hp") {
        const event = this.event;
        this.hp[event.side] += Math.sign(event.to - this.hp[event.side])
          * Math.min(Math.abs(event.to - this.hp[event.side]), Math.max(1, event.max / 48));
        if (!this.animation) {
          this.hp[event.side] = event.to;
        }
      }
      if (this.event?.kind === "exp") {
        const index = this.event.index;
        this.displayExp[index] += (this.expTarget - this.displayExp[index]) / Math.max(1, this.animation + 1);
        if (!this.animation) {
          this.displayExp[index] = this.expTarget;
        }
      }
      if (!this.animation && this.event?.kind === "faint") {
        this.fainted[this.event.side] = true;
      }
      if (!this.animation && this.event?.kind === "level") {
        this.audio.play(this.battle.config.rhea ? "leader" : this.battle.config.trainer ? "trainer" : "wild");
      }
      if (this.event?.kind === "shake") {
        const elapsed = this.catchDuration(this.event) - this.animation;
        if (elapsed >= 56 && elapsed < 56 + Math.min(3, this.event.count) * 30 && (elapsed - 56) % 30 === 0) {
          this.audio.sfx("shake");
        }
        if (!this.animation) {
          this.audio.sfx(this.event.caught ? "catch" : "cancel");
        }
      }
      return;
    }
    if (this.textbox) {
      this.textbox.update(this.input);
      return;
    }
    const event = this.queue.shift();
    if (event) {
      this.animate(event);
      return;
    }
    this.event = undefined;
    if (this.ended) {
      const end = this.ended;
      this.stack.pop();
      this.complete(end.result, end.levelledUp);
      return;
    }
    if (!this.menu) {
      if (this.battle.pendingLearn) {
        this.learnMenu();
      } else if (this.battle.forcedSwitch || this.battle.mon(1).hp === 0) {
        this.teamMenu();
      } else {
        this.mainMenu();
      }
    }
    this.menu?.update(this.input);
  }
  private animate(event: BattleEvent): void {
    this.event = event;
    if (event.kind === "message") {
      this.textbox = new Textbox(event.text, this.state.options, () => { this.textbox = undefined; });
    } else if (event.kind === "hp") {
      this.hp[event.side] = event.from;
      this.animation = this.motion ? Math.max(1, Math.ceil(Math.abs(event.to - event.from) / event.max * 48)) : 1;
    } else if (event.kind === "damage") {
      this.audio.sfx(event.multiplier > 1 ? "super" : event.multiplier < 1 ? "weak" : "hit");
      this.animation = this.motion ? 18 : 1;
    } else if (event.kind === "move") {
      this.animation = this.motion ? 18 : 1;
    } else if (event.kind === "faint") {
      this.fainted[event.side] = !this.motion;
      this.audio.cry(this.battle.species(this.battle.mon(event.side)).sprite.seed);
      this.audio.sfx("faint");
      this.animation = this.motion ? 24 : 1;
    } else if (event.kind === "shake") {
      this.audio.sfx("throw");
      this.animation = this.motion ? this.catchDuration(event) : 24;
    } else if (event.kind === "level") {
      this.displayLevels[0][event.index] = event.level;
      this.audio.play("levelUp");
      this.animation = 60;
    } else if (event.kind === "exp") {
      this.expTarget = this.displayExp[event.index] + event.amount;
      this.animation = this.motion ? 30 : 1;
      this.textbox = new Textbox(T.exp(event.amount), this.state.options,
        () => { this.textbox = undefined; });
    } else if (event.kind === "switch") {
      this.displayActive[event.side] = event.index;
      const mon = (event.side ? this.battle.config.foes : this.battle.config.party)[event.index];
      this.hp[event.side] = mon.hp;
      this.fainted[event.side] = false;
      this.audio.cry(this.battle.species(this.battle.mon(event.side)).sprite.seed);
      this.animation = this.motion ? 24 : 1;
    } else if (event.kind === "shift") {
      this.textbox = new Textbox(T.shift(event.name), this.state.options,
        () => { this.textbox = undefined; });
    } else if (event.kind === "end") {
      this.ended = event;
      if (event.result === "win" || event.result === "caught") {
        this.audio.play("victory");
      }
    }
  }
  private catchDuration(event: Extract<BattleEvent, { kind: "shake" }>): number {
    return 80 + Math.min(3, event.count) * 30;
  }
  draw(screen: Screen): void {
    const catchElapsed = this.event?.kind === "shake" ? this.catchDuration(this.event) - this.animation : 0;
    const catchPhase = catchElapsed < 20 ? "throw" : catchElapsed < 32 ? "open"
      : catchElapsed < 48 ? "shrink" : catchElapsed < 56 ? "settle"
      : this.animation <= 24 ? this.event?.kind === "shake" && this.event.caught ? "caught" : "release" : "wobble";
    screen.describe(this.textbox ? `Battle dialogue: ${this.textbox.text}`
      : this.menu ? `Battle ${this.mode} menu: ${this.menu.entries.join(" / ")}`
      : `Battle animation: ${this.event?.kind ?? "arrival"}${this.event?.kind === "shake" ? " / " + catchPhase : ""}`);
    screen.fill(6);
    const slide = this.motion && this.frames < 24 ? 24 - this.frames : 0;
    groundPlatform(screen, 121, 49, 66, this.state.map === "cave");
    groundPlatform(screen, 40, 87, 68, this.state.map === "cave");
    for (const side of [0, 1]) {
      const mon = (side ? this.battle.config.foes : this.battle.config.party)[this.displayActive[side]];
      const level = this.displayLevels[side][this.displayActive[side]];
      const species = this.battle.species(mon);
      const max = stats(formOf(species, mon.stage).base, mon.ivs, level).hp;
      const x = side ? 6 : 78;
      const y = side ? 8 : 55;
      windowFrame(screen, x, y, 76, side ? 31 : 37);
      drawSmallText(screen, formOf(species, mon.stage).name, x + 5, y + 5, 1);
      drawCompactText(screen, `Lv${level}`, x + 6, y + 15, 1);
      drawCompactText(screen, mon.status?.slice(0, 3) ?? "", x + 38, y + 15, 1);
      drawCompactText(screen, "HP", x + 6, y + 23, 1);
      screen.fill(1, x + 19, y + 23, 51, 5);
      screen.fill(6, x + 20, y + 24, 49, 3);
      const ratio = Math.max(0, Math.min(1, this.hp[side] / max));
      screen.fill(ratio > 0.5 ? 9 : ratio > 0.2 ? 22 : 24, x + 20, y + 24, Math.ceil(ratio * 49), 3);
      if (!side) {
        drawCompactText(screen, `${Math.ceil(this.hp[side])}/${max}`, x + 38, y + 29, 1);
        screen.fill(27, x + 6, y + 33, 28, 1);
        const range = expForLevel(level + 1) - expForLevel(level);
        const currentExp = this.displayExp[this.displayActive[0]];
        const progress = Math.max(0, Math.min(1, (currentExp - expForLevel(level)) / range));
        screen.fill(13, x + 6, y + 33, Math.floor(progress * 28), 1);
      }
      if (!this.fainted[side]) {
        const sprite = drawCreature(species.sprite.seed, species.sprite.body, species.type,
          side ? "front" : "back", mon.stage);
        const blink = this.event?.kind === "damage" && this.event.side === side && this.motion
          && this.animation % 6 < 3;
        if (!blink) {
          const drop = this.event?.kind === "faint" && this.event.side === side && this.motion
            ? 24 - this.animation : 0;
          let scale = 1;
          if (side && this.event?.kind === "shake") {
            const elapsed = this.motion ? this.catchDuration(this.event) - this.animation : 56;
            scale = elapsed < 32 ? 1 : Math.max(0, 1 - (elapsed - 32) / 16);
            if (!this.event.caught && this.animation < 24) {
              scale = (24 - this.animation) / 24;
            }
          }
          if (scale > 0) {
            const size = Math.max(1, Math.round(32 * scale));
            screen.context.drawImage(sprite, Math.round((side ? 108 + slide : 24 - slide) + (32 - size) / 2),
              Math.round((side ? 19 : 58) + drop + (32 - size) / 2), size, size);
          }
        }
      }
    }
    if (this.battle.config.trainer && this.frames < 90) {
      drawSprite(screen, this.battle.config.rhea ? "rhea" : "trainer", "down", 0, 138 + slide, 4);
    }
    if (this.battle.config.trainer) {
      this.battle.config.foes.forEach((mon, index) => {
        screen.fill(1, 90 + index * 8, 7, 5, 5);
        screen.fill(mon.hp ? 4 : 27, 91 + index * 8, 8, 3, 3);
      });
    }
    if (this.event?.kind === "move" && this.motion && this.animation) {
      const move = MOVES[this.event.move];
      const side = 1 - this.event.side;
      const type = move?.type ?? "normal";
      const colour = CREATURE_RAMPS[type][2];
      const dimensions: Readonly<Record<string, readonly [number, number]>> = {
        python: [1, 3], javascript: [1, 2], typescript: [3, 3], go: [2, 2], swift: [3, 1],
        shell: [2, 1], dart: [4, 1], csharp: [1, 4], java: [2, 3], normal: [2, 2],
      };
      const [width, height] = dimensions[type];
      for (let i = 0; i < 6; i++) {
        const x = (side ? 110 : 30) + Math.round(Math.sin(i + this.animation) * 16);
        const y = (side ? 38 : 82) + Math.round(Math.cos(i * 2 + this.animation) * 12);
        screen.fill(colour, x, y, width, height);
      }
    }
    if (this.event?.kind === "shake") {
      const event = this.event;
      const elapsed = this.motion ? this.catchDuration(event) - this.animation : 56;
      const flight = Math.min(1, elapsed / 20);
      const shakeTime = elapsed - 56;
      const shaking = shakeTime >= 0 && shakeTime < Math.min(3, event.count) * 30;
      const phase = shakeTime % 30;
      const wiggle = this.motion && shaking && phase < 12 ? Math.round(Math.sin(phase * Math.PI / 6) * 2) : 0;
      const x = Math.round(28 + flight * 90) + wiggle;
      const y = Math.round(76 - flight * 44 - Math.sin(flight * Math.PI) * 26)
        + Math.round(Math.max(0, Math.min(1, (elapsed - 48) / 8)) * 15);
      if (this.animation > 24 || event.caught) {
        forkBall(screen, x, y);
        if (elapsed >= 20 && elapsed < 32) {
          for (let i = 0; i < 8; i++) {
            const angle = i * Math.PI / 4;
            const distance = 3 + elapsed - 20;
            screen.fill(4, x + 4 + Math.round(Math.cos(angle) * distance),
              y + 4 + Math.round(Math.sin(angle) * distance), 2, 2);
          }
          screen.fill(5, x + 1, y + 3, 6, 1);
        }
        if (event.caught && this.animation < 24) {
          for (const [dx, dy] of [[-12, -8], [4, -14], [18, -6]]) {
            const rise = Math.round((24 - this.animation) / 4);
            screen.fill(4, x + dx, y + dy - rise, 1, 5);
            screen.fill(4, x + dx - 2, y + dy + 2 - rise, 5, 1);
          }
        }
      } else {
        for (let i = 0; i < 8; i++) {
          const angle = i * Math.PI / 4;
          const distance = 24 - this.animation;
          screen.fill(4, 122 + Math.round(Math.cos(angle) * distance),
            46 + Math.round(Math.sin(angle) * distance), 2, 2);
        }
      }
    }
    if (this.menu) {
      if (this.mode === "main") {
        windowFrame(screen, 4, 96, 152, 44);
        this.menu.entries.forEach((entry, index) => {
          drawSmallText(screen, `${this.menu!.selected === index ? "▶" : " "}${entry}`,
            12 + index % 2 * 72, 105 + Math.floor(index / 2) * 18, 1);
        });
      } else if (this.mode === "moves") {
        windowFrame(screen, 4, 96, 152, 44);
        this.menu.entries.forEach((entry, index) => {
          drawSmallText(screen, `${this.menu!.selected === index ? "▶" : " "}${entry}`, 12, 102 + index * 9, 1);
        });
        screen.fill(27, 91, 101, 1, 34);
        const entry = this.battle.mon(0).moves[this.menu.selected];
        const move = entry ? MOVES[entry.id] : undefined;
        drawCompactText(screen, "TYPE", 98, 104, 1);
        drawCompactText(screen, move?.type ?? "NORMAL", 98, 113, 1);
        drawCompactText(screen, move ? `PP ${entry.pp}/${move.pp}` : "NO PP", 98, 127, 1);
      } else if (this.mode === "learn") {
        this.learn?.draw(screen);
      } else {
        this.menu.draw(screen, 4, 70, 152);
      }
    } else if (!this.textbox) {
      windowFrame(screen, 4, 109, 152, 31);
    }
    if (this.event?.kind === "level" && this.animation) {
      windowFrame(screen, 16, 22, 128, 82);
      drawSmallText(screen, `LEVEL ${this.event.level}`, 48, 33, 1);
      Object.entries(this.event.stats).forEach(([key, value], index) =>
        drawSmallText(screen, `${key.toUpperCase()} ${value}`, 48, 47 + index * 10, 1));
    }
    this.textbox?.draw(screen);
    if (this.frames < 24 && this.motion) {
      screen.whiteFlash(this.frames < 8 ? 0.7 : 0);
      SPIRAL.forEach(([x, y], index) => {
        if (index > this.frames * 4) {
          screen.fill(1, x * 16, y * 16, 16, 16);
        }
      });
    } else {
      screen.whiteFlash(0);
    }
  }
}
