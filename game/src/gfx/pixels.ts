import { PALETTE } from "./palette.js";

const RGB = PALETTE.map((hex) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16)));

// One putImageData per sprite: painting each pixel with its own fillRect cost
// ~700 ms of boot on a throttled phone. Palette colours are opaque, so the
// result is pixel-identical to filling 1x1 rectangles on a blank canvas.
export function pixels(rows: readonly string[], colours: Readonly<Record<string, number>>): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const width = rows[0]?.length ?? 0;
  canvas.width = width;
  canvas.height = rows.length;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D is unavailable");
  }
  if (!width || !rows.length) {
    return canvas;
  }
  const image = context.createImageData(width, rows.length);
  rows.forEach((row, y) => {
    let x = 0;
    for (const pixel of row) {
      const index = colours[pixel];
      if (index !== undefined && x < width) {
        image.data.set(RGB[index], (y * width + x) * 4);
        image.data[(y * width + x) * 4 + 3] = 255;
      }
      x++;
    }
  });
  context.putImageData(image, 0, 0);
  return canvas;
}

export function mirror(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D is unavailable");
  }
  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(source, 0, 0);
  return canvas;
}
