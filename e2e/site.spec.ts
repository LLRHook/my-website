import { test, expect } from "@playwright/test";
import { PAGES } from "../app/lib/html";
import { SITE_URL } from "../app/lib/constants";

for (const item of PAGES) {
  test(`${item.label}: HTML, navigation, CSP and narrow layout`, async ({ page }) => {
    const stylesheets: string[] = [];
    page.on("request", (request) => { if (request.resourceType() === "stylesheet") stylesheets.push(request.url()); });
    const response = await page.goto(item.path);
    expect(response?.status()).toBe(200);
    expect(response?.headers()["content-type"]).toContain("text/html");
    const policy = response?.headers()["content-security-policy"];
    expect(policy).toMatch(/script-src https?:\/\/[^/; ]+\/speculation-rules;/);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("script")).toHaveCount(0);
    // The stylesheet is inlined and allowed by its CSP hash: no CSS request, styles applied.
    await expect(page.locator('link[rel="stylesheet"]')).toHaveCount(0);
    await expect(page.locator("head style")).toHaveCount(1);
    const hash = await page.locator("head style").evaluate(async (element) => btoa(String.fromCharCode(
      ...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(element.textContent!))))));
    expect(policy).toContain(`style-src 'sha256-${hash}'`);
    expect(await page.locator('nav[aria-label="Site"]').evaluate((element) => getComputedStyle(element).textAlign)).toBe("center");
    expect(stylesheets).toEqual([]);
    await expect(page.locator('nav [aria-current="page"]')).toHaveText(item.label);
    await page.setViewportSize({ width: 320, height: 700 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    if (item.path === "/projects") await expect(page.getByRole("table", { name: "Public repositories" }).or(page.locator(".notice"))).toBeVisible();
  });
}

test("public photos are cached and the retired game bundle is gone", async ({ request }) => {
  expect((await request.get("/game/main.js")).status()).toBe(404);
  const photo = await request.get("/peru-travel.webp");
  expect(photo.status()).toBe(200);
  expect(photo.headers()["cache-control"]).toContain("max-age=86400");
});

const photos = [
  { path: "/", name: "victor-profile", original: "victor-profile.jpg", width: 120, height: 120 },
  { path: "/about", name: "conference-photo", original: "conference-photo.jpg", width: 320, height: 320 },
  { path: "/off-the-clock", name: "peru-travel", original: "peru-travel.webp", width: 320, height: 240 },
];

for (const photo of photos) {
  for (const density of [1, 2]) {
    test(`${photo.name}: AVIF at ${density}x with reserved dimensions`, async ({ browser, baseURL }) => {
      const context = await browser.newContext({ baseURL, deviceScaleFactor: density });
      try {
        const page = await context.newPage();
        const response = page.waitForResponse((item) => new URL(item.url()).pathname === `/${photo.name}-${density}x.avif`);
        await page.goto(photo.path);
        const image = page.locator(`picture img[src="/${photo.original}"]`);
        await image.scrollIntoViewIfNeeded();
        await image.evaluate((element) => (element as HTMLImageElement).decode());
        const result = await response;
        expect(result.status()).toBe(200);
        expect(result.headers()["content-type"]).toContain("image/avif");
        expect(result.headers()["cache-control"]).toContain("max-age=86400");
        expect(await image.evaluate((element) => (element as HTMLImageElement).currentSrc)).toContain(`/${photo.name}-${density}x.avif`);
        await expect(image).toHaveAttribute("width", String(photo.width));
        await expect(image).toHaveAttribute("height", String(photo.height));
        const size = await image.evaluate((element) => ({ width: element.clientWidth, height: element.clientHeight }));
        expect(size.width / size.height).toBeCloseTo(photo.width / photo.height, 2);
      } finally {
        await context.close();
      }
    });
  }
  test(`${photo.name}: original image remains a working fallback`, async ({ page }) => {
    await page.goto(photo.path);
    const picture = page.locator("picture").filter({ has: page.locator(`img[src="/${photo.original}"]`) });
    await picture.locator("source").evaluateAll((elements) => elements.forEach((element) => element.remove()));
    const image = picture.locator("img");
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).currentSrc)).toContain(`/${photo.original}`);
    await image.evaluate((element) => (element as HTMLImageElement).decode());
    expect(await image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  });
}

test("public profile pages retain approved wording without superseded selections", async ({ page }) => {
  for (const path of ["/", "/about", "/resume"]) {
    await page.goto(path);
    expect(await page.locator("main").innerText()).not.toMatch(/Sterling|MailIt|Systems & Architecture/i);
  }
  await expect(page.locator("main")).toContainText("Revature");
  await expect(page.locator("main")).toContainText("Active DoD Secret clearance");
  await expect(page.locator("main")).toContainText("U.S. Citizen");
});

test("interests redirects to off the clock", async ({ page }) => {
  await page.goto("/interests");
  await expect(page).toHaveURL(/\/off-the-clock$/);
});
test("unknown routes return a readable 404", async ({ page }) => {
  expect((await page.goto("/nope"))?.status()).toBe(404);
  await expect(page.getByRole("link", { name: "Back to the home page" })).toHaveAttribute("href", "/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});
test("resume PDF remains available", async ({ request }) => {
  expect((await request.get("/Victor_Ivanov_Resume.pdf")).status()).toBe(200);
});
test("resume prints its content without the site's navigation or download control", async ({ page }) => {
  await page.goto("/resume");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("header.masthead")).toBeHidden();
  await expect(page.locator("footer")).toBeHidden();
  await expect(page.getByRole("link", { name: "Download resume (PDF)" })).toBeHidden();
  await expect(page.getByRole("heading", { name: "Victor Ivanov", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Experience", exact: true })).toBeVisible();
});
test("reduced motion stops the marquee", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await page.locator(".marquee span").evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
  const marquee = await page.locator(".marquee span").evaluate((element) => ({ height: element.clientHeight, lineHeight: parseFloat(getComputedStyle(element).lineHeight) }));
  expect(marquee.height).toBe(marquee.lineHeight);
});
test("sitemap lists all six pages", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  expect(xml.match(/<loc>/g)).toHaveLength(6);
  for (const item of PAGES) expect(xml).toContain(`<loc>${SITE_URL}${item.path}</loc>`);
  expect(xml.match(/<lastmod>/g)).toHaveLength(6);
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
test("home and about carry Person structured data", async ({ page }) => {
  for (const path of ["/", "/about"]) {
    await page.goto(path);
    await expect(page.locator('[itemtype="https://schema.org/Person"] > meta[itemprop="name"]')).toHaveAttribute("content", "Victor Ivanov");
  }
  await expect(page.locator('[itemtype="https://schema.org/ProfilePage"] > [itemprop="mainEntity"]')).toHaveCount(1);
});
test("share card is served at 1200x630 and subpages show breadcrumbs", async ({ page, request }) => {
  const card = await request.get("/og-image.png");
  expect(card.status()).toBe(200);
  expect(card.headers()["content-type"]).toContain("image/png");
  await page.goto("/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", `${SITE_URL}/og-image.png`);
  await expect(page.locator("nav.crumbs")).toHaveCount(0);
  await page.goto("/contact");
  await expect(page.locator("nav.crumbs")).toBeVisible();
  await expect(page.locator("nav.crumbs li")).toHaveText(["Home", "Contact"]);
});
test("no page reports a Content Security Policy violation", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  for (const item of PAGES) {
    await page.goto(item.path);
    await page.waitForLoadState("networkidle");
  }
  expect(errors.filter((text) => /Content Security Policy/i.test(text))).toEqual([]);
});
test("projects shows the token burner panel without inline styles", async ({ page }) => {
  await page.goto("/projects");
  const panel = page.locator("section.burner");
  await expect(panel.getByRole("heading", { name: "Token burner" })).toBeVisible();
  await expect(panel.locator(".burner-stats > div")).toHaveCount(4);
  await expect(panel.locator(".burner-tools li")).toHaveCount(2);
  expect(await panel.locator(".burner-models li").count()).toBeGreaterThan(0);
  await expect(panel.locator(".burner-chart svg[role=img]")).toHaveAttribute("aria-label", /^Daily tokens from /);
  await expect(page.locator("[style]")).toHaveCount(0);
  // Bars take their colour from the stylesheet, so the hashed style-src applied.
  expect(await panel.locator(".burner-chart rect").first().evaluate((element) => getComputedStyle(element).fill)).toBe("rgb(0, 255, 0)");
  await panel.getByText("Daily numbers as a table").click();
  await expect(panel.locator("details tbody tr")).toHaveCount(90);
  await page.setViewportSize({ width: 320, height: 700 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(await panel.locator(".burner-chart svg").evaluate((element) => element.getBoundingClientRect().width)).toBeLessThanOrEqual(320);
});

test("the daily table can be reached and scrolled with the keyboard", async ({ page }) => {
  // At this width the daily table overflows even without live GitHub data.
  await page.setViewportSize({ width: 240, height: 700 });
  await page.goto("/projects");
  const summary = page.getByText("Daily numbers as a table");
  await summary.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");

  const region = page.getByRole("region", { name: "Tokens per day", exact: true });
  await expect(region).toBeFocused();
  expect(await region.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  await expect(region).toBeFocused();
});
