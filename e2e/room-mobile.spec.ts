import { test, expect, type Locator, type Page } from "@playwright/test";

const viewports = [
  { width: 320, height: 568, deviceScaleFactor: 2 },
  { width: 375, height: 667, deviceScaleFactor: 2 },
  { width: 390, height: 844, deviceScaleFactor: 3 },
  { width: 393, height: 852, deviceScaleFactor: 3 },
  { width: 412, height: 915, deviceScaleFactor: 3 },
  { width: 430, height: 932, deviceScaleFactor: 3 },
  { width: 844, height: 390, deviceScaleFactor: 3 },
];

async function expectDialogFits(page: Page, dialog: Locator) {
  await expect.poll(() => dialog.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return rect.x >= 0 && rect.y >= 0 && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1
      && element.scrollWidth <= element.clientWidth + 1;
  })).toBe(true);
  await expect(dialog.getByRole("button", { name: "Back to room", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}

for (const { deviceScaleFactor, ...viewport } of viewports) {
  test.describe(`touch room ${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport, isMobile: true, hasTouch: true, deviceScaleFactor, contextOptions: { reducedMotion: "reduce" } });

    test("centers the screen, pans horizontally, and opens hotspots and the enlarged computer by tap", async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/");
      const stage = page.locator(".room-stage");
      const screen = page.locator(".scene-screen");
      if (viewport.width <= 700) {
        await expect.poll(() => stage.evaluate((el) => el.scrollWidth > el.clientWidth && el.scrollLeft > 0)).toBe(true);
        const rect = (await screen.boundingBox())!;
        expect(Math.abs(rect.x + rect.width / 2 - viewport.width / 2)).toBeLessThan(viewport.width * .15);
        const previous = await stage.evaluate((el) => el.scrollLeft);
        await stage.evaluate((el) => { el.scrollLeft += 80; });
        expect(await stage.evaluate((el) => el.scrollLeft)).toBeGreaterThan(previous);
        await expect(page.locator(".room-scene")).toHaveAttribute("data-scrolled", "true");
        await expect(page.locator(".scene-swipe-hint")).not.toBeVisible();
      }
      const sizes = await page.locator(".hotspot").evaluateAll((elements) => elements.map((el) => {
        const rect = el.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      }));
      expect(sizes).toHaveLength(11);
      for (const size of sizes) {
        expect(size.width).toBeGreaterThanOrEqual(24);
        expect(size.height).toBeGreaterThanOrEqual(24);
      }
      for (const [label, title] of [
        ["Diploma. B.S. Computer Science, UMBC", "B.S. Computer Science · UMBC"],
        ["Bookshelf. Currently reading Red Rising", "Currently reading · Red Rising"],
        ["Travel photo from Peru", "Peru · September 2026"],
        ["Buffalo Wild Wings carton", "Buffalo Wild Wings"],
      ]) {
        const trigger = page.getByRole("button", { name: label, exact: true });
        await trigger.tap();
        const detail = page.getByRole("dialog", { name: title, exact: true });
        await expect(detail).toBeVisible();
        await expectDialogFits(page, detail);
        await detail.getByRole("button", { name: "Back to room", exact: true }).tap();
        await expect(trigger).toBeFocused();
      }
      await page.getByRole("button", { name: "Turn on Victor's computer", exact: true }).tap();
      const computer = page.getByRole("dialog", { name: "Your seat at my desk.", exact: true });
      await expect(computer).toBeVisible();
      await expectDialogFits(page, computer);
      await expect(page.getByTestId("desktop")).toBeVisible();
      await page.setViewportSize({ width: viewport.width, height: viewport.height - 96 });
      await expectDialogFits(page, computer);
      await page.setViewportSize(viewport);
      await computer.getByRole("button", { name: "Back to room", exact: true }).tap();
      await expect(page.getByTestId("computer")).toHaveAttribute("data-power", "on");
      await page.getByRole("button", { name: "Expand computer screen", exact: true }).tap();
      await expect(computer).toBeVisible();
      await computer.getByRole("button", { name: "Open Resume", exact: true }).tap();
      const resume = page.getByRole("dialog", { name: "Resume", exact: true });
      await expect(resume).toBeVisible();
      await expect(resume.getByRole("heading", { name: "Experience", exact: true })).toBeVisible();
      await resume.getByRole("button", { name: "Close window and return to room", exact: true }).tap();
      await expect(page.locator("dialog[open]")).toHaveCount(0);
      await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
      expect(errors).toEqual([]);
    });
  });
}
