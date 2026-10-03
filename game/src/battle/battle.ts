import { BATTLE_TEXT as T } from "../data/text.js";
import type { ItemId, Status } from "../data/ids.js";
import { formOf, type Species } from "../data/species.js";
import { applyItem } from "../data/items.js";
import type { Codeling, Stats } from "../engine/storage.js";
import { chooseMove } from "./ai.js";
import { catchShakes, catchValue, runOdds } from "./catch.js";
import { damage } from "./damage.js";
import { MOVES, STRUGGLE, type Move, type StageStat } from "./moves.js";
import { expForLevel, expGain, stageMultiplier, stats } from "./stats.js";
import { effectiveness } from "./types.js";
export type BattleAction = { kind: "fight"; move: number } | { kind: "switch"; index: number }
  | { kind: "item"; item: ItemId; target: number } | { kind: "run" }
  | { kind: "ball"; item: "forkBall" | "greatFork" } | { kind: "learn"; slot: number };
export type BattleResult = "win" | "lose" | "run" | "caught";
export type BattleEvent =
  | { kind: "message"; text: string }
  | { kind: "move"; side: number; move: string }
  | { kind: "hp"; side: number; from: number; to: number; max: number }
  | { kind: "damage"; side: number; amount: number; multiplier: number; critical: boolean }
  | { kind: "faint"; side: number }
  | { kind: "status"; side: number; status: Status | "confused" }
  | { kind: "stage"; side: number; stat: StageStat; amount: number }
  | { kind: "shake"; count: number; caught: boolean }
  | { kind: "exp"; index: number; amount: number }
  | { kind: "level"; index: number; level: number; stats: Stats }
  | { kind: "learn"; index: number; move: string }
  | { kind: "switch"; side: number; index: number }
  | { kind: "shift"; name: string }
  | { kind: "end"; result: BattleResult; readonly levelledUp: ReadonlySet<string> };
export interface BattleConfig {
  party: Codeling[];
  foes: Codeling[];
  species: readonly Species[];
  bag: Partial<Record<ItemId, number>>;
  trainer?: string;
  rhea?: boolean;
}
interface Volatile {
  stages: Record<StageStat, number>;
  frozen: number;
  confused: number;
}
const volatile = (): Volatile => ({ stages: { atk: 0, def: 0, spd: 0, spc: 0, accuracy: 0 },
  frozen: 0, confused: 0 });
export class Battle {
  readonly active = [0, 0];
  private readonly levelled = new Set<string>();
  result?: BattleResult;
  forcedSwitch = false;
  pendingLearn?: { index: number; move: string };
  private action?: BattleAction;
  private readonly participants = new Set<number>();
  private readonly effects = [volatile(), volatile()];
  private readonly events: BattleEvent[] = [];
  private readonly learning: { index: number; move: string }[] = [];
  private attempts = 0;
  private readonly knownMoves = new Set<string>();
  private pendingEnd = false;
  private nextFoe = false;
  private nextFoeIndex = 0;
  constructor(readonly config: BattleConfig, private readonly rng: () => number) {
    this.active[0] = Math.max(0, config.party.findIndex((mon) => mon.hp > 0));
    this.participants.add(this.active[0]);
  }
  mon(side: number): Codeling {
    return (side === 0 ? this.config.party : this.config.foes)[this.active[side]];
  }
  species(mon: Codeling): Species {
    const species = this.config.species.find((entry) => entry.id === mon.species);
    if (!species) {
      throw new Error("Battle species missing");
    }
    return species;
  }
  name(mon: Codeling): string {
    return formOf(this.species(mon), mon.stage).name;
  }
  stats(mon: Codeling): Stats {
    return stats(formOf(this.species(mon), mon.stage).base, mon.ivs, mon.level);
  }
  choose(action: BattleAction): boolean {
    if (this.result || this.action) {
      return false;
    }
    if (action.kind === "learn" && !this.pendingLearn) {
      return false;
    }
    if (this.pendingLearn && action.kind !== "learn") {
      return false;
    }
    if (this.forcedSwitch && action.kind !== "switch") {
      return false;
    }
    if (action.kind === "switch" && (action.index === this.active[0]
      || !this.config.party[action.index]?.hp)) {
      return false;
    }
    if (action.kind === "fight" && action.move >= 0 && !this.mon(0).moves[action.move]?.pp) {
      return false;
    }
    this.action = action;
    return true;
  }
  private say(text: string): void {
    this.events.push({ kind: "message", text });
  }
  private end(result: BattleResult): void {
    this.result = result;
    this.events.push({ kind: "end", result, levelledUp: new Set(this.levelled) });
  }
  private hp(side: number, value: number): void {
    const mon = this.mon(side);
    const max = this.stats(mon).hp;
    const from = mon.hp;
    mon.hp = Math.max(0, Math.min(max, value));
    this.events.push({ kind: "hp", side, from, to: mon.hp, max });
  }
  private switch(side: number, index: number): void {
    this.active[side] = index;
    this.effects[side] = volatile();
    if (side === 0) {
      this.participants.add(index);
    }
    this.events.push({ kind: "switch", side, index });
    this.say(T.sent(this.name(this.mon(side)), side === 1));
  }
  private speed(side: number): number {
    const mon = this.mon(side);
    return this.stats(mon).spd * stageMultiplier(this.effects[side].stages.spd)
      * (mon.status === "blocked" ? 0.5 : 1);
  }
  step(): BattleEvent[] {
    this.events.length = 0;
    const action = this.action;
    this.action = undefined;
    if (this.result || !action) {
      return [];
    }
    if (action.kind === "learn" && this.pendingLearn) {
      const { index, move } = this.pendingLearn;
      if (action.slot >= 0 && action.slot < 4) {
        this.config.party[index].moves[action.slot] = { id: move, pp: MOVES[move].pp };
        this.say(T.learned(this.name(this.config.party[index]), MOVES[move].name));
      }
      this.pendingLearn = undefined;
      this.advanceLearning();
      return [...this.events];
    }
    if (this.forcedSwitch && action.kind === "switch") {
      this.switch(0, action.index);
      this.forcedSwitch = false;
      return [...this.events];
    }
    if (this.nextFoe) {
      if (action.kind === "switch") {
        this.switch(0, action.index);
      }
      this.nextFoe = false;
      this.switch(1, this.nextFoeIndex);
      this.participants.clear();
      this.participants.add(this.active[0]);
      return [...this.events];
    }
    if (action.kind === "run") {
      if (this.config.trainer) {
        this.say(T.trainerRun);
        return [...this.events];
      }
      this.attempts++;
      if (this.rng() < runOdds(this.speed(0), this.speed(1), this.attempts)) {
        this.say(T.escaped);
        this.end("run");
        return [...this.events];
      }
      this.say(T.blockedPath);
    } else if (action.kind === "ball") {
      if (this.config.trainer) {
        this.say(T.owned);
        return [...this.events];
      }
      if (!this.consume(action.item)) {
        return [...this.events];
      }
      const foe = this.mon(1);
      const shakes = catchShakes(catchValue(this.stats(foe).hp, foe.hp,
        formOf(this.species(foe), foe.stage).catchRate, action.item === "greatFork" ? 1.5 : 1, foe.status), this.rng);
      this.say(T.throw);
      this.events.push({ kind: "shake", count: shakes, caught: shakes === 4 });
      if (shakes === 4) {
        this.say(T.caught(this.name(foe)));
        this.end("caught");
        return [...this.events];
      }
      this.say(shakes ? T.almost : T.burst);
    } else if (action.kind === "item") {
      const mon = this.config.party[action.target];
      const before = mon?.hp ?? 0;
      if (!mon || !this.config.bag[action.item] || !applyItem(action.item, mon, this.stats(mon).hp)) {
        this.say(T.noEffect);
        return [...this.events];
      }
      this.consume(action.item);
      if (action.target === this.active[0]) {
        this.events.push({ kind: "hp", side: 0, from: before, to: mon.hp, max: this.stats(mon).hp });
      }
      this.say(T.fixed);
    } else if (action.kind === "switch") {
      this.switch(0, action.index);
    }
    let foeMove = chooseMove(this.mon(1), this.species(this.mon(0)).type, !!this.config.trainer, this.rng);
    if (action.kind === "fight") {
      const playerMove = action.move < 0 ? STRUGGLE : MOVES[this.mon(0).moves[action.move].id];
      if (this.config.rhea && this.wouldFaint(playerMove)) {
        const index = this.config.foes.findIndex((mon, index) => index !== this.active[1] && mon.hp > 0
          && effectiveness(playerMove.type, this.species(mon).type) < 2);
        if (index >= 0) {
          this.switch(1, index);
          this.attack(0, action.move);
          this.checkFaint();
          return [...this.events];
        }
      }
      const foe = foeMove < 0 ? STRUGGLE : MOVES[this.mon(1).moves[foeMove].id];
      const p = playerMove.effect?.priority ?? 0;
      const f = foe.effect?.priority ?? 0;
      const first = p !== f ? (p > f ? 0 : 1) : this.speed(0) !== this.speed(1)
        ? (this.speed(0) > this.speed(1) ? 0 : 1) : this.rng() < 0.5 ? 0 : 1;
      this.attack(first, first ? foeMove : action.move);
      if (this.mon(0).hp && this.mon(1).hp) {
        this.attack(1 - first, first ? action.move : foeMove);
      }
    } else {
      foeMove = chooseMove(this.mon(1), this.species(this.mon(0)).type, !!this.config.trainer, this.rng);
      this.attack(1, foeMove);
    }
    for (const side of [0, 1]) {
      if (this.mon(side).hp && this.mon(side).status === "deprecated") {
        this.say(T.deprecated(this.name(this.mon(side))));
        this.hp(side, this.mon(side).hp - Math.max(1, Math.floor(this.stats(this.mon(side)).hp / 8)));
      }
    }
    this.checkFaint();
    return [...this.events];
  }
  private wouldFaint(move: Move): boolean {
    return this.knownMoves.has(move.id) && effectiveness(move.type, this.species(this.mon(1)).type) === 2
      && move.power > 0
      && damage(this.mon(0).level, move, this.stats(this.mon(0)), this.stats(this.mon(1)),
        this.species(this.mon(0)).type, this.species(this.mon(1)).type, () => 0.5).damage >= this.mon(1).hp;
  }
  private consume(item: ItemId): boolean {
    if (!this.config.bag[item]) {
      this.say(T.empty);
      return false;
    }
    this.config.bag[item]!--;
    return true;
  }
  private attack(side: number, index: number): void {
    const mon = this.mon(side);
    const foe = this.mon(1 - side);
    const effect = this.effects[side];
    const name = this.name(mon);
    if (mon.status === "frozen") {
      if (!effect.frozen) {
        effect.frozen = 1 + Math.floor(this.rng() * 3);
      }
      effect.frozen--;
      this.say(T.frozen(name));
      if (!effect.frozen) {
        mon.status = null;
        this.say(T.thawed(name));
      }
      return;
    }
    if (mon.status === "blocked" && this.rng() < 0.25) {
      this.say(T.blocked(name));
      return;
    }
    if (effect.confused > 0) {
      effect.confused--;
      if (this.rng() < 1 / 3) {
        this.say(T.confused(name));
        const hit = damage(mon.level, { ...STRUGGLE, power: 40 }, this.stats(mon), this.stats(mon),
          "normal", "normal", this.rng);
        this.hp(side, mon.hp - hit.damage);
        return;
      }
    }
    const move = index < 0 ? STRUGGLE : MOVES[mon.moves[index].id];
    if (index >= 0) {
      mon.moves[index].pp--;
    }
    if (side === 0) {
      this.knownMoves.add(move.id);
    }
    this.events.push({ kind: "move", side, move: move.id });
    this.say(T.move(name, move.name));
    if (this.rng() * 100 >= move.accuracy * stageMultiplier(effect.stages.accuracy)) {
      this.say(T.missed);
      return;
    }
    let dealt = 0;
    if (move.power) {
      const count = move.effect?.multi ? 2 + Math.floor(this.rng() * 4) : 1;
      let strikes = 0;
      for (let hit = 0; hit < count && foe.hp; hit++) {
        strikes++;
        const key = move.category === "physical" ? "atk" : "spc";
        const def = move.category === "physical" ? "def" : "spc";
        const result = damage(mon.level, move, this.stats(mon), this.stats(foe), this.species(mon).type,
          this.species(foe).type, this.rng, stageMultiplier(effect.stages[key]),
          stageMultiplier(this.effects[1 - side].stages[def]));
        dealt += Math.min(foe.hp, result.damage);
        this.events.push({ kind: "damage", side: 1 - side, amount: result.damage,
          multiplier: result.multiplier, critical: result.critical });
        this.hp(1 - side, foe.hp - result.damage);
        if (result.critical) {
          this.say(T.critical);
        }
        if (result.multiplier !== 1) {
          this.say(result.multiplier > 1 ? T.super : T.weak);
        }
      }
      if (count > 1) {
        this.say(T.strikes(strikes));
      }
    }
    const extra = move.effect;
    if (extra?.stage) {
      const target = extra.stage.target === "self" ? side : 1 - side;
      const stages = this.effects[target].stages;
      stages[extra.stage.stat] = Math.max(-6, Math.min(6, stages[extra.stage.stat] + extra.stage.amount));
      this.events.push({ kind: "stage", side: target, stat: extra.stage.stat, amount: extra.stage.amount });
      this.say(T.stage(extra.stage.stat, extra.stage.amount));
    }
    if (extra?.status && foe.hp && this.rng() < (extra.chance ?? 1)) {
      if (extra.status === "confused") {
        this.effects[1 - side].confused = 2 + Math.floor(this.rng() * 4);
      } else if (!foe.status) {
        foe.status = extra.status;
      }
      this.events.push({ kind: "status", side: 1 - side, status: extra.status });
      this.say(T.status(this.name(foe), extra.status));
    }
    if (extra?.heal || extra?.drain) {
      this.hp(side, mon.hp + Math.floor(extra.heal ? this.stats(mon).hp * extra.heal : dealt * extra!.drain!));
    }
    if (extra?.recoil && dealt) {
      this.say(T.recoil);
      this.hp(side, mon.hp - Math.max(1, Math.floor(dealt * extra.recoil)));
    }
  }
  private checkFaint(): void {
    if (!this.mon(0).hp) {
      this.events.push({ kind: "faint", side: 0 });
      this.say(T.fainted(this.name(this.mon(0))));
      if (!this.config.party.some((mon) => mon.hp)) {
        this.end("lose");
        return;
      }
      this.forcedSwitch = true;
    }
    if (!this.mon(1).hp) {
      this.events.push({ kind: "faint", side: 1 });
      this.say(T.fainted(this.name(this.mon(1))));
      this.awardExp();
      this.pendingEnd = !this.config.foes.some((mon) => mon.hp);
      this.nextFoe = !this.pendingEnd;
      this.advanceLearning();
    }
  }
  private awardExp(): void {
    const alive = [...this.participants].filter((index) => this.config.party[index].hp > 0);
    const foe = this.mon(1);
    const amount = expGain(formOf(this.species(foe), foe.stage).expYield, foe.level,
      !!this.config.trainer, alive.length || 1);
    for (const index of alive) {
      const mon = this.config.party[index];
      const species = this.species(mon);
      mon.exp += amount;
      this.events.push({ kind: "exp", index, amount });
      while (mon.level < 100 && mon.exp >= expForLevel(mon.level + 1)) {
        const old = this.stats(mon).hp;
        const oldHp = mon.hp;
        mon.level++;
        this.levelled.add(mon.uid);
        const next = this.stats(mon);
        mon.hp += next.hp - old;
        this.events.push({ kind: "level", index, level: mon.level, stats: next });
        if (index === this.active[0]) {
          this.events.push({ kind: "hp", side: 0, from: oldHp, to: mon.hp, max: next.hp });
        }
        this.say(T.level(this.name(mon), mon.level));
        for (const learn of species.learnset.filter((entry) => entry.level === mon.level)) {
          if (mon.moves.some((entry) => entry.id === learn.move)) {
            continue;
          }
          if (mon.moves.length < 4) {
            mon.moves.push({ id: learn.move, pp: MOVES[learn.move].pp });
            this.say(T.newMove(MOVES[learn.move].name));
          } else {
            this.learning.push({ index, move: learn.move });
          }
        }
      }
    }
  }
  private advanceLearning(): void {
    this.pendingLearn = this.learning.shift();
    if (this.pendingLearn) {
      this.events.push({ kind: "learn", ...this.pendingLearn });
    } else if (this.pendingEnd) {
      this.end("win");
    } else if (this.nextFoe) {
      this.nextFoeIndex = this.config.foes.findIndex((mon) => mon.hp > 0);
      this.events.push({ kind: "shift", name: this.name(this.config.foes[this.nextFoeIndex]) });
    }
  }
}
