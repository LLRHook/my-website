import type { Dir, GameRepo, MapId, Options, TrackId } from "../data/ids.js";
import { QUEST_TEXT as Q, WORLD_TEXT as T } from "../data/text.js";
import type { Audio } from "../engine/audio.js";
import type { Input } from "../engine/input.js";
import type { Scene, SceneStack } from "../engine/scenes.js";
import type { Screen } from "../engine/screen.js";
import type { SaveV1 } from "../engine/storage.js";
import { drawSmallText, drawText, measureSmallText } from "../gfx/font.js";
import { drawMapTile, drawScenery } from "../gfx/scenery.js";
import { drawSprite } from "../gfx/sprites.js";
import { drawTile, lightAt, type Light } from "../gfx/tiles.js";
import { windowFrame } from "../gfx/ui.js";
import { buildSpecies, starterCandidates, type Species } from "../data/species.js";
import { trainerParty } from "../data/trainers.js";
import { createCodeling, stats } from "../battle/stats.js";
import { MOVES } from "../battle/moves.js";
import { Battle, type BattleResult } from "../battle/battle.js";
import { BattleScene } from "../battle/battleScene.js";
import { StarterScene } from "../ui/starter.js";
import { MartScene } from "../ui/mart.js";
import { PcBoxScene } from "../ui/pcBox.js";
import { EndingScene } from "../ui/ending.js";
import { DiplomaScene } from "../ui/diploma.js";
import { StartMenuScene } from "../ui/startMenu.js";
import { Textbox } from "../ui/textbox.js";
import { YesNo } from "../ui/yesno.js";
import { MAPS } from "./maps/index.js";
import {
  OPPOSITE, VECTORS, canMove, connectionDestination, inBounds, walkable, type GameMap, type NpcDef,
} from "./map.js";
import { createNpcs, faceToward, trainerSees, wander, type NpcState } from "./npc.js";
import { interpolate, runScript, setFlag, type Script, type ScriptHost } from "./script.js";

export interface OverworldHooks {
  onEncounter(map: GameMap): void;
  startTrainerBattle(npc: NpcDef): Promise<void>;
}
export function newGame(name: string, options: Options): SaveV1 {
  return {
    v: 1, name, map: "bedroom", x: 4, y: 4, dir: "down", party: [], box: [], bag: {},
    coins: 500, flags: [], seen: [], caught: [], playTimeSec: 0, options,
  };
}
interface Step {
  fromX: number;
  fromY: number;
  progress: number;
  distance: number;
  hop: boolean;
}
interface Transition {
  frame: number;
  map: MapId;
  x: number;
  y: number;
  dir: Dir;
}
interface Timer {
  remaining: number;
  resolve: () => void;
}
const DIRECTIONS: readonly Dir[] = ["up", "down", "left", "right"];
const ARROWS: Readonly<Record<string, Dir>> = { a: "up", ">": "right", "<": "left" };

export class OverworldScene implements Scene, ScriptHost, OverworldHooks {
  readonly id = "overworld";
  private map: GameMap;
  private npcs: NpcState[];
  private frames = 0;
  private px: number;
  private py: number;
  private step?: Step;
  private transition?: Transition;
  private textbox?: Textbox;
  private yesno?: YesNo;
  private busy = false;
  private activeNpc?: NpcState;
  private alert?: NpcState;
  private timers: Timer[] = [];
  private warpLocked = true;
  private steps = 0;
  private heading = 100;
  private arrowCount = 0;
  private turnUntil = 0;
  private readonly starters: Species[];
  readonly species: Species[];
  private readonly fallback: boolean;
  private closed = false;

  constructor(private readonly input: Input, private readonly audio: Audio,
    private readonly stack: SceneStack, private readonly root: HTMLElement, readonly state: SaveV1,
    repos: readonly GameRepo[], private readonly hour?: number,
    private readonly rng: () => number = Math.random, private forceEncounter = false) {
    this.map = MAPS[state.map];
    if (!walkable(this.map, state.x, state.y)) {
      state.map = "bedroom";
      state.x = 4;
      state.y = 4;
      this.map = MAPS.bedroom;
    }
    this.px = state.x * 16;
    this.py = state.y * 16;
    this.npcs = createNpcs(this.map);
    this.species = buildSpecies([...repos]);
    this.fallback = repos.length === 0;
    this.starters = starterCandidates(this.species);
    this.syncCaught();
  }
  get stepCount(): number {
    return this.steps;
  }
  get mon(): string {
    return this.starters[Math.max(0, this.state.x - 3)]?.name ?? "CODELING";
  }
  private publishPosition(): void {
    const position = `${this.state.x},${this.state.y},${this.state.dir}`;
    if (this.root.dataset.pos !== position) {
      this.root.dataset.pos = position;
    }
  }
  enter(): void {
    this.publishPosition();
    this.root.dataset.map = this.map.id;
    if (this.map.id === "center") {
      setFlag(this.state, "lastCenter");
    }
    this.audio.play(this.map.music);
    void this.diploma();
  }
  exit(): void {
    this.closed = true;
  }
  update(dt: number): void {
    this.publishPosition();
    this.frames++;
    this.state.playTimeSec += dt;
    this.heading = Math.max(0, this.heading - 1);
    const timers = this.timers;
    this.timers = [];
    for (const timer of timers) {
      timer.remaining -= dt;
      if (timer.remaining <= 0) {
        timer.resolve();
      } else {
        this.timers.push(timer);
      }
    }
    this.updateNpcs();
    if (this.transition) {
      this.updateTransition();
      return;
    }
    if (this.yesno) {
      this.yesno.update(this.input);
      return;
    }
    if (this.textbox) {
      this.textbox.update(this.input);
      return;
    }
    if (this.busy) {
      return;
    }
    if (this.step) {
      this.updateStep();
      return;
    }
    if (this.input.pressed("start")) {
      this.stack.push(new StartMenuScene(this.input, this.audio, this.stack, this.state, (s) => this.draw(s),
        this.species, this.fallback));
      return;
    }
    if (this.input.pressed("a")) {
      this.interact();
      return;
    }
    const arrow = ARROWS[this.map.tiles[this.state.y][this.state.x]];
    if (arrow && this.arrowCount < 32) {
      this.arrowCount++;
      if (this.movePlayer(arrow)) {
        return;
      }
    } else {
      this.arrowCount = 0;
    }
    const dir = DIRECTIONS.find((candidate) => this.input.isDown(candidate) || this.input.pressed(candidate));
    if (!dir) {
      return;
    }
    if (dir !== this.state.dir) {
      this.state.dir = dir;
      this.turnUntil = this.frames + 4;
      return;
    }
    if (this.frames < this.turnUntil) {
      return;
    }
    // A short tap changes facing only; holding the same direction starts a step.
    if (!this.input.pressed(dir)) {
      this.movePlayer(dir);
    }
  }
  private updateNpcs(): void {
    for (const npc of this.npcs) {
      const dx = npc.x * 16 - npc.px;
      const dy = npc.y * 16 - npc.py;
      npc.px += Math.sign(dx);
      npc.py += Math.sign(dy);
      npc.frame = dx || dy ? Math.floor(this.frames / 6) % 3 : 0;
      if (!this.busy && !this.step && !this.textbox && this.frames % 120 === 0 && npc.movement !== "static") {
        const dir = DIRECTIONS[Math.floor(this.rng() * DIRECTIONS.length)];
        if (npc.movement === "look") {
          npc.dir = dir;
        } else {
          wander(npc, this.map, dir, [...this.npcs.filter((other) => other !== npc), this.state]);
        }
      }
    }
  }
  private movePlayer(dir: Dir): boolean {
    this.state.dir = dir;
    const [dx, dy] = VECTORS[dir];
    const x = this.state.x + dx;
    const y = this.state.y + dy;
    if (!inBounds(this.map, x, y)) {
      const connection = this.map.connections?.[dir];
      if (connection) {
        if (this.map.id === "sterling" && !this.state.flags.includes("hasStarter")) {
          this.launch([{ say: T.gate }]);
          return false;
        }
        const target = connectionDestination(this.map, dir, x, y, MAPS);
        if (target) {
          this.changeMap(target.map, target.x, target.y, dir);
          return true;
        }
      }
      this.bump();
      return false;
    }
    if (!canMove(this.map, this.state.x, this.state.y, dir, this.npcs)) {
      this.bump();
      return false;
    }
    const hop = this.map.tiles[y][x] === "v";
    const distance = hop ? 32 : 16;
    const tx = hop ? x + dx : x;
    const ty = hop ? y + dy : y;
    if (!walkable(this.map, tx, ty) || this.npcs.some((npc) => npc.x === tx && npc.y === ty)) {
      this.bump();
      return false;
    }
    this.step = { fromX: this.px, fromY: this.py, progress: 0, distance, hop };
    this.state.x = tx;
    this.state.y = ty;
    if (hop) {
      this.audio.sfx("ledge");
    }
    return true;
  }
  private bump(): void {
    if (this.frames % 12 === 0) {
      this.audio.sfx("bump");
    }
  }
  private updateStep(): void {
    const step = this.step!;
    step.progress = Math.min(step.distance, step.progress + (this.input.isDown("b") ? 2 : 1));
    const ratio = step.progress / step.distance;
    this.px = step.fromX + (this.state.x * 16 - step.fromX) * ratio;
    this.py = step.fromY + (this.state.y * 16 - step.fromY) * ratio;
    if (step.progress < step.distance) {
      return;
    }
    this.step = undefined;
    const warp = this.map.warps.find((entry) => entry.x === this.state.x && entry.y === this.state.y);
    if (!warp) {
      this.warpLocked = false;
    } else if (!this.warpLocked) {
      this.transition = { frame: 0, map: warp.to, x: warp.tx, y: warp.ty, dir: warp.dir };
      this.audio.sfx("door");
      return;
    }
    this.steps++;
    const trainer = this.npcs.find((npc) => !this.state.flags.includes(`defeated:${npc.id}`)
      && trainerSees(this.map, npc, this.state.x, this.state.y, this.npcs.filter((other) => other !== npc)));
    if (trainer) {
      this.spotTrainer(trainer);
      return;
    }
    const tile = this.map.tiles[this.state.y][this.state.x];
    if ((tile === "g" || tile === "c") && this.map.encounters
      && (this.forceEncounter || this.rng() < this.map.encounters.rate)) {
      this.onEncounter(this.map);
    }
  }
  private updateTransition(): void {
    const transition = this.transition!;
    transition.frame++;
    if (transition.frame === 12) {
      this.changeMap(transition.map, transition.x, transition.y, transition.dir);
    }
    if (transition.frame >= 24) {
      this.transition = undefined;
    }
  }
  private changeMap(id: MapId, x: number, y: number, dir: Dir): void {
    this.map = MAPS[id];
    Object.assign(this.state, { map: id, x, y, dir });
    this.px = x * 16;
    this.py = y * 16;
    this.npcs = createNpcs(this.map);
    this.warpLocked = true;
    this.steps = 0;
    this.heading = 100;
    this.arrowCount = 0;
    this.root.dataset.map = id;
    this.audio.play(this.map.music);
    if (id === "center") {
      setFlag(this.state, "lastCenter");
    }
  }
  private interact(): void {
    const [dx, dy] = VECTORS[this.state.dir];
    const x = this.state.x + dx;
    const y = this.state.y + dy;
    const npc = this.npcs.find((entry) => entry.x === x && entry.y === y)
      ?? (inBounds(this.map, x, y) && !walkable(this.map, x, y)
        ? this.npcs.find((entry) => entry.x === x + dx && entry.y === y + dy) : undefined);
    if (npc) {
      npc.dir = faceToward(npc, this.state.x, this.state.y);
      this.activeNpc = npc;
      this.launch(this.state.flags.includes(`defeated:${npc.id}`) && npc.trainer
        ? [{ say: npc.trainer.lose }] : npc.script);
      return;
    }
    const sign = this.map.signs.find((entry) => entry.x === x && entry.y === y)
      ?? this.map.signs.find((entry) => entry.x === this.state.x && entry.y === this.state.y);
    if (!sign) {
      return;
    }
    if (sign.text === T.starter) {
      if (this.state.flags.includes("hasStarter")) {
        this.launch([{ say: Q.remainingStarters }]);
      } else {
        this.launch([{ starter: true }]);
      }
    } else if (sign.text === T.box || sign.text === T.pcHome) {
      this.launch([{ pc: true }]);
    } else if (sign.text === T.item) {
      if (!this.state.flags.includes("route1Gift")) {
        this.launch([{ say: T.item }, { give: "forkBall", qty: 3 }, { flag: "route1Gift", set: true }]);
      }
    } else {
      this.launch([{ say: sign.text }]);
    }
  }
  private launch(script: Script): void {
    this.busy = true;
    void runScript(script, this).finally(() => {
      if (!this.closed) {
        this.busy = false;
        this.activeNpc = undefined;
      }
    });
  }
  private spotTrainer(npc: NpcState): void {
    this.busy = true;
    this.alert = npc;
    this.activeNpc = npc;
    void (async () => {
      await this.wait(0.8);
      this.alert = undefined;
      while (Math.abs(npc.x - this.state.x) + Math.abs(npc.y - this.state.y) > 1) {
        const dir = faceToward(npc, this.state.x, this.state.y);
        if (!canMove(this.map, npc.x, npc.y, dir, this.npcs.filter((other) => other !== npc))) {
          break;
        }
        await this.move(npc.id, [dir]);
      }
      this.state.dir = OPPOSITE[npc.dir];
      await runScript(npc.script, this);
      this.busy = false;
      this.activeNpc = undefined;
    })();
  }
  private syncCaught(): void {
    this.root.dataset.caught = String(this.state.caught.length);
  }
  private async diploma(): Promise<void> {
    if (this.species.every((species) => this.state.caught.includes(species.id))
      && !this.state.flags.includes("diploma")) {
      setFlag(this.state, "diploma");
      await this.showScene(new DiplomaScene(this.input, this.stack, this.state.name, this.species.length));
    }
  }
  onEncounter(map: GameMap): void {
    if (!map.encounters || !this.state.party.some((mon) => mon.hp > 0)) {
      return;
    }
    this.forceEncounter = false;
    const starterId = Number(this.state.flags.find((flag) => flag.startsWith("starter:"))?.split(":")[1]);
    const excluded = this.species.length < 4
      ? new Set([Number.isFinite(starterId) ? starterId : this.state.party[0].species]) : new Set<number>();
    let pool = this.species.filter((species) => species.habitat.includes(map.id) && !excluded.has(species.id));
    if (!pool.length) {
      pool = this.species.filter((species) => !excluded.has(species.id));
    }
    if (!pool.length) {
      return;
    }
    let roll = this.rng() * pool.reduce((sum, species) => sum + species.rarity, 0);
    const species = pool.find((entry) => {
      roll -= entry.rarity;
      return roll < 0;
    }) ?? pool[pool.length - 1];
    const level = map.encounters.minLevel + Math.floor(this.rng()
      * (map.encounters.maxLevel - map.encounters.minLevel + 1));
    const foe = createCodeling(species, level, this.rng);
    this.busy = true;
    void this.playBattle([foe]).then(async (result) => {
      if (result === "caught") {
        (this.state.party.length < 6 ? this.state.party : this.state.box).push(foe);
        if (!this.state.caught.includes(species.id)) {
          this.state.caught.push(species.id);
        }
        this.syncCaught();
        await this.diploma();
        if (await this.ask(Q.openRepository)) {
          this.open(species.repo.url);
        }
      }
      this.busy = false;
    });
  }
  private playBattle(foes: SaveV1["party"], npc?: NpcDef): Promise<BattleResult> {
    for (const foe of foes) {
      if (!this.state.seen.includes(foe.species)) {
        this.state.seen.push(foe.species);
      }
    }
    return new Promise((resolve) => {
      const battle = new Battle({ party: this.state.party, foes, species: this.species,
        bag: this.state.bag, trainer: npc?.trainer?.name, rhea: npc?.id === "rhea" }, this.rng);
      this.stack.push(new BattleScene(this.input, this.audio, this.stack, battle, this.state, (result) => {
        if (result === "lose") {
          this.state.coins = Math.floor(this.state.coins / 2);
          this.restoreParty();
          this.changeMap(this.state.flags.includes("lastCenter") ? "center" : "bedroom",
            this.state.flags.includes("lastCenter") ? 5 : 4, 4, "down");
        }
        this.audio.play(this.map.music);
        resolve(result);
      }));
    });
  }
  async startTrainerBattle(npc: NpcDef): Promise<void> {
    if (!npc.trainer || this.state.flags.includes(`defeated:${npc.id}`) || !this.state.party.length) {
      return;
    }
    const result = await this.playBattle(trainerParty(npc, this.species), npc);
    if (result !== "win") {
      await this.say(Q.blackout);
      return;
    }
    setFlag(this.state, `defeated:${npc.id}`);
    this.state.coins += npc.trainer.reward;
    await this.say(`${npc.trainer.lose} Received ${npc.trainer.reward} coins.`);
    if (npc.id === "rhea") {
      setFlag(this.state, "badge");
      this.audio.play("badge");
      this.audio.sfx("badge");
      await this.say(T.badge);
      await this.showScene(new EndingScene(this.input, this.audio, this.stack));
      this.audio.play(this.map.music);
    }
  }
  say(text: string): Promise<void> {
    return new Promise((resolve) => {
      this.textbox = new Textbox(interpolate(text, this.state.name, this.mon), this.state.options, () => {
        this.textbox = undefined;
        resolve();
      });
    });
  }
  async ask(text: string): Promise<boolean> {
    await this.say(text);
    return new Promise((resolve) => {
      this.yesno = new YesNo((yes) => {
        this.yesno = undefined;
        resolve(yes);
      }, (effect) => this.audio.sfx(effect));
    });
  }
  give(): void {
    this.audio.sfx("item");
  }
  async heal(): Promise<void> {
    this.restoreParty();
    this.audio.sfx("heal");
    await this.wait(1.2);
  }
  async move(id: string, path: readonly Dir[]): Promise<void> {
    const npc = this.npcs.find((entry) => entry.id === id);
    if (!npc) {
      return;
    }
    for (const dir of path) {
      if (!canMove(this.map, npc.x, npc.y, dir, [...this.npcs.filter((other) => other !== npc), this.state])) {
        break;
      }
      npc.dir = dir;
      const [dx, dy] = VECTORS[dir];
      npc.x += dx;
      npc.y += dy;
      await this.wait(16 / 60);
    }
  }
  face(dir: Dir): void {
    if (this.activeNpc) {
      this.activeNpc.dir = dir;
    }
  }
  async battle(id: string): Promise<void> {
    const npc = this.npcs.find((entry) => entry.id === id);
    if (npc) {
      await this.startTrainerBattle(npc);
    }
  }
  async starter(): Promise<void> {
    if (this.state.flags.includes("hasStarter")) {
      return;
    }
    await new Promise<void>((resolve) => {
      this.stack.push(new StarterScene(this.input, this.audio, this.stack, this.starters, (species) => {
        this.state.party.push(createCodeling(species, 5, this.rng));
        this.state.seen.push(species.id);
        this.state.caught.push(species.id);
        this.state.bag.forkBall = (this.state.bag.forkBall ?? 0) + 5;
        setFlag(this.state, `starter:${species.id}`);
        setFlag(this.state, "hasStarter");
        setFlag(this.state, "hasCodex");
        this.syncCaught();
        resolve();
      }, Math.max(0, this.state.x - 3)));
    });
    await this.say(Q.starterGift);
    await this.diploma();
  }
  open(url: string): void {
    const links: Readonly<Record<string, string>> = {
      resume: "/resume", contact: "/contact", github: "https://github.com/LLRHook",
    };
    const target = links[url] ?? url;
    if (target.startsWith("/") || /^https?:\/\//i.test(target)) {
      window.open(target, "_blank", "noopener");
    }
  }
  private restoreParty(): void {
    for (const mon of this.state.party) {
      const species = this.species.find((entry) => entry.id === mon.species)!;
      mon.hp = stats(species.base, mon.ivs, mon.level).hp;
      mon.status = null;
      for (const move of mon.moves) {
        move.pp = MOVES[move.id].pp;
      }
    }
  }
  async mart(): Promise<void> {
    await this.showScene(new MartScene(this.input, this.audio, this.stack, this.state));
  }
  async pc(): Promise<void> {
    await this.showScene(new PcBoxScene(this.input, this.audio, this.stack, this.state, this.species));
  }
  private showScene(scene: Scene): Promise<void> {
    return new Promise((resolve) => {
      this.stack.push(Object.assign(scene, { exit: resolve }));
    });
  }
  music(track: TrackId): void {
    this.audio.play(track);
  }
  wait(seconds: number): Promise<void> {
    return new Promise((resolve) => this.timers.push({ remaining: Math.max(0, seconds), resolve }));
  }
  draw(screen: Screen): void {
    screen.describe(this.yesno ? "YES / NO" : this.textbox ? `Dialogue: ${this.textbox.text}`
      : `Overworld: ${this.map.name}`);
    screen.fill(this.map.outdoor ? 7 : 29);
    const light: Light = this.map.outdoor ? lightAt(this.hour ?? new Date().getHours()) : "day";
    const cx = Math.max(0, Math.min(this.px - 72, this.map.width * 16 - 160));
    const cy = Math.max(0, Math.min(this.py - 64, this.map.height * 16 - 144));
    const ox = this.map.width < 10 ? (160 - this.map.width * 16) / 2 : 0;
    const oy = this.map.height < 9 ? (144 - this.map.height * 16) / 2 : 0;
    const frame = Math.floor(this.frames / 30) % 2;
    for (let y = Math.max(0, Math.floor(cy / 16)); y < Math.min(this.map.height, Math.ceil((cy + 144) / 16)); y++) {
      for (let x = Math.max(0, Math.floor(cx / 16)); x < Math.min(this.map.width, Math.ceil((cx + 160) / 16)); x++) {
        const tile = this.map.tiles[y][x];
        const usedItem = tile === "i" && this.state.flags.includes("route1Gift");
        drawMapTile(screen, this.map, usedItem ? "g" : tile, x, y,
          x * 16 - cx + ox, y * 16 - cy + oy, frame, light);
      }
    }
    drawScenery(screen, this.map, ox - cx, oy - cy, light, false);
    const actors = this.npcs.map((npc) => ({ sprite: npc.sprite, dir: npc.dir, frame: npc.frame,
      x: npc.px, y: npc.py, player: false }));
    actors.push({ sprite: "player", dir: this.state.dir, frame: this.step ? Math.floor(this.frames / 6) % 3 : 0,
      x: this.px, y: this.py, player: true });
    actors.sort((a, b) => a.y - b.y);
    for (const actor of actors) {
      const x = actor.x - cx + ox;
      const y = actor.y - cy + oy;
      const hop = actor.player && this.step?.hop
        ? Math.round(Math.sin(this.step.progress / this.step.distance * Math.PI) * 7) : 0;
      if (hop) {
        screen.fill(29, x + 3, y + 13, 10, 2);
      }
      drawSprite(screen, actor.sprite, actor.dir, actor.frame, x, y - hop, light);
      if (actor.player && this.map.tiles[this.state.y][this.state.x] === "g") {
        const ctx = screen.context;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y + 12, 16, 4);
        ctx.clip();
        drawTile(screen, "g", x, y, this.step ? frame : 0, light);
        ctx.restore();
      }
    }
    drawScenery(screen, this.map, ox - cx, oy - cy, light, true);
    this.map.overhead?.forEach((row, y) => [...row].forEach((tile, x) => {
      if (tile !== " ") {
        drawTile(screen, tile, x * 16 - cx + ox, y * 16 - cy + oy, frame, light);
      }
    }));
    if (this.heading && !this.textbox) {
      const width = measureSmallText(this.map.name) + 16;
      windowFrame(screen, (160 - width) / 2, 2, width, 18);
      drawSmallText(screen, this.map.name, (160 - width) / 2 + 8, 8, 1);
    }
    if (this.alert) {
      windowFrame(screen, this.alert.px - cx + ox, this.alert.py - cy + oy - 18, 16, 16);
      drawText(screen, "!", this.alert.px - cx + ox + 4, this.alert.py - cy + oy - 13, 1);
    }
    this.textbox?.draw(screen);
    this.yesno?.draw(screen, 88, 60, 64);
    screen.fadeToBlack(this.transition ? 1 - Math.abs(this.transition.frame - 12) / 12 : 0);
  }
}
