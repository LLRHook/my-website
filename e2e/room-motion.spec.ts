import { test, expect, type Page } from "@playwright/test";

type FrameSnapshot = { scheduled: number; pending: number; lastTouchPrevented: boolean | null };

async function observeFrames(page: Page) {
  await page.addInitScript(() => {
    const request = window.requestAnimationFrame.bind(window);
    const cancel = window.cancelAnimationFrame.bind(window);
    const pending = new Set<number>();
    let scheduled = 0;
    let lastTouchPrevented: boolean | null = null;
    window.requestAnimationFrame = (callback) => {
      let id = 0;
      id = request((time) => {
        pending.delete(id);
        callback(time);
      });
      scheduled++;
      pending.add(id);
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      pending.delete(id);
      cancel(id);
    };
    document.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") queueMicrotask(() => { lastTouchPrevented = event.defaultPrevented; });
    }, { capture: true, passive: true });
    Object.assign(window, { roomFrameSnapshot: () => ({ scheduled, pending: pending.size, lastTouchPrevented }) });
  });
}

function frames(page: Page) {
  return page.evaluate(() => (window as Window & { roomFrameSnapshot: () => FrameSnapshot }).roomFrameSnapshot());
}

function attention(page: Page) {
  return page.locator(".room-stage").evaluate((element) => ({
    x: Number((element as HTMLElement).style.getPropertyValue("--room-look-x")),
    y: Number((element as HTMLElement).style.getPropertyValue("--room-look-y")),
  }));
}

async function moveIntoRoom(page: Page) {
  const stage = page.locator(".room-stage");
  await expect(stage).toHaveAttribute("data-room-motion", "active");
  const bounds = await stage.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width * 0.82, bounds!.y + bounds!.height * 0.42);
  await expect.poll(async () => (await attention(page)).x).toBeGreaterThan(0.45);
}

async function expectIdleFrames(page: Page) {
  await expect.poll(async () => (await frames(page)).pending, { timeout: 4000 }).toBe(0);
  const resting = await frames(page);
  // Measure a quiet interval after interpolation ends; CSS scenery keeps moving.
  await page.waitForTimeout(300);
  expect((await frames(page)).scheduled).toBe(resting.scheduled);
}

test.describe("desktop room motion", () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  test("pointer attention moves light and notes gently, then releases the JavaScript frame loop", async ({ page }) => {
    await observeFrames(page);
    await page.goto("/");
    await expect(page.locator(".room-stage")).toHaveAttribute("data-room-motion", "active");
    await expectIdleFrames(page);
    const noteRotation = await page.locator(".note-profile").evaluate(element => getComputedStyle(element).transform);

    await moveIntoRoom(page);
    const motion = await page.locator(".atmosphere-light").evaluate(element => getComputedStyle(element).translate);
    expect(Math.abs(parseFloat(motion))).toBeGreaterThan(2);
    expect(Math.abs(parseFloat(motion))).toBeLessThanOrEqual(25);
    const note = await page.locator(".note-profile").evaluate(element => ({
      translate: getComputedStyle(element).translate,
      transform: getComputedStyle(element).transform,
      rotate: getComputedStyle(element).rotate,
    }));
    expect(Math.abs(parseFloat(note.translate))).toBeGreaterThan(0);
    expect(Math.abs(parseFloat(note.translate))).toBeLessThanOrEqual(3);
    expect(Math.abs(parseFloat(note.rotate))).toBeLessThan(0.3);
    expect(note.transform).toBe(noteRotation);
    await expectIdleFrames(page);
    const atRest = await attention(page);
    expect(Math.abs(atRest.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(atRest.y)).toBeLessThanOrEqual(1);

    await page.mouse.move(0, 0);
    await expect.poll(() => attention(page)).toEqual({ x: 0, y: 0 });
    await expectIdleFrames(page);
  });

  test("pause, an open detail, and reduced motion stop pointer work and ambient animation", async ({ page }) => {
    await observeFrames(page);
    await page.goto("/");
    await moveIntoRoom(page);
    await page.getByRole("button", { name: "Pause motion", exact: true }).click();
    await expect(page.locator(".room-stage")).toHaveAttribute("data-room-motion", "still");
    await expect.poll(() => attention(page)).toEqual({ x: 0, y: 0 });
    await expect(page.locator(".atmosphere-light-breath")).toHaveCSS("animation-play-state", "paused");
    const paused = await frames(page);
    const scene = (await page.locator(".room-scene").boundingBox())!;
    await page.mouse.move(scene.x + scene.width * 0.8, scene.y + scene.height * 0.3);
    expect(await attention(page)).toEqual({ x: 0, y: 0 });
    expect((await frames(page)).scheduled).toBe(paused.scheduled);

    await page.getByRole("button", { name: /Resume ambient motion/ }).click();
    await moveIntoRoom(page);
    await page.locator(".note-profile").click();
    const detail = page.getByRole("dialog", { name: "A familiar face.", exact: true });
    await expect(detail).toBeVisible();
    await expect(page.locator(".room-stage")).toHaveAttribute("data-room-motion", "still");
    await expect.poll(() => attention(page)).toEqual({ x: 0, y: 0 });
    await expectIdleFrames(page);
    await detail.getByRole("button", { name: "Back to room", exact: true }).click();
    await expect(detail).not.toBeVisible();

    await moveIntoRoom(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator(".room-stage")).toHaveAttribute("data-room-motion", "still");
    await expect.poll(() => attention(page)).toEqual({ x: 0, y: 0 });
    await expect(page.locator(".atmosphere-light-breath")).toHaveCSS("animation-name", "none");
    await expect(page.locator(".atmosphere-motes")).not.toBeVisible();
    await expectIdleFrames(page);
  });
});

test.describe("touch room motion", () => {
  test.use({ viewport: { width: 390, height: 600 }, isMobile: true, hasTouch: true });

  test("a real touch tap settles by itself and leaves page scrolling available", async ({ page, browserName }) => {
    await observeFrames(page);
    await page.goto("/");
    await expect(page.locator(".room-stage")).toHaveAttribute("data-room-motion", "active");
    const scene = page.locator(".room-scene");
    await scene.scrollIntoViewIfNeeded();
    const bounds = (await scene.boundingBox())!;
    // Clear plaster above the computer: a touch should not open an object here.
    await page.touchscreen.tap(bounds.x + bounds.width * 0.72, bounds.y + bounds.height * 0.15);
    await expect.poll(async () => (await attention(page)).x).toBeGreaterThan(0.15);
    expect((await frames(page)).lastTouchPrevented).toBe(false);
    expect(await page.locator("dialog[open]").count()).toBe(0);

    const beforeScroll = await page.evaluate(() => window.scrollY);
    if (browserName === "chromium") {
      // Drive an actual touch drag, including the browser's scroll/cancel path.
      const session = await page.context().newCDPSession(page);
      const x = bounds.x + bounds.width * 0.72;
      const y = bounds.y + bounds.height * 0.15;
      try {
        await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
        for (let step = 1; step <= 6; step++) {
          await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y - step * 20, id: 1 }] });
        }
        await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      } finally { await session.detach(); }
    } else {
      // Playwright provides touch taps, but neither drags nor wheel input in
      // mobile WebKit. Check browser scrolling plus real-touch cancellation.
      await page.evaluate(distance => window.scrollBy(0, distance), beforeScroll > 60 ? -160 : 160);
    }
    await expect.poll(async () => Math.abs(await page.evaluate(() => window.scrollY) - beforeScroll)).toBeGreaterThan(20);
    expect((await frames(page)).lastTouchPrevented).toBe(false);
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
    await expect.poll(() => attention(page), { timeout: 5000 }).toEqual({ x: 0, y: 0 });
    await expectIdleFrames(page);
  });
});
