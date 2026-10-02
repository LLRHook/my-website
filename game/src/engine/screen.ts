import { PALETTE } from "../gfx/palette.js";

export class Screen {
  readonly canvas = document.createElement("canvas");
  readonly context: CanvasRenderingContext2D;
  readonly reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  private readonly visible: CanvasRenderingContext2D;
  private shade = 0;
  private flash = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas.width = 160;
    this.canvas.height = 144;
    const context = this.canvas.getContext("2d");
    const visible = canvas.getContext("2d");
    if (!context || !visible) {
      throw new Error("Canvas 2D is unavailable");
    }
    this.context = context;
    this.visible = visible;
    context.imageSmoothingEnabled = false;
    visible.imageSmoothingEnabled = false;
  }

  fill(colour: number, x = 0, y = 0, width = 160, height = 144): void {
    this.context.fillStyle = PALETTE[colour];
    this.context.fillRect(x, y, width, height);
  }

  blit(atlas: HTMLCanvasElement, sx: number, sy: number, width: number, height: number, dx: number,
    dy: number, flip = false): void {
    const context = this.context;
    context.save();
    context.translate(Math.round(dx) + (flip ? width : 0), Math.round(dy));
    if (flip) {
      context.scale(-1, 1);
    }
    context.drawImage(atlas, sx, sy, width, height, 0, 0, width, height);
    context.restore();
  }

  fadeToBlack(progress: number): void {
    this.shade = Math.max(0, Math.min(1, progress));
  }

  fadeFromBlack(progress: number): void {
    this.fadeToBlack(1 - progress);
  }

  whiteFlash(progress: number): void {
    this.flash = this.reducedMotion ? 0 : Math.max(0, Math.min(1, progress));
  }

  present(): void {
    this.visible.drawImage(this.canvas, 0, 0);
    for (const [opacity, colour] of [[this.shade, "#000"], [this.flash, "#fff"]] as const) {
      if (opacity) {
        this.visible.globalAlpha = opacity;
        this.visible.fillStyle = colour;
        this.visible.fillRect(0, 0, 160, 144);
      }
    }
    this.visible.globalAlpha = 1;
  }
}
