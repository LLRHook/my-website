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

type Rect = { x: number; y: number; width: number; height: number };
function overlaps(a: Rect, b: Rect) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

async function expectDialogFits(page: Page, dialog: Locator) {
  await expect.poll(async () => dialog.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return rect.x >= 0 && rect.y >= 0 && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1
      && element.scrollWidth <= element.clientWidth + 1;
  })).toBe(true);
  await expect(dialog.getByRole("button", { name: "Back to room", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}

for (const { deviceScaleFactor, ...viewport } of viewports) {
  test.describe(`touch composition ${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport, isMobile: true, hasTouch: true, deviceScaleFactor, contextOptions: { reducedMotion: "reduce" } });

    test("keeps desktop room features available with taps and opens readable details", async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto("/");
      // This attribute changes after hydration reads the reduced-motion setting.
      await expect(page.locator(".workspace")).toHaveAttribute("data-moving", "false");
      await page.evaluate(async () => { await document.fonts.ready; });
      expect(await page.evaluate(() => devicePixelRatio)).toBe(deviceScaleFactor);
      await testInfo.attach("room-composition", {
        body: await page.screenshot({ fullPage: true, scale: "css" }), contentType: "image/png",
      });

      const geometry = await page.evaluate(() => {
        const rect = (selector: string) => {
          const element = document.querySelector(selector);
          if (!element) throw new Error(`Missing room object: ${selector}`);
          const { x, y, width, height } = element.getBoundingClientRect();
          return { x, y, width, height };
        };
        return {
          scene: rect(".room-scene"), computer: rect(".room-scene > .computer"),
          screen: rect(".room-scene > .computer .monitor-screen"), keyboard: rect(".keyboard"),
          lamp: rect(".target-lamp"), roulette: rect(".target-roulette"),
          photos: [".note-profile", ".note-work", ".note-travel"].map(rect),
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
        };
      });
      expect(geometry.overflow).toBe(false);
      expect(geometry.scene.width / geometry.scene.height).toBeCloseTo(1440 / 850, 2);
      expect(geometry.computer.width).toBeLessThan(geometry.scene.width * 0.35);
      expect(geometry.keyboard.y).toBeGreaterThanOrEqual(geometry.computer.y + geometry.computer.height - 1);
      expect(geometry.lamp.x + geometry.lamp.width).toBeLessThan(geometry.computer.x);
      expect(geometry.roulette.x).toBeGreaterThan(geometry.computer.x + geometry.computer.width);
      for (const photo of geometry.photos) {
        expect(overlaps(photo, geometry.screen)).toBe(false);
        if (viewport.width <= 700) {
          expect(photo.y + photo.height).toBeLessThan(geometry.scene.y);
          expect(photo.width).toBeGreaterThan(70);
        }
      }
      await expect(page.locator(".power-hint,.hotspot-label,.object-target > span")).toHaveCount(0);
      // The cat's direct-gesture label only appears on hover, focus, or while awake.
      await expect(page.locator(".room-scene .cat-label")).toHaveCSS("opacity", "0");

      // Check the painted keyboard, not just its CSS bounding rectangle.
      const keyboard = page.locator(".keyboard");
      await keyboard.scrollIntoViewIfNeeded();
      expect(await keyboard.evaluate(element => {
        const rect = element.getBoundingClientRect();
        return [0.2, 0.5, 0.8].every(fraction => {
          const hit = document.elementFromPoint(rect.x + rect.width * fraction, rect.y + rect.height / 2);
          return hit !== null && (hit === element || element.contains(hit));
        });
      })).toBe(true);
      await expect(page.getByText("A room full of things I care about.", { exact: false })).toHaveCount(0);
      await expect(page.locator(".room-footer")).toHaveText(/^© \d{4} Victor Ivanov$/);

      const roulette = page.getByRole("button", { name: "Spin roulette wheel", exact: true });
      await roulette.tap();
      const rouletteResult = page.getByRole("status", { name: "Roulette result", exact: true });
      await expect(rouletteResult).toHaveText(/^(?:[0-9]|[12][0-9]|3[0-6]) · (?:red|black|green)$/);
      await expect(rouletteResult).toHaveAttribute("data-visible", "true");
      await expect(roulette).toHaveAttribute("aria-busy", "false");
      await expect(page.locator("dialog[open]")).toHaveCount(0);
      const resultBounds = (await rouletteResult.boundingBox())!;
      expect(resultBounds.x).toBeGreaterThanOrEqual(0);
      expect(resultBounds.x + resultBounds.width).toBeLessThanOrEqual(viewport.width + 1);

      const workspace = page.locator(".workspace");
      const lamp = page.getByRole("button", { name: /^Desk lamp is / });
      await lamp.tap();
      await expect(workspace).toHaveAttribute("data-lamp", "false");
      await expect(lamp).toHaveAttribute("aria-pressed", "false");
      await lamp.tap();
      await expect(workspace).toHaveAttribute("data-lamp", "true");
      const windowToggle = page.getByRole("button", { name: /^Look out the window\./ });
      await windowToggle.tap();
      await expect(workspace).toHaveAttribute("data-night", "true");
      await expect(windowToggle).toHaveAttribute("aria-pressed", "true");
      await windowToggle.tap();
      await expect(workspace).toHaveAttribute("data-night", "false");
      await expect(page.locator("dialog[open]")).toHaveCount(0);

      for (const [launcherName, title] of [
        ["Currently reading · Red Rising", "Currently reading · Red Rising"],
        ["Take a closer look at the diploma", "B.S. Computer Science · UMBC"],
      ]) {
        const launcher = page.getByRole("button", { name: launcherName, exact: true });
        await launcher.tap();
        const detail = page.getByRole("dialog", { name: title, exact: true });
        await expect(detail).toBeVisible();
        await expect(detail.getByRole("img", { name: title, exact: true })).toBeVisible();
        await expectDialogFits(page, detail);
        await detail.getByRole("button", { name: "Back to room", exact: true }).tap();
        await expect(launcher).toBeFocused();
      }

      const photo = page.getByRole("button", { name: "Peru, September 2026. Open travel photo", exact: true });
      await photo.tap();
      const travel = page.getByRole("dialog", { name: "Peru · September 2026", exact: true });
      await expect(travel).toBeVisible();
      await expect(travel.getByRole("img", { name: "A river running through a mountain town in Peru" })).toBeVisible();
      await expectDialogFits(page, travel);
      await travel.getByRole("button", { name: "Back to room", exact: true }).tap();
      await expect(photo).toBeFocused();

      const wings = page.getByRole("button", { name: "Take a closer look at the Buffalo Wild Wings carton", exact: true });
      await wings.tap();
      const wingsDetail = page.getByRole("dialog", { name: "Buffalo Wild Wings", exact: true });
      await expect(wingsDetail).toBeVisible();
      await expectDialogFits(page, wingsDetail);
      // A shorter viewport represents browser chrome expanding while a dialog is open.
      await page.setViewportSize({ width: viewport.width, height: viewport.height - 96 });
      await expectDialogFits(page, wingsDetail);
      await wingsDetail.getByRole("button", { name: "Back to room", exact: true }).tap();
      await expect(wings).toBeFocused();
      await page.setViewportSize(viewport);

      await page.getByRole("button", { name: "Power on computer", exact: true }).tap();
      const computer = page.getByRole("dialog", { name: "Your seat at my desk.", exact: true });
      await expect(computer).toBeVisible();
      await expect(page.getByTestId("computer")).toHaveAttribute("data-power", "on");
      await expectDialogFits(page, computer);
      expect((await page.getByTestId("computer").boundingBox())!.width).toBeGreaterThan(geometry.computer.width + 20);
      await page.setViewportSize({ width: viewport.width, height: viewport.height - 96 });
      await expectDialogFits(page, computer);
      await page.setViewportSize(viewport);
      await computer.getByRole("button", { name: "Back to room", exact: true }).tap();
      await expect(page.getByTestId("computer")).toHaveAttribute("data-power", "on");

      await page.getByRole("button", { name: /Expand computer screen$/ }).tap();
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
