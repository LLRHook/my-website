import { test, expect } from "@playwright/test";

const objects = [
  [".note-profile", "Victor Ivanov"],
  [".note-work", "At the podium"],
  [".note-travel", "Peru · September 2026"],
  [".hobby-hotspot", "Magic & Pokémon"],
  [".climb-hotspot", "Rock climbing"],
  [".target-wings", "Buffalo Wild Wings"],
  [".target-window", "By the window"],
  [".target-lamp", "Desk lamp"],
  [".target-plants", "Plants"],
  [".cat-detail-hotspot", "Meet the cat"],
];

for (const viewport of [{ width: 320, height: 740 }, { width: 390, height: 844 }, { width: 412, height: 915 }, { width: 1440, height: 1000 }]) {
  test.describe(`${viewport.width}px close-ups`, () => {
    test.use({ viewport });
    test("objects show sharp artwork or photos, readable stories, and restore room focus", async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto("/");
      for (const [selector, title] of objects) {
        const trigger = page.locator(selector);
        await trigger.click();
        const dialog = page.getByRole("dialog", { name: title, exact: true });
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole("heading", { name: title, exact: true })).toBeVisible();
        await expect(dialog.getByRole("button", { name: "Back to room" })).toBeFocused();
        const bounds = await dialog.boundingBox();
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.y).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width + 1);
        expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height + 1);
        expect(await dialog.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
        const vector = dialog.locator(".object-detail-visual > svg");
        if (await vector.count()) {
          await expect(vector).toHaveAttribute("viewBox", /^\d+ \d+ \d+ \d+$/);
          await expect(vector.locator("image")).toHaveAttribute("href", "/room-studio.svg");
        }
        for (let index = 0; index < 6; index++) {
          await page.keyboard.press(index % 2 ? "Shift+Tab" : "Tab");
          expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
        }
        await page.keyboard.press("Escape");
        await expect(dialog).not.toBeVisible();
        await expect(trigger).toBeFocused();
        await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
      }
      expect(errors).toEqual([]);
    });

    test("power zooms the monitor into a readable boot and returns to the same desktop", async ({ page }) => {
      await page.goto("/");
      const roomWidth = (await page.getByTestId("computer").boundingBox())!.width;
      await page.getByRole("button", { name: /Turn on Victor's computer/ }).click();
      const focus = page.getByRole("dialog", { name: "Your seat at my desk." });
      await expect(focus).toBeVisible();
      await expect(focus).toHaveCSS("opacity", "1");
      const focusedWidth = (await page.getByTestId("computer").boundingBox())!.width;
      expect(focusedWidth).toBeGreaterThan(roomWidth * 1.3);
      expect(await page.locator(".boot-lines").evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(10);
      await expect(focus.getByRole("progressbar")).toBeVisible();
      await focus.getByRole("button", { name: "Skip startup" }).click();
      await expect(page.getByTestId("desktop")).toBeVisible();
      await focus.getByRole("button", { name: "Back to room" }).click();
      await expect(focus).not.toBeVisible();
      await expect(page.getByTestId("computer")).toHaveAttribute("data-power", "on");
      await expect(page.getByRole("button", { name: "Shut down computer", exact: true })).toBeFocused();
      await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
    });

    test("the physical power switch and project reminder have clear touch areas", async ({ page }) => {
      await page.goto("/");
      const switchButton = page.getByRole("button", { name: "Power on computer", exact: true });
      const reminder = page.locator(".sticky-reminder");
      for (const target of [switchButton, reminder]) {
        await target.scrollIntoViewIfNeeded();
        const hitArea = await target.evaluate(element => {
          const rect = element.getBoundingClientRect();
          const centerX = rect.x + rect.width / 2;
          const centerY = rect.y + rect.height / 2;
          // A 24px square inside each control must reach that control, including
          // its corners. Center-only clicks miss partially covered touch areas.
          return {
            width: rect.width,
            height: rect.height,
            clear: [-11.5, 0, 11.5].every(dx => [-11.5, 0, 11.5].every(dy => {
              const hit = document.elementFromPoint(centerX + dx, centerY + dy);
              return hit === element || (hit !== null && element.contains(hit));
            })),
          };
        });
        expect(hitArea.width).toBeGreaterThanOrEqual(24);
        expect(hitArea.height).toBeGreaterThanOrEqual(24);
        expect(hitArea.clear).toBe(true);
      }
      await switchButton.click();
      const focus = page.getByRole("dialog", { name: "Your seat at my desk.", exact: true });
      await expect(focus).toBeVisible();
      await focus.getByRole("button", { name: "Skip startup", exact: true }).click();
      await expect(page.getByTestId("desktop")).toBeVisible();
      await focus.getByRole("button", { name: "Back to room", exact: true }).click();
      await reminder.click();
      await expect(page.getByRole("dialog", { name: "Projects", exact: true })).toBeVisible();
    });
  });
}

test("the travel postcard serves a real high-resolution photo and verified trip caption", async ({ page }) => {
  await page.goto("/");
  await page.locator(".note-travel").click();
  const dialog = page.getByRole("dialog", { name: "Peru · September 2026" });
  await expect(dialog.getByRole("link", { name: "View original photo" })).toHaveAttribute("href", "/peru-travel.webp");
  const response = await page.request.get("/peru-travel.webp");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/webp");
  const dimensions = await page.evaluate(async () => {
    const photo = new Image();
    photo.src = "/peru-travel.webp";
    await photo.decode();
    return { width: photo.naturalWidth, height: photo.naturalHeight };
  });
  expect(dimensions).toEqual({ width: 2400, height: 1800 });
});

test("the breeze follows pause and reduced-motion preferences", async ({ page }) => {
  await page.goto("/");
  const curtain = page.locator(".breeze-curtain");
  await expect(curtain).toHaveCSS("animation-play-state", "running");
  await page.getByRole("button", { name: "Pause motion", exact: true }).click();
  await expect(curtain).toHaveCSS("animation-play-state", "paused");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(curtain).toHaveCSS("animation-name", "none");
});
