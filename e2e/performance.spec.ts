import { test, expect } from "@playwright/test";

// Chromium only: CPU throttling and the Long Tasks API need CDP and Blink.
test.skip(({ browserName }) => browserName !== "chromium", "Chromium only");

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
