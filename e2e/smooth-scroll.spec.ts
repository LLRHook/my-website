import { test, expect } from "@playwright/test";

// Integration coverage for FEAT-1781502129 (Lenis smooth scrolling).
test.describe("Smooth scroll (Lenis)", () => {
  test("Lenis activates on load", async ({ page }) => {
    await page.goto("/");
    // Lenis adds the `lenis` class to <html> once initialized.
    await expect(page.locator("html")).toHaveClass(/lenis/);
  });

  test("anchor navigation scrolls the page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/lenis/);

    const before = await page.evaluate(() => window.scrollY);
    await page.locator('a[href="#work"]').first().click();

    // Lenis animates the scroll; poll until the page has moved meaningfully.
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 })
      .toBeGreaterThan(before + 100);
  });
});
