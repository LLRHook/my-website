import { test, expect } from "@playwright/test";
import { PAGES } from "../app/lib/html";
import { SITE_URL } from "../app/lib/constants";

for (const item of PAGES) {
  test(`${item.label}: HTML, navigation, CSP and narrow layout`, async ({ page }) => {
    const response = await page.goto(item.path);
    expect(response?.status()).toBe(200);
    expect(response?.headers()["content-type"]).toContain("text/html");
    expect(response?.headers()["content-security-policy"]).toContain("script-src 'none'");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("script")).toHaveCount(0);
    await expect(page.locator('nav [aria-current="page"]')).toHaveText(item.label);
    await page.setViewportSize({ width: 320, height: 700 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    if (item.path === "/projects") await expect(page.locator("table.projects, .notice")).toBeVisible();
  });
}

test("interests redirects to off the clock", async ({ page }) => {
  await page.goto("/interests");
  await expect(page).toHaveURL(/\/off-the-clock$/);
});
test("unknown routes return a readable 404", async ({ page }) => {
  expect((await page.goto("/nope"))?.status()).toBe(404);
  await expect(page.getByRole("link", { name: "Back to the home page" })).toHaveAttribute("href", "/");
});
test("resume PDF remains available", async ({ request }) => {
  expect((await request.get("/Victor_Ivanov_Resume.pdf")).status()).toBe(200);
});
test("reduced motion stops the marquee", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await page.locator(".marquee span").evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
});
test("sitemap lists all six pages", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  expect(xml.match(/<loc>/g)).toHaveLength(6);
  for (const item of PAGES) expect(xml).toContain(`<loc>${SITE_URL}${item.path}</loc>`);
});
test("favicon set is served and linked", async ({ page, request }) => {
  for (const [path, type] of [["/favicon.svg", "image/svg+xml"], ["/favicon.ico", "image/"], ["/apple-touch-icon.png", "image/png"]]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain(type);
  }
  await page.goto("/");
  for (const href of ["/favicon.ico", "/favicon.svg"]) await expect(page.locator(`link[rel="icon"][href="${href}"]`)).toHaveCount(1);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute("href", "/apple-touch-icon.png");
});
