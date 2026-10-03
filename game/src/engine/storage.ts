import { ORIGIN_ID } from "../data/species.js";
import { MOVES } from "../battle/moves.js";
import type { Dir, ItemId, MapId, MoveId, Options, Status } from "../data/ids.js";

export interface Stats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
  spc: number;
}

export interface Codeling {
  stage: 1 | 2 | 3;
  uid: string;
  species: number;
  level: number;
  exp: number;
  hp: number;
  ivs: Stats;
  moves: {
    id: MoveId;
    pp: number;
  }[];
  status: Status | null;
}

export interface SaveV1 {
  v: 1;
  name: string;
  map: MapId;
  x: number;
  y: number;
  dir: Dir;
  party: Codeling[];
  box: Codeling[];
  bag: Partial<Record<ItemId, number>>;
  coins: number;
  flags: string[];
  seen: number[];
  caught: number[];
  playTimeSec: number;
  options: Options;
}
export const SAVE_KEY = "codelings.save.v1";
export const OPTIONS_KEY = "codelings.options.v1";
export const DEFAULT_OPTIONS: Readonly<Options> = {
  textSpeed: "mid", music: 6, sfx: 7, anims: true, haptics: true
};

const maps: readonly MapId[] = ["bedroom", "house", "sterling", "lab", "route1", "commit", "center", "mart",
  "gym", "route2", "cave", "route3", "bay", "bayCenter", "bayMart", "bayHouse", "pipeGym",
  "route4", "ridge", "ridgeCenter", "ridgeMart", "releaseGym", "tower", "vault"];

const items: readonly ItemId[] = ["forkBall", "greatFork", "patch", "hotfix", "fullRebuild", "rollback", "linter"];

const record = (value: unknown): value is Record<string, unknown> => typeof value === "object" &&
  value !== null && !Array.isArray(value);

const integer = (value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): value is number =>
  Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max;

const member = <T extends string>(value: unknown, values: readonly T[]): value is T =>
  typeof value === "string" && values.includes(value as T);

const arrayOf = (value: unknown, validate: (entry: unknown) => boolean): value is unknown[] =>
  Array.isArray(value) && value.every(validate);

type StoredOptions = Omit<Options, "haptics"> & { haptics?: boolean };

export function validOptions(value: unknown): value is StoredOptions {
  return record(value) && member(value.textSpeed, ["slow", "mid", "fast"])
    && integer(value.music, 0, 10) && integer(value.sfx, 0, 10) && typeof value.anims === "boolean"
    && (value.haptics === undefined || typeof value.haptics === "boolean");
}

type StoredCodeling = Omit<Codeling, "stage"> & { stage?: 1 | 2 | 3 };
type StoredSave = Omit<SaveV1, "party" | "box" | "options"> & {
  party: StoredCodeling[];
  box: StoredCodeling[];
  options: StoredOptions;
};

function validCodeling(value: unknown): value is StoredCodeling {
  return record(value) && typeof value.uid === "string" && value.uid.length > 0
    && (value.stage === undefined || integer(value.stage, 1, 3))
    && integer(value.species, 0) && integer(value.level, 1, 100) && integer(value.exp) && integer(value.hp)
    && record(value.ivs) && ["hp", "atk", "def", "spd", "spc"].every((stat) =>
      integer((value.ivs as Record<string, unknown>)[stat], 0, 31))
    && arrayOf(value.moves, (move) => record(move) && typeof move.id === "string" &&
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(move.id) && !!MOVES[move.id]
      && integer(move.pp, 0, MOVES[move.id]?.pp ?? 0))
    && value.moves.length >= 1 && value.moves.length <= 4
    && (value.status === null || member(value.status, ["blocked", "deprecated", "frozen"]));
}

export function validSave(value: unknown): value is StoredSave {
  return record(value) && value.v === 1 && typeof value.name === "string" && value.name.length > 0 &&
    value.name.length <= 7
    && member(value.map, maps) && integer(value.x) && integer(value.y) && member(value.dir, ["up", "down",
      "left", "right"])
    && arrayOf(value.party, validCodeling) && value.party.length <= 6 && arrayOf(value.box, validCodeling)
    && record(value.bag) && Object.entries(value.bag).every(([key, quantity]) => member(key, items) &&
      integer(quantity))
    && integer(value.coins) && arrayOf(value.flags, (flag) => typeof flag === "string")
    && arrayOf(value.seen, (id) => integer(id, 0)) && arrayOf(value.caught, (id) => integer(id, 0))
    && typeof value.playTimeSec === "number" && Number.isFinite(value.playTimeSec) &&
      value.playTimeSec >= 0 && validOptions(value.options);
}

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const CENTERS = ["center", "bayCenter", "ridgeCenter"] as const;
export type CenterId = typeof CENTERS[number];

export function lastCenter(flags: readonly string[]): CenterId | "bedroom" {
  for (const flag of [...flags].reverse()) {
    const id = CENTERS.find((center) => flag === `lastCenter:${center}`);
    if (id) {
      return id;
    }
  }
  return flags.includes("lastCenter") ? "center" : "bedroom";
}

export function visitCenter(save: SaveV1, id: MapId): void {
  if (!CENTERS.some((center) => center === id)) {
    return;
  }
  save.flags = save.flags.filter((flag) => flag !== "lastCenter" && !flag.startsWith("lastCenter:"));
  save.flags.push(`lastCenter:${id}`);
}

export function reconcileFlags(flags: readonly string[]): string[] {
  const result = flags.filter((flag) => flag !== "badge" && flag !== "lastCenter"
    && !flag.startsWith("lastCenter:"));
  if ((flags.includes("badge") || flags.includes("defeated:rhea")) && !result.includes("badge:merge")) {
    result.push("badge:merge");
  }
  const latest = [...flags].reverse().find((flag) => CENTERS.some((id) => flag === `lastCenter:${id}`));
  if (latest || flags.includes("lastCenter")) {
    result.push(latest ?? "lastCenter:center");
  }
  return [...new Set(result)];
}

export function loadSave(): SaveV1 | null {
  const value = read(SAVE_KEY);
  if (!validSave(value)) {
    return null;
  }
  return { ...value, flags: reconcileFlags(value.flags),
    party: value.party.map((mon) => ({ ...mon, stage: mon.stage ?? 1 })),
    box: value.box.map((mon) => ({ ...mon, stage: mon.stage ?? 1 })),
    options: { ...value.options, haptics: value.options.haptics ?? true } };
}

export function reconcileSpecies(save: SaveV1, ids: ReadonlySet<number>): SaveV1 {
  const known = (id: number): boolean => id === ORIGIN_ID || ids.has(id);
  const result: SaveV1 = {
    ...save, party: save.party.filter((mon) => known(mon.species)),
    box: save.box.filter((mon) => known(mon.species)),
    seen: save.seen.filter(known),
    caught: save.caught.filter(known),
    flags: reconcileFlags(save.flags),
  };
  if (!result.party.length && !result.box.length) {
    result.flags = result.flags.filter((flag) => flag !== "hasStarter" && flag !== "hasCodex"
      && !flag.startsWith("starter:"));
    // Part 2 granted placeholder starter and battle flags without creating a team.
    // A real team lost through payload changes keeps its legitimately earned badge.
    if (!save.party.length && !save.box.length && save.flags.includes("hasStarter")) {
      result.flags = result.flags.filter((flag) => flag !== "badge:merge" && flag !== "diploma"
        && !flag.startsWith("defeated:"));
    }
  }
  // The old ladder was a dead end where a player could save without a badge.
  // The new Warden would trap that position, so resume just below his checkpoint.
  if (result.map === "cave" && result.x === 9 && result.y === 3 && !result.flags.includes("badge:merge")) {
    result.y = 5;
    result.dir = "up";
  }
  return result;
}

export function writeSave(save: SaveV1): boolean {
  return validSave(save) && write(SAVE_KEY, save);
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Storage can be disabled.
  }
}

export function loadOptions(): Options {
  const save = loadSave();
  if (save) {
    return save.options;
  }
  const value = read(OPTIONS_KEY);
  return validOptions(value) ? { ...value, haptics: value.haptics ?? true } : {
    ...DEFAULT_OPTIONS
  };
}

export function writeOptions(options: Options): boolean {
  if (!validOptions(options)) {
    return false;
  }
  const separate = write(OPTIONS_KEY, options);
  const save = loadSave();
  return save ? writeSave({
    ...save, options
  }) && separate : separate;
}
