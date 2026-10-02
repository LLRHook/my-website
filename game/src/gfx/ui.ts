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
