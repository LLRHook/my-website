import { PALETTE } from "./palette.js";

export function pixels(rows: readonly string[], colours: Readonly<Record<string, number>>): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = rows[0]?.length ?? 0;
  canvas.height = rows.length;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D is unavailable");
  }
  rows.forEach((row, y) => [...row].forEach((pixel, x) => {
    const index = colours[pixel];
    if (index !== undefined) {
      context.fillStyle = PALETTE[index];
      context.fillRect(x, y, 1, 1);
    }
  }));
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
