import type { Screen } from "../engine/screen.js";

export function windowFrame(screen: Screen, x: number, y: number, width: number, height: number): void {
  screen.fill(0, x, y, width, height);
  screen.fill(5, x + 1, y + 1, width - 2, height - 2);
  screen.fill(1, x + 2, y + 2, width - 4, height - 4);
  screen.fill(6, x + 3, y + 3, width - 6, height - 6);
  for (const [cx, cy] of [[x, y], [x + width - 2, y], [x, y + height - 2], [x + width - 2, y + height - 2]]) {
    screen.fill(6, cx, cy, 2, 2);
  }
}

export function forkBall(screen: Screen, x: number, y: number): void {
  const rows = ["..dddd..", ".dttttd.", "dttttttd", "dtftfttd", "dddddddd", "dbbddbbd", ".dbbbbd.", "..dddd.."];
  const colours: Readonly<Record<string, number>> = { d: 1, t: 22, b: 5, f: 4 };
  rows.forEach((row, dy) => [...row].forEach((pixel, dx) => {
    if (pixel !== ".") {
      screen.fill(colours[pixel], x + dx, y + dy, 1, 1);
    }
  }));
  screen.fill(1, x + 3, y + 2, 1, 2);
  screen.fill(1, x + 2, y + 1, 1, 2);
  screen.fill(1, x + 4, y + 1, 1, 2);
  screen.fill(1, x + 2, y + 2, 3, 1);
  screen.fill(5, x + 3, y + 4, 2, 2);
}

export function groundPlatform(screen: Screen, x: number, y: number, width: number, cave: boolean): void {
  const height = 10;
  for (let row = 0; row < height; row++) {
    const half = Math.round(width / 2 * Math.sqrt(1 - ((row - 4.5) / 5) ** 2));
    screen.fill(cave ? row < 5 ? 27 : 28 : row < 5 ? 7 : 8, x - half, y + row, half * 2, 1);
  }
  for (const offset of [-18, -5, 12, 23]) {
    screen.fill(cave ? 3 : 9, x + offset, y + 3 + Math.abs(offset) % 3, cave ? 3 : 2, 1);
  }
}
