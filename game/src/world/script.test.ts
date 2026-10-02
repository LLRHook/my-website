import { expect, it, vi } from "vitest";
import { DEFAULT_OPTIONS } from "../engine/storage.js";
import { MAPS } from "./maps/index.js";
import { newGame } from "./overworld.js";
import { runScript, type ScriptHost } from "./script.js";

function host(): ScriptHost {
  return {
    state: newGame("DEV", { ...DEFAULT_OPTIONS }), mon: "SPROUT",
    say: vi.fn(async () => {}), ask: vi.fn(async () => true), give: vi.fn(), heal: vi.fn(async () => {}),
    move: vi.fn(async () => {}), face: vi.fn(), battle: vi.fn(async () => {}), starter: vi.fn(async () => {}),
    open: vi.fn(), mart: vi.fn(async () => {}), pc: vi.fn(async () => {}), music: vi.fn(), wait: vi.fn(async () => {}),
  };
}
it("say interpolates only PLAYER and MON; ask, flag, if, give and heal execute in order", async () => {
  const h = host();
  await runScript([
    { say: "Hi {PLAYER}, meet {MON}." },
    { ask: "Ready?", yes: [{ flag: "ready", set: true }], no: [{ say: "Later" }] },
    { if: "ready", then: [{ give: "forkBall", qty: 5 }, { heal: true }], else: [{ say: "Missing" }] },
    { give: "forkBall", qty: 2 }, { flag: "ready", set: false },
  ], h);
  expect(h.say).toHaveBeenCalledExactlyOnceWith("Hi DEV, meet SPROUT.");
  expect(h.state.flags).toEqual([]);
  expect(h.state.bag.forkBall).toBe(7);
  expect(h.heal).toHaveBeenCalledOnce();
  expect(h.give).toHaveBeenCalledTimes(2);
});
it("no branches and conditional else are honored", async () => {
  const h = host();
  h.ask = vi.fn(async () => false);
  await runScript([{ ask: "Ready?", yes: [], no: [{ say: "Later" }] },
    { if: "absent", then: [], else: [{ say: "Missing" }] }], h);
  expect(h.say).toHaveBeenNthCalledWith(1, "Later");
  expect(h.say).toHaveBeenNthCalledWith(2, "Missing");
});
it("movement, facing, battle, starter, screens, music and waits dispatch to their hooks", async () => {
  const h = host();
  await runScript([{ move: "prof", path: ["down"] }, { face: "left" }, { battle: "rhea" },
    { starter: true }, { mart: true }, { pc: true }, { music: "lab" }, { wait: 0.5 }], h);
  expect(h.move).toHaveBeenCalledWith("prof", ["down"]);
  expect(h.face).toHaveBeenCalledWith("left");
  expect(h.battle).toHaveBeenCalledWith("rhea");
  expect(h.starter).toHaveBeenCalledOnce();
  expect(h.mart).toHaveBeenCalledOnce();
  expect(h.pc).toHaveBeenCalledOnce();
  expect(h.music).toHaveBeenCalledWith("lab");
  expect(h.wait).toHaveBeenCalledWith(0.5);
});
it("external pages open only after affirmative consent", async () => {
  const h = host();
  h.ask = vi.fn(async () => false);
  await runScript([{ open: "https://example.org" }], h);
  expect(h.open).not.toHaveBeenCalled();
  h.ask = vi.fn(async () => true);
  await runScript([{ open: "https://example.org" }], h);
  expect(h.open).toHaveBeenCalledWith("https://example.org");
});

it("the authored lab script grants the Codex, unlocks the north exit, and gives Fork Balls once", async () => {
  const h = host();
  h.starter = vi.fn(async () => {
    h.state.flags.push("hasCodex", "hasStarter");
    h.state.bag.forkBall = 5;
  });
  const script = MAPS.lab.npcs.find((npc) => npc.id === "prof")!.script;
  await runScript(script, h);
  expect(h.state.flags).toEqual(["hasCodex", "hasStarter"]);
  expect(h.state.bag.forkBall).toBe(5);
  expect(h.starter).toHaveBeenCalledOnce();
  await runScript(script, h);
  expect(h.state.bag.forkBall).toBe(5);
  expect(h.starter).toHaveBeenCalledOnce();
});
