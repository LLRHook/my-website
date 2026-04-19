import { expect, test, type Page } from "@playwright/test";

const mockReadme = [
  "# Mock README",
  "",
  "## Overview",
  "This deterministic README keeps the end-to-end suite stable while the archive panel verifies the new layout.",
  "",
  ...Array.from(
    { length: 80 },
    (_, index) =>
      `- verification note ${index + 1}: the archive should stay readable and scroll cleanly.`
  ),
].join("\n");

async function gotoPortfolio(page: Page) {
  await page.route("**/api/readme/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/plain; charset=utf-8",
      body: mockReadme,
    });
  });

  await page.goto("/");
  await expect(page.getByTestId("portfolio-page")).toBeVisible();
}

test.describe("desktop portfolio", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("renders the hero and lets the featured demo accept input", async ({
    page,
  }) => {
    await gotoPortfolio(page);

    await expect(
      page.getByRole("heading", {
        name: /Build useful systems\. Let people touch the work\./i,
      })
    ).toBeVisible();

    await expect(page.getByTestId("featured-demo")).toBeVisible();

    const before = Number(
      (await page.getByTestId("stage-count-interview").textContent()) ?? "0"
    );

    await page.getByRole("tab", { name: "AI systems" }).click();
    await page.getByLabel("Company").fill("Acme Robotics");
    await page.getByLabel("Stage").selectOption("interview");
    await page.getByRole("button", { name: "Log to funnel" }).click();

    await expect(page.getByTestId("demo-feed")).toContainText("Acme Robotics");

    const after = Number(
      (await page.getByTestId("stage-count-interview").textContent()) ?? "0"
    );

    expect(after).toBe(before + 1);
  });

  test("filters the archive and keeps repo selection in sync", async ({
    page,
  }) => {
    await gotoPortfolio(page);

    const rows = page.locator(".archive-row");
    const count = await rows.count();
    expect(count).toBeGreaterThan(1);

    const secondTitle = (await rows
      .nth(1)
      .locator(".archive-row-title")
      .textContent())?.trim();

    expect(secondTitle).toBeTruthy();

    await rows.nth(1).click();
    await expect(page.getByTestId("archive-title")).toContainText(secondTitle!);
    await expect(page.locator(".markdown-content")).toContainText("Mock README");

    const search = page.locator('input[name="project-search"]');
    await search.fill("zzzz-no-match");
    await expect(page.getByText("No repos match that query yet.")).toBeVisible();

    await search.fill("");
    await expect(page.locator(".archive-row").first()).toBeVisible();
  });

  test("navigates to the contact section from the primary nav", async ({
    page,
  }) => {
    await gotoPortfolio(page);

    await page.getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL(/#contact$/);
    await expect(
      page.getByRole("heading", { name: /Let's build something useful/i })
    ).toBeVisible();
  });
});

test.describe("mobile portfolio", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true });

  test("avoids horizontal overflow and allows page scrolling", async ({
    page,
  }) => {
    await gotoPortfolio(page);

    await expect(page.getByTestId("featured-demo")).toBeVisible();

    const before = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      scrollTop: document.scrollingElement?.scrollTop ?? 0,
    }));

    expect(before.scrollWidth).toBeLessThanOrEqual(before.clientWidth);
    expect(before.scrollHeight).toBeGreaterThan(before.clientHeight);

    await page.evaluate(() => {
      document.scrollingElement?.scrollTo(0, document.documentElement.scrollHeight);
    });
    await page.waitForTimeout(150);

    const after = await page.evaluate(
      () => document.scrollingElement?.scrollTop ?? 0
    );

    expect(after).toBeGreaterThan(before.scrollTop);
  });
});
