import { SCENE, type Point } from "./room-scene";

export type RouletteColor = "red" | "black" | "green";

// Single-zero wheel order. One source drives the drawing, result and landing.
export const ROULETTE_POCKETS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
].map((number, index) => ({
  number,
  color: (number === 0 ? "green" : index % 2 ? "red" : "black") as RouletteColor,
}));

export const SPIN_MS = 4200;

export function ringPoint(angle: number, scale: number): Point {
  const { center, u, v } = SCENE.roulette;
  return [
    center[0] + scale * (u[0] * Math.cos(angle) + v[0] * Math.sin(angle)),
    center[1] + scale * (u[1] * Math.cos(angle) + v[1] * Math.sin(angle)),
  ];
}

export function pocketAngle(index: number, rotor: number): number {
  return SCENE.roulette.pocketZero + index * SCENE.roulette.pocketStep + rotor;
}

export function frameIndex(rotor: number): number {
  const { frameStep, frames } = SCENE.roulette;
  return ((Math.round(rotor / frameStep) % frames) + frames) % frames;
}

export function spinPlan(index: number): { rotorEnd: number; ballTurns: number } {
  return {
    rotorEnd: Math.sign(SCENE.roulette.frameStep) * (3 * 2 * Math.PI + (index * 0.37 % 1) * 2 * Math.PI),
    ballTurns: 6,
  };
}

export function spinState(
  plan: { rotorEnd: number; ballTurns: number },
  index: number,
  t: number,
): { rotor: number; angle: number; scale: number } {
  const LAND = 0.72;
  const rotor = plan.rotorEnd * (1 - (1 - t) ** 3);
  const { trackScale, frameStep } = SCENE.roulette;
  if (t < LAND) {
    const B = -Math.sign(frameStep) * plan.ballTurns * 2 * Math.PI;
    const A = pocketAngle(index, plan.rotorEnd * (1 - (1 - LAND) ** 3)) - B;
    return { rotor, angle: A + B * (1 - (1 - t / LAND) ** 2), scale: trackScale };
  }
  const progress = Math.min((t - LAND) / 0.1, 1);
  return {
    rotor,
    angle: pocketAngle(index, rotor),
    scale: trackScale + (1 - trackScale) * (1 - (1 - progress) ** 2),
  };
}

// Reject the incomplete final bucket before modulo, so every pocket has exactly
// the same number of uint32 outcomes. Do not fall back to Math.random.
export function drawPocketIndex() {
  const values = new Uint32Array(1);
  const limit = Math.floor(0x1_0000_0000 / ROULETTE_POCKETS.length) * ROULETTE_POCKETS.length;
  do { crypto.getRandomValues(values); } while (values[0] >= limit);
  return values[0] % ROULETTE_POCKETS.length;
}
