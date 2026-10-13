import { test, expect } from "@playwright/test";

// Chromium only: CPU throttling, the Long Tasks API, Preload events and request sizes need CDP and Blink.
test.skip(({ browserName }) => browserName !== "chromium", "Chromium only");

// Cold-load budgets against the local production server (`next start` sends HTML
// uncompressed and static files gzipped; production brotli is smaller). Measured
// 2026-10-12 and recorded in VERIFICATION.md; raise a budget only on purpose.
const PAGE_BUDGETS: Record<string, { requests: number; bytes: number }> = {
  "/": { requests: 3, bytes: 40_000 },
  "/about": { requests: 4, bytes: 75_000 },
  "/projects": { requests: 3, bytes: 140_000 },
  "/resume": { requests: 2, bytes: 32_000 },
  "/off-the-clock": { requests: 3, bytes: 85_000 },
  "/contact": { requests: 2, bytes: 26_000 },
};
const GAME_BUNDLE_MAX_BYTES = 240_000;

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

test("the game bundle stays under its size cap", async ({ page, request }) => {
  await page.goto("/projects");
  const script = await page.locator('script[type="module"]').getAttribute("src");
  const body = await (await request.get(script!)).body();
  expect(body.length).toBeLessThanOrEqual(GAME_BUNDLE_MAX_BYTES);
});

// 4x CPU approximates a mid-range phone. Measured 2026-10-12: the slowest task while
// Codelings boots fell from ~780 ms to under 200 ms; the cap leaves room for slower CI hosts.
const LONG_TASK_CAP_MS = 300;

test("Codelings boots on /projects without a long main-thread task", async ({ page }) => {
  const session = await page.context().newCDPSession(page);
  await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.addInitScript(() => {
    const durations: number[] = [];
    Object.assign(window, { __longTasks: durations });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) durations.push(entry.duration);
    }).observe({ type: "longtask", buffered: true });
  });
  await page.goto("/projects");
  await expect(page.locator("#game")).toHaveAttribute("data-scene", "title");
  await page.waitForTimeout(1000);
  const durations = await page.evaluate(() => (window as unknown as { __longTasks: number[] }).__longTasks);
  expect(Math.max(0, ...durations)).toBeLessThan(LONG_TASK_CAP_MS);
});

test("hovered links are speculatively loaded: pages prerendered, /projects only prefetched", async ({ page, request }) => {
  const rules = await request.get("/speculation-rules");
  expect(rules.headers()["content-type"]).toBe("application/speculationrules+json");
  const session = await page.context().newCDPSession(page);
  const speculations: { action: string; path: string }[] = [];
  const record = (event: { key: { action: string; url: string } }) =>
    speculations.push({ action: event.key.action, path: new URL(event.key.url).pathname });
  session.on("Preload.prerenderStatusUpdated", record);
  session.on("Preload.prefetchStatusUpdated", record);
  await session.send("Preload.enable");
  const response = await page.goto("/about");
  expect(response?.headers()["speculation-rules"]).toBe('"/speculation-rules"');
  for (const path of ["/projects", "/resume"]) {
    await page.hover(`nav a[href="${path}"]`);
    await expect.poll(() => speculations.some((item) => item.path === path)).toBe(true);
  }
  expect(speculations).toContainEqual({ action: "Prerender", path: "/resume" });
  expect(speculations).toContainEqual({ action: "Prefetch", path: "/projects" });
  expect(speculations).not.toContainEqual({ action: "Prerender", path: "/projects" });
  // Chromium never activates a prerender while DevTools is attached
  // (PrerenderingDisabledByDevTools), so assert the prefetched response is what loads.
  await page.click('nav a[href="/resume"]');
  await expect(page).toHaveURL(/\/resume$/);
  expect(await page.evaluate(() => (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming & { deliveryType: string })
    .deliveryType)).toBe("navigational-prefetch");
});
