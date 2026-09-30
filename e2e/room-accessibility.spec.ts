import { test, expect } from "@playwright/test";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import type { AxeResults } from "axe-core";

const resolveDependency = createRequire(resolve("package.json"));

test("audited app text passes axe contrast checks against rendered backgrounds", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const app of ["about", "resume", "contact"]) {
    await page.goto(`/${app}`);
    await expect(page.locator(".desktop-window")).toBeVisible();
    await page.addScriptTag({ path: resolveDependency.resolve("axe-core/axe.min.js") });
    const selectors = [
      ".window-path", ".window-sidebar button:not([aria-current])",
      ".location-chip", ".section-label", ".about-note small", ".skill-list > span",
      ".text-button", ".resume-section-title", ".education-row h4", ".education-row > span",
      ".contact-location", ".contact-links a",
    ];
    const result = await page.evaluate(async (include) => {
      const axe = (window as unknown as { axe: { run: (context: unknown, options: unknown) => Promise<AxeResults> } }).axe;
      return axe.run({ include }, { runOnly: { type: "rule", values: ["color-contrast"] } });
    }, selectors);
    expect(result.violations, `${app}: ${JSON.stringify(result.violations)}`).toEqual([]);
    expect(result.passes.some((rule) => rule.id === "color-contrast")).toBe(true);
  }
});
