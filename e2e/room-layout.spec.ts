import { test, expect } from "@playwright/test";

for (const viewport of [
  { width: 320, height: 740 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 1000 },
]) {
  test.describe(`${viewport.width}px workspace`, () => {
    test.use({ viewport });

    test("room and all apps fit the viewport with readable, scrollable content", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");
      const pageOverflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(await pageOverflow()).toBeLessThanOrEqual(1);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByRole("button", { name: "Power on computer", exact: true })).toBeVisible();
      const quickAccess = page.getByRole("navigation", { name: "Open a desktop app" });

      for (const app of ["About me", "Projects", "Resume", "Off the clock", "Contact"]) {
        await quickAccess.getByRole("button", { name: new RegExp(`^${app}(?:\\s*↗)?$`) }).click();
        const dialog = page.getByRole("dialog", { name: app, exact: true });
        await expect(dialog).toBeVisible();
        const box = await dialog.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(-1);
        expect(box!.y).toBeGreaterThanOrEqual(-1);
        expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
        expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
        expect(await pageOverflow()).toBeLessThanOrEqual(1);
        const content = dialog.locator(".window-content");
        const contentMetrics = await content.evaluate((element) => ({
          overflow: element.scrollWidth - element.clientWidth,
          fontSize: parseFloat(getComputedStyle(element.querySelector(".app-lead, .resume-summary") || element).fontSize),
        }));
        expect(contentMetrics.overflow, `${app} content overflow at ${viewport.width}px`).toBeLessThanOrEqual(1);
        expect(contentMetrics.fontSize, `${app} reading size`).toBeGreaterThanOrEqual(14);
        await expect(dialog.getByRole("button", { name: "Close window and return to room" })).toBeVisible();
        await content.evaluate((element) => element.scrollTo({ top: element.scrollHeight }));
        await expect(dialog.getByRole("button", { name: "Close window and return to room" })).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(dialog).not.toBeVisible();
      }
    });
  });
}
