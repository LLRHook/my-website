import type { Dir } from "../data/ids.js";
import type { Screen } from "../engine/screen.js";
import { pixels } from "./pixels.js";
import { remap, type Light } from "./tiles.js";

export type SpriteId = "player" | "prof" | "gran" | "medic" | "clerk" | "aide" | "townsfolk" | "trainer" | "rhea";
// Outline, clothing/accent, skin/highlight: three opaque colours plus transparency.
const STYLES: Readonly<Record<SpriteId, readonly [number, number, number]>> = {
  player: [1, 2, 18], prof: [0, 28, 18], gran: [0, 16, 18], medic: [0, 5, 18],
  clerk: [0, 9, 18], aide: [0, 27, 18], townsfolk: [0, 16, 18], trainer: [0, 23, 18], rhea: [0, 30, 18],
};
const BODY = [
  "................", "......hhhh......", ".....hhhhhh.....", ".....hssssh.....",
  ".....ssssss.....", ".....sossos.....", "......ssss......", "......hssh......",
  ".....hhsshh.....", ".....hhsshh.....", "....shhhhhhs....", ".....hhhhhh.....",
  "......hhhh......", "......h..h......", "......o..o......", "................",
];
function characterRows(id: SpriteId, dir: Dir, frame: number): string[] {
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
export function initSprites(): void {
  for (const id of Object.keys(STYLES) as SpriteId[]) {
    const [outline, clothing, skin] = STYLES[id];
    for (const light of ["day", "dusk", "night"] as const) {
      for (const dir of ["up", "down", "left", "right"] as const) {
        for (let frame = 0; frame < 3; frame++) {
          atlas.set(`${id}:${dir}:${frame}:${light}`, pixels(characterRows(id, dir, frame), {
            o: remap(outline, light), h: remap(clothing, light), s: remap(skin, light),
          }));
        }
      }
    }
  }
}

export function drawSprite(screen: Screen, id: SpriteId, dir: Dir, frame: number,
  x: number, y: number, light: Light = "day"): void {
  const sprite = atlas.get(`${id}:${dir}:${frame}:${light}`);
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
