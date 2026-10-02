import type { Dir, ItemId, TrackId } from "../data/ids.js";
import type { SaveV1 } from "../engine/storage.js";

export type Script = readonly Command[];
export type Command =
  | { say: string }
  | { ask: string; yes: Script; no: Script }
  | { give: ItemId; qty: number }
  | { heal: true }
  | { flag: string; set: boolean }
  | { if: string; then: Script; else: Script }
  | { move: string; path: readonly Dir[] }
  | { face: Dir }
  | { battle: string }
  | { starter: true }
  | { open: "resume" | "contact" | "github" | string }
  | { mart: true }
  | { pc: true }
  | { music: TrackId }
  | { wait: number };

export interface ScriptHost {
  state: SaveV1;
  mon: string;
  say(text: string): Promise<void>;
  ask(text: string): Promise<boolean>;
  give(): void;
  heal(): Promise<void>;
  move(id: string, path: readonly Dir[]): Promise<void>;
  face(dir: Dir): void;
  battle(id: string): Promise<void>;
  starter(): Promise<void>;
  open(url: string): void;
  mart(): Promise<void>;
  pc(): Promise<void>;
  music(track: TrackId): void;
  wait(seconds: number): Promise<void>;
}
export function setFlag(state: SaveV1, flag: string, set = true): void {
  state.flags = state.flags.filter((entry) => entry !== flag);
  if (set) {
    state.flags.push(flag);
  }
}
export function interpolate(text: string, player: string, mon: string): string {
  return text.replaceAll("{PLAYER}", player).replaceAll("{MON}", mon);
}
export async function runScript(script: Script, host: ScriptHost): Promise<void> {
  const text = (value: string) => interpolate(value, host.state.name, host.mon);
  for (const command of script) {
    if ("say" in command) {
      await host.say(text(command.say));
    } else if ("ask" in command) {
      await runScript(await host.ask(text(command.ask)) ? command.yes : command.no, host);
    } else if ("give" in command) {
      host.state.bag[command.give] = (host.state.bag[command.give] ?? 0) + command.qty;
      host.give();
    } else if ("heal" in command) {
      await host.heal();
    } else if ("flag" in command) {
      setFlag(host.state, command.flag, command.set);
    } else if ("if" in command) {
      await runScript(host.state.flags.includes(command.if) ? command.then : command.else, host);
    } else if ("move" in command) {
      await host.move(command.move, command.path);
    } else if ("face" in command) {
      host.face(command.face);
    } else if ("battle" in command) {
      await host.battle(command.battle);
    } else if ("starter" in command) {
      await host.starter();
    } else if ("open" in command) {
      if (await host.ask(text(command.open))) {
        host.open(command.open);
      }
    } else if ("mart" in command) {
      await host.mart();
    } else if ("pc" in command) {
      await host.pc();
    } else if ("music" in command) {
      host.music(command.music);
    } else if ("wait" in command) {
      await host.wait(command.wait);
    } else {
      const exhaustive: never = command;
      throw new Error(`Unknown command: ${String(exhaustive)}`);
    }
  }
}
