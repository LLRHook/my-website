import { test, expect } from "@playwright/test";

const objects = [
  ["Bookshelf. Currently reading Red Rising", "Currently reading · Red Rising", "books"],
  ["Diploma. B.S. Computer Science, UMBC", "B.S. Computer Science · UMBC", "diploma"],
  ["Profile photo", "Victor Ivanov", null],
  ["Conference photo", "At the podium", null],
  ["Travel photo from Peru", "Peru · September 2026", null],
  ["Poké Ball. Magic and Pokémon", "Magic & Pokémon", "pokeball"],
  ["Buffalo Wild Wings carton", "Buffalo Wild Wings", "bww"],
  ["Plants", "Plants", "plants"],
] as const;

for (const viewport of [{ width: 320, height: 740 }, { width: 390, height: 844 }, { width: 412, height: 915 }, { width: 1440, height: 1000 }]) {
  test.describe(`${viewport.width}px close-ups`, () => {
    test.use({ viewport });

    test("hotspots open encoded close-ups or photos and restore focus", async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/");
      for (const [label, title, detail] of objects) {
        const trigger = page.getByRole("button", { name: label, exact: true });
        await trigger.click();
        const dialog = page.getByRole("dialog", { name: title, exact: true });
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole("heading", { name: title, exact: true })).toBeVisible();
        await expect(dialog.getByRole("button", { name: "Back to room" })).toBeFocused();
        const bounds = (await dialog.boundingBox())!;
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.y).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width + 1);
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height + 1);
        expect(await dialog.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
        if (detail) {
          const image = dialog.locator("picture > img");
          await expect(image).toHaveAttribute("src", `/room/detail-${detail}.webp`);
          await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
          const source = await image.evaluate((el: HTMLImageElement) => el.currentSrc);
          expect(source).toMatch(new RegExp(`/room/detail-${detail}\\.(avif|webp)$`));
          const response = await page.request.get(source);
          expect(response.status()).toBe(200);
          expect(response.headers()["content-type"]).toMatch(/^image\//);
          expect((await response.body()).length).toBeGreaterThan(0);
        }
        for (let index = 0; index < 6; index++) {
          await page.keyboard.press(index % 2 ? "Shift+Tab" : "Tab");
          expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
        }
        await page.keyboard.press("Escape");
        await expect(dialog).not.toBeVisible();
        await expect(trigger).toBeFocused();
        await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
      }
      expect(errors).toEqual([]);
    });

    test("power opens readable boot and expand returns to the same desktop", async ({ page }) => {
      await page.goto("/");
      const roomWidth = (await page.getByTestId("computer").boundingBox())!.width;
      await page.getByRole("button", { name: "Turn on Victor's computer", exact: true }).click();
      const focus = page.getByRole("dialog", { name: "Your seat at my desk." });
      await expect(focus).toBeVisible();
      await expect(focus).toHaveCSS("opacity", "1");
      expect((await page.getByTestId("computer").boundingBox())!.width).toBeGreaterThan(roomWidth * 1.3);
      await expect(focus.getByRole("progressbar")).toBeVisible();
      await focus.getByRole("button", { name: "Skip startup" }).click();
      await expect(page.getByTestId("desktop")).toBeVisible();
      await focus.getByRole("button", { name: "Back to room" }).click();
      await expect(focus).not.toBeVisible();
      await expect(page.locator(".scene-screen")).toBeFocused();
      await page.getByRole("button", { name: "Expand computer screen", exact: true }).click();
      await expect(focus).toBeVisible();
      await expect(focus.getByRole("button", { name: "Expand computer screen" })).toBeDisabled();
      await focus.getByRole("button", { name: "Back to room" }).click();
      await expect(page.getByTestId("computer")).toHaveAttribute("data-power", "on");
      await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
    });

    test("the sticky-note hotspot starts Projects", async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button", { name: "Sticky note: one more commit. Open Projects" }).click();
      await page.getByRole("button", { name: "Skip startup", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Projects", exact: true })).toBeVisible();
    });
  });
}

test("the travel photo keeps the original image and trip caption", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Travel photo from Peru" }).click();
  const dialog = page.getByRole("dialog", { name: "Peru · September 2026" });
  await expect(dialog.getByRole("link", { name: "View original photo" })).toHaveAttribute("href", "/peru-travel.webp");
  const response = await page.request.get("/peru-travel.webp");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/webp");
});

test("window and lamp hotspots and toolbar swap the loaded active still independently", async ({ page }) => {
  await page.goto("/");
  const active = page.locator(".room-scene > picture > img[data-active=true]");
  const expectVariant = async (variant: string) => {
    await expect(active).toHaveAttribute("src", `/room/${variant}-1920.webp`);
    await expect.poll(() => active.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  };
  await expectVariant("day_lamp_on");
  const window = page.getByRole("button", { name: "Window. Switch to evening", exact: true });
  await expect(window).toHaveAttribute("aria-pressed", "false");
  await window.click();
  await expectVariant("night_lamp_on");
  await expect(page.getByRole("button", { name: "Window. Switch to daylight", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Desk lamp. Switch off", exact: true }).click();
  await expectVariant("night_lamp_off");
  await expect(page.getByRole("button", { name: "Desk lamp. Switch on", exact: true })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Evening. Switch to daylight", exact: true }).click();
  await expectVariant("day_lamp_off");
  await page.getByRole("button", { name: "Lamp off. Switch on", exact: true }).click();
  await expectVariant("day_lamp_on");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
});
