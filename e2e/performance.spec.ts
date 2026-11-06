import { test, expect } from "@playwright/test";

// Chromium only: Preload events and request sizes need CDP and Blink.
test.skip(({ browserName }) => browserName !== "chromium", "Chromium only");

// Cold-load budgets against the local production server (`next start` sends HTML
// uncompressed and static files gzipped; production brotli is smaller). Measured
// 2026-10-12 (/projects 2026-10-14, with the token burner panel) and recorded in
// VERIFICATION.md; raise a budget only on purpose.
const PAGE_BUDGETS: Record<string, { requests: number; bytes: number }> = {
  "/": { requests: 3, bytes: 32_000 },
  "/about": { requests: 4, bytes: 48_000 },
  "/projects": { requests: 2, bytes: 44_000 },
  "/resume": { requests: 2, bytes: 32_000 },
  "/off-the-clock": { requests: 3, bytes: 48_000 },
  "/contact": { requests: 2, bytes: 26_000 },
};

for (const [path, budget] of Object.entries(PAGE_BUDGETS)) {
  test(`${path} stays within its cold-load budget`, async ({ page }) => {
    const transfers: { url: string; bytes: Promise<number> }[] = [];
    page.on("requestfinished", (request) => transfers.push({
      url: new URL(request.url()).pathname,
      bytes: request.sizes().then((sizes) => sizes.responseHeadersSize + sizes.responseBodySize),
    }));
    await page.goto(path, { waitUntil: "networkidle" });
    const rows = await Promise.all(transfers.map(async ({ url, bytes }) => ({ url, bytes: await bytes })));
    const total = rows.reduce((sum, row) => sum + row.bytes, 0);
    expect(rows.length, JSON.stringify(rows)).toBeLessThanOrEqual(budget.requests);
    expect(total, JSON.stringify(rows)).toBeLessThanOrEqual(budget.bytes);
  });
}

// Keep the thresholds in source so increasing one requires a reviewed change.
const SLOW_BUDGETS = {
  "/": { paint: 2500, load: 4000 },
  "/about": { paint: 2500, load: 4000 },
  "/projects": { paint: 3500, load: 5000 },
  "/resume": { paint: 2500, load: 4000 },
  "/off-the-clock": { paint: 2500, load: 4000 },
  "/contact": { paint: 2500, load: 4000 },
};

test("all pages paint and load within their poor-connection budgets", async ({ browser, baseURL }, testInfo) => {
  const measurements: { path: string; paint: number; load: number }[] = [];
  for (const [path, budget] of Object.entries(SLOW_BUDGETS)) {
    const context = await browser.newContext({ baseURL, reducedMotion: "reduce" });
    try {
      const page = await context.newPage();
      const session = await context.newCDPSession(page);
      await session.send("Network.enable");
      await session.send("Network.setCacheDisabled", { cacheDisabled: true });
      await session.send("Network.emulateNetworkConditions", {
        offline: false, latency: 400, downloadThroughput: 50 * 1024,
        uploadThroughput: 20 * 1024, connectionType: "cellular3g",
      });
      await page.goto(path, { waitUntil: "load" });
      await expect(page.locator("main h1")).toBeVisible();
      await expect.poll(() => page.evaluate(() => performance.getEntriesByName("first-contentful-paint").length)).toBeGreaterThan(0);
      const timing = await page.evaluate(() => ({
        paint: performance.getEntriesByName("first-contentful-paint")[0].startTime,
        load: (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming).loadEventEnd,
      }));
      measurements.push({ path, ...timing });
      expect(timing.paint, `${path} first contentful paint`).toBeGreaterThan(0);
      expect(timing.load, `${path} load event`).toBeGreaterThan(0);
      expect(timing.paint, `${path} first contentful paint`).toBeLessThan(budget.paint);
      expect(timing.load, `${path} load event`).toBeLessThan(budget.load);
    } finally {
      await context.close();
    }
  }
  await testInfo.attach("poor-connection-measurements", { body: JSON.stringify(measurements, null, 2), contentType: "application/json" });
});

test("hovered links are prerendered, /projects included", async ({ page, request }) => {
  const rules = await request.get("/speculation-rules");
  expect(rules.headers()["content-type"]).toBe("application/speculationrules+json");
  const session = await page.context().newCDPSession(page);
  const speculations: { action: string; path: string }[] = [];
  const record = (event: { key: { action: string; url: string } }) =>
    speculations.push({ action: event.key.action, path: new URL(event.key.url).pathname });
  session.on("Preload.prerenderStatusUpdated", record);
  await session.send("Preload.enable");
  const response = await page.goto("/about");
  expect(response?.headers()["speculation-rules"]).toBe('"/speculation-rules"');
  for (const path of ["/projects", "/resume"]) {
    await page.hover(`nav a[href="${path}"]`);
    await expect.poll(() => speculations.some((item) => item.path === path)).toBe(true);
  }
  expect(speculations).toContainEqual({ action: "Prerender", path: "/resume" });
  expect(speculations).toContainEqual({ action: "Prerender", path: "/projects" });
  // Chromium never activates a prerender while DevTools is attached
  // (PrerenderingDisabledByDevTools), so assert the prefetched response is what loads.
  await page.click('nav a[href="/resume"]');
  await expect(page).toHaveURL(/\/resume$/);
  expect(await page.evaluate(() => (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming & { deliveryType: string })
    .deliveryType)).toBe("navigational-prefetch");
});
