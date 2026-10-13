import type { MapId } from "../data/ids.js";
import type { Screen } from "../engine/screen.js";
import type { GameMap } from "../world/map.js";
import { pixels } from "./pixels.js";
import { drawTile, remap, type Light } from "./tiles.js";
import { drawSmallText } from "./font.js";

interface Art {
  rows: string[];
  colours: readonly number[];
}
interface Building {
  x: number;
  y: number;
  width: number;
  style: "house" | "lab" | "center" | "mart" | "gym";
}
const BUILDINGS: Partial<Record<MapId, readonly Building[]>> = {
  sterling: [
    { x: 3, y: 7, width: 5, style: "house" }, { x: 12, y: 6, width: 5, style: "lab" },
    { x: 2, y: 2, width: 4, style: "house" }, { x: 13, y: 13, width: 4, style: "house" },
  ],
  bay: [
    { x: 3, y: 5, width: 5, style: "center" }, { x: 13, y: 5, width: 5, style: "mart" },
    { x: 3, y: 12, width: 5, style: "gym" }, { x: 9, y: 16, width: 4, style: "house" },
  ],
  ridge: [
    { x: 3, y: 6, width: 5, style: "center" }, { x: 15, y: 6, width: 5, style: "mart" },
    { x: 3, y: 14, width: 5, style: "gym" }, { x: 8, y: 0, width: 8, style: "lab" },
  ],
  commit: [
    { x: 3, y: 5, width: 5, style: "center" }, { x: 15, y: 5, width: 5, style: "mart" },
    { x: 9, y: 12, width: 5, style: "gym" }, { x: 3, y: 15, width: 4, style: "house" },
  ],
};
const ROOF_PALETTES = {
  house: [2, 24, 21], lab: [5, 27, 28], center: [1, 14, 0], mart: [31, 30, 10], gym: [9, 31, 10],
} as const;
const art = new Map<string, Art>();
const atlas = new Map<string, HTMLCanvasElement>();
function grid(width = 16, height = 16, background = "0"): string[][] {
  return Array.from({ length: height }, () => Array<string>(width).fill(background));
}
function rect(rows: string[][], x: number, y: number, width: number, height: number, colour: string): void {
  for (let yy = Math.max(0, y); yy < Math.min(rows.length, y + height); yy++) {
    for (let xx = Math.max(0, x); xx < Math.min(rows[0].length, x + width); xx++) {
      rows[yy][xx] = colour;
    }
  }
}
function register(key: string, rows: string[][], colours: readonly number[]): void {
  art.set(key, { rows: rows.map((row) => row.join("")), colours });
}
function hash(x: number, y: number): number {
  let value = Math.imul(x + 117, 374761393) ^ Math.imul(y + 83, 668265263);
  value = Math.imul(value ^ value >>> 13, 1274126177);
  return (value ^ value >>> 16) >>> 0;
}
function floorArt(): void {
  const palettes = {
    wood: [19, 20, 21, 18], lab: [18, 19, 20, 21],
    center: [12, 27, 3, 28], mart: [7, 30, 31, 6], gym: [27, 28, 3, 29],
  } as const;
  for (const [kind, colours] of Object.entries(palettes)) {
    for (let variant = 0; variant < 8; variant++) {
      const rows = grid();
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          if (kind === "wood" || kind === "lab") {
            const plank = Math.floor(y / 4);
            const seam = (variant * 5 + plank * 7) % 16;
            const grain = hash(x + variant * 16, y) % 59;
            rows[y][x] = y % 4 === 3 ? "1" : x === seam ? "2" : grain < 2 ? (kind === "lab" ? "1" : "3") : "0";
          } else {
            const checker = (Math.floor(x / 8) + Math.floor(y / 8) + variant) % 2;
            rows[y][x] = checker ? "1" : "0";
            if (y % 8 === 0 || x % 8 === 0) {
              rows[y][x] = checker ? "2" : "1";
            }
            if (x % 8 === 1 && y % 8 === 1) {
              rows[y][x] = "2";
            }
          }
        }
      }
      register(`floor:${kind}:${variant}`, rows, colours);
    }
  }
}
function terrainArt(): void {
  for (let variant = 0; variant < 3; variant++) {
    const rows = grid();
    for (let y = 1; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const seed = hash(x + variant * 19, y + variant * 7) % 127;
        if (seed < 4) {
          rows[y][x] = "1";
          if (seed === 0 && y > 1) {
            rows[y - 1][x] = "2";
          }
        }
      }
    }
    register(`grass:${variant}`, rows, [7, 8, 9]);
    register(`gravel:${variant}`, rows, [27, 28, 19]);
  }
  for (let edges = 0; edges < 16; edges++) {
    const rows = grid();
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const distance = Math.min(edges & 1 ? y : 16, edges & 2 ? 15 - x : 16,
          edges & 4 ? 15 - y : 16, edges & 8 ? x : 16);
        const blend = distance <= 1 + hash(x, y) % 2;
        rows[y][x] = blend ? hash(x, y) % 4 ? "2" : "3" : hash(x, y) % 31 === 0 ? "1" : "0";
      }
    }
    register(`path:${edges}`, rows, [18, 19, 7, 8]);
    register(`snow-path:${edges}`, rows, [18, 19, 5, 12]);
    register(`mountain-path:${edges}`, rows, [18, 19, 27, 28]);
    for (let frame = 0; frame < 2; frame++) {
      const water = grid();
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const shore = (edges & 1 && y < 2) || (edges & 2 && x > 13)
            || (edges & 4 && y > 13) || (edges & 8 && x < 2);
          const foam = (edges & 1 && y === 2) || (edges & 2 && x === 13)
            || (edges & 4 && y === 13) || (edges & 8 && x === 2);
          water[y][x] = shore ? "3" : foam && (x + y + frame) % 4 ? "2"
            : (y + frame * 2) % 7 === 3 && (x + y + frame * 3) % 9 < 5 ? "1" : "0";
        }
      }
      register(`water:${edges}:${frame}`, water, [11, 13, 12, 7]);
    }
  }
  for (let edges = 0; edges < 16; edges++) {
    const plaza = grid();
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const seam = y % 5 === 4 || (x + Math.floor(y / 5) * 5) % 9 === 8;
        plaza[y][x] = seam ? "2" : (x + y) % 13 === 0 ? "1" : "0";
      }
    }
    register(`plaza:${edges}`, plaza, [27, 3, 28]);
  }
  for (let edges = 0; edges < 16; edges++) {
    const rug = grid();
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const distance = Math.min(edges & 1 ? y : 16, edges & 2 ? 15 - x : 16,
          edges & 4 ? 15 - y : 16, edges & 8 ? x : 16);
        rug[y][x] = distance < 2 ? "1" : distance === 3 ? "2"
          : (x + y) % 8 === 0 && (x - y + 16) % 8 === 0 ? "2" : "0";
      }
    }
    register(`rug:${edges}`, rug, [2, 24, 18]);
    const sofa = grid();
    rect(sofa, 0, 4, 16, 9, "1");
    rect(sofa, 0, 5, 16, 4, "2");
    rect(sofa, 1, 9, 14, 1, "3");
    if (edges & 8) {
      rect(sofa, 0, 7, 3, 7, "1");
    }
    if (edges & 2) {
      rect(sofa, 13, 7, 3, 7, "1");
    }
    register(`sofa:${edges}`, sofa, [21, 2, 24, 18]);
  }
  const tree = grid(32, 32, ".");
  for (let y = 0; y < 25; y++) {
    for (let x = 0; x < 32; x++) {
      const edge = ((x - 15.5) / 15) ** 2 + ((y - 12) / 12) ** 2;
      if (edge < 1 + (hash(x, y) % 3) / 30) {
        tree[y][x] = edge > 0.8 || y > 21 ? "2" : (x + y * 2) % 11 < 3 ? "1" : "0";
      }
    }
  }
  rect(tree, 13, 23, 6, 7, "2");
  rect(tree, 14, 25, 2, 4, "0");
  rect(tree, 8, 30, 18, 1, "2");
  register("tree", tree, [9, 8, 10]);
  const pine = grid(32, 32, ".");
  for (const [top, height, width] of [[1, 10, 8], [8, 12, 12], [15, 11, 15]]) {
    for (let y = top; y < top + height; y++) {
      const half = Math.max(1, Math.floor((y - top + 1) * width / height));
      for (let x = 16 - half; x <= 16 + half && x < 32; x++) {
        pine[y][x] = x === 16 - half || x === 16 + half || y === top + height - 1
          ? "3" : y > top + height - 4 ? "1" : "0";
      }
    }
  }
  rect(pine, 14, 25, 4, 5, "2");
  rect(pine, 8, 30, 18, 1, "3");
  register("pine", pine, [9, 8, 10, 28]);
  register("snow-pine", pine, [5, 12, 10, 27]);
  const lookout = grid(32, 32, ".");
  for (let y = 2; y < 10; y++) {
    const half = 1 + (y - 2) * 2;
    rect(lookout, 16 - half, y, half * 2, 1, y === 9 ? "1" : "0");
    lookout[y][16 - half] = "1";
    lookout[y][15 + half] = "1";
  }
  rect(lookout, 5, 10, 3, 22, "1");
  rect(lookout, 24, 10, 3, 22, "1");
  rect(lookout, 8, 11, 16, 9, "3");
  for (let y = 13; y < 20; y++) {
    rect(lookout, 12 - (y - 13), y, (y - 13) * 2 + 1, 1, "0");
  }
  rect(lookout, 2, 20, 28, 2, "2");
  for (const x of [3, 10, 19, 27]) {
    rect(lookout, x, 18, 2, 7, "1");
  }
  rect(lookout, 2, 25, 28, 2, "1");
  rect(lookout, 3, 25, 26, 1, "2");
  register("lookout", lookout, [5, 21, 19, 12]);
  for (const arrow of ["a", ">", "<"]) {
    const panel = grid();
    rect(panel, 0, 0, 16, 1, "2");
    rect(panel, 0, 0, 1, 16, "2");
    rect(panel, 1, 1, 14, 14, "1");
    rect(panel, 15, 1, 1, 15, "3");
    rect(panel, 1, 15, 15, 1, "3");
    for (let y = 4; y < 12; y++) {
      for (let x = 4; x < 12; x++) {
        const ax = arrow === "a" ? x - 8 : y - 8;
        const ay = arrow === "a" ? y - 4 : arrow === ">" ? 11 - x : x - 4;
        if (ay < 4 ? Math.abs(ax) <= ay : Math.abs(ax) <= 1) {
          panel[y][x] = "0";
        }
      }
    }
    register(`panel:${arrow}`, panel, [1, 30, 12, 31]);
  }
  for (let variant = 0; variant < 5; variant++) {
    const cave = grid();
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const seed = hash(x + variant * 16, y) % 71;
        cave[y][x] = seed < 3 ? "1" : seed === 4 ? "2" : "0";
      }
    }
    register(`cave:${variant}`, cave, variant === 3 ? [27, 28, 19] : variant === 4 ? [28, 27, 29] : [29, 28, 27]);
  }
}
function buildingArt(): void {
  for (const [style, colours] of Object.entries(ROOF_PALETTES)) {
    for (const width of [4, 5, 8]) {
      const roof = grid(width * 16 + 8, 40, ".");
      for (let y = 0; y < 40; y++) {
        const inset = Math.max(0, 8 - Math.floor(y / 3));
        for (let x = inset; x < roof[0].length - inset; x++) {
          roof[y][x] = y >= 34 ? "2" : y < 3 ? "1" : y % 5 === 4 ? "2"
            : (x + Math.floor(y / 5) * 5) % 13 === 0 ? "1" : "0";
        }
      }
      rect(roof, 0, 34, roof[0].length, 2, "1");
      register(`roof:${style}:${width}`, roof, colours);
    }
    const wall = grid();
    rect(wall, 0, 0, 16, 3, "2");
    rect(wall, 0, 13, 16, 2, "1");
    rect(wall, 0, 15, 16, 1, "2");
    rect(wall, 4, 3, 8, 9, "2");
    rect(wall, 5, 4, 6, 7, "3");
    rect(wall, 8, 4, 1, 7, "1");
    rect(wall, 5, 7, 6, 1, "1");
    rect(wall, 3, 12, 10, 1, "1");
    register(`wall:${style}`, wall, style === "lab" ? [5, 27, 28, 11] : [18, 19, 21, 11]);
  }
  const board = grid(16, 16, ".");
  rect(board, 1, 1, 14, 12, "2");
  rect(board, 2, 2, 12, 10, "0");
  rect(board, 6, 3, 4, 8, "1");
  rect(board, 4, 5, 8, 4, "1");
  register("center-board", board, [1, 5, 27]);
  const check = grid(16, 16, ".");
  rect(check, 1, 1, 14, 12, "2");
  rect(check, 2, 2, 12, 10, "0");
  for (let index = 0; index < 4; index++) {
    rect(check, 4 + index, 5 + index, 2, 2, "1");
    rect(check, 7 + index, 8 - index, 2, 2, "1");
  }
  register("gym-board", check, [9, 6, 21]);
  const dish = grid(16, 16, ".");
  for (let y = 1; y < 11; y++) {
    for (let x = 2; x < 14; x++) {
      if ((x - 7) ** 2 / 36 + (y - 5) ** 2 / 25 < 1) {
        dish[y][x] = x < 6 || y > 7 ? "1" : "0";
      }
    }
  }
  rect(dish, 7, 9, 2, 6, "2");
  rect(dish, 8, 4, 5, 1, "2");
  register("dish", dish, [5, 27, 28]);
  const chimney = grid(16, 16, ".");
  rect(chimney, 4, 3, 8, 13, "0");
  rect(chimney, 3, 2, 10, 3, "1");
  rect(chimney, 5, 2, 6, 1, "2");
  rect(chimney, 4, 8, 8, 1, "2");
  register("chimney", chimney, [20, 19, 21]);
}
// Art is registered and rasterized on first draw; building every piece and light up front blocked boot.
function imageFor(key: string, light: Light): HTMLCanvasElement | undefined {
  if (!art.size) {
    floorArt();
    terrainArt();
    buildingArt();
  }
  const id = `${key}:${light}`;
  const value = art.get(key);
  if (!atlas.has(id) && value) {
    const colours = Object.fromEntries(value.colours.map((index, digit) => [String(digit), remap(index, light)]));
    atlas.set(id, pixels(value.rows, colours));
  }
  return atlas.get(id);
}
function blit(screen: Screen, key: string, x: number, y: number, light: Light): void {
  const image = imageFor(key, light);
  if (image) {
    screen.blit(image, 0, 0, image.width, image.height, x, y);
  }
}
function edgeMask(map: GameMap, x: number, y: number, same: (tile: string) => boolean): number {
  return [[0, -1], [1, 0], [0, 1], [-1, 0]].reduce((mask, [dx, dy], index) => {
    const tile = map.tiles[y + dy]?.[x + dx];
    return tile !== undefined && !same(tile) ? mask | 1 << index : mask;
  }, 0);
}
export function drawMapTile(screen: Screen, map: GameMap, tile: string, wx: number, wy: number,
  x: number, y: number, frame: number, light: Light): void {
  if (tile === "^") {
    drawTile(screen, "*", x, y, frame, light);
    return;
  }
  if (map.id === "ridge" && tile === "?") {
    drawTile(screen, "*", x, y, frame, light);
    return;
  }
  if (map.id === "ridge" && tile === "F") {
    screen.fill(remap(5, light), x, y, 16, 16);
    for (const post of [2, 12]) {
      screen.fill(remap(21, light), x + post, y + 3, 2, 13);
      screen.fill(remap(19, light), x + post, y + 4, 1, 11);
      screen.fill(remap(12, light), x + post - 1, y + 2, 4, 2);
    }
    for (const rail of [6, 11]) {
      screen.fill(remap(21, light), x, y + rail, 16, 2);
      screen.fill(remap(19, light), x, y + rail, 16, 1);
    }
    return;
  }
  if (tile === "9") {
    screen.fill(remap(12, light), x, y, 16, 16);
    for (let offset = 1; offset < 15; offset++) {
      const crackY = 3 + Math.floor(offset / 2) + hash(wx, wy) % 3;
      screen.fill(remap(5, light), x + offset, y + crackY, 1, 1);
    }
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      if (map.tiles[wy + dy]?.[wx + dx] !== "9") {
        screen.fill(remap(5, light), x + (dx > 0 ? 13 : 0), y + (dy > 0 ? 13 : 0),
          dx ? 3 : 16, dy ? 3 : 16);
      }
    }
    return;
  }
  if (tile === "_") {
    const kind = map.id === "lab" ? "lab" : ["bedroom", "house", "bayHouse"].includes(map.id) ? "wood"
      : ["center", "bayCenter", "ridgeCenter"].includes(map.id) ? "center"
        : ["mart", "bayMart", "ridgeMart"].includes(map.id) ? "mart" : "gym";
    blit(screen, `floor:${kind}:${hash(wx, wy) % 8}`, x, y, light);
    return;
  }
  if (tile === "." || tile === "T") {
    blit(screen, `${map.id === "route4" ? "gravel" : "grass"}:${hash(wx, wy) % 3}`, x, y, light);
    return;
  }
  if (tile === ":") {
    const ground = map.id === "ridge" ? ["*", "7", "8", "^"] : [".", "g", "f", "T", "Z"];
    const edges = edgeMask(map, wx, wy, (value) => !ground.includes(value));
    const plaza = map.id === "commit" && wx >= 14 && wx <= 21 && wy >= 10 && wy <= 15;
    const kind = map.id === "ridge" ? "snow-path" : map.id === "route4" ? "mountain-path"
      : plaza ? "plaza" : "path";
    blit(screen, `${kind}:${edges}`, x, y, light);
    return;
  }
  if (tile === "~") {
    const edges = edgeMask(map, wx, wy, (value) => ["~", "=", "j"].includes(value));
    blit(screen, `water:${edges}:${frame}`, x, y, light);
    return;
  }
  if (["a", ">", "<"].includes(tile)) {
    blit(screen, `panel:${tile}`, x, y, light);
    return;
  }
  if (tile === "v" && map.id === "pipeGym") {
    blit(screen, `floor:gym:${hash(wx, wy) % 8}`, x, y, light);
    screen.fill(28, x, y + 2, 16, 2);
    screen.fill(3, x, y + 2, 16, 1);
    for (let row = 0; row < 3; row++) {
      screen.fill(28, x + 5 + row, y + 7 + row, 6 - row * 2, 1);
    }
    return;
  }
  if (tile === "z") {
    const edges = edgeMask(map, wx, wy, (value) => value === "z");
    blit(screen, `sofa:${edges}`, x, y, light);
    return;
  }
  if (tile === "r") {
    const edges = edgeMask(map, wx, wy, (value) => value === "r");
    blit(screen, `rug:${edges}`, x, y, light);
    return;
  }
  if (tile === "c") {
    const distance = Math.abs(wx - 9) + Math.abs(wy - 18);
    const variant = distance <= 2 ? 3 : distance <= 5 ? 4 : hash(wx, wy) % 3;
    blit(screen, `cave:${variant}`, x, y, light);
    return;
  }
  if (tile === "W") {
    const building = BUILDINGS[map.id]?.find((entry) => wy === entry.y + 2
      && wx >= entry.x && wx < entry.x + entry.width);
    if (building) {
      blit(screen, `wall:${building.style}`, x, y, light);
      return;
    }
  }
  drawTile(screen, tile, x, y, frame, light);
  if (tile === "D") {
    screen.fill(21, x, y + 15, 16, 1);
    screen.fill(19, x + 1, y + 13, 14, 1);
  }
  if (tile === "=" && map.id === "route2" && (wy === 8 || wy === 9)) {
    screen.fill(21, x, y + (wy === 8 ? 0 : 14), 16, 2);
    screen.fill(18, x, y + (wy === 8 ? 0 : 14), 16, 1);
    screen.fill(21, x + 1, y + (wy === 8 ? 0 : 10), 2, 6);
  }
  if (tile === "=" && ["route3", "route4"].includes(map.id)) {
    const dark = remap(21, light);
    const highlight = remap(18, light);
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      if (map.tiles[wy + dy]?.[wx + dx] !== "~") {
        continue;
      }
      if (dx) {
        const railX = x + (dx < 0 ? 0 : 14);
        screen.fill(dark, railX, y, 2, 16);
        screen.fill(highlight, railX, y, 1, 16);
        screen.fill(dark, railX - (dx > 0 ? 1 : 0), y + 2, 3, 3);
        screen.fill(dark, railX - (dx > 0 ? 1 : 0), y + 11, 3, 3);
      } else {
        const railY = y + (dy < 0 ? 0 : 14);
        screen.fill(dark, x, railY, 16, 2);
        screen.fill(highlight, x, railY, 16, 1);
        screen.fill(dark, x + 2, railY - (dy > 0 ? 1 : 0), 3, 3);
        screen.fill(dark, x + 11, railY - (dy > 0 ? 1 : 0), 3, 3);
      }
    }
  }
}
export function drawScenery(screen: Screen, map: GameMap, ox: number, oy: number,
  light: Light, overhead: boolean): void {
  if (!map.outdoor) {
    if (!overhead) {
      for (let y = 2; y < map.height - 1; y++) {
        screen.fill(21, ox + 16, oy + y * 16, 1, 16);
        screen.fill(21, ox + (map.width - 1) * 16 - 1, oy + y * 16, 1, 16);
      }
      screen.fill(21, ox + 16, oy + 32, (map.width - 2) * 16, 2);
    }
    return;
  }
  const trees: [number, number][] = [];
  for (let x = 0; x < map.width; x += 2) {
    if (map.tiles[0][x] === "T") {
      trees.push([x * 16 - 8, -10]);
    }
    if (map.tiles[map.height - 1][x] === "T") {
      trees.push([x * 16 - 8, map.height * 16 - 26]);
    }
  }
  for (let y = 2; y < map.height - 2; y += 2) {
    if (map.tiles[y][0] === "T") {
      trees.push([-15, y * 16 - 6]);
    }
    if (map.tiles[y][map.width - 1] === "T") {
      trees.push([map.width * 16 - 17, y * 16 - 6]);
    }
  }
  for (let y = 1; y < map.height - 1; y++) {
    for (let x = 1; x < map.width - 1; x++) {
      if (map.tiles[y][x] === "T" && map.tiles[y][x - 1] !== "T") {
        trees.push([x * 16, y * 16 - 16]);
      }
    }
  }
  const tree = imageFor(map.id === "route4" ? "pine" : "tree", light)!;
  for (const [x, y] of trees) {
    const sy = overhead ? 0 : 24;
    screen.blit(tree, 0, sy, 32, overhead ? 24 : 8, x + ox, y + oy + sy);
  }
  if (map.id === "ridge") {
    const snowTree = imageFor("snow-pine", light)!;
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (map.tiles[y][x] === "^") {
          const sy = overhead ? 0 : 24;
          screen.blit(snowTree, 0, sy, 32, overhead ? 24 : 8, ox + x * 16 - 8, oy + y * 16 - 16 + sy);
        }
      }
    }
    if (overhead) {
      blit(screen, "lookout", ox + 18 * 16 - 8, oy + 13 * 16 - 16, light);
    }
  }
  for (const building of BUILDINGS[map.id] ?? []) {
    const x = ox + building.x * 16;
    const y = oy + building.y * 16;
    if (!overhead) {
      screen.fill(21, x + 1, y + 48, building.width * 16 + 1, 1);
      continue;
    }
    blit(screen, `roof:${building.style}:${building.width}`, x - 4, y - 4, light);
    if (map.id === "ridge") {
      screen.fill(remap(5, light), x + 5, y + 1, building.width * 16 - 10, 3);
    }
    if (building.style === "house") {
      blit(screen, "chimney", x + 14, y - 12, light);
    } else if (building.style === "lab") {
      blit(screen, "dish", x + 10, y - 12, light);
    } else if (building.style === "center") {
      blit(screen, "center-board", x + 32, y + 16, light);
    } else if (building.style === "gym") {
      blit(screen, "gym-board", x + 32, y + 16, light);
    } else {
      screen.fill(10, x + 19, y + 18, 41, 11);
      drawSmallText(screen, "MART", x + 27, y + 20, 5);
    }
  }
}
