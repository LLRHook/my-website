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
