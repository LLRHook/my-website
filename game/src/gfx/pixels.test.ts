import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PALETTE } from "./palette.js";
import { pixels } from "./pixels.js";

// Minimal raster supporting both the old per-pixel fillRect path (the reference)
// and the ImageData path, so the two can be compared without a native canvas.
class RasterCanvas {
  width = 0;
  height = 0;
  data = new Uint8ClampedArray(0);
  private readonly context = {
    fillStyle: "#000000",
    fillRect: (x: number, y: number) => {
      if (x < this.width && y < this.height) {
        const rgb = [1, 3, 5].map((offset) => parseInt(this.context.fillStyle.slice(offset, offset + 2), 16));
        this.data.set([...rgb, 255], (y * this.width + x) * 4);
      }
    },
    createImageData: (width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) }),
    putImageData: (image: { data: Uint8ClampedArray }) => this.data.set(image.data),
  };

  getContext() {
    if (this.data.length !== this.width * this.height * 4) {
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
    }
    return this.context;
  }
}

function reference(rows: readonly string[], colours: Readonly<Record<string, number>>): Uint8ClampedArray {
  const canvas = new RasterCanvas();
  canvas.width = rows[0]?.length ?? 0;
  canvas.height = rows.length;
  const context = canvas.getContext();
  rows.forEach((row, y) => [...row].forEach((pixel, x) => {
    const index = colours[pixel];
    if (index !== undefined) {
      context.fillStyle = PALETTE[index];
      context.fillRect(x, y);
    }
  }));
  return canvas.data;
}

describe("pixels", () => {
  beforeEach(() => vi.stubGlobal("document", { createElement: () => new RasterCanvas() }));
  afterEach(() => vi.unstubAllGlobals());

  it("matches per-pixel rendering, including transparent and overlong rows", () => {
    const rows = ["0123.", "4.5..", "..67.", "01234567"];
    const colours = { 0: 0, 1: 5, 2: 13, 3: 31, 4: 22, 5: 9, 6: 17, 7: 3 };
    const canvas = pixels(rows, colours) as unknown as RasterCanvas;
    expect(canvas.width).toBe(5);
    expect(canvas.height).toBe(4);
    expect(canvas.data).toEqual(reference(rows, colours));
  });

  it("returns an empty canvas for empty art", () => {
    const canvas = pixels([], {}) as unknown as RasterCanvas;
    expect([canvas.width, canvas.height]).toEqual([0, 0]);
  });
});
