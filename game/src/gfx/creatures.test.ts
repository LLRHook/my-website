import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bodyMask, drawCreature } from "./creatures.js";
import { buildSpecies, FALLBACK_REPOS, originSpecies } from "../data/species.js";
import { mulberry32 } from "../engine/rng.js";
import { TYPES, type TypeId } from "../battle/types.js";

// Integer pixel rectangles are the sprite renderer's only drawing primitive.
// This test raster implements their exact opaque/source-atop semantics without a native canvas dependency.
class PixelCanvas {
  width = 32;
  height = 32;
  private readonly pixels = new Uint8ClampedArray(32 * 32 * 4);
  private readonly saved: { fillStyle: string; globalCompositeOperation: string }[] = [];
  private readonly context = {
    fillStyle: "#000000",
    globalCompositeOperation: "source-over",
    save: () => {
      this.saved.push({ fillStyle: this.context.fillStyle,
        globalCompositeOperation: this.context.globalCompositeOperation });
    },
    restore: () => Object.assign(this.context, this.saved.pop()),
    getImageData: () => ({ data: this.pixels }),
    fillRect: (x: number, y: number, width: number, height: number) => {
      const rgb = [1, 3, 5].map((offset) => parseInt(this.context.fillStyle.slice(offset, offset + 2), 16));
      for (let row = Math.max(0, y); row < Math.min(this.height, y + height); row++) {
        for (let column = Math.max(0, x); column < Math.min(this.width, x + width); column++) {
          const offset = (row * this.width + column) * 4;
          if (this.context.globalCompositeOperation === "source-atop" && !this.pixels[offset + 3]) {
            continue;
          }
          this.pixels.set([...rgb, 255], offset);
        }
      }
    },
  };
  getContext() {
    return this.context;
  }
}

// SHA-256 of raw Chromium RGBA pixels from git HEAD:game/src/gfx/creatures.ts,
// captured with the throwaway shots7/baseline.cjs before the revised sprite implementation.
const baseline: readonly [number, TypeId, string, string][] = [
  [0, "python", "ec1c5bdc89c77856d7845ab1fbc2519787b717cd9712dcb4f36ddb0305cabf0f",
    "163b3f7032db6d3c9f75b4761975a5dc607526a987577519db2cdc6b43692330"],
  [1, "normal", "eeb6a2212664f45a53d1e1ec20221c94d4f5236086d11b5ccdc0561f544d5037",
    "b75bb68e0be07714ec831b205c2d6b9d0a88d70cee7360f6f4999ed05b7f002e"],
  [42, "go", "114c64e9fd1179144e598c0847ba019bcde199670ddb36f201c4d74f4e1cd3d1",
    "349d9c6de367da91f842396fd47a0bcd6cb3a1af2c2912ce54d011aa3aa77a25"],
  [123456789, "typescript", "70cf3c7639178bb8a1f7a429e94891d2e95ce5615303d260dbd8322cfea95e2c",
    "c1d3c42a2682ce3e6814a07379c1d25d86afa1c19538735131fe95d666ecfeef"],
  [987654321, "swift", "3eb1ceec8a21d5ef0b39dd12874ada7d52025609d69d84a5dedc7097baef056c",
    "db26aaba6bdabb2d5f7be08f31bd4a1299ec0c6e84a7e49db2e49c6b4c62e653"],
];
const pixelsOf = (canvas: HTMLCanvasElement) => canvas.getContext("2d")!.getImageData(0, 0, 32, 32).data;
const fixture = buildSpecies(Array.from({ length: 31 }, (_, index) => ({ ...FALLBACK_REPOS[index % 3],
  id: index + 100, name: `companion-${index}`, stars: index % 5,
  pushedAt: `2026-09-${String(index + 1).padStart(2, "0")}` })));
beforeEach(() => vi.stubGlobal("document", { createElement: () => new PixelCanvas() }));
afterEach(() => vi.unstubAllGlobals());

describe("evolution sprites", () => {
  it.each(baseline)("keeps seed %i %s front and back identical to pre-evolution pixels", (seed, type, front, back) => {
    for (const [facing, expected] of [["front", front], ["back", back]] as const) {
      const sprite = drawCreature(seed, bodyMask(type), type, facing, 1);
      expect(createHash("sha256").update(pixelsOf(sprite)).digest("hex")).toBe(expected);
      expect(drawCreature(seed, bodyMask(type), type, facing)).toBe(sprite);
    }
  });
  it("keeps each species ramp within four colours at every stage", () => {
    for (const type of TYPES) {
      for (const seed of [1, 42, 2026, 123456789, 987654321]) {
        let palette: Set<string> | undefined;
        for (const stage of [1, 2, 3] as const) {
          const pixels = pixelsOf(drawCreature(seed, bodyMask(type), type, "front", stage));
          const colours = new Set<string>();
          for (let offset = 0; offset < pixels.length; offset += 4) {
            colours.add(Array.from(pixels.slice(offset, offset + 4)).join(","));
          }
          expect(colours.size).toBeLessThanOrEqual(4);
          if (palette) {
            expect(colours).toEqual(palette);
          }
          palette = colours;
        }
      }
    }
  });
  it("carries the same eye and mouth pixel patterns into each new posture", () => {
    for (const species of fixture) {
      const seed = species.sprite.seed;
      const rng = mulberry32(seed);
      const height = Math.min(27, [22, 15, 19][seed % 3] + Math.floor(rng() * 6));
      for (let index = 0; index < 4; index++) {
        rng();
      }
      const eye = Math.floor(rng() * 4);
      const mouth = Math.floor(rng() * 3);
      const faceY = 28 - height
        + Math.round(height * (species.type === "python" ? 0.24 : species.type === "typescript" ? 0.2 : 0.38));
      const base = pixelsOf(drawCreature(seed, species.sprite.body, species.type, "front"));
      const row = Array.from({ length: 32 }, (_, x) => base[(faceY * 32 + x) * 4 + 3] > 0);
      const spread = Math.max(2, Math.min(5, Math.floor((row.lastIndexOf(true) - row.indexOf(true)) / 4)));
      const eyeSamples = Array.from({ length: eye === 0 || eye === 3 ? 16 : 12 }, (_, index) =>
        [index % 4, Math.floor(index / 4)] as const);
      const mouthSamples = mouth === 0 ? [[0, 0], [5, 0], [1, 1], [2, 1], [3, 1], [4, 1]]
        : Array.from({ length: mouth === 1 ? 8 : 12 }, (_, index) => [index % 4 + 1, Math.floor(index / 4)]);
      for (const form of species.forms.slice(1)) {
        const pixels = pixelsOf(drawCreature(seed, species.sprite.body, species.type, "front", form.stage));
        expect(hasPattern(pixels, base, 15 - spread, faceY, eyeSamples), `${form.name} eyes`).toBe(true);
        expect(hasPattern(pixels, base, 13, faceY + 5, mouthSamples), `${form.name} mouth`).toBe(true);
      }
    }
  });
  it("retains visible landmarks for every inherited feature in the live-like fixture", () => {
    // Original stage-1 traits, including the Python curl and secondary head features.
    const inherited = [
      ["tail", "crest"], ["crest"], ["ears"], ["horns", "tail"], ["horns"], ["spikes"],
      ["tail"], ["crest"], ["ears"], ["horns", "tail", "crest"], ["tail"], ["antennae"],
      ["tail", "crest", "horns"], ["tail"], ["ears"], ["horns", "tail"], ["horns"], ["spikes"],
      ["tail", "crest", "horns"], ["crest"], ["antennae"], ["hood", "tail"], ["horns"], ["spikes"],
      ["hood", "tail"], ["tail"], ["horns"], ["crest", "tail"], ["tail"], ["spikes"], ["crest", "tail"],
    ] as const;
    // Seed 0 Swift supplies the fin kind absent from this fixture.
    for (const stage of [2, 3] as const) {
      expect(hasFeature(pixelsOf(drawCreature(0, bodyMask("swift"), "swift", "front", stage)),
        "fins", stage)).toBe(true);
    }
    fixture.forEach((species, index) => {
      for (const form of species.forms.slice(1)) {
        const pixels = pixelsOf(drawCreature(species.sprite.seed, species.sprite.body, species.type,
          "front", form.stage));
        for (const trait of inherited[index]) {
          expect(hasFeature(pixels, trait, form.stage), `${form.name} inherited ${trait}`).toBe(true);
        }
      }
    });
  });
  it("grows opaque area by at least ten percent at every evolution", () => {
    for (const species of fixture) {
      let previous = areaOf(pixelsOf(drawCreature(species.sprite.seed, species.sprite.body, species.type, "front")));
      for (const form of species.forms.slice(1)) {
        const area = areaOf(pixelsOf(drawCreature(species.sprite.seed, species.sprite.body, species.type,
          "front", form.stage)));
        expect(area, form.name).toBeGreaterThanOrEqual(Math.ceil(previous * 1.1));
        previous = area;
      }
    }
  });
  it("changes at least a quarter of consecutive portraits over the live-like fixture", () => {
    for (const species of fixture) {
      let previous = pixelsOf(drawCreature(species.sprite.seed, species.sprite.body, species.type, "front"));
      for (const form of species.forms.slice(1)) {
        const pixels = pixelsOf(drawCreature(species.sprite.seed, species.sprite.body, species.type,
          "front", form.stage));
        let union = 0;
        let changed = 0;
        for (let offset = 0; offset < pixels.length; offset += 4) {
          if (pixels[offset + 3] || previous[offset + 3]) {
            union++;
            if (pixels.slice(offset, offset + 4).some((value, channel) => value !== previous[offset + channel])) {
              changed++;
            }
          }
        }
        expect(changed / union, form.name).toBeGreaterThanOrEqual(0.25);
        previous = pixels;
      }
    }
  });
  it("preserves curved outer profiles and transparent margins over the live-like fixture", () => {
    for (const species of fixture) {
      const base = pixelsOf(drawCreature(species.sprite.seed, species.sprite.body, species.type, "front"));
      for (const form of species.forms.slice(1)) {
        const pixels = pixelsOf(drawCreature(species.sprite.seed, species.sprite.body, species.type,
          "front", form.stage));
        expect(longestOuterRun(pixels), form.name).toBeLessThanOrEqual(longestOuterRun(base) + 2);
        for (let index = 0; index < 32; index++) {
          expect(pixels[index * 128 + 3], `${form.name} left`).toBe(0);
          expect(pixels[index * 128 + 127], `${form.name} right`).toBe(0);
          expect(pixels[index * 4 + 3], `${form.name} top`).toBe(0);
          if (!Array.from({ length: 32 }, (_, x) => base[31 * 128 + x * 4 + 3]).some(Boolean)) {
            expect(pixels[31 * 128 + index * 4 + 3], `${form.name} bottom`).toBe(0);
          }
        }
      }
    }
  });
});

function longestOuterRun(pixels: Uint8ClampedArray): number {
  let longest = 0;
  for (const vertical of [false, true]) {
    for (const reverse of [false, true]) {
      let previous = -1;
      let run = 0;
      for (let row = 0; row < 32; row++) {
        let edge = -1;
        for (let offset = 0; offset < 32; offset++) {
          const column = reverse ? 31 - offset : offset;
          const x = vertical ? row : column;
          const y = vertical ? column : row;
          if (pixels[(y * 32 + x) * 4 + 3]) {
            edge = column;
            break;
          }
        }
        run = edge >= 0 ? edge === previous ? run + 1 : 1 : 0;
        longest = Math.max(longest, run);
        previous = edge;
      }
    }
  }
  return longest;
}

function hasPattern(pixels: Uint8ClampedArray, base: Uint8ClampedArray, bx: number, by: number,
  samples: readonly (readonly number[])[]): boolean {
  for (let y = 0; y < 28; y++) {
    for (let x = 5; x < 25; x++) {
      if (samples.every(([dx, dy]) => {
        const source = ((by + dy) * 32 + bx + dx) * 4;
        const target = ((y + dy) * 32 + x + dx) * 4;
        return !base[source + 3] || base.slice(source, source + 4)
          .every((value, channel) => value === pixels[target + channel]);
      })) {
        return true;
      }
    }
  }
  return false;
}

function areaOf(pixels: Uint8ClampedArray): number {
  return Array.from({ length: 1024 }, (_, index) => pixels[index * 4 + 3]).filter(Boolean).length;
}

function hasFeature(pixels: Uint8ClampedArray, trait: string, stage: 1 | 2 | 3): boolean {
  const colours = new Map<string, number[]>();
  for (let offset = 0; offset < pixels.length; offset += 4) {
    if (pixels[offset + 3]) {
      const rgb = Array.from(pixels.slice(offset, offset + 3));
      colours.set(rgb.join(","), rgb);
    }
  }
  const ramp = Array.from(colours.values()).sort((a, b) =>
    a.reduce((sum, value) => sum + value, 0) - b.reduce((sum, value) => sum + value, 0));
  const matches = (x: number, y: number, light = false) => {
    const rgb = light ? ramp.at(-1)! : ramp[0];
    return pixels[(y * 32 + x) * 4 + 3] > 0
      && rgb.every((value, channel) => value === pixels[(y * 32 + x) * 4 + channel]);
  };
  const pair = (x: number, y: number, light = false) => matches(x, y, light) && matches(31 - x, y, light);
  if (trait === "tail") {
    return matches(29, 21) && matches(29, 22) && matches(28, 23);
  }
  for (let y = 1; y < 22; y++) {
    if (trait === "ears") {
      const width = stage === 3 ? 6 : 3;
      if ([0, 1].every((dy) => pair(4, y + dy) && (stage === 3 || pair(4 + width - 1, y + dy))
        && Array.from({ length: stage === 3 ? 3 : width - 2 }, (_, dx) => pair(5 + dx, y + dy, true)).every(Boolean))) {
        return true;
      }
    } else if (trait === "horns" || trait === "antennae") {
      const x = trait === "horns" ? 8 : 10;
      if (pair(9, y) && [2, 3, 4, 5].every((dy) => pair(x, y + dy))) {
        return true;
      }
    } else if (trait === "crest") {
      if (pair(15, y) && pair(15, y + 3, true) && pair(13, y + 4)) {
        return true;
      }
    } else if (trait === "hood" || trait === "fins") {
      if (pair(1, y) && pair(2, y, true) && pair(2, y - 1) && pair(2, y + 1)) {
        return true;
      }
    } else if (trait === "spikes" && [0, 4, 8].every((dy) => pair(1, y + dy))) {
      return true;
    }
  }
  return false;
}

it("renders ORIGIN's distinct gold front and back with three opaque colours", () => {
  const origin = originSpecies();
  const images = ["front", "back"].map((facing) => pixelsOf(drawCreature(origin.sprite.seed,
    origin.sprite.body, origin.type, facing as "front" | "back")));
  for (const pixels of images) {
    const colours = new Set<string>();
    let opaque = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3]) {
        colours.add(Array.from(pixels.slice(index, index + 3)).join(","));
        opaque++;
      }
    }
    expect(colours).toEqual(new Set(["96,72,48", "248,184,72", "240,208,160"]));
    const largest = Math.max(...fixture.filter((entry) => entry.stages === 3).flatMap((entry) =>
      (["front", "back"] as const).map((facing) => areaOf(pixelsOf(drawCreature(
        entry.sprite.seed, entry.sprite.body, entry.type, facing, 3))))));
    expect(opaque).toBeGreaterThanOrEqual(largest);
  }
  expect(images[0]).not.toEqual(images[1]);
});
