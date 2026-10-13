import { test, expect, type Page } from "@playwright/test";
import { loadGameModules } from "./support/load-game-modules";
import type { Dir, MapId } from "../game/src/data/ids";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

test.beforeEach(async ({}, info) => {
  test.skip(info.project.name !== "chromium", "Visual QA is Chromium only");
});

async function press(page: Page, key: string, options?: { delay?: number }): Promise<void> {
  await page.keyboard.press(key, options);
  // Let the simulation consume the edge and observe keyup before another press or state read.
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

const REGION_BADGES = ["badge:merge", "badge:pipeline", "badge:release"];

async function regionWalk(page: Page, key: string, count: number): Promise<void> {
  const game = page.locator("#game");
  for (let index = 0; index < count; index++) {
    const before = (await game.getAttribute("data-pos"))!.split(",").slice(0, 2).join(",");
    await page.keyboard.down(key);
    try {
      await expect.poll(async () => (await game.getAttribute("data-pos"))!.split(",").slice(0, 2).join(","),
        { intervals: [16], timeout: 2500 }).not.toBe(before);
    } finally {
      await page.keyboard.up(key);
    }
    await page.waitForTimeout(700);
  }
}

async function seedRegion(page: Page, map: MapId, x: number, y: number, dir: Dir = "up",
  extraFlags: readonly string[] = REGION_BADGES, hour = 12,
  progress?: "origin" | "milestone"): Promise<void> {
  await page.goto(`/projects?seed=1&hour=${hour}`);
  const game = page.locator("#game");
  await expect(game).toHaveAttribute("data-ready", "");
  await loadGameModules(page);
  await page.evaluate(({ map, x, y, dir, extraFlags, progress }) => {
    const { buildSpecies, createCodeling, newGame, DEFAULT_OPTIONS, writeSave, MAPS } = globalThis.__codelings;
    const species = buildSpecies(JSON.parse(document.querySelector<HTMLElement>("#game")!.dataset.repos!));
    const state = newGame("DEV", { ...DEFAULT_OPTIONS, textSpeed: "fast", music: 0, sfx: 0, anims: false });
    const party = Array.from({ length: 6 }, (_, index) => {
      const mon = createCodeling(species[index % species.length], 100, () => 0.5);
      mon.uid = `region-${index}`;
      mon.moves = [{ id: "repo-pulse", pp: 25 }];
      return mon;
    });
    const leaders = new Set(["rhea", "otto", "mira", "champion"]);
    const defeated = Object.values(MAPS).flatMap((entry) => entry.npcs
      .filter((npc) => npc.trainer && !leaders.has(npc.id)).map((npc) => `defeated:${npc.id}`));
    Object.assign(state, { map, x, y, dir, party, seen: [species[0].id], caught: [species[0].id],
      flags: ["hasStarter", "hasCodex", ...defeated, ...extraFlags] });
    if (progress === "origin") {
      state.seen.push(0);
    } else if (progress === "milestone") {
      state.caught = species.slice(0, Math.ceil(species.length / 4)).map((entry) => entry.id);
    }
    if (!writeSave(state)) {
      throw new Error("Region fixture did not save");
    }
  }, { map, x, y, dir, extraFlags: [...extraFlags], progress });
  await page.reload();
  await expect(game).toHaveAttribute("data-ready", "");
  await game.scrollIntoViewIfNeeded();
  await game.focus();
  await press(page, "Enter", { delay: 100 });
  await press(page, "ArrowDown", { delay: 100 });
  await press(page, "z", { delay: 100 });
  await expect(game).toHaveAttribute("data-scene", "overworld");
  await expect(game).toHaveAttribute("data-map", map);
}

async function clearRegionDialogue(page: Page): Promise<void> {
  const canvas = page.locator("#game canvas");
  for (let index = 0; index < 60 && (await canvas.getAttribute("aria-label"))?.includes("Dialogue:"); index++) {
    await press(page, "z", { delay: 35 });
    await page.waitForTimeout(50);
  }
}

async function captureRegion(page: Page, name: string): Promise<void> {
  const directory = process.env.CODELINGS_CAPTURE_DIR;
  if (!directory) {
    return;
  }
  await page.waitForTimeout(750);
  await mkdir(directory, { recursive: true });
  const url = await page.locator("#game canvas").evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const scaled = document.createElement("canvas");
    scaled.width = canvas.width * 4;
    scaled.height = canvas.height * 4;
    const context = scaled.getContext("2d")!;
    context.imageSmoothingEnabled = false;
    context.drawImage(canvas, 0, 0, scaled.width, scaled.height);
    return scaled.toDataURL("image/png");
  });
  await writeFile(join(directory, `${name}.png`), Buffer.from(url.split(",")[1], "base64"));
}

async function solvePipeline(page: Page): Promise<void> {
  await regionWalk(page, "ArrowLeft", 2);
  await regionWalk(page, "ArrowUp", 1);
  for (const stage of [0, 1, 2]) {
    await press(page, "z", { delay: 35 });
    await expect(page.locator("#game canvas")).toHaveAttribute("aria-label", /Dialogue:/);
    await clearRegionDialogue(page);
    if (stage === 0 && process.env.CODELINGS_CAPTURE_DIR) {
      await regionWalk(page, "ArrowDown", 1);
      await captureRegion(page, "pipeline-one-pressed");
      await regionWalk(page, "ArrowUp", 1);
    }
    if (stage < 2) {
      await regionWalk(page, "ArrowRight", 2);
    }
  }
  if (process.env.CODELINGS_CAPTURE_DIR) {
    await regionWalk(page, "ArrowUp", 6);
    await captureRegion(page, "pipeline-barriers-open");
    await regionWalk(page, "ArrowDown", 6);
  }
}

for (const [map, name, x, y] of [["gym", "Rhea", 4, 3], ["pipeGym", "Otto", 5, 14],
  ["releaseGym", "Mira", 8, 3], ["tower", "Champion", 5, 3]] as const) {
  test(`region: start ${name} battle`, async ({ page }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const badges = name === "Rhea" ? [] : name === "Otto" ? REGION_BADGES.slice(0, 1)
      : name === "Mira" ? REGION_BADGES.slice(0, 2) : REGION_BADGES;
    await seedRegion(page, map, x, y, "up", badges);
    if (map === "pipeGym") {
      await solvePipeline(page);
      await regionWalk(page, "ArrowLeft", 2);
      await regionWalk(page, "ArrowUp", 10);
    } else {
      await press(page, "z", { delay: 35 });
    }
    const game = page.locator("#game");
    for (let tick = 0; tick < 80 && await game.getAttribute("data-scene") !== "battle"; tick++) {
      await press(page, "z", { delay: 35 });
      await page.waitForTimeout(50);
    }
    await expect(game).toHaveAttribute("data-scene", "battle");
    await expect(game.locator("canvas")).toHaveAttribute("aria-label", /Battle/);
    await expect(game.locator("canvas")).toHaveAttribute("aria-label", /Battle dialogue:/);
    await press(page, "z", { delay: 35 });
    await captureRegion(page, `${name.toLowerCase()}-battle-start`);
    expect(errors).toEqual([]);
  });
}

test("region: a Champion win reaches ending, KEEP PLAYING uses the Tower exit", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  await seedRegion(page, "tower", 5, 3);
  const game = page.locator("#game");
  const canvas = game.locator("canvas");
  await press(page, "z", { delay: 35 });
  for (let tick = 0; tick < 900 && await game.getAttribute("data-scene") !== "ending"; tick++) {
    const label = await canvas.getAttribute("aria-label") ?? "";
    if (/Battle (main|moves) menu:|Battle dialogue:|Dialogue:/.test(label)) {
      await press(page, "z", { delay: 35 });
    } else if (label.includes("Battle team menu:")) {
      await press(page, "x", { delay: 35 });
    } else {
      await page.waitForTimeout(60);
    }
  }
  await expect(game).toHaveAttribute("data-scene", "ending");
  await page.waitForTimeout(6000);
  await captureRegion(page, "ending-champion");
  await press(page, "z", { delay: 35 });
  await expect(canvas).toHaveAttribute("aria-label", /KEEP PLAYING/);
  for (let index = 0; index < 3; index++) {
    await press(page, "ArrowDown", { delay: 35 });
  }
  await press(page, "z", { delay: 35 });
  await expect(game).toHaveAttribute("data-scene", "overworld");
  await expect(game).toHaveAttribute("data-map", "ridge");
  await expect(game).toHaveAttribute("data-pos", "11,2,down");
  await page.waitForTimeout(450);
  await press(page, "Enter", { delay: 35 });
  for (let index = 0; index < 3; index++) {
    await press(page, "ArrowDown", { delay: 35 });
  }
  await press(page, "z", { delay: 35 });
  await expect(canvas).toHaveAttribute("aria-label", /TRAINER CARD: DEV \/ CHAMPION/);
  await captureRegion(page, "trainer-card-champion");
  expect(errors).toEqual([]);
});

test("region: authored map captures", async ({ page }) => {
  test.setTimeout(180_000);
  const views: readonly [string, MapId, number, number, number?][] = [
    ["route3-south", "route3", 12, 24], ["route3-stream", "route3", 11, 12],
    ["branch-bay-day", "bay", 15, 9], ["branch-bay-night", "bay", 18, 6, 22],
    ["bay-center", "bayCenter", 5, 4], ["bay-mart", "bayMart", 4, 4],
    ["bay-house", "bayHouse", 3, 4], ["pipeline-switches-up", "pipeGym", 5, 14],
    ["route4-bridge", "route4", 10, 20], ["route4-tunnel", "route4", 8, 29],
    ["route4-cliffs", "route4", 12, 13], ["route4-switchback", "route4", 12, 35],
    ["release-ridge-day", "ridge", 12, 10], ["release-ridge-night", "ridge", 11, 4, 22],
    ["release-ridge-pond", "ridge", 14, 18], ["release-ridge-lookout", "ridge", 16, 13],
    ["release-gym-pads", "releaseGym", 2, 14], ["tower-hall", "tower", 5, 11],
  ];
  for (const [name, map, x, y, hour] of views) {
    await seedRegion(page, map, x, y, "up", REGION_BADGES, hour ?? 12);
    await page.waitForTimeout(1800);
    await captureRegion(page, name);
  }
});

test("region: Warden visibly steps aside and the ladder reaches Branch Trail", async ({ page }) => {
  await seedRegion(page, "cave", 9, 5, "up", []);
  await captureRegion(page, "cave-warden-before");
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(250);
  await page.keyboard.up("ArrowUp");
  await expect(page.locator("#game")).toHaveAttribute("data-pos", "9,5,up");
  await seedRegion(page, "cave", 9, 5, "up", ["badge:merge"]);
  await press(page, "z", { delay: 35 });
  await expect(page.locator("#game canvas")).toHaveAttribute("aria-label", /Dialogue:/);
  await clearRegionDialogue(page);
  await page.waitForTimeout(700);
  await captureRegion(page, "cave-warden-after");
});

test("region: original character contact sheet", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.locator("#game")).toHaveAttribute("data-ready", "");
  await loadGameModules(page);
  const url = await page.evaluate(() => {
    const { Screen, initFont, REGION_SPRITES, drawSprite, trainerPortrait, drawSmallText }
      = globalThis.__codelings;
    initFont();
    const canvas = document.createElement("canvas");
    canvas.width = 192;
    canvas.height = 240;
    const screen = new Screen(canvas);
    screen.canvas.width = 192;
    screen.canvas.height = 240;
    screen.context.imageSmoothingEnabled = false;
    screen.fill(6, 0, 0, 192, 240);
    REGION_SPRITES.forEach((id, index) => {
      const x = index % 3 * 64;
      const y = Math.floor(index / 3) * 80;
      drawSmallText(screen, id.toUpperCase(), x + 4, y + 5, 1);
      drawSprite(screen, id, "down", 0, x + 5, y + 34);
      screen.blit(trainerPortrait(id)!, 0, 0, 32, 40, x + 29, y + 20);
      screen.fill(27, x, y + 78, 64, 1);
    });
    const scaled = document.createElement("canvas");
    scaled.width = 768;
    scaled.height = 960;
    const context = scaled.getContext("2d")!;
    context.imageSmoothingEnabled = false;
    context.drawImage(screen.canvas, 0, 0, 768, 960);
    return scaled.toDataURL("image/png");
  });
  await mkdir(process.env.CODELINGS_CAPTURE_DIR!, { recursive: true });
  await writeFile(join(process.env.CODELINGS_CAPTURE_DIR!, "region-characters.png"),
    Buffer.from(url.split(",")[1], "base64"));
});




test("post-game: authored captures", async ({ page }) => {
  test.setTimeout(180_000);
  const flags = [...REGION_BADGES, "champion"];
  await seedRegion(page, "cave", 1, 6, "left", []);
  await press(page, "z", { delay: 35 });
  await captureRegion(page, "sealed-door-before");
  await seedRegion(page, "cave", 1, 6, "left", flags);
  await page.waitForTimeout(1800);
  await captureRegion(page, "sealed-door-after");
  await seedRegion(page, "vault", 4, 5, "up", flags);
  await page.waitForTimeout(1800);
  await captureRegion(page, "vault");
  await regionWalk(page, "ArrowUp", 1);
  await press(page, "z", { delay: 35 });
  await clearRegionDialogue(page);
  await expect(page.locator("#game")).toHaveAttribute("data-scene", "battle");
  await press(page, "z", { delay: 35 });
  await captureRegion(page, "origin-battle-start");
  // Saved fixtures keep screenshots on actual menu and dialogue paths.
  await seedRegion(page, "lab", 4, 7, "up", flags, 12, "origin");
  await press(page, "Enter", { delay: 35 });
  await press(page, "z", { delay: 35 });
  await captureRegion(page, "origin-codex-list");
  await press(page, "z", { delay: 35 });
  await expect(page.locator("#game canvas")).toHaveAttribute("aria-label", /Codex entry: ORIGIN/);
  await captureRegion(page, "origin-codex-entry");
  await press(page, "z", { delay: 35 });
  await expect(page.locator("#game canvas")).toHaveAttribute("aria-label", /Open on GitHub.*YES \/ NO/);
  await captureRegion(page, "origin-codex-confirmation");
  await seedRegion(page, "gym", 4, 3, "up", [...flags, "defeated:rhea"]);
  await press(page, "z", { delay: 35 });
  await captureDialogue(page, "rhea-rematch-offer", "Rematch?");
  await clearRegionDialogue(page);
  await expect(page.locator("#game canvas")).toHaveAttribute("aria-label", /YES \/ NO/);
  await captureRegion(page, "rhea-rematch-yes-no");
  const today = await page.evaluate(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${
      String(now.getDate()).padStart(2, "0")}`;
  });
  await seedRegion(page, "gym", 4, 3, "up", [...flags, `rematch:rhea:${today}`]);
  await press(page, "z", { delay: 35 });
  await captureDialogue(page, "rhea-cooldown", "tomorrow");
  await seedRegion(page, "bayHouse", 3, 4, "right", flags);
  await press(page, "z", { delay: 35 });
  await captureDialogue(page, "old-dev-quest-start", "keyboard");
  await seedRegion(page, "route3", 15, 27, "down", [...flags, "quest:keyboard:started"]);
  await press(page, "z", { delay: 35 });
  await captureDialogue(page, "keyboard-found", "OLD");
  await seedRegion(page, "ridge", 15, 12, "right", flags);
  await press(page, "z", { delay: 35 });
  await captureDialogue(page, "collector-reward", "Received");
  await seedRegion(page, "lab", 7, 4, "up", flags, 12, "milestone");
  await press(page, "z", { delay: 35 });
  await captureDialogue(page, "aide-milestone", "Received");
});

async function captureDialogue(page: Page, name: string, target: string): Promise<void> {
  await loadGameModules(page);
  const label = await page.locator("#game canvas").getAttribute("aria-label");
  const text = label!.split("Dialogue: ")[1].split(" Projects are also")[0];
  const lines = await page.evaluate((text) => globalThis.__codelings.wrapText(text, 18), text);
  const line = lines.findIndex((line) => line.includes(target));
  expect(line, `Missing capture phrase ${target}`).toBeGreaterThanOrEqual(0);
  const count = Math.floor(line / 2);
  await page.waitForTimeout(750);
  for (let index = 0; index < count; index++) {
    await press(page, "z", { delay: 35 });
    await page.waitForTimeout(750);
  }
  await captureRegion(page, name);
}


test("post-game: ORIGIN front, back and icon art", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.locator("#game")).toHaveAttribute("data-ready", "");
  await loadGameModules(page);
  const { url, areas, largest } = await page.evaluate(() => {
    const { Screen, initFont, drawSmallText, drawCreature, creatureIcon, originSpecies } = globalThis.__codelings;
    initFont();
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 144;
    const screen = new Screen(canvas);
    screen.fill(29);
    drawSmallText(screen, "ORIGIN", 61, 10, 6);
    const origin = originSpecies();
    const area = (sprite: HTMLCanvasElement): number => {
      const rgba = sprite.getContext("2d")!.getImageData(0, 0, 32, 32).data;
      return rgba.filter((value, index) => index % 4 === 3 && value !== 0).length;
    };
    const repositorySpecies = globalThis.__codelings.buildSpecies(
      JSON.parse(document.querySelector<HTMLElement>("#game")!.dataset.repos!));
    const largest = Math.max(...repositorySpecies.filter((entry) => entry.stages === 3).flatMap((entry) =>
      (["front", "back"] as const).map((facing) => area(drawCreature(
        entry.sprite.seed, entry.sprite.body, entry.type, facing, 3)))));
    const areas: number[] = [];
    for (const [facing, x] of [["front", 24], ["back", 100]] as const) {
      const sprite = drawCreature(origin.sprite.seed, origin.sprite.body, origin.type, facing);
      areas.push(area(sprite));
      screen.blit(sprite, 0, 0, 32, 32, x, 38);
      drawSmallText(screen, facing.toUpperCase(), x, 80, 6);
    }
    screen.blit(creatureIcon(origin), 0, 0, 16, 16, 72, 105);
    const scaled = document.createElement("canvas");
    scaled.width = 640;
    scaled.height = 576;
    const context = scaled.getContext("2d")!;
    context.imageSmoothingEnabled = false;
    context.drawImage(screen.canvas, 0, 0, 640, 576);
    return { url: scaled.toDataURL("image/png"), areas, largest };
  });
  for (const area of areas) {
    expect(area).toBeGreaterThanOrEqual(largest);
  }
  console.log(`ORIGIN front/back opaque areas: ${areas.join("/")}; largest stage-3: ${largest}`);
  await mkdir(process.env.CODELINGS_CAPTURE_DIR!, { recursive: true });
  await writeFile(join(process.env.CODELINGS_CAPTURE_DIR!, "origin-sprites.png"),
    Buffer.from(url.split(",")[1], "base64"));
});
