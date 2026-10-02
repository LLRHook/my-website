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