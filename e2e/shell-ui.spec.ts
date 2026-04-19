import { expect, test, type Page } from "@playwright/test";

const mockReadme = [
  "# Mock README",
  "",
  "## Overview",
  "This deterministic README keeps the end-to-end suite stable and long enough to verify scrolling.",
  "",
  ...Array.from(
    { length: 80 },
    (_, index) =>
      `- verification note ${index + 1}: the shell should keep content readable and scrollable.`
  ),
].join("\n");

async function gotoShell(page: Page) {
  await page.route("**/api/readme/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/plain; charset=utf-8",
      body: mockReadme,
    });
  });

  await page.goto("/");
  await expect(page.getByTestId("shell-page")).toBeVisible();
  await expect(page.locator(".repo-row").first()).toBeVisible();
}

test.describe("desktop shell", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("renders the projects workspace and keeps selection in sync", async ({
    page,
  }) => {
    await gotoShell(page);

    const rows = page.locator(".repo-row");
    const count = await rows.count();
    expect(count).toBeGreaterThan(1);

    const firstTitle = (await rows
      .nth(0)
      .locator(".repo-row-title")
      .textContent())?.trim();
    const secondTitle = (await rows
      .nth(1)
      .locator(".repo-row-title")
      .textContent())?.trim();

    expect(firstTitle).toBeTruthy();
    expect(secondTitle).toBeTruthy();

    await expect(page.locator(".project-title")).toContainText(firstTitle!);
    await expect(page.locator(".markdown-content")).toContainText(
      "This deterministic README keeps the end-to-end suite stable"
    );

    await rows.nth(1).click();
    await expect(page.locator(".project-title")).toContainText(secondTitle!);
    await expect(
      page.getByRole("link", { name: "Open repository" })
    ).toBeVisible();
  });

  test("filters repositories and recovers from the empty state", async ({
    page,
  }) => {
    await gotoShell(page);

    const search = page.locator('input[name="project-search"]');
    await search.fill("zzzz-no-match");
    await expect(page.getByText("No repos match that query yet.")).toBeVisible();

    await search.fill("");
    await expect(page.locator(".repo-row").first()).toBeVisible();
  });

  test("switches cleanly between about, projects, and contact", async ({
    page,
  }) => {
    await gotoShell(page);

    await page.getByRole("tab", { name: /About/ }).click();
    await expect(page).toHaveURL(/#about$/);
    await expect(
      page.getByRole("heading", {
        name: /Software engineer building reliable systems/i,
      })
    ).toBeVisible();

    await page.getByRole("tab", { name: /Contact/ }).click();
    await expect(page).toHaveURL(/#contact$/);
    await expect(
      page.getByRole("heading", { name: /Let's build something useful/i })
    ).toBeVisible();

    await page.getByRole("tab", { name: /Projects/ }).click();
    await expect(page).toHaveURL(/#work$/);
    await expect(
      page.getByRole("heading", { name: "Selected work" })
    ).toBeVisible();
  });

  test("locks the desktop shell to the viewport while keeping internal panes scrollable", async ({
    page,
  }) => {
    await gotoShell(page);
    await expect(page.locator(".markdown-content")).toContainText(
      "verification note 80"
    );

    const layout = await page.evaluate(() => {
      const repo = document.querySelector<HTMLElement>(".repo-list");
      const panel = document.querySelector<HTMLElement>(".panel--document");

      return {
        page: {
          scrollHeight: document.documentElement.scrollHeight,
          clientHeight: document.documentElement.clientHeight,
        },
        repo: repo
          ? {
              scrollHeight: repo.scrollHeight,
              clientHeight: repo.clientHeight,
            }
          : null,
        panel: panel
          ? {
              scrollHeight: panel.scrollHeight,
              clientHeight: panel.clientHeight,
            }
          : null,
      };
    });

    expect(layout.page.scrollHeight).toBe(layout.page.clientHeight);
    expect(layout.repo?.scrollHeight ?? 0).toBeGreaterThan(
      layout.repo?.clientHeight ?? 0
    );
    expect(layout.panel?.scrollHeight ?? 0).toBeGreaterThan(
      layout.panel?.clientHeight ?? 0
    );

    const scrolled = await page.evaluate(() => {
      const repo = document.querySelector<HTMLElement>(".repo-list");
      const panel = document.querySelector<HTMLElement>(".panel--document");

      if (!repo || !panel) {
        return null;
      }

      repo.scrollTop = repo.scrollHeight;
      panel.scrollTop = panel.scrollHeight;

      return {
        win: window.scrollY,
        repo: repo.scrollTop,
        panel: panel.scrollTop,
      };
    });

    expect(scrolled).not.toBeNull();
    expect(scrolled!.win).toBe(0);
    expect(scrolled!.repo).toBeGreaterThan(0);
    expect(scrolled!.panel).toBeGreaterThan(0);
  });
});

test.describe("mobile shell", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true });

  test("avoids horizontal overflow and allows document scrolling", async ({
    page,
  }) => {
    await gotoShell(page);
    await expect(page.locator(".markdown-content")).toContainText(
      "verification note 80"
    );

    await expect(page.locator(".shell-launchpad > *")).toHaveCount(4);

    const before = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      scrollY: document.scrollingElement?.scrollTop ?? 0,
    }));

    expect(before.scrollWidth).toBeLessThanOrEqual(before.clientWidth);
    expect(before.scrollHeight).toBeGreaterThan(before.clientHeight);

    await page.evaluate(() => {
      document.scrollingElement?.scrollTo(0, document.documentElement.scrollHeight);
    });
    await page.waitForTimeout(150);

    const afterScroll = await page.evaluate(
      () => document.scrollingElement?.scrollTop ?? 0
    );

    expect(afterScroll).toBeGreaterThan(before.scrollY);

    await page.getByRole("tab", { name: /Contact/ }).click();
    await expect(page).toHaveURL(/#contact$/);
    await expect(
      page.getByRole("heading", { name: /Let's build something useful/i })
    ).toBeVisible();
  });
});
