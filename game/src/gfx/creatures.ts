import type { BodyPlan, Species } from "../data/species.js";
import { mulberry32 } from "../engine/rng.js";
import type { TypeId } from "../battle/types.js";
import { PALETTE } from "./palette.js";
// Each row is a 16-cell half-mask, mirrored around the creature's spine.
// # is body, ? is seeded fringe, E is the eye anchor, . is always transparent.
const profiles: Record<TypeId, readonly number[]> = {
  python: [0,0,0,0,0,0,5,7,8,9,9,9,8,7,6,5,4,3,3,4,5,7,9,10,10,9,7,5,0,0,0,0],
  go: [0,0,0,0,0,0,5,7,9,10,11,11,12,12,12,12,12,12,12,12,11,11,10,9,8,7,6,5,0,0,0,0],
  javascript: [0,0,0,0,1,2,2,3,5,6,7,9,9,10,10,11,11,11,11,10,10,9,8,7,6,5,3,2,0,0,0,0],
  typescript: [0,0,0,0,0,0,0,8,8,8,8,8,8,8,8,9,12,12,12,12,12,10,8,8,8,7,6,6,0,0,0,0],
  swift: [0,0,0,0,0,0,1,2,3,4,5,6,7,8,10,13,14,13,11,9,7,6,5,4,3,2,1,0,0,0,0,0],
  shell: [0,0,0,0,0,0,0,0,0,0,3,5,7,8,9,10,11,12,12,12,12,11,10,9,8,7,5,4,0,0,0,0],
  dart: [0,0,0,0,0,0,0,0,0,1,2,3,5,7,9,11,13,14,13,11,9,7,5,3,2,1,0,0,0,0,0,0],
  csharp: [0,0,0,0,1,2,3,4,4,5,6,7,8,9,10,11,11,10,10,9,8,8,7,6,5,4,3,2,0,0,0,0],
  java: [0,0,0,0,0,0,1,2,3,3,3,4,6,8,10,10,11,11,11,11,10,10,9,8,7,6,5,4,0,0,0,0],
  normal: [0,0,0,0,0,0,0,0,3,5,7,9,10,11,12,12,12,12,12,12,12,12,11,10,9,7,5,3,0,0,0,0],
};
export const CREATURE_RAMPS: Readonly<Record<TypeId, readonly number[]>> = {
  python: [10,9,7], javascript: [21,23,22], typescript: [14,13,12], go: [21,20,18],
  swift: [15,16,17], shell: [21,20,22], dart: [14,31,30], csharp: [15,16,17],
  java: [29,27,3], normal: [24,25,26],
};
export function bodyMask(body: TypeId): string[] {
  return profiles[body].map((width, y) => Array.from({ length: 16 }, (_, x) => {
    if (width === 0 || x < 16 - width) {
      return ".";
    }
    if (y === 14 && x === 12) {
      return "E";
    }
    return x === 16 - width && y > 8 && y < 24 ? "?" : "#";
  }).join(""));
}
type Feature = "ears" | "horns" | "antennae" | "fins" | "tail" | "spikes" | "crest" | "hood";
const features: Record<TypeId, readonly Feature[]> = {
  python: ["hood", "horns", "crest", "tail"], javascript: ["horns", "spikes", "tail", "crest"],
  typescript: ["antennae", "horns", "ears", "spikes"], go: ["ears", "horns", "tail", "crest"],
  swift: ["crest", "fins", "tail", "horns"], shell: ["antennae", "spikes", "horns", "tail"],
  dart: ["fins", "tail", "crest", "horns"], csharp: ["spikes", "horns", "crest", "ears"],
  java: ["antennae", "ears", "crest", "tail"], normal: ["ears", "horns", "tail", "antennae"],
};
// Each ramp has three opaque colours. Transparency is the fourth sprite colour.
const hues: Record<TypeId, readonly (readonly number[])[]> = {
  python: [[10,9,7], [10,31,30], [10,8,7]],
  javascript: [[21,23,22], [24,23,26], [21,22,18]],
  typescript: [[14,13,12], [14,11,12], [29,13,11]],
  go: [[21,20,18], [21,19,18], [21,22,18]],
  swift: [[15,16,17], [15,17,26], [29,27,3]],
  shell: [[21,20,22], [21,23,18], [24,23,22]],
  dart: [[14,31,30], [10,31,12], [14,13,30]],
  csharp: [[15,16,17], [15,27,17], [15,17,26]],
  java: [[29,27,3], [29,28,27], [21,20,3]],
  normal: [[24,25,26], [15,16,17], [21,19,18]],
};
const cache = new Map<string, HTMLCanvasElement>();
export function drawCreature(seed: number, body: BodyPlan, type: TypeId,
  facing: "front" | "back"): HTMLCanvasElement {
  const key = `${seed}:${body.join("|")}:${type}:${facing}`;
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }
  const rng = mulberry32(seed);
  const variant = seed % 3;
  const height = [22, 15, 19][variant] + Math.floor(rng() * 6);
  const width = [0.65, 0.98, 0.78][variant] + rng() * 0.3;
  const headRatio = 0.75 + rng() * 0.65;
  const limb = 2 + Math.floor(rng() * 4);
  const feature = features[type][Math.floor(rng() * features[type].length)];
  const eye = Math.floor(rng() * 4);
  const mouth = Math.floor(rng() * 3);
  const marking = Math.floor(rng() * 4);
  const ramp = hues[type][Math.floor(rng() * hues[type].length)];
  const [dark, mid, light] = ramp;
  let cells = Array.from({ length: 32 }, () => Array<boolean>(32).fill(false));
  const top = 28 - height;
  const activeRows = body.map((row, index) => row.includes("#") ? index : -1).filter((row) => row >= 0);
  const first = activeRows[0];
  const last = activeRows.at(-1)!;
  for (let y = top; y < 28; y++) {
    const sourceY = first + Math.floor((y - top) * (last - first + 1) / height);
    const row = body[sourceY];
    const half = 16 - row.search(/[#?E]/);
    const head = y < top + height * 0.45 ? headRatio : 1;
    const radius = Math.min(13, Math.max(1, Math.round(half * width * head)));
    const lean = variant === 2 ? Math.round((y - top - height / 2) / 7) : 0;
    for (let x = 16 - radius + lean; x < 16 + radius + lean; x++) {
      cells[y][x] = true;
    }
  }
  const rect = (x: number, y: number, w: number, h: number) => {
    for (let dy = Math.max(0, y); dy < Math.min(32, y + h); dy++) {
      for (let dx = Math.max(0, x); dx < Math.min(32, x + w); dx++) {
        cells[dy][dx] = true;
      }
    }
  };
  const pair = (x: number, y: number, w: number, h: number) => {
    rect(x, y, w, h);
    rect(32 - x - w, y, w, h);
  };
  const faceY = top + Math.round(height * (type === "python" ? 0.24 : type === "typescript" ? 0.2 : 0.38));
  // Upright, broad and leaning bodies have different shoulders and extremities.
  if (type === "python") {
    pair(6 + variant, 24 - variant, 6, 4);
  } else if (type === "swift" || type === "dart") {
    pair(2 + variant, faceY + 3, 6, variant === 1 ? 3 : 6);
  } else if (type === "shell") {
    pair(2, faceY + 2, 5 + variant, 5);
    pair(7, 25, 3, limb);
  } else {
    pair(8 + variant, 25, 4, limb);
    if (variant !== 2) {
      pair(4 + variant, faceY + 5, 4, limb + 1);
    }
  }
  if (feature === "ears") {
    pair(7 + variant, Math.max(1, top - limb), 4, faceY - top + limb + 4);
  } else if (feature === "horns" || feature === "antennae") {
    pair(10 - variant, Math.max(1, top - limb), feature === "horns" ? 3 : 1, faceY - top + limb + 4);
    if (feature === "antennae") {
      pair(9 - variant, Math.max(1, top - limb), 3, 2);
    }
  } else if (feature === "crest") {
    rect(14 - variant, Math.max(1, top - limb), 3 + variant, faceY - top + limb + 2);
  } else if (feature === "fins" || feature === "hood") {
    pair(3 + variant, faceY - 1, 7, feature === "hood" ? 9 : 4 + limb);
  } else if (feature === "spikes") {
    for (let index = 0; index < 3; index++) {
      pair(3 + index * 2, faceY + index * 4, 5, 2);
    }
  } else {
    rect(23, 22 - variant * 2, 6, 3);
    rect(27, 19 - variant * 2, 2, 5);
  }
  if (type === "python") {
    // A second, asymmetric crest or curled tail distinguishes snakes within the same posture.
    const curl = (seed >>> 9) % 4;
    rect(21 + curl, 23 - curl, 3, 5);
    rect(23 + curl, 21 - curl, 3, 3);
    if ((seed >>> 12) % 2) {
      rect(12, Math.max(1, top - 2), 2, faceY - top + 3);
    }
    const crest = (seed >>> 16) % 4;
    if (crest === 1) {
      rect(14, Math.max(1, top - 4), 3, faceY - top + 5);
    } else if (crest === 2) {
      pair(10, Math.max(1, top - 4), 2, faceY - top + 5);
    } else if (crest === 3) {
      rect(25, 18, 3, 8);
      rect(27, 15, 2, 5);
    }
  }
  if (facing === "back") {
    // Enlarge around the spine and extend beyond the bottom crop, as a close rear view.
    const front = cells;
    cells = Array.from({ length: 32 }, (_, y) => Array.from({ length: 32 }, (_, x) =>
      front[Math.floor((y - 3) / 1.12)]?.[Math.round(16 + (x - 16) / 1.12)] ?? false));
  }
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d")!;
  const on = (x: number, y: number): boolean => cells[y]?.[x] ?? false;
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      if (!on(x, y)) {
        continue;
      }
      const border = !on(x - 1, y) || !on(x + 1, y) || !on(x, y - 1) || !on(x, y + 1);
      const highlight = !on(x - 2, y) || !on(x, y - 2);
      const shade = !on(x + 2, y) || !on(x, y + 2);
      const belowFace = y > faceY + 6;
      const accent = marking === 0 ? belowFace && (x + seed % 5) % 7 < 2 && y % 6 < 2
        : marking === 1 ? belowFace && (y + seed % 4) % 6 === 0
        : marking === 2 ? belowFace && Math.abs(x - 16) < 4 && y < 26
        : Math.abs(y - faceY - 1) < 2 && Math.abs(x - 16) < 9;
      const backMark = facing === "back" && Math.abs(x - 16) <= 1 + variant
        && y > top + 7 && y < 29 && y % 5 !== 0;
      ctx.fillStyle = PALETTE[border || shade ? dark : accent || backMark || highlight ? light : mid];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  const pixelRect = (x: number, y: number, w: number, h: number, colour: number) => {
    ctx.fillStyle = PALETTE[colour];
    ctx.fillRect(x, y, w, h);
  };
  if (facing === "front") {
    const face = cells[faceY];
    const left = face.indexOf(true);
    const right = face.lastIndexOf(true);
    const spread = Math.max(2, Math.min(5, Math.floor((right - left) / 4)));
    for (const x of [15 - spread, 15 + spread]) {
      if (eye === 0) {
        pixelRect(x, faceY, 4, 4, light);
        pixelRect(x + 1, faceY + 1, 2, 3, dark);
        pixelRect(x, faceY, 1, 1, light);
      } else if (eye === 1) {
        pixelRect(x, faceY, 4, 3, light);
        pixelRect(x, faceY + 1, 4, 1, dark);
        pixelRect(x + 1, faceY + 2, 2, 1, dark);
      } else if (eye === 2) {
        pixelRect(x, faceY, 4, 3, light);
        pixelRect(x + (x < 16 ? 0 : 2), faceY, 2, 1, dark);
        pixelRect(x + (x < 16 ? 2 : 0), faceY + 1, 2, 2, dark);
      } else {
        pixelRect(x, faceY, 4, 4, dark);
        pixelRect(x, faceY, 2, 2, light);
        pixelRect(x + 3, faceY + 3, 1, 1, light);
      }
    }
    const y = faceY + 5;
    if (mouth === 0) {
      pixelRect(14, y + 1, 4, 1, dark);
      pixelRect(13, y, 1, 1, dark);
      pixelRect(18, y, 1, 1, dark);
    } else if (mouth === 1) {
      pixelRect(14, y, 4, 2, dark);
      pixelRect(15, y, 1, 2, light);
    } else {
      pixelRect(14, y, 4, 3, dark);
      pixelRect(15, y + 2, 2, 1, light);
    }
  } else {
    pixelRect(12 + variant, 24, 7 - variant, 2, light);
    pixelRect(14 + variant, 26, 5, 6, dark);
    pixelRect(15 + variant, 27, 2, 5, mid);
  }
  ctx.restore();
  cache.set(key, canvas);
  return canvas;
}
export function creatureIcon(species: Species): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(drawCreature(species.sprite.seed, species.sprite.body, species.type, "front"), 0, 0, 16, 16);
  return canvas;
}
