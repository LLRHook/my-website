import { test, expect } from "@playwright/test";

// Integration coverage for the richer card (FEAT-1781502131/132/133).
test.describe("Project card tabs", () => {
  test("expanding a card reveals README/Code/Activity tabs and switches", async ({
    page,
  }) => {
    await page.goto("/");

    const firstCard = page
      .locator('[data-testid="work"] button[aria-expanded]')
      .first();
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
});
