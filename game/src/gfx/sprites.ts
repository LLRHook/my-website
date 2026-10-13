import type { Dir } from "../data/ids.js";
import type { Screen } from "../engine/screen.js";
import { pixels } from "./pixels.js";
import { remap, type Light } from "./tiles.js";

export const REGION_SPRITES = ["otto", "mira", "warden", "ranger", "guard", "hiker", "sailor", "skier", "ace"] as const;
export type RegionSpriteId = typeof REGION_SPRITES[number];
export type SpriteId = "player" | "prof" | "gran" | "medic" | "clerk" | "aide" | "townsfolk"
  | "trainer" | "rhea" | RegionSpriteId;
// Outline, clothing/accent, skin/highlight: three opaque colours plus transparency.
const STYLES: Readonly<Record<SpriteId, readonly [number, number, number]>> = {
  player: [1, 2, 18], prof: [0, 28, 18], gran: [0, 16, 18], medic: [0, 5, 18],
  clerk: [0, 9, 18], aide: [0, 27, 18], townsfolk: [0, 16, 18], trainer: [0, 23, 18], rhea: [0, 30, 18],
  otto: [0, 4, 18], mira: [0, 15, 18], warden: [0, 22, 18], ranger: [0, 9, 18],
  guard: [0, 14, 18], hiker: [0, 20, 18], sailor: [0, 11, 18], skier: [0, 30, 18], ace: [0, 16, 18],
};
function regionRows(id: RegionSpriteId, dir: Dir, frame: number): string[] {
  const rows = Array.from({ length: 16 }, () => Array<string>(16).fill("."));
  const put = (y: number, x: number, value: string) => {
    [...value].forEach((pixel, offset) => { rows[y][x + offset] = pixel; });
  };
  ["ohhhhhho", "ohhhhhho", "osssssso", "osossoso", "osssssso", "oossssoo"]
    .forEach((row, y) => put(y + 1, 4, row));
  ["ohhhho", "oshhhhso", "oshhhhso", "ohhhhho", "ohhhhho", "oohhhoo"]
    .forEach((row, y) => put(y + 7, row.length === 8 ? 4 : 5, row));
  put(13, 5, frame === 1 ? "oh..ho" : frame === 2 ? "ho..oh" : "oh..ho");
  put(14, 5, frame === 1 ? "oo...oo" : frame === 2 ? "oo..oo." : "oo..oo");
  if (id === "otto" || id === "warden") {
    put(0, 6, "oooo");
    put(1, 5, "ohhhho");
    put(2, 4, "ohhhhhho");
    put(3, 4, id === "warden" ? "ohhsshho" : "ohhhhhho");
    put(8, 5, "ohosho");
    put(9, 5, "ohosho");
    put(10, 5, id === "otto" ? "osssso" : "ohhhho");
  } else if (id === "mira") {
    for (let y = 2; y < 12; y++) {
      put(y, 4, "oh");
      put(y, 10, "ho");
    }
    put(8, 5, "ohssho");
    put(9, 5, "ohosho");
    put(10, 7, "ss");
    put(11, 7, "so");
  } else if (id === "ranger" || id === "hiker") {
    put(1, 5, "ohhhho");
    put(2, 4, "ohhhhhho");
    put(3, 3, "oohhhhhhoo");
    put(8, 5, id === "hiker" ? "osohho" : "ohssho");
    if (id === "hiker") {
      for (let y = 7; y < 12; y++) {
        put(y, 3, "oh");
      }
      put(10, 12, "o");
      put(11, 12, "o");
      put(12, 12, "o");
    }
  } else if (id === "guard" || id === "sailor") {
    put(1, 5, "osssso");
    put(2, 5, "ohhhho");
    put(3, 4, "oohhhhho");
    put(8, 5, id === "sailor" ? "osssso" : "ohosho");
    put(10, 5, id === "sailor" ? "osssso" : "oooooo");
  } else if (id === "skier") {
    put(0, 7, "ss");
    put(1, 5, "ohhhho");
    put(2, 5, "osssso");
    put(4, 5, "osooso");
    put(6, 5, "ohhhho");
    put(8, 5, "osshho");
    put(9, 5, "ohssho");
  } else {
    put(1, 4, "oohhhhho");
    put(2, 4, "ohhhhhho");
    put(8, 5, "ohssho");
    put(9, 5, "ohosho");
    put(10, 9, "ss");
  }
  if (dir === "up") {
    put(4, 5, "ohhhho");
    put(5, 5, "ohhhho");
    put(6, 5, "ohhhho");
    put(8, 5, id === "hiker" ? "osssso" : "ohhhho");
    put(9, 5, id === "hiker" ? "osohso" : "ohhhho");
    put(10, 5, "ohhhho");
  } else if (dir === "left" || dir === "right") {
    put(4, 4, "osssho");
    put(5, 4, "ososhho");
    put(6, 5, "osshho");
  }
  put(15, 4, "oooooooo");
  const result = rows.map((row) => row.join(""));
  return dir === "right" ? result.map((row) => [...row].reverse().join("")) : result;
}
const BODY = [
  "................", "......hhhh......", ".....hhhhhh.....", ".....hssssh.....",
  ".....ssssss.....", ".....sossos.....", "......ssss......", "......hssh......",
  ".....hhsshh.....", ".....hhsshh.....", "....shhhhhhs....", ".....hhhhhh.....",
  "......hhhh......", "......h..h......", "......o..o......", "................",
];
function characterRows(id: SpriteId, dir: Dir, frame: number): string[] {
  if (REGION_SPRITES.some((sprite) => sprite === id)) {
    return regionRows(id as RegionSpriteId, dir, frame);
  }
  const rows = BODY.map((row) => [...row]);
  const put = (y: number, x: number, value: string) => {
    [...value].forEach((pixel, offset) => { rows[y][x + offset] = pixel; });
  };
  if (id === "player") {
    put(1, 5, "hhhhhh");
    put(2, 4, "hhshhhhh");
    put(3, 4, "hhhhhhhh");
    put(8, 5, "oossooo");
    put(9, 5, "oohoooh");
    put(10, 5, "ooooooh");
    put(11, 5, "oohhooh");
    put(12, 6, "oooo");
    if (dir === "up") {
      put(8, 5, "ohhhhho");
      put(9, 5, "ohsshho");
      put(10, 5, "ohhhhho");
      put(11, 5, "ohsshho");
    }
  } else if (id === "gran") {
    put(0, 7, "hh");
    put(1, 6, "hshh");
    put(2, 5, "hhhhhh");
    put(11, 4, "hhshhshh");
    put(12, 4, "hhhhhhhh");
    put(13, 4, "hhhhhhhh");
  } else if (id === "medic" || id === "aide") {
    if (id === "medic") {
      put(1, 5, "hhhhhh");
      put(2, 5, "hhoohh");
    }
    put(8, 5, "hhosohh");
    put(9, 5, "hhosohh");
    put(10, 5, "hhosohh");
    put(11, 4, "hhhsohhh");
    put(12, 4, "hhhooohh");
    put(13, 4, "hh....hh");
  } else if (id === "prof") {
    put(1, 6, "ohho");
    put(2, 5, "ohhoooo");
    put(4, 5, "oosooso");
    put(5, 5, "sossoss");
    put(8, 5, "ohssoho");
    put(9, 5, "oohhooo");
    put(10, 5, "oohhooo");
    put(11, 5, "ohhhooo");
  } else if (id === "clerk") {
    put(2, 5, "oohhoo");
    put(6, 5, "soooss");
    put(7, 6, "oooo");
    put(9, 6, "hssh");
    put(10, 6, "hssh");
    put(11, 6, "hhhh");
    put(12, 6, "hhhh");
  } else if (id === "trainer") {
    put(1, 5, "hhhhhh");
    put(3, 4, "hhhhhhhh");
    put(8, 4, "hhsshhh");
    put(9, 4, "hshhhhh");
    put(11, 5, "hhohhho");
  } else if (id === "rhea") {
    put(2, 4, "oohhhhoo");
    put(4, 4, "oossssso");
    put(6, 4, "oo....oo");
    put(9, 9, "sss");
    put(10, 9, "sos");
    put(11, 9, "sss");
  }
  if (dir === "up") {
    put(4, 5, id === "player" ? "hhhhhh" : "oohhoo");
    put(5, 5, id === "player" ? "hhhhhh" : "oooooo");
    put(6, 6, "oooo");
  } else if (dir === "left" || dir === "right") {
    put(4, 5, "ssssho");
    put(5, 4, "sosshoo");
    put(6, 5, "ssssoo");
  }
  if (frame && id !== "gran") {
    put(13, 5, frame === 1 ? "hh..h." : ".h..hh");
    put(14, 5, frame === 1 ? "oo..o." : ".o..oo");
  }
  const outline = rows.map((row) => [...row]);
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < 16; x++) {
      if (rows[y][x] !== ".") {
        for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
          if (rows[y + dy]?.[x + dx] === ".") {
            outline[y + dy][x + dx] = "o";
          }
        }
      }
    }
  }
  for (let x = 4; x < 12; x++) {
    outline[15][x] = "o";
  }
  const result = outline.map((row) => row.join(""));
  return dir === "right" ? result.map((row) => [...row].reverse().join("")) : result;
}
const atlas = new Map<string, HTMLCanvasElement>();
const portraits = new Map<SpriteId, HTMLCanvasElement>();

function portraitRows(id: RegionSpriteId): string[] {
  const rows = Array.from({ length: 40 }, () => Array<string>(32).fill("."));
  const rect = (x: number, y: number, width: number, height: number, colour: string) => {
    for (let yy = y; yy < y + height; yy++) {
      for (let xx = x; xx < x + width; xx++) {
        rows[yy][xx] = colour;
      }
    }
  };
  for (let y = 5; y < 26; y++) {
    const half = y < 8 ? 7 : y > 22 ? 7 : 10;
    rect(16 - half, y, half * 2, 1, "o");
    rect(17 - half, y, half * 2 - 2, 1, y < 11 ? "h" : "s");
  }
  rect(10, 16, 2, 2, "o");
  rect(21, 16, 2, 2, "o");
  rect(15, 22, 5, 1, "o");
  rect(13, 25, 6, 3, "s");
  for (let y = 28; y < 40; y++) {
    const half = Math.min(15, 10 + Math.floor((y - 28) / 2));
    rect(16 - half, y, half * 2, 1, "o");
    rect(17 - half, y, half * 2 - 2, 1, "h");
  }
  if (id === "otto" || id === "warden") {
    rect(9, 2, 14, 3, "o");
    rect(10, 3, 12, 2, "h");
    rect(6, 5, 20, 6, "h");
    rect(4, 10, 24, 3, "o");
    rect(5, 10, 22, 2, "h");
    rect(15, 4, 2, 5, "o");
    if (id === "warden") {
      rect(13, 6, 6, 5, "o");
      rect(14, 7, 4, 3, "s");
    } else {
      rect(8, 29, 3, 10, "s");
      rect(22, 29, 3, 10, "s");
      rect(4, 35, 25, 2, "s");
      rect(15, 29, 3, 11, "o");
    }
  } else if (id === "mira") {
    rect(5, 8, 4, 25, "o");
    rect(6, 9, 2, 22, "h");
    rect(24, 8, 4, 25, "o");
    rect(25, 9, 2, 22, "h");
    rect(10, 6, 13, 5, "h");
    for (let y = 28; y < 35; y++) {
      rows[y][12 + Math.floor((y - 28) / 3)] = "s";
      rows[y][21 - Math.floor((y - 28) / 3)] = "s";
    }
    rect(14, 34, 7, 5, "s");
    rect(15, 35, 1, 1, "o");
  } else if (id === "ranger" || id === "hiker") {
    rect(9, 2, 14, 7, "h");
    rect(5, 8, 23, 3, "o");
    rect(4, 11, 25, 2, "h");
    rect(9, 7, 14, 2, "o");
    rect(10, 29, 3, 11, "s");
    if (id === "hiker") {
      rect(2, 27, 5, 12, "o");
      rect(3, 28, 3, 10, "h");
      rect(27, 25, 2, 15, "o");
    } else {
      rect(21, 32, 3, 3, "s");
    }
  } else if (id === "guard" || id === "sailor") {
    rect(7, 4, 19, 5, id === "sailor" ? "s" : "h");
    rect(6, 9, 22, 3, "o");
    rect(15, 6, 4, 2, "s");
    if (id === "sailor") {
      rect(5, 31, 23, 2, "s");
      rect(3, 36, 27, 2, "s");
      rect(13, 28, 7, 2, "o");
    } else {
      rect(15, 29, 2, 11, "o");
      rect(21, 31, 3, 3, "s");
      rect(6, 37, 23, 2, "o");
    }
  } else if (id === "skier") {
    rect(13, 1, 5, 3, "s");
    rect(8, 5, 17, 5, "h");
    rect(7, 12, 19, 6, "o");
    rect(9, 13, 7, 3, "s");
    rect(18, 13, 6, 3, "s");
    rect(9, 24, 16, 3, "h");
    rect(11, 28, 4, 8, "s");
  } else {
    rect(6, 3, 18, 6, "h");
    rect(5, 7, 22, 3, "o");
    rect(11, 29, 2, 8, "s");
    rect(21, 29, 2, 8, "s");
    rect(22, 34, 3, 3, "s");
  }
  return rows.map((row) => row.join(""));
}

// Portraits and walk frames are rasterized on first use; building all of them up front blocked boot.
export function trainerPortrait(id: SpriteId): HTMLCanvasElement | undefined {
  let portrait = portraits.get(id);
  const region = REGION_SPRITES.find((sprite) => sprite === id);
  if (!portrait && region) {
    const [o, h, s] = STYLES[region];
    portrait = pixels(portraitRows(region), { o, h, s });
    portraits.set(region, portrait);
  }
  return portrait;
}

export function drawSprite(screen: Screen, id: SpriteId, dir: Dir, frame: number,
  x: number, y: number, light: Light = "day"): void {
  const key = `${id}:${dir}:${frame}:${light}`;
  let sprite = atlas.get(key);
  if (!sprite && Object.hasOwn(STYLES, id) && (frame === 0 || frame === 1 || frame === 2)) {
    const [outline, clothing, skin] = STYLES[id];
    sprite = pixels(characterRows(id, dir, frame), {
      o: remap(outline, light), h: remap(clothing, light), s: remap(skin, light),
    });
    atlas.set(key, sprite);
  }
  if (sprite) {
    screen.blit(sprite, 0, 0, 16, 16, x, y);
  }
}
// Original 48x64 portrait: swept hair, rectangular glasses, black jacket.
export function professorPortrait(): HTMLCanvasElement {
  const rows = Array.from({ length: 64 }, (_, y) => Array.from({ length: 48 }, (_, x) => {
    if (y >= 40 && Math.abs(x - 24) < 15 + Math.floor((y - 40) / 3)) {
      const center = Math.abs(x - 24);
      if (center < 2 && y < 50) {
        return "s";
      }
      const lapel = Math.abs(center - (13 - (y - 40) * 0.65)) < 0.7 && y < 55;
      const shoulder = y < 46 && center > 10 && (x + y) % 4 === 0;
      return lapel || shoulder ? "g" : "h";
    }
    if (y >= 8 && y < 39 && ((x - 24) ** 2 / 225 + (y - 24) ** 2 / 289 < 1)) {
      if (y < 15 + Math.floor((x - 12) / 4) || x > 35) {
        return "h";
      }
      if (y >= 22 && y <= 27 && ((x >= 12 && x <= 22) || (x >= 26 && x <= 36))) {
        return y === 22 || y === 27 || x === 12 || x === 22 || x === 26 || x === 36 ? "h" : "g";
      }
      if (y === 24 && x > 22 && x < 26 || y === 33 && x > 20 && x < 28) {
        return "h";
      }
      return "s";
    }
    return ".";
  }).join(""));
  return pixels(rows, { h: 0, s: 18, g: 27 });
}
