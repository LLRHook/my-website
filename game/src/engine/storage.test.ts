import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSave, DEFAULT_OPTIONS, loadOptions, loadSave, OPTIONS_KEY, SAVE_KEY, writeOptions, writeSave,
  type SaveV1 } from "./storage.js";

const fixture = (): SaveV1 => ({
  v: 1, name: "DEV", map: "bedroom", x: 1, y: 2, dir: "down", coins: 20, flags: ["starter"], seen: [42],
    caught: [42], playTimeSec: 12.5,
  options: {
    ...DEFAULT_OPTIONS
  }, bag: {
    forkBall: 5
  }, box: [],
  party: [{
    uid: "caught-1", species: 42, level: 5, exp: 125, hp: 22, ivs: {
      hp: 1, atk: 2, def: 3, spd: 4, spc: 5
    }, moves: [{
      id: "type-guard", pp: 10
    }], status: null
  }],
});
describe("versioned local storage", () => {
  let values: Map<string, string>;
  beforeEach(() => {
    values = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) =>
        values.set(key, value), removeItem: (key: string) => values.delete(key)
    });
  });
  afterEach(() => vi.unstubAllGlobals());
  it("round-trips a complete save and clears it", () => {
    expect(writeSave(fixture())).toBe(true);
    expect(loadSave()).toEqual(fixture());
    clearSave();
    expect(loadSave()).toBeNull();
  });
  it.each(["{bad", "null", "[]", JSON.stringify({
    ...fixture(), v: 2
  })])("treats corrupt JSON or unsupported shapes as no save: %s", (raw) => {
    values.set(SAVE_KEY, raw);
    expect(loadSave()).toBeNull();
  });
  it("rejects every missing top-level field", () => {
    for (const key of Object.keys(fixture())) {
      const value: Record<string, unknown> = {
        ...fixture()
      };
      delete value[key];
      values.set(SAVE_KEY, JSON.stringify(value));
      expect(loadSave(), key).toBeNull();
    }
  });
  it.each([{
    dir: "north"
  }, {
    map: "missing"
  }, {
    x: -1
  }, {
    coins: 1.5
  }, {
    bag: {
      unknown: 1
    }
  }, {
    seen: ["42"]
  }, {
    options: {
      ...DEFAULT_OPTIONS, music: 11
    }
  }, {
    party: [{
      ...fixture().party[0], ivs: {
        hp: 32
      }
    }]
  }, {
    party: [{
      ...fixture().party[0], status: "confused"
    }]
  }, {
    party: [{
      ...fixture().party[0], moves: [{
        id: "bad id", pp: -1
      }]
    }]
  }])("rejects invalid nested values: %j", (change) => {
    values.set(SAVE_KEY, JSON.stringify({
      ...fixture(), ...change
    }));
    expect(loadSave()).toBeNull();
  });
  it("persists options without a save and uses defaults for invalid options", () => {
    expect(loadOptions()).toEqual(DEFAULT_OPTIONS);
    const options = {
      ...DEFAULT_OPTIONS, music: 0, textSpeed: "fast" as const
    };
    expect(writeOptions(options)).toBe(true);
    expect(loadOptions()).toEqual(options);
    values.set(OPTIONS_KEY, '{"music":5}');
    expect(loadOptions()).toEqual(DEFAULT_OPTIONS);
  });
  it("takes options from the save and updates both storage locations", () => {
    writeSave(fixture());
    values.set(OPTIONS_KEY, JSON.stringify({
      ...DEFAULT_OPTIONS, music: 1
    }));
    expect(loadOptions().music).toBe(6);
    const options = {
      ...DEFAULT_OPTIONS, music: 3
    };
    writeOptions(options);
    expect(loadSave()?.options).toEqual(options);
    expect(JSON.parse(values.get(OPTIONS_KEY)!)).toEqual(options);
  });
  it("never throws when localStorage access is denied", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("Denied");
      }, setItem: () => {
        throw new Error("Quota");
      }, removeItem: () => {
        throw new Error("Denied");
      }
    });
    expect(loadSave()).toBeNull();
    expect(loadOptions()).toEqual(DEFAULT_OPTIONS);
    expect(writeSave(fixture())).toBe(false);
    expect(writeOptions({
      ...DEFAULT_OPTIONS
    })).toBe(false);
    expect(() => clearSave()).not.toThrow();
  });
});
