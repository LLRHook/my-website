import { test, expect, type Page } from "@playwright/test";

async function startComputer(page: Page) {
  await page.getByRole("button", { name: /Turn on Victor's computer/ }).click();
  await page.getByRole("button", { name: "Skip startup", exact: true }).click();
  await expect(page.getByTestId("computer")).toHaveAttribute("data-power", "on");
  await page.getByRole("dialog", { name: "Your seat at my desk." }).getByRole("button", { name: "Back to room" }).click();
}

test("computer begins off, completes every boot stage, and can shut down and restart", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await expect(page.getByTestId("computer")).toHaveAttribute("data-power", "off");
  await expect(page.getByTestId("desktop")).toHaveCount(0);
  await page.getByRole("button", { name: "Power on computer", exact: true }).click();

  const boot = page.getByTestId("boot-screen");
  for (const line of ["VI BIOS", "Checking memory", "Mounting /home/victor", "Loading projects", "Checking window cat", "Starting a good day"]) {
    await expect(boot.locator("p").filter({ hasText: line })).toBeAttached();
  }
  await expect(page.getByRole("progressbar", { name: "Starting computer" })).toHaveAttribute("aria-valuenow", "100");
  await expect(page.getByTestId("desktop")).toBeVisible();
  await expect(boot).toHaveCount(0);

  await page.getByRole("button", { name: "Shut down computer", exact: true }).click();
  await expect(page.getByTestId("computer")).toHaveAttribute("data-power", "off");
  await startComputer(page);
  await expect(page.getByRole("button", { name: "Open About me", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("a photo opens its close-up and its experience link starts the requested app", async ({ page }) => {
  await page.goto("/");
  const note = page.getByRole("button", { name: /Open experience note$/ });
  await note.click();
  const photo = page.getByRole("dialog", { name: "At the podium" });
  await expect(photo).toBeVisible();
  await expect(photo.getByRole("img", { name: "A moment at the conference podium" })).toBeVisible();
  await expect(page.getByTestId("computer")).toHaveAttribute("data-power", "off");
  await photo.getByRole("button", { name: "Explore my experience" }).click();
  await expect(page.getByTestId("boot-screen")).toBeVisible();
  await page.getByRole("button", { name: "Skip startup", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Resume", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Experience", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(note).toBeFocused();
});

test("public app links open the requested content and follow hash navigation", async ({ page }) => {
  await page.goto("/#work");
  await expect(page.getByRole("dialog", { name: "Projects", exact: true })).toBeVisible();
  await expect(page.getByTestId("computer")).toHaveAttribute("data-power", "on");
  await page.evaluate(() => { window.location.hash = "resume"; });
  await expect(page.getByRole("dialog", { name: "Resume", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Experience", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Shut down computer", exact: true })).toBeFocused();
});

test("all apps open, sidebar navigation works, and Escape returns focus to the launcher", async ({ page }) => {
  await page.goto("/");
  await startComputer(page);
  const launcher = page.getByRole("button", { name: "Open About me", exact: true });
  await launcher.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toHaveAccessibleName("About me");
  await expect(dialog.getByRole("button", { name: "Close window and return to room" })).toBeFocused();

  const apps = dialog.getByRole("navigation", { name: "Computer applications" });
  for (const label of ["Projects", "Resume", "Off the clock", "Contact", "About me"]) {
    await apps.getByRole("button", { name: label, exact: true }).click();
    await expect(dialog).toHaveAccessibleName(label);
    await expect(apps.getByRole("button", { name: label, exact: true })).toHaveAttribute("aria-current", "page");
  }
  for (let tab = 0; tab < 18; tab++) {
    await page.keyboard.press(tab < 9 ? "Tab" : "Shift+Tab");
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(launcher).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

test("repeated app visits and power cycles leave one window and restore room scrolling", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await startComputer(page);
  const initialElements = await page.locator("*").count();
  for (let visit = 0; visit < 12; visit++) {
    const label = visit % 2 ? "Resume" : "About me";
    await page.getByRole("button", { name: `Open ${label}`, exact: true }).click();
    await expect(page.locator("dialog[open]")).toHaveCount(1);
    await page.getByRole("button", { name: "Close window and return to room" }).click();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(page.locator(".window-content")).toBeEmpty();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  }
  expect(await page.locator("*").count()).toBe(initialElements);
  await page.getByRole("button", { name: "Shut down computer", exact: true }).click();
  await startComputer(page);
  await expect(page.getByTestId("desktop")).toBeVisible();
  expect(errors).toEqual([]);
});

test("room controls pause motion, change lighting, and let the cat return to sleep", async ({ page }) => {
  await page.goto("/");
  const room = page.locator(".workspace");
  await expect(room).toHaveAttribute("data-moving", "true");
  await page.getByRole("button", { name: "Pause motion", exact: true }).click();
  await expect(room).toHaveAttribute("data-moving", "false");
  await page.getByRole("button", { name: /Switch to evening$/ }).click();
  await expect(room).toHaveAttribute("data-night", "true");
  await page.getByRole("button", { name: /Switch to daylight$/ }).click();
  await expect(room).toHaveAttribute("data-night", "false");
  await page.getByRole("button", { name: /Resume ambient motion$/ }).click();
  await expect(room).toHaveAttribute("data-moving", "true");
  await expect(page.getByRole("button", { name: "Meet the window cat up close", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Say hello to the cat", exact: true }).click();
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Let the cat sleep", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Say hello to the cat", exact: true })).toBeVisible({ timeout: 8000 });
});

test("reduced motion skips the timed boot and pauses ambient CSS", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".workspace")).toHaveAttribute("data-moving", "false");
  await page.getByRole("button", { name: "Power on computer", exact: true }).click();
  await expect(page.getByTestId("desktop")).toBeVisible({ timeout: 1000 });
  await expect(page.getByTestId("boot-screen")).toHaveCount(0);
  const animations = await page.locator(".cat-body, .cat-head, .cat-tail, .cat-paw, .cat-zzz").evaluateAll((elements) => elements.map((element) => {
    const css = getComputedStyle(element);
    return { name: css.animationName, state: css.animationPlayState, duration: css.animationDuration };
  }));
  expect(animations.length).toBeGreaterThan(0);
  for (const animation of animations) {
    expect(animation.name === "none" || animation.state.split(",").every((state) => state.trim() === "paused") || animation.duration.split(",").every((duration) => parseFloat(duration) <= 0.01)).toBe(true);
  }
});

test("contact uses the public email and professional profile links", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("navigation", { name: "Open a desktop app" }).getByRole("button", { name: /^Contact(?:\s*↗)?$/ }).click();
  const dialog = page.getByRole("dialog", { name: "Contact", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link", { name: /victor.n.ivanov@gmail.com/ })).toHaveAttribute("href", "mailto:victor.n.ivanov@gmail.com");
  await expect(dialog.getByRole("link", { name: "GitHub ↗", exact: true })).toHaveAttribute("href", "https://github.com/LLRHook");
  await expect(dialog.getByRole("link", { name: "LinkedIn ↗", exact: true })).toHaveAttribute("href", "https://www.linkedin.com/in/victorivanovofficial/");
  for (const link of await dialog.locator('a[target="_blank"]').all()) {
    await expect(link).toHaveAttribute("rel", /noopener/);
  }
});

test("resume prints its readable screen edition", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => { window.print = () => { document.documentElement.dataset.printRequested = "true"; }; });
  await page.getByRole("navigation", { name: "Open a desktop app" }).getByRole("button", { name: /^Resume(?:\s*↗)?$/ }).click();
  await page.getByRole("button", { name: "Print / save PDF", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-print-requested", "true");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".resume-content")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Georgia Institute of Technology", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "University of Maryland, Baltimore County", exact: true })).toBeVisible();
  await expect(page.locator(".room-stage")).not.toBeVisible();
});
