import { test, expect, type Page } from "@playwright/test";

test("game boots cleanly with a single module, route CSP, and keyboard title flow", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  const response = await page.goto("/projects");
  expect(response?.headers()["content-security-policy"]).toContain("script-src 'self'");
  await expect(page.locator("script")).toHaveCount(1);
  await expect(page.locator("script")).toHaveAttribute("src", "/game/main.js");
  await expect(page.locator("script")).toHaveAttribute("type", "module");
  const game = page.locator("#game");
  await expect(game).toHaveAttribute("data-ready", ""); await expect(game).toHaveAttribute("data-scene", "title");
  await expect(page.locator("table.projects")).toBeVisible();
  const canvas = game.locator("canvas"); const attract = await canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL());
  await game.focus(); await page.keyboard.press("Enter");
  await expect.poll(() => canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL())).not.toBe(attract);
  await expect(game).toHaveAttribute("data-scene", "title");
  await page.keyboard.press("Enter"); await expect(game).toHaveAttribute("data-scene", "intro");
  expect(errors).toEqual([]);
  await page.keyboard.press("Escape"); await expect(game).not.toBeFocused();
});

test.describe("touch controls", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  test("START twice reaches intro and 320px has no horizontal overflow", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" }); await page.goto("/projects");
    const game = page.locator("#game"); await expect(game).toHaveAttribute("data-ready", "");
    const canvas = game.locator("canvas"); const attract = await canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL());
    await game.locator('[data-button="start"]').tap();
    await expect.poll(() => canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL())).not.toBe(attract);
    await game.locator('[data-button="start"]').tap(); await expect(game).toHaveAttribute("data-scene", "intro");
    await page.setViewportSize({ width: 320, height: 700 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expect(page.locator("table.projects")).toBeVisible();
  });
});

test("options persist before a save exists", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/projects"); const game = page.locator("#game"); await expect(game).toHaveAttribute("data-ready", "");
  const frame = () => game.locator("canvas").evaluate((element) => (element as HTMLCanvasElement).toDataURL());
  const attract = await frame();
  await game.focus(); await page.keyboard.press("Enter"); await expect.poll(frame).not.toBe(attract);
  const menu = await frame(); await page.keyboard.press("ArrowDown"); await expect.poll(frame).not.toBe(menu);
  await page.keyboard.press("Enter");
  await expect(game).toHaveAttribute("data-scene", "menu"); await page.keyboard.press("ArrowRight");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("codelings.options.v1") ?? "{}").textSpeed)).toBe("fast");
  await page.keyboard.press("x"); await expect(game).toHaveAttribute("data-scene", "title");
  await page.reload(); await expect(game).toHaveAttribute("data-ready", "");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("codelings.options.v1")!).textSpeed)).toBe("fast");
});


async function finishIntro(page: Page): Promise<void> {
  const game = page.locator("#game");
  for (let presses = 0; presses < 40; presses++) {
    if (await game.getAttribute("data-scene") === "overworld") {
      return;
    }
    await page.keyboard.press("z", { delay: 35 });
    await page.waitForTimeout(50);
  }
  await expect(game).toHaveAttribute("data-scene", "overworld");
}
async function hold(page: Page, key: string, duration: number): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForTimeout(duration);
  await page.keyboard.up(key);
  await page.waitForTimeout(150);
}

async function walk(page: Page, key: string, count: number): Promise<void> {
  for (let index = 0; index < count; index++) {
    await page.keyboard.press(key, { delay: 120 });
    await page.waitForTimeout(330);
  }
}

test("choose a starter, encounter, use a Fork Ball and open the Codex without errors", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/projects?seed=1&encounter=1");
  const game = page.locator("#game");
  await expect(game).toHaveAttribute("data-ready", "");
  await game.focus();
  await page.keyboard.press("Enter", { delay: 35 });
  await page.waitForTimeout(100);
  await page.keyboard.press("Enter", { delay: 35 });
  await finishIntro(page);
  await walk(page, "ArrowRight", 2);
  await walk(page, "ArrowUp", 2);
  await expect(game).toHaveAttribute("data-map", "house");
  await page.waitForTimeout(350);
  await walk(page, "ArrowDown", 4);
  await walk(page, "ArrowLeft", 3);
  await walk(page, "ArrowDown", 1);
  await expect(game).toHaveAttribute("data-map", "sterling");
  await page.waitForTimeout(350);
  await walk(page, "ArrowDown", 1);
  await walk(page, "ArrowRight", 9);
  await walk(page, "ArrowUp", 2);
  await expect(game).toHaveAttribute("data-map", "lab");
  await page.waitForTimeout(350);
  await walk(page, "ArrowUp", 4);
  await page.keyboard.press("z", { delay: 35 });
  for (let index = 0; index < 25 && await game.getAttribute("data-scene") !== "menu"; index++) {
    await page.keyboard.press("z", { delay: 35 });
    await page.waitForTimeout(70);
  }
  await expect(game).toHaveAttribute("data-scene", "menu");
  await page.keyboard.press("z", { delay: 35 });
  await page.waitForTimeout(100);
  await page.keyboard.press("z", { delay: 35 });
  await finishIntro(page);
  await expect(game).toHaveAttribute("data-caught", "1");
  // Canvas labels expose the same dialogue and menu choices to assistive technology.
  const canvas = game.locator("canvas");
  for (let index = 0; index < 30 && (await canvas.getAttribute("aria-label"))?.includes("Dialogue:"); index++) {
    await page.keyboard.press("z", { delay: 35 });
    await page.waitForTimeout(100);
  }
  await page.keyboard.press("Enter", { delay: 35 });
  for (let index = 0; index < 4; index++) {
    await page.keyboard.press("ArrowDown", { delay: 35 });
  }
  await page.keyboard.press("z", { delay: 35 });
  const starterSave = await page.evaluate(() => JSON.parse(localStorage.getItem("codelings.save.v1")!));
  expect(starterSave.party).toHaveLength(1);
  expect(starterSave.party[0].level).toBe(5);
  expect(starterSave.bag.forkBall).toBe(5);
  await page.keyboard.press("x", { delay: 35 });
  await page.keyboard.press("x", { delay: 35 });
  await walk(page, "ArrowDown", 4);
  await expect(game).toHaveAttribute("data-map", "sterling");
  await page.waitForTimeout(350);
  await walk(page, "ArrowDown", 2);
  await walk(page, "ArrowLeft", 5);
  await walk(page, "ArrowUp", 11);
  await expect(game).toHaveAttribute("data-map", "route1");
  await walk(page, "ArrowUp", 3);
  await walk(page, "ArrowLeft", 5);
  await walk(page, "ArrowUp", 6);
  await expect(game).toHaveAttribute("data-scene", "battle");
  const caughtBefore = Number(await game.getAttribute("data-caught"));
  let throws = 0;
  for (let tick = 0; tick < 180 && await game.getAttribute("data-scene") === "battle"; tick++) {
    const label = await canvas.getAttribute("aria-label") ?? "";
    if (label.includes("Battle main menu:")) {
      // The main menu starts on FIGHT. Right selects BAG.
      await page.keyboard.press("ArrowRight", { delay: 35 });
      await page.keyboard.press("z", { delay: 35 });
      await expect(game).toHaveAttribute("data-scene", "menu");
      await expect(canvas).toHaveAttribute("aria-label", /Bag:.*Fork Ball/);
      await page.keyboard.press("z", { delay: 35 });
      throws++;
    } else if (label.includes("Battle dialogue:")) {
      await page.keyboard.press("z", { delay: 35 });
    } else if (label.includes("Battle team menu:")) {
      await page.keyboard.press("z", { delay: 35 });
    }
    await page.waitForTimeout(100);
    if (throws >= 5 && label.includes("Battle main menu:")) {
      break;
    }
  }
  expect(throws).toBeGreaterThan(0);
  expect(Number(await game.getAttribute("data-caught")) > caughtBefore
    || await game.getAttribute("data-scene") !== "battle").toBe(true);
  for (let tick = 0; tick < 30; tick++) {
    const label = await canvas.getAttribute("aria-label") ?? "";
    if (label.includes("YES / NO")) {
      await page.keyboard.press("x", { delay: 35 });
    } else if (label.includes("Dialogue:")) {
      await page.keyboard.press("z", { delay: 35 });
    } else {
      break;
    }
    await page.waitForTimeout(100);
  }
  await expect(game).toHaveAttribute("data-scene", "overworld");
  await page.keyboard.press("Enter", { delay: 35 });
  await page.keyboard.press("z", { delay: 35 });
  await expect(game).toHaveAttribute("data-scene", "codex");
  const starterIndex = await page.evaluate((id: number) => {
    const repos = JSON.parse(document.querySelector<HTMLElement>("#game")!.dataset.repos!) as
      { id: number; pushedAt: string }[];
    return repos.sort((a, b) => a.pushedAt.localeCompare(b.pushedAt) || a.id - b.id)
      .findIndex((repo) => repo.id === id);
  }, starterSave.party[0].species);
  for (let index = 0; index < starterIndex; index++) {
    await page.keyboard.press("ArrowDown", { delay: 35 });
    await page.waitForTimeout(50);
  }
  await page.keyboard.press("z", { delay: 35 });
  await expect(canvas).toHaveAttribute("aria-label", /Codex entry:/);
  await page.keyboard.press("z", { delay: 35 });
  await expect(canvas).toHaveAttribute("aria-label", /Open on GitHub\? YES \/ NO/);
  const popupPromise = page.waitForEvent("popup");
  await page.keyboard.press("z", { delay: 35 });
  const popup = await popupPromise;
  expect(popup.url()).toMatch(/^https:\/\/github\.com\/LLRHook\//);
  await popup.close();
  expect(errors).toEqual([]);
});

test("every live species has encounters and reproducible four-colour front and back sprites", async ({ page }) => {
  await page.goto("/projects?seed=1");
  await expect(page.locator("#game")).toHaveAttribute("data-ready", "");
  const result = await page.evaluate(async () => {
    // These imports are confined to the test; the game exposes no JavaScript globals.
    const base = "/game/";
    const { buildSpecies } = await import(base + "data/species.js") as typeof import("../game/src/data/species.js");
    const { drawCreature } = await import(base + "gfx/creatures.js") as typeof import("../game/src/gfx/creatures.js");
    const { MAPS } = await import(base + "world/maps/index.js") as typeof import("../game/src/world/maps/index.js");
    const species = buildSpecies(JSON.parse(document.querySelector<HTMLElement>("#game")!.dataset.repos!));
    return species.map((entry) => {
      const front = drawCreature(entry.sprite.seed, entry.sprite.body, entry.type, "front");
      const back = drawCreature(entry.sprite.seed, entry.sprite.body, entry.type, "back");
      const pixels = front.getContext("2d")!.getImageData(0, 0, 32, 32).data;
      const behind = back.getContext("2d")!.getImageData(0, 0, 32, 32).data;
      const colours = new Set<string>();
      const backColours = new Set<string>();
      let frontArea = 0;
      let backArea = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        colours.add(Array.from(pixels.slice(index, index + 4)).join(","));
        backColours.add(Array.from(behind.slice(index, index + 4)).join(","));
        frontArea += pixels[index + 3] ? 1 : 0;
        backArea += behind[index + 3] ? 1 : 0;
      }
      return { id: entry.id, catchable: entry.habitat.some((map) => !!MAPS[map].encounters),
        deterministic: front.toDataURL() === drawCreature(entry.sprite.seed, entry.sprite.body,
          entry.type, "front").toDataURL(), colours: colours.size, backColours: backColours.size,
        front: front.toDataURL(), back: back.toDataURL(), frontArea, backArea,
        cropped: Array.from({ length: 32 }, (_, x) => behind[(31 * 32 + x) * 4 + 3]).some(Boolean) };
    });
  });
  expect(result.length).toBeGreaterThan(0);
  expect(new Set(result.map((entry) => entry.front)).size).toBe(result.length);
  for (const entry of result) {
    expect(entry.catchable, String(entry.id)).toBe(true);
    expect(entry.deterministic, String(entry.id)).toBe(true);
    expect(entry.colours, String(entry.id)).toBeLessThanOrEqual(4);
    expect(entry.backColours, String(entry.id)).toBeLessThanOrEqual(4);
    expect(entry.back, String(entry.id)).not.toBe(entry.front);
    expect(entry.backArea, String(entry.id)).toBeGreaterThan(entry.frontArea);
    expect(entry.cropped, String(entry.id)).toBe(true);
  }
});

test("new game reaches bedroom; stairs and door warp; save and continue preserve the map", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  await page.goto("/projects");
  const game = page.locator("#game");
  await expect(game).toHaveAttribute("data-ready", "");
  await game.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(100);
  await page.keyboard.press("Enter");
  await expect(game).toHaveAttribute("data-scene", "intro");
  await finishIntro(page);
  await expect(game).toHaveAttribute("data-map", "bedroom");
  // The bedroom starts at (4,4); walk east to the wall, then north onto the stair at (6,2).
  await hold(page, "ArrowRight", 650);
  await hold(page, "ArrowUp", 650);
  await expect(game).toHaveAttribute("data-map", "house");
  // Stair arrival is (6,2). Head south, west to x=3, then out of the door.
  await hold(page, "ArrowDown", 1100);
  await hold(page, "ArrowLeft", 850);
  await hold(page, "ArrowDown", 550);
  await expect(game).toHaveAttribute("data-map", "sterling");
  // data-map changes halfway through the 24-frame door fade; wait for its remaining frames.
  await page.waitForTimeout(250);
  await page.keyboard.press("Enter", { delay: 35 });
  await expect(game).toHaveAttribute("data-scene", "menu");
  for (let index = 0; index < 4; index++) {
    await page.keyboard.press("ArrowDown", { delay: 35 });
  }
  await page.keyboard.press("z", { delay: 35 });
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("codelings.save.v1") ?? "{}").map))
    .toBe("sterling");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("codelings.save.v1")!));
  expect(saved.party).toEqual([]);
  await page.reload();
  await expect(game).toHaveAttribute("data-ready", "");
  await game.focus();
  await page.keyboard.press("Enter", { delay: 35 });
  await page.waitForTimeout(100);
  await page.keyboard.press("ArrowDown", { delay: 35 });
  await page.keyboard.press("z", { delay: 35 });
  await expect(game).toHaveAttribute("data-scene", "overworld");
  await expect(game).toHaveAttribute("data-map", saved.map);
  // Saving immediately after continue verifies position and facing, without a JS game global.
  await page.keyboard.press("Enter", { delay: 35 });
  for (let index = 0; index < 4; index++) {
    await page.keyboard.press("ArrowDown", { delay: 35 });
  }
  await page.keyboard.press("z", { delay: 35 });
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("codelings.save.v1")!).playTimeSec))
    .toBeGreaterThan(saved.playTimeSec);
  const resumed = await page.evaluate(() => JSON.parse(localStorage.getItem("codelings.save.v1")!));
  expect([resumed.x, resumed.y, resumed.dir]).toEqual([saved.x, saved.y, saved.dir]);
  expect(errors).toEqual([]);
});
