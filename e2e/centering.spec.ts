import { test, expect } from "@playwright/test";

const viewports = [
  { width: 1440, height: 900, label: "desktop-xl" },
  { width: 1024, height: 768, label: "desktop" },
  { width: 768, height: 1024, label: "tablet" },
  { width: 375, height: 812, label: "mobile" },
];

const sections = ["about", "contact", "footer", "work"];

for (const vp of viewports) {
  test.describe(`Centering @ ${vp.width}px (${vp.label})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const section of sections) {
      test(`${section} inner div is centered`, async ({ page }) => {
        await page.goto("/");

        const inner = page.locator(`[data-testid="${section}"] > div`);
        await inner.waitFor({ state: "attached" });

        const box = await inner.boundingBox();
        expect(box).not.toBeNull();

        const leftMargin = box!.x;
        const rightMargin = vp.width - (box!.x + box!.width);

        expect(
          Math.abs(leftMargin - rightMargin),
          `${section} margins: left=${leftMargin.toFixed(1)} right=${rightMargin.toFixed(1)}`,
        ).toBeLessThanOrEqual(2);
      });
    }

    test("statement inner div is centered", async ({ page }) => {
      await page.goto("/");

      const inner = page.locator('[data-testid="statement"] > div');
      // Statement may appear multiple times; check first one
      await inner.first().waitFor({ state: "attached" });

      const box = await inner.first().boundingBox();
      expect(box).not.toBeNull();

      const leftMargin = box!.x;
      const rightMargin = vp.width - (box!.x + box!.width);

      expect(
        Math.abs(leftMargin - rightMargin),
        `statement margins: left=${leftMargin.toFixed(1)} right=${rightMargin.toFixed(1)}`,
      ).toBeLessThanOrEqual(2);
    });
  });
}
