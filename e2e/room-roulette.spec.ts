import { test, expect } from "@playwright/test";

const RESULT = /^(0|[1-9]\d?) · (red|black|green)$/;

for (const viewport of [{ width: 1280, height: 800 }, { width: 320, height: 740 }]) {
  test.describe(`${viewport.width}px roulette`, () => {
    test.use({ viewport });

    test("sprite frames and ball move during a guarded spin, announce, expire, and accept Enter", async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/");
      const scene = page.locator(".scene-roulette");
      const button = scene.locator(".roulette-spin");
      const result = scene.getByRole("status", { name: "Roulette result" });
      const rotor = scene.locator(".roulette-rotor");
      const ball = scene.locator(".roulette-ball");
      await button.scrollIntoViewIfNeeded();
      const box = (await button.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);
      await expect(button).toHaveAttribute("aria-disabled", "false");
      await expect(result).toHaveAttribute("data-visible", "false");
      await button.click();
      await expect(button).toHaveAttribute("aria-disabled", "true");
      await expect(button).toHaveAttribute("aria-busy", "true");
      await expect(result).toHaveText("Spinning…");
      await expect(scene.locator(".roulette-rotor[data-ready=true]")).toHaveCount(1);
      const position = await rotor.evaluate((el) => el.style.backgroundPosition);
      const point = await ball.evaluate((el) => el.style.left + el.style.top);
      await expect.poll(() => rotor.evaluate((el) => el.style.backgroundPosition)).not.toBe(position);
      await expect.poll(() => ball.evaluate((el) => el.style.left + el.style.top)).not.toBe(point);
      await button.focus();
      await page.keyboard.press("Enter");
      await expect(button).toBeFocused();
      await expect(result).toHaveText(RESULT, { timeout: 6000 });
      await expect(button).toHaveAttribute("aria-busy", "false");
      await expect(result).toHaveAttribute("aria-live", "polite");
      await expect(result).toHaveAttribute("aria-atomic", "true");
      await expect(result).toHaveAttribute("data-visible", "false", { timeout: 4000 });
      await expect(result).toHaveText(RESULT);
      await page.keyboard.press("Enter");
      await expect(result).toHaveText("Spinning…");
      await expect(result).toHaveText(RESULT, { timeout: 6000 });
      await expect(button).toBeFocused();
      await expect(page.locator("dialog[open]")).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      expect(errors).toEqual([]);
    });
  });
}

test("reduced motion lands immediately with a loaded sprite", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator(".roulette-spin").click();
  await expect(page.getByRole("status", { name: "Roulette result" })).toHaveText(RESULT, { timeout: 1000 });
  await expect(page.locator(".roulette-spin")).toHaveAttribute("aria-disabled", "false");
  await expect(page.locator(".roulette-rotor[data-ready=true]")).toHaveCount(1);
});
