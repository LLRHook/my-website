import { expect, it } from "vitest";
import { MAPS } from "./maps/index.js";
import { createNpcs, trainerSees, wander } from "./npc.js";

it("trainers see along their facing direction, within range, with clear terrain", () => {
  const npc = MAPS.route1.npcs[0];
  expect(trainerSees(MAPS.route1, npc, 9, 30)).toBe(true);
  expect(trainerSees(MAPS.route1, npc, 9, 29)).toBe(false);
  expect(trainerSees(MAPS.route1, npc, 12, 30)).toBe(false);
  expect(trainerSees(MAPS.route1, npc, 5, 30)).toBe(false);
  expect(trainerSees(MAPS.route1, npc, 9, 30, [{ x: 8, y: 30 }])).toBe(false);
  expect(trainerSees(MAPS.route1, { ...npc, x: 17, y: 30 }, 20, 30)).toBe(false);
});
it("wander stays within two tiles of home and respects occupants", () => {
  const npc = createNpcs(MAPS.sterling)[0];
  for (let step = 0; step < 8; step++) {
    wander(npc, MAPS.sterling, "right", []);
  }
  expect(npc.x).toBe(npc.homeX + 2);
  wander(npc, MAPS.sterling, "down", [{ x: npc.x, y: npc.y + 1 }]);
  expect(npc.y).toBe(npc.homeY);
});
