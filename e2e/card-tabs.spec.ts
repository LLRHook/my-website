import { test, expect } from "@playwright/test";

// Integration coverage for the richer card (FEAT-1781502131/132/133).
test.describe("Project card tabs", () => {
  test("expanding a card reveals README/Code/Activity tabs and switches", async ({
    page,
  }) => {
    await page.goto("/");

    const cards = page.locator('[data-testid="work"] button[aria-expanded]');
    test.skip(
      (await cards.count()) === 0,
      "no project cards rendered (GitHub data unavailable / rate-limited)"
    );
    const firstCard = cards.first();
    await firstCard.click();
    await expect(firstCard).toHaveAttribute("aria-expanded", "true");

    const tablist = page.locator('[role="tablist"]').first();
    await expect(tablist.getByRole("tab", { name: "README" })).toBeVisible();
    await expect(tablist.getByRole("tab", { name: "Code" })).toBeVisible();
    await expect(tablist.getByRole("tab", { name: "Activity" })).toBeVisible();

    // Switching tabs updates the selected state (uses already-loaded data).
    await tablist.getByRole("tab", { name: "Activity" }).click();
    await expect(
      tablist.getByRole("tab", { name: "Activity" })
    ).toHaveAttribute("aria-selected", "true");
  });

  test("Run tab mounts a live embed and unmounts on tab switch (leak-safe)", async ({
    page,
  }) => {
    await page.goto("/");
    const cards = page.locator('[data-testid="work"] button[aria-expanded]');
    const count = Math.min(await cards.count(), 10);

    let exercised = false;
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      await card.click(); // expand
      const tablist = page.locator('[role="tablist"]').first();
      await tablist.waitFor();
      if ((await tablist.getByRole("tab", { name: "Run" }).count()) > 0) {
        await tablist.getByRole("tab", { name: "Run" }).click();
        await expect(page.locator('iframe[src*="stackblitz.com"]')).toHaveCount(1);
        // Switching away must unmount the iframe (tears down the WebContainer).
        await tablist.getByRole("tab", { name: "Activity" }).click();
        await expect(page.locator('iframe[src*="stackblitz.com"]')).toHaveCount(0);
        exercised = true;
        break;
      }
      await card.click(); // collapse and try the next card
    }
    test.skip(!exercised, "no runnable repo found among the first cards");
  });
});
