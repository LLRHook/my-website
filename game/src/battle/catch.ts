import type { Status } from "../data/ids.js";
export function catchValue(maxHp: number, hp: number, rate: number, ball = 1, status: Status | null = null): number {
  return ((3 * maxHp - 2 * hp) * rate * ball * (status === "frozen" ? 2 : status ? 1.5 : 1)) / (3 * maxHp);
}
export function catchShakes(a: number, rng: () => number): number {
  if (a >= 255) {
    return 4;
  }
  const b = 1048560 / Math.sqrt(Math.sqrt(16711680 / Math.max(1, a)));
  let shakes = 0;
  while (shakes < 4 && rng() * 65536 < b) {
    shakes++;
  }
  return shakes;
}
export function runOdds(speed: number, foeSpeed: number, attempts: number): number {
  return Math.min(1, (Math.floor(speed * 128 / Math.max(1, foeSpeed)) + 30 * attempts) / 256);
}
