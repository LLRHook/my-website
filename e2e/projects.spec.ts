import { test, expect, type Page } from "@playwright/test";

async function openProjects(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("navigation", { name: "Open a desktop app" }).getByRole("button", { name: /^Projects(?:\s*↗)?$/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleName("Projects");
  await expect(dialog.locator(".project-tile").first(), "The published portfolio must include projects").toBeVisible();
  return dialog;
}

test("projects are populated, searchable, and open their README with a repository link", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/readme/**", (route) => route.fulfill({ contentType: "text/plain; charset=utf-8", body: "# Project documentation\n\nThese notes are ready to read.\n\n[Visit the documentation](https://example.com/docs)" }));
  const dialog = await openProjects(page);
  const firstName = await dialog.locator(".project-tile h3").first().innerText();
  const search = dialog.getByRole("searchbox", { name: "Search projects" });
  await search.fill(firstName);
  await expect(dialog.locator(".project-tile h3").filter({ hasText: firstName }).first()).toBeVisible();
  await search.fill("no-project-can-match-this-unique-query-2026");
  await expect(dialog.getByRole("heading", { name: "No matching projects.", exact: true })).toBeVisible();
  await expect(dialog.locator(".project-tile")).toHaveCount(0);
  await search.clear();
  await dialog.locator(".project-tile").first().click();
  await expect(dialog.getByRole("heading", { name: firstName, exact: true })).toBeFocused();
  await expect(dialog.getByRole("heading", { name: "Project documentation", exact: true })).toBeVisible();
  await expect(dialog.getByText("These notes are ready to read.")).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Open repository", exact: true })).toHaveAttribute("href", /^https:\/\/github\.com\/LLRHook\//);
  await dialog.getByRole("button", { name: "← All projects", exact: true }).click();
  await expect(search).toBeVisible();
  await expect(search).toBeFocused();
  expect(errors).toEqual([]);
});

test("the portfolio's actual README endpoint returns text that the computer renders", async ({ page }) => {
  const dialog = await openProjects(page);
  await dialog.getByRole("searchbox", { name: "Search projects" }).fill("my-website");
  const project = dialog.locator(".project-tile").filter({ has: page.getByRole("heading", { name: "my-website", exact: true }) });
  await expect(project).toBeVisible();
  const responsePromise = page.waitForResponse((response) => response.url().includes("/api/readme/LLRHook/my-website"));
  await project.click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/plain");
  const markdown = await response.text();
  expect(markdown.length).toBeGreaterThan(80);
  expect(markdown).not.toContain("*No README available.*");
  await expect(dialog.locator(".project-readme h1")).toBeVisible();
  await expect(dialog.locator(".project-readme")).not.toContainText("Project notes could not load.");
});

test("README failure leaves a usable repository link and project navigation", async ({ page }) => {
  await page.route("**/api/readme/**", (route) => route.abort("failed"));
  const dialog = await openProjects(page);
  await dialog.locator(".project-tile").first().click();
  await expect(dialog.getByText("Project notes could not load. You can still open the repository on GitHub.")).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Open repository", exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "← All projects", exact: true }).click();
  await expect(dialog.getByRole("searchbox", { name: "Search projects" })).toBeVisible();
});

test("leaving a pending README aborts the request and reopening starts a fresh one", async ({ page }) => {
  await page.addInitScript(() => {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input, options) => {
      if (String(input).startsWith("/api/readme/")) {
        const root = document.documentElement;
        root.dataset.readmeRequests = String(Number(root.dataset.readmeRequests || 0) + 1);
        return new Promise<Response>((_resolve, reject) => {
          options?.signal?.addEventListener("abort", () => {
            root.dataset.readmeAborts = String(Number(root.dataset.readmeAborts || 0) + 1);
            reject(new DOMException("Aborted", "AbortError"));
          }, { once: true });
        });
      }
      return nativeFetch(input, options);
    };
  });
  const dialog = await openProjects(page);
  for (let attempt = 1; attempt <= 3; attempt++) {
    await dialog.locator(".project-tile").first().click();
    await expect(dialog.getByRole("status")).toHaveText("Opening project notes…");
    await expect(page.locator("html")).toHaveAttribute("data-readme-requests", String(attempt));
    await dialog.getByRole("navigation", { name: "Computer applications" }).getByRole("button", { name: "About me", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-readme-aborts", String(attempt));
    await dialog.getByRole("navigation", { name: "Computer applications" }).getByRole("button", { name: "Projects", exact: true }).click();
    await expect(dialog.locator(".project-readme")).toHaveCount(0);
  }
});
