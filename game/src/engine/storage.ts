import type { Dir, ItemId, MapId, MoveId, Options, Status } from "../data/ids.js";

export interface Stats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
  spc: number;
}

export interface Codeling {
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
  textSpeed: "mid", music: 6, sfx: 7, anims: true
};

const maps: readonly MapId[] = ["bedroom", "house", "sterling", "lab", "route1", "commit", "center", "mart",
  "gym", "route2", "cave"];

const items: readonly ItemId[] = ["forkBall", "greatFork", "patch", "hotfix", "fullRebuild", "rollback", "linter"];

const record = (value: unknown): value is Record<string, unknown> => typeof value === "object" &&
  value !== null && !Array.isArray(value);

const integer = (value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): value is number =>
  Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max;

const member = <T extends string>(value: unknown, values: readonly T[]): value is T =>
  typeof value === "string" && values.includes(value as T);

const arrayOf = (value: unknown, validate: (entry: unknown) => boolean): value is unknown[] =>
  Array.isArray(value) && value.every(validate);

export function validOptions(value: unknown): value is Options {
  return record(value) && member(value.textSpeed, ["slow", "mid", "fast"])
    && integer(value.music, 0, 10) && integer(value.sfx, 0, 10) && typeof value.anims === "boolean";
}

function validCodeling(value: unknown): value is Codeling {
  return record(value) && typeof value.uid === "string" && value.uid.length > 0
    && integer(value.species, 1) && integer(value.level, 1, 100) && integer(value.exp) && integer(value.hp)
    && record(value.ivs) && ["hp", "atk", "def", "spd", "spc"].every((stat) =>
      integer((value.ivs as Record<string, unknown>)[stat], 0, 31))
    && arrayOf(value.moves, (move) => record(move) && typeof move.id === "string" &&
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(move.id) && integer(move.pp))
    && value.moves.length <= 4 && (value.status === null || member(value.status, ["blocked", "deprecated", "frozen"]));
}

export function validSave(value: unknown): value is SaveV1 {
  return record(value) && value.v === 1 && typeof value.name === "string" && value.name.length > 0 &&
    value.name.length <= 7
    && member(value.map, maps) && integer(value.x) && integer(value.y) && member(value.dir, ["up", "down",
      "left", "right"])
    && arrayOf(value.party, validCodeling) && value.party.length <= 6 && arrayOf(value.box, validCodeling)
    && record(value.bag) && Object.entries(value.bag).every(([key, quantity]) => member(key, items) &&
      integer(quantity))
    && integer(value.coins) && arrayOf(value.flags, (flag) => typeof flag === "string")
    && arrayOf(value.seen, (id) => integer(id, 1)) && arrayOf(value.caught, (id) => integer(id, 1))
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

export function loadSave(): SaveV1 | null {
  const value = read(SAVE_KEY);
  return validSave(value) ? value : null;
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
  return validOptions(value) ? value : {
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
