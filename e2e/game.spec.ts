import { test, expect } from "@playwright/test";

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
