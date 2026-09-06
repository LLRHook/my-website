export type RouletteColor = "red" | "black" | "green";

// Single-zero wheel order. One source drives the drawing, result and landing.
export const ROULETTE_POCKETS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
].map((number, index) => ({
  number,
  color: (number === 0 ? "green" : index % 2 ? "red" : "black") as RouletteColor,
}));

export const POCKET_ANGLE = 360 / ROULETTE_POCKETS.length;
export const SPIN_DURATION_MS = 2600;

export function landingRotation(previous: number, pocketIndex: number) {
  const target = (360 - pocketIndex * POCKET_ANGLE) % 360;
  const remaining = (target - (previous % 360) + 360) % 360;
  return previous + 1080 + remaining;
}

// Reject the incomplete final bucket before modulo, so every pocket has exactly
// the same number of uint32 outcomes. Do not fall back to Math.random.
export function drawPocketIndex() {
  const values = new Uint32Array(1);
  const limit = Math.floor(0x1_0000_0000 / ROULETTE_POCKETS.length) * ROULETTE_POCKETS.length;
  do { crypto.getRandomValues(values); } while (values[0] >= limit);
  return values[0] % ROULETTE_POCKETS.length;
}
