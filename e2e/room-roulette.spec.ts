import { test, expect, type Page } from "@playwright/test";

const RESULT = /^(0|[1-9]\d?) · (red|black|green)$/;
const SPIN_TIMEOUT = 15_000;

const wheel = (page: Page) => page.locator(".target-roulette").getByRole("button", { name: "Spin roulette wheel", exact: true });
const status = (page: Page) => page.getByRole("status", { name: "Roulette result", exact: true });
const rotor = (page: Page) => page.locator(".target-roulette .roulette-rotor");
const confetti = (page: Page) => page.locator(".target-roulette .roulette-confetti");

async function expectSettledResult(page: Page, timeout: number) {
  const result = status(page);
  await expect(result).toHaveText(RESULT, { timeout });
  await expect(result).toHaveAttribute("data-visible", "true");
  const color = await result.locator("strong").getAttribute("data-color");
  expect(["red", "black", "green"]).toContain(color);
  await expect(result).toContainText(color!);
  await expect(wheel(page)).toHaveAttribute("aria-disabled", "false");
  await expect(wheel(page)).toHaveAttribute("aria-busy", "false");
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

for (const viewport of [{ width: 1280, height: 800 }, { width: 320, height: 740 }]) {
  test.describe(`${viewport.width}px roulette`, () => {
    test.use({ viewport });

    test("spins in the room by click and Enter, locks while pending, shows a small result, and fits the layout", async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto("/");
      const button = wheel(page);
      const result = status(page);
      await button.scrollIntoViewIfNeeded();
      await expect(page.locator(".target-roulette").getByRole("button")).toHaveCount(1);
      await expect(button).toHaveAttribute("aria-disabled", "false");
      await expect(result).toHaveAttribute("data-visible", "false");
      const box = (await button.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.width).toBeLessThan(150);
      expect(box.height).toBeGreaterThanOrEqual(24);

      await button.click();
      await expect(button).toHaveAttribute("aria-disabled", "true");
      await expect(button).toHaveAttribute("aria-busy", "true");
      await expect(result).toHaveText("Spinning…");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expectSettledResult(page, SPIN_TIMEOUT);
      await expect(confetti(page)).toHaveCount(1);
      expect((await result.boundingBox())!.width).toBeLessThanOrEqual(150);

      await button.focus();
      await expect(button).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(button).toHaveAttribute("aria-disabled", "true");
      await expect(button).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(button).toHaveAttribute("aria-disabled", "true");
      await expect(button).toBeFocused();
      await expect(result).toHaveText("Spinning…");
      await expectSettledResult(page, SPIN_TIMEOUT);
      await expect(button).toBeFocused();

      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
      await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
      expect(errors).toEqual([]);
    });
  });
}

test("reduced motion lands immediately with no transition or confetti", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const button = wheel(page);
  await button.click();
  await expectSettledResult(page, 1_000);
  await expect(button).toHaveAttribute("data-spinning", "false");
  await expect(rotor(page)).toHaveCSS("transition-property", "none");
  await expect(confetti(page)).toHaveCount(0);
});

test("Pause motion lands immediately with no transition or confetti", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pause motion", exact: true }).click();
  await expect(page.getByRole("button", { name: /Motion off/ })).toHaveAttribute("aria-pressed", "true");
  const button = wheel(page);
  await button.click();
  await expectSettledResult(page, 1_000);
  await expect(button).toHaveAttribute("data-spinning", "false");
  await expect(rotor(page)).toHaveCSS("transition-property", "none");
  await expect(confetti(page)).toHaveCount(0);
});
