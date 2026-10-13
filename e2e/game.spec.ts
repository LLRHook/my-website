import { test, expect, type Page } from "@playwright/test";
import { loadGameModules } from "./support/load-game-modules";
import type { Dir, MapId } from "../game/src/data/ids";

test("game boots cleanly with a single module, route CSP, and keyboard title flow", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  const response = await page.goto("/projects");
  expect(response?.headers()["content-security-policy"]).toContain("script-src 'self'");
  await expect(page.locator("script")).toHaveCount(1);
  await expect(page.locator("script")).toHaveAttribute("src", /^\/game\/main\.js(\?v=[0-9a-f]{10})?$/);
  await expect(page.locator("script")).toHaveAttribute("type", "module");
  const game = page.locator("#game");
  await expect(game).toHaveAttribute("data-ready", ""); await expect(game).toHaveAttribute("data-scene", "title");
  await expect(page.locator("table.projects")).toBeVisible();
  const canvas = game.locator("canvas"); const attract = await canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL());
  await game.focus(); await press(page, "Enter");
  await expect.poll(() => canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL())).not.toBe(attract);
  await expect(game).toHaveAttribute("data-scene", "title");
  await press(page, "Enter"); await expect(game).toHaveAttribute("data-scene", "intro");
  expect(errors).toEqual([]);
  await press(page, "Escape"); await expect(game).not.toBeFocused();
});

test("projects loads one game request and reaches data-ready", async ({ page }, info) => {
  test.skip(!["chromium", "webkit-mobile"].includes(info.project.name), "Desktop browser projects only");
  const requests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/game/")) {
      requests.push(request.url());
    }
  });
  await page.goto("/projects");
  await expect(page.locator("#game")).toHaveAttribute("data-ready", "");
  expect(requests).toHaveLength(1);
});

test.describe("touch controls", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  test("START twice reaches intro and 320px has no horizontal overflow", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" }); await page.goto("/projects");
    const game = page.locator("#game"); await expect(game).toHaveAttribute("data-ready", "");
    const canvas = game.locator("canvas"); const attract = await canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL());
    await game.locator('[data-button="start"]').tap();
    await expect.poll(() => canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL())).not.toBe(attract);
    await game.locator('[data-button="start"]').tap(); await expect(game).toHaveAttribute("data-scene", "intro");
    await page.setViewportSize({ width: 320, height: 700 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expect(page.locator("table.projects")).toBeVisible();
  });
});

test("options persist before a save exists", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/projects"); const game = page.locator("#game"); await expect(game).toHaveAttribute("data-ready", "");
  const frame = () => game.locator("canvas").evaluate((element) => (element as HTMLCanvasElement).toDataURL());
  const attract = await frame();
  await game.focus(); await press(page, "Enter"); await expect.poll(frame).not.toBe(attract);
  const menu = await frame(); await press(page, "ArrowDown"); await expect.poll(frame).not.toBe(menu);
  await press(page, "Enter");
  await expect(game).toHaveAttribute("data-scene", "menu"); await press(page, "ArrowRight");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("codelings.options.v1") ?? "{}").textSpeed)).toBe("fast");
  await press(page, "x"); await expect(game).toHaveAttribute("data-scene", "title");
  await page.reload(); await expect(game).toHaveAttribute("data-ready", "");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("codelings.options.v1")!).textSpeed)).toBe("fast");
});


async function press(page: Page, key: string, options?: { delay?: number }): Promise<void> {
  await page.keyboard.press(key, options);
  // Let the simulation consume the edge and observe keyup before another press or state read.
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

async function finishIntro(page: Page): Promise<void> {
  const game = page.locator("#game");
  for (let presses = 0; presses < 40; presses++) {
    if (await game.getAttribute("data-scene") === "overworld") {
      return;
    }
    await press(page, "z", { delay: 35 });
    await page.waitForTimeout(50);
  }
  await expect(game).toHaveAttribute("data-scene", "overworld");
}
async function hold(page: Page, key: string, duration: number): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForTimeout(duration);
  await page.keyboard.up(key);
  await page.waitForTimeout(150);
}

async function walk(page: Page, key: string, count: number): Promise<void> {
  for (let index = 0; index < count; index++) {
    await press(page, key, { delay: test.info().project.name === "iphone" ? 180 : 120 });
    await page.waitForTimeout(330);
  }
}

test("choose a starter, encounter, use a Fork Ball and open the Codex without errors", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/projects?seed=1&encounter=1");
  const game = page.locator("#game");
  await expect(game).toHaveAttribute("data-ready", "");
  await game.focus();
  await press(page, "Enter", { delay: 35 });
  await page.waitForTimeout(100);
  await press(page, "Enter", { delay: 35 });
  await finishIntro(page);
  await walk(page, "ArrowRight", 2);
  await walk(page, "ArrowUp", 2);
  await expect(game).toHaveAttribute("data-map", "house");
  await page.waitForTimeout(350);
  await walk(page, "ArrowDown", 4);
  await walk(page, "ArrowLeft", 3);
  await walk(page, "ArrowDown", 1);
  await expect(game).toHaveAttribute("data-map", "sterling");
  await page.waitForTimeout(350);
  await walk(page, "ArrowDown", 1);
  await walk(page, "ArrowRight", 9);
  await walk(page, "ArrowUp", 2);
  await expect(game).toHaveAttribute("data-map", "lab");
  await page.waitForTimeout(350);
  await walk(page, "ArrowUp", 4);
  await press(page, "z", { delay: 35 });
  for (let index = 0; index < 25 && await game.getAttribute("data-scene") !== "menu"; index++) {
    await press(page, "z", { delay: 35 });
    await page.waitForTimeout(70);
  }
  await expect(game).toHaveAttribute("data-scene", "menu");
  await press(page, "z", { delay: 35 });
  await page.waitForTimeout(100);
  await press(page, "z", { delay: 35 });
  await finishIntro(page);
  await expect(game).toHaveAttribute("data-caught", "1");
  // Canvas labels expose the same dialogue and menu choices to assistive technology.
  const canvas = game.locator("canvas");
  await expect(canvas).toHaveAttribute("aria-label", /Dialogue:/);
  for (let index = 0; index < 30 && (await canvas.getAttribute("aria-label"))?.includes("Dialogue:"); index++) {
    await press(page, "z", { delay: 35 });
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(200);
  await press(page, "Enter", { delay: 35 });
  await expect(game).toHaveAttribute("data-scene", "menu");
  for (let index = 0; index < 4; index++) {
    await press(page, "ArrowDown", { delay: 35 });
    await page.waitForTimeout(50);
  }
  await press(page, "z", { delay: 35 });
  await expect.poll(() => page.evaluate(() => localStorage.getItem("codelings.save.v1"))).not.toBeNull();
  const starterSave = await page.evaluate(() => JSON.parse(localStorage.getItem("codelings.save.v1")!));
  expect(starterSave.party).toHaveLength(1);
  expect(starterSave.party[0].level).toBe(5);
  expect(starterSave.bag.forkBall).toBe(5);
  await press(page, "x", { delay: 35 });
  await page.waitForTimeout(100);
  await press(page, "x", { delay: 35 });
  await expect(game).toHaveAttribute("data-scene", "overworld");
  await walk(page, "ArrowDown", 4);
  await expect(game).toHaveAttribute("data-map", "sterling");
  await page.waitForTimeout(350);
  await walk(page, "ArrowDown", 2);
  await walk(page, "ArrowLeft", 5);
  await walk(page, "ArrowUp", 11);
  await expect(game).toHaveAttribute("data-map", "route1");
  await walk(page, "ArrowUp", 3);
  await walk(page, "ArrowLeft", 5);
  await walk(page, "ArrowUp", 6);
  await expect(game).toHaveAttribute("data-scene", "battle");
  const caughtBefore = Number(await game.getAttribute("data-caught"));
  let throws = 0;
  for (let tick = 0; tick < 180 && await game.getAttribute("data-scene") === "battle"; tick++) {
    const label = await canvas.getAttribute("aria-label") ?? "";
    if (label.includes("Battle main menu:")) {
      if (throws < 5) {
        // The main menu starts on FIGHT. Right selects BAG.
        await press(page, "ArrowRight", { delay: 35 });
        await press(page, "z", { delay: 35 });
        await expect(game).toHaveAttribute("data-scene", "menu");
        await expect(canvas).toHaveAttribute("aria-label", /Bag:.*Fork Ball/);
        await press(page, "z", { delay: 35 });
        await expect(game).toHaveAttribute("data-scene", "battle");
        throws++;
      } else {
        // Five full-health catches may all fail; RUN completes the existing escape outcome assertion.
        await press(page, "ArrowDown", { delay: 35 });
        await press(page, "ArrowRight", { delay: 35 });
        await press(page, "z", { delay: 35 });
      }
    } else if (label.includes("Battle dialogue:")) {
      await press(page, "z", { delay: 35 });
    } else if (label.includes("Battle team menu:")) {
      await press(page, "z", { delay: 35 });
    }
    await page.waitForTimeout(100);
  }
  expect(throws).toBeGreaterThan(0);
  expect(Number(await game.getAttribute("data-caught")) > caughtBefore
    || await game.getAttribute("data-scene") !== "battle").toBe(true);
  for (let tick = 0; tick < 30; tick++) {
    const label = await canvas.getAttribute("aria-label") ?? "";
    if (label.includes("YES / NO")) {
      await press(page, "x", { delay: 35 });
    } else if (label.includes("Dialogue:")) {
      await press(page, "z", { delay: 35 });
    } else {
      break;
    }
    await page.waitForTimeout(100);
  }
  await expect(game).toHaveAttribute("data-scene", "overworld");
  await press(page, "Enter", { delay: 35 });
  await press(page, "z", { delay: 35 });
  await expect(game).toHaveAttribute("data-scene", "codex");
  const starterIndex = await page.evaluate((id: number) => {
    const repos = JSON.parse(document.querySelector<HTMLElement>("#game")!.dataset.repos!) as
      { id: number; pushedAt: string }[];
    return repos.sort((a, b) => a.pushedAt.localeCompare(b.pushedAt) || a.id - b.id)
      .findIndex((repo) => repo.id === id);
  }, starterSave.party[0].species);
  for (let index = 0; index < starterIndex; index++) {
    await press(page, "ArrowDown", { delay: 35 });
    await page.waitForTimeout(50);
  }
  await press(page, "z", { delay: 35 });
  await expect(canvas).toHaveAttribute("aria-label", /Codex entry:/);
  await press(page, "z", { delay: 35 });
  await expect(canvas).toHaveAttribute("aria-label", /Open on GitHub\? YES \/ NO/);
  const popupPromise = page.waitForEvent("popup");
  await press(page, "z", { delay: 35 });
  const popup = await popupPromise;
  expect(popup.url()).toMatch(/^https:\/\/github\.com\/LLRHook\//);
  await popup.close();
  expect(errors).toEqual([]);
});

test("every live species has encounters and reproducible four-colour front and back sprites", async ({ page }) => {
  await page.goto("/projects?seed=1");
  await expect(page.locator("#game")).toHaveAttribute("data-ready", "");
  await loadGameModules(page);
  const result = await page.evaluate(() => {
    // This global is confined to the test; the game itself exposes no JavaScript globals.
    const { buildSpecies, drawCreature, MAPS } = globalThis.__codelings;
    const species = buildSpecies(JSON.parse(document.querySelector<HTMLElement>("#game")!.dataset.repos!));
    return species.map((entry) => {
      const front = drawCreature(entry.sprite.seed, entry.sprite.body, entry.type, "front");
      const back = drawCreature(entry.sprite.seed, entry.sprite.body, entry.type, "back");
      const pixels = front.getContext("2d")!.getImageData(0, 0, 32, 32).data;
      const behind = back.getContext("2d")!.getImageData(0, 0, 32, 32).data;
      const colours = new Set<string>();
      const backColours = new Set<string>();
      let frontArea = 0;
      let backArea = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        colours.add(Array.from(pixels.slice(index, index + 4)).join(","));
        backColours.add(Array.from(behind.slice(index, index + 4)).join(","));
        frontArea += pixels[index + 3] ? 1 : 0;
        backArea += behind[index + 3] ? 1 : 0;
      }
      return { id: entry.id, catchable: entry.habitat.some((map) => !!MAPS[map].encounters),
        deterministic: front.toDataURL() === drawCreature(entry.sprite.seed, entry.sprite.body,
          entry.type, "front").toDataURL(), colours: colours.size, backColours: backColours.size,
        front: front.toDataURL(), back: back.toDataURL(), frontArea, backArea,
        cropped: Array.from({ length: 32 }, (_, x) => behind[(31 * 32 + x) * 4 + 3]).some(Boolean) };
    });
  });
  expect(result.length).toBeGreaterThan(0);
  expect(new Set(result.map((entry) => entry.front)).size).toBe(result.length);
  for (const entry of result) {
    expect(entry.catchable, String(entry.id)).toBe(true);
    expect(entry.deterministic, String(entry.id)).toBe(true);
    expect(entry.colours, String(entry.id)).toBeLessThanOrEqual(4);
    expect(entry.backColours, String(entry.id)).toBeLessThanOrEqual(4);
    expect(entry.back, String(entry.id)).not.toBe(entry.front);
    expect(entry.backArea, String(entry.id)).toBeGreaterThan(entry.frontArea);
    expect(entry.cropped, String(entry.id)).toBe(true);
  }
});

test("new game reaches bedroom; stairs and door warp; save and continue preserve the map", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  await page.goto("/projects");
  const game = page.locator("#game");
  await expect(game).toHaveAttribute("data-ready", "");
  await game.focus();
  await press(page, "Enter");
  await page.waitForTimeout(100);
  await press(page, "Enter");
  await expect(game).toHaveAttribute("data-scene", "intro");
  await finishIntro(page);
  await expect(game).toHaveAttribute("data-map", "bedroom");
  // The bedroom starts at (4,4); walk east to the wall, then north onto the stair at (6,2).
  await hold(page, "ArrowRight", 650);
  await hold(page, "ArrowUp", 650);
  await expect(game).toHaveAttribute("data-map", "house");
  // Stair arrival is (6,2). Head south, west to x=3, then out of the door.
  await hold(page, "ArrowDown", 1100);
  await hold(page, "ArrowLeft", 850);
  await hold(page, "ArrowDown", 550);
  await expect(game).toHaveAttribute("data-map", "sterling");
  // data-map changes halfway through the 24-frame door fade; wait for its remaining frames.
  await page.waitForTimeout(250);
  await press(page, "Enter", { delay: 35 });
  await expect(game).toHaveAttribute("data-scene", "menu");
  for (let index = 0; index < 4; index++) {
    await press(page, "ArrowDown", { delay: 35 });
    await page.waitForTimeout(50);
  }
  await press(page, "z", { delay: 35 });
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("codelings.save.v1") ?? "{}").map))
    .toBe("sterling");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("codelings.save.v1")!));
  expect(saved.party).toEqual([]);
  await page.reload();
  await expect(game).toHaveAttribute("data-ready", "");
  await game.focus();
  await press(page, "Enter", { delay: 35 });
  await page.waitForTimeout(100);
  await press(page, "ArrowDown", { delay: 35 });
  await press(page, "z", { delay: 35 });
  await expect(game).toHaveAttribute("data-scene", "overworld");
  await expect(game).toHaveAttribute("data-map", saved.map);
  // Saving immediately after continue verifies position and facing, without a JS game global.
  await page.waitForTimeout(200);
  await press(page, "Enter", { delay: 35 });
  await expect(game).toHaveAttribute("data-scene", "menu");
  for (let index = 0; index < 4; index++) {
    await press(page, "ArrowDown", { delay: 35 });
    await page.waitForTimeout(50);
  }
  await press(page, "z", { delay: 35 });
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("codelings.save.v1")!).playTimeSec))
    .toBeGreaterThan(saved.playTimeSec);
  const resumed = await page.evaluate(() => JSON.parse(localStorage.getItem("codelings.save.v1")!));
  expect([resumed.x, resumed.y, resumed.dir]).toEqual([saved.x, saved.y, saved.dir]);
  expect(errors).toEqual([]);
});


test.describe("phone fullscreen", () => {
  test.beforeEach(async ({ page }, info) => {
    test.skip(!["iphone", "pixel"].includes(info.project.name), "Phone projects only");
    if (info.title.includes("portrait, landscape")) {
      // Chromium cannot resize an active native fullscreen window. Exercise the iOS CSS fallback here.
      await page.addInitScript(() => {
        Object.defineProperty(HTMLElement.prototype, "requestFullscreen", { value: undefined });
      });
    }
    await page.goto("/projects?seed=1");
    await expect(page.locator("#game")).toHaveAttribute("data-ready", "");
    await page.locator('[data-action="fullscreen"]').tap();
    await expect(page.locator("#game")).toHaveAttribute("data-fullscreen", "");
  });

  async function fits(page: Page): Promise<void> {
    await expect.poll(() => page.locator("#game").evaluate((root) => {
      const bounds = root.getBoundingClientRect();
      return [bounds.x, bounds.y, bounds.width, bounds.height];
    })).toEqual([0, 0, page.viewportSize()!.width, page.viewportSize()!.height]);
    await expect.poll(() => page.locator("#game .game-display, #game [data-button], #game .game-exit")
      .evaluateAll((elements) => elements.every((element) => {
        const rect = element.getBoundingClientRect();
        return rect.x >= 0 && rect.y >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight;
      }))).toBe(true);
    const bounds = await page.locator("#game .game-display, #game [data-button], #game .game-exit")
      .evaluateAll((elements) => elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom,
          width: rect.width, height: rect.height };
      }));
    for (const rect of bounds) {
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.right).toBeLessThanOrEqual(page.viewportSize()!.width);
      expect(rect.bottom).toBeLessThanOrEqual(page.viewportSize()!.height);
      expect(rect.width).toBeGreaterThanOrEqual(44);
      expect(rect.height).toBeGreaterThanOrEqual(44);
    }
    const before = await page.evaluate(() => window.scrollY);
    await page.evaluate(() => window.scrollBy(0, 500));
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
  }

  test("portrait, landscape and small phone fit; EXIT restores page scrolling", async ({ page }) => {
    await fits(page);
    await expect.poll(() => page.locator("#game canvas").evaluate((canvas) => canvas.clientWidth))
      .toBeGreaterThanOrEqual(320);
    const viewport = page.viewportSize()!;
    await page.setViewportSize({ width: viewport.height, height: viewport.width });
    await fits(page);
    await expect.poll(() => page.locator("#game canvas").evaluate((canvas) => canvas.clientWidth))
      .toBeGreaterThanOrEqual(320);
    await page.setViewportSize({ width: 320, height: 568 });
    await fits(page);
    await expect.poll(() => page.locator("#game canvas").evaluate((canvas) => canvas.clientWidth))
      .toBeGreaterThanOrEqual(320);
    await page.locator('[data-action="exit-fullscreen"]').tap();
    await expect(page.locator("#game")).not.toHaveAttribute("data-fullscreen");
    await page.evaluate(() => window.scrollBy(0, 500));
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });

  test("Esc, toggle and native browser exit release fullscreen", async ({ page }) => {
    const game = page.locator("#game");
    await press(page, "Escape");
    await expect(game).not.toHaveAttribute("data-fullscreen");
    await expect.poll(() => page.evaluate(() => document.fullscreenElement === null)).toBe(true);
    await expect(page.locator("html")).not.toHaveClass("game-locked");
    await page.locator('[data-action="fullscreen"]').tap();
    await expect(game).toHaveAttribute("data-fullscreen", "");
    await page.locator('[data-action="fullscreen"]').evaluate((button: HTMLButtonElement) => button.click());
    await expect(game).not.toHaveAttribute("data-fullscreen");
    await expect.poll(() => page.evaluate(() => document.fullscreenElement === null)).toBe(true);
    await page.locator('[data-action="fullscreen"]').tap();
    const native = await page.evaluate(() => Boolean(document.fullscreenElement));
    if (native) {
      await page.evaluate(() => document.exitFullscreen());
      await expect(game).not.toHaveAttribute("data-fullscreen");
    } else {
      await page.locator('[data-action="exit-fullscreen"]').tap();
    }
    await expect(page.locator("html")).not.toHaveClass("game-locked");
  });

  test("sliding a captured thumb changes direction without lifting", async ({ page }) => {
    await page.locator('[data-button="start"]').tap();
    await page.waitForTimeout(100);
    await page.locator('[data-button="start"]').tap();
    await finishIntro(page);
    const game = page.locator("#game");
    await expect(game).toHaveAttribute("data-map", "bedroom");
    const pad = (await game.locator(".dpad").boundingBox())!;
    await page.mouse.move(pad.x + pad.width / 2, pad.y + 22);
    await page.mouse.down();
    await expect(game).toHaveAttribute("data-pos", /,up$/);
    await page.mouse.move(pad.x + pad.width - 22, pad.y + pad.height / 2);
    await expect(game).toHaveAttribute("data-pos", /,right$/);
    await expect(game.locator('[data-button="right"]')).toHaveAttribute("data-pressed", "");
    await page.mouse.up();
    await expect(game.locator('[data-button="right"]')).not.toHaveAttribute("data-pressed");
  });

  test("independent B pointer makes sliding movement faster", async ({ page, browserName }) => {
    const game = page.locator("#game");
    await expect(game).toHaveAttribute("data-ready", "");
    await loadGameModules(page);
    // Persist the same unobstructed starting position for both runs.
    await page.evaluate(() => {
      // This global is confined to the test; the game itself exposes no JavaScript globals.
      const { newGame, DEFAULT_OPTIONS, writeSave } = globalThis.__codelings;
      writeSave({ ...newGame("DEV", { ...DEFAULT_OPTIONS }), x: 2, y: 4, dir: "right" });
    });
    const distances: number[] = [];
    for (const running of [false, true]) {
      await page.reload();
      await expect(game).toHaveAttribute("data-ready", "");
      await page.locator('[data-action="fullscreen"]').tap();
      await game.locator('[data-button="start"]').tap();
      await page.waitForTimeout(100);
      await game.locator('[data-button="down"]').tap();
      await game.locator('[data-button="a"]').tap();
      await expect(game).toHaveAttribute("data-scene", "overworld");
      const pad = (await game.locator(".dpad").boundingBox())!;
      const b = (await game.locator('[data-button="b"]').boundingBox())!;
      const session = browserName === "chromium" ? await page.context().newCDPSession(page) : null;
      if (session) {
        const otherThumb = running ? [{ id: 22, x: b.x + b.width / 2, y: b.y + b.height / 2 }] : [];
        await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [
          ...otherThumb, { id: 21, x: pad.x + pad.width / 2, y: pad.y + 22 },
        ] });
        await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [
          ...otherThumb, { id: 21, x: pad.x + pad.width - 22, y: pad.y + pad.height / 2 },
        ] });
      } else {
        // Playwright WebKit has no multi-contact touch API; retain an independent pointer for B.
        if (running) {
          await game.locator('[data-button="b"]').dispatchEvent("pointerdown", { pointerId: 22 });
        }
        await page.mouse.move(pad.x + pad.width / 2, pad.y + 22);
        await page.mouse.down();
        await page.mouse.move(pad.x + pad.width - 22, pad.y + pad.height / 2);
      }
      await page.waitForTimeout(500);
      distances.push(Number((await game.getAttribute("data-pos"))!.split(",")[0]));
      if (session) {
        await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await session.detach();
      } else {
        await page.mouse.up();
        await game.locator('[data-button="b"]').dispatchEvent("pointerup", { pointerId: 22 });
      }
    }
    expect(distances[1]).toBeGreaterThan(distances[0]);
  });
});


test("fullscreen power LED stays inside the desktop bezel", async ({ page }, info) => {
  test.skip(["iphone", "pixel"].includes(info.project.name), "Desktop projects only");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/projects");
  await expect(page.locator("#game")).toHaveAttribute("data-ready", "");
  await page.locator('[data-action="fullscreen"]').click();
  await expect(page.locator("#game")).toHaveAttribute("data-fullscreen", "");
  const bounds = await page.locator("#game .game-bezel").evaluate((bezel) => {
    const shell = bezel.getBoundingClientRect();
    const led = bezel.querySelector(".power-led")!.getBoundingClientRect();
    return { left: led.left - shell.left, top: led.top - shell.top,
      right: shell.right - led.right, bottom: shell.bottom - led.bottom };
  });
  for (const inset of Object.values(bounds)) {
    expect(inset).toBeGreaterThanOrEqual(3);
  }
});


test("a live three-stage Codeling evolves after winning at its threshold", async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/projects?seed=1&encounter=1");
  const game = page.locator("#game");
  const canvas = game.locator("canvas");
  await expect(game).toHaveAttribute("data-ready", "");
  await loadGameModules(page);
  const evolvedName = await page.evaluate(() => {
    const { buildSpecies, createCodeling, newGame, DEFAULT_OPTIONS, writeSave } = globalThis.__codelings;
    const species = buildSpecies(JSON.parse(document.querySelector<HTMLElement>("#game")!.dataset.repos!));
    const entry = species.find((candidate) => candidate.stages === 3)!;
    const level = entry.evolveAt[0];
    const mon = createCodeling(entry, level - 1, () => 0.5);
    mon.exp = level ** 3 - 1;
    const state = newGame("DEV", { ...DEFAULT_OPTIONS, textSpeed: "fast", music: 0, sfx: 0 });
    Object.assign(state, { map: "route1", x: 4, y: 27, dir: "up", party: [mon],
      flags: ["hasStarter", "hasCodex", "defeated:leni", "defeated:kit"],
      seen: [entry.id], caught: [entry.id] });
    if (!writeSave(state)) {
      throw new Error("Evolution fixture did not save");
    }
    return entry.forms[1].name;
  });
  await page.reload();
  await expect(game).toHaveAttribute("data-ready", "");
  await game.focus();
  await press(page, "Enter", { delay: 35 });
  await press(page, "ArrowDown", { delay: 35 });
  await press(page, "z", { delay: 35 });
  await expect(game).toHaveAttribute("data-scene", "overworld");
  await walk(page, "ArrowUp", 1);
  await expect(game).toHaveAttribute("data-scene", "battle");
  for (let tick = 0; tick < 220 && await game.getAttribute("data-scene") === "battle"; tick++) {
    const label = await canvas.getAttribute("aria-label") ?? "";
    if (/Battle (main|moves|learn) menu:|Battle dialogue:/.test(label)) {
      await press(page, "z", { delay: 35 });
    } else {
      await page.waitForTimeout(60);
    }
  }
  await expect(game).toHaveAttribute("data-scene", "evolution");
  await expect(canvas).toHaveAttribute("aria-label", /What\? .* is evolving!/);
  for (let tick = 0; tick < 160 && await game.getAttribute("data-scene") === "evolution"; tick++) {
    const label = await canvas.getAttribute("aria-label") ?? "";
    if (label.includes("Evolution animation:")) {
      await page.waitForTimeout(100);
    } else if (label.includes("Evolution learn:") && label.includes(" / ")) {
      await press(page, "x", { delay: 35 });
    } else {
      await press(page, "z", { delay: 35 });
    }
  }
  await expect(game).toHaveAttribute("data-scene", "overworld");
  await press(page, "Enter", { delay: 35 });
  await press(page, "ArrowDown", { delay: 35 });
  await press(page, "z", { delay: 35 });
  await expect(canvas).toHaveAttribute("aria-label", new RegExp(`Party: ${evolvedName}`));
  expect(errors).toEqual([]);
});


const REGION_BADGES = ["badge:merge", "badge:pipeline", "badge:release"];

async function regionWalk(page: Page, key: string, count: number): Promise<void> {
  const game = page.locator("#game");
  for (let index = 0; index < count; index++) {
    const before = (await game.getAttribute("data-pos"))!.split(",").slice(0, 2).join(",");
    await page.keyboard.down(key);
    try {
      await expect.poll(async () => (await game.getAttribute("data-pos"))!.split(",").slice(0, 2).join(","),
        { intervals: [16], timeout: 2500 }).not.toBe(before);
    } finally {
      await page.keyboard.up(key);
    }
    await page.waitForTimeout(700);
  }
}

async function seedRegion(page: Page, map: MapId, x: number, y: number, dir: Dir = "up",
  extraFlags: readonly string[] = REGION_BADGES, hour = 12, seed = 1): Promise<void> {
  await page.goto(`/projects?seed=${seed}&hour=${hour}`);
  const game = page.locator("#game");
  await expect(game).toHaveAttribute("data-ready", "");
  await loadGameModules(page);
  await page.evaluate(({ map, x, y, dir, extraFlags }) => {
    const { buildSpecies, createCodeling, newGame, DEFAULT_OPTIONS, writeSave, MAPS } = globalThis.__codelings;
    const species = buildSpecies(JSON.parse(document.querySelector<HTMLElement>("#game")!.dataset.repos!));
    const state = newGame("DEV", { ...DEFAULT_OPTIONS, textSpeed: "fast", music: 0, sfx: 0, anims: false });
    const party = Array.from({ length: 6 }, (_, index) => {
      const mon = createCodeling(species[index % species.length], 100, () => 0.5);
      mon.uid = `region-${index}`;
      mon.moves = [{ id: "repo-pulse", pp: 25 }];
      return mon;
    });
    const leaders = new Set(["rhea", "otto", "mira", "champion"]);
    const defeated = Object.values(MAPS).flatMap((entry) => entry.npcs
      .filter((npc) => npc.trainer && !leaders.has(npc.id)).map((npc) => `defeated:${npc.id}`));
    Object.assign(state, { map, x, y, dir, party, seen: [species[0].id], caught: [species[0].id],
      flags: ["hasStarter", "hasCodex", ...defeated, ...extraFlags] });
    if (!writeSave(state)) {
      throw new Error("Region fixture did not save");
    }
  }, { map, x, y, dir, extraFlags: [...extraFlags] });
  await page.reload();
  await expect(game).toHaveAttribute("data-ready", "");
  await game.scrollIntoViewIfNeeded();
  await game.focus();
  await press(page, "Enter", { delay: 100 });
  await press(page, "ArrowDown", { delay: 100 });
  await press(page, "z", { delay: 100 });
  await expect(game).toHaveAttribute("data-scene", "overworld");
  await expect(game).toHaveAttribute("data-map", map);
}

async function clearRegionDialogue(page: Page): Promise<void> {
  const canvas = page.locator("#game canvas");
  for (let index = 0; index < 60 && (await canvas.getAttribute("aria-label"))?.includes("Dialogue:"); index++) {
    await press(page, "z", { delay: 35 });
    await page.waitForTimeout(50);
  }
}

for (const [route, town, x] of [["route3", "bay", 11], ["route4", "ridge", 9]] as const) {
  test(`region: enter ${town} from ${route}`, async ({ page }) => {
    await seedRegion(page, route, x, 1);
    await regionWalk(page, "ArrowUp", 2);
    await expect(page.locator("#game")).toHaveAttribute("data-map", town);
  });
}

async function solvePipeline(page: Page): Promise<void> {
  await regionWalk(page, "ArrowLeft", 2);
  await regionWalk(page, "ArrowUp", 1);
  for (const stage of [0, 1, 2]) {
    await press(page, "z", { delay: 35 });
    await expect(page.locator("#game canvas")).toHaveAttribute("aria-label", /Dialogue:/);
    await clearRegionDialogue(page);
    if (stage < 2) {
      await regionWalk(page, "ArrowRight", 2);
    }
  }

}

for (const [map, name, x, y] of [["gym", "Rhea", 4, 3], ["pipeGym", "Otto", 5, 14],
  ["releaseGym", "Mira", 8, 3], ["tower", "Champion", 5, 3]] as const) {
  test(`region: start ${name} battle`, async ({ page }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const badges = name === "Rhea" ? [] : name === "Otto" ? REGION_BADGES.slice(0, 1)
      : name === "Mira" ? REGION_BADGES.slice(0, 2) : REGION_BADGES;
    await seedRegion(page, map, x, y, "up", badges);
    if (map === "pipeGym") {
      await solvePipeline(page);
      await regionWalk(page, "ArrowLeft", 2);
      await regionWalk(page, "ArrowUp", 10);
    } else {
      await press(page, "z", { delay: 35 });
    }
    const game = page.locator("#game");
    for (let tick = 0; tick < 80 && await game.getAttribute("data-scene") !== "battle"; tick++) {
      await press(page, "z", { delay: 35 });
      await page.waitForTimeout(50);
    }
    await expect(game).toHaveAttribute("data-scene", "battle");
    await expect(game.locator("canvas")).toHaveAttribute("aria-label", /Battle/);
    if (name !== "Champion") {
      await finishRegionBattle(page);
      await clearRegionDialogue(page);
      await press(page, "Enter", { delay: 35 });
      for (let index = 0; index < 4; index++) {
        await press(page, "ArrowDown", { delay: 35 });
      }
      await press(page, "z", { delay: 35 });
      await loadGameModules(page);
      const flags = await page.evaluate(() => globalThis.__codelings.loadSave()!.flags);
      expect(flags).toContain(`badge:${name === "Rhea" ? "merge" : name === "Otto" ? "pipeline" : "release"}`);
      expect(flags).not.toContain("champion");
    }
    expect(errors).toEqual([]);
  });
}

async function finishRegionBattle(page: Page): Promise<void> {
  const game = page.locator("#game");
  const canvas = game.locator("canvas");
  for (let tick = 0; tick < 600 && await game.getAttribute("data-scene") === "battle"; tick++) {
    const label = await canvas.getAttribute("aria-label") ?? "";
    if (/Battle (main|moves) menu:|Battle dialogue:/.test(label)) {
      await press(page, "z", { delay: 35 });
    } else if (label.includes("Battle team menu:")) {
      await press(page, "x", { delay: 35 });
    } else {
      await page.waitForTimeout(60);
    }
  }
  await expect(game).not.toHaveAttribute("data-scene", "battle");
  await page.waitForTimeout(100);
}

test("region: a Champion win reaches ending, KEEP PLAYING uses the Tower exit", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  await seedRegion(page, "tower", 5, 3);
  const game = page.locator("#game");
  const canvas = game.locator("canvas");
  await press(page, "z", { delay: 35 });
  for (let tick = 0; tick < 900 && await game.getAttribute("data-scene") !== "ending"; tick++) {
    const label = await canvas.getAttribute("aria-label") ?? "";
    if (/Battle (main|moves) menu:|Battle dialogue:|Dialogue:/.test(label)) {
      await press(page, "z", { delay: 35 });
    } else if (label.includes("Battle team menu:")) {
      await press(page, "x", { delay: 35 });
    } else {
      await page.waitForTimeout(60);
    }
  }
  await expect(game).toHaveAttribute("data-scene", "ending");
  await press(page, "z", { delay: 35 });
  await expect(canvas).toHaveAttribute("aria-label", /KEEP PLAYING/);
  for (let index = 0; index < 3; index++) {
    await press(page, "ArrowDown", { delay: 35 });
  }
  await press(page, "z", { delay: 35 });
  await expect(game).toHaveAttribute("data-scene", "overworld");
  await expect(game).toHaveAttribute("data-map", "ridge");
  await expect(game).toHaveAttribute("data-pos", "11,2,down");
  await page.waitForTimeout(450);
  await press(page, "Enter", { delay: 35 });
  for (let index = 0; index < 3; index++) {
    await press(page, "ArrowDown", { delay: 35 });
  }
  await press(page, "z", { delay: 35 });
  await expect(canvas).toHaveAttribute("aria-label", /TRAINER CARD: DEV \/ CHAMPION/);
  expect(errors).toEqual([]);
});

test("region: Warden visibly steps aside and the ladder reaches Branch Trail", async ({ page }) => {
  await seedRegion(page, "cave", 9, 5, "up", []);
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(250);
  await page.keyboard.up("ArrowUp");
  await expect(page.locator("#game")).toHaveAttribute("data-pos", "9,5,up");
  await seedRegion(page, "cave", 9, 5, "up", ["badge:merge"]);
  await press(page, "z", { delay: 35 });
  await expect(page.locator("#game canvas")).toHaveAttribute("aria-label", /Dialogue:/);
  await clearRegionDialogue(page);
  await page.waitForTimeout(700);
  await regionWalk(page, "ArrowUp", 1);
  await expect(page.locator("#game")).toHaveAttribute("data-pos", "9,4,up");
  if (await page.locator("#game").getAttribute("data-scene") === "battle") {
    await finishRegionBattle(page);
  }
  await regionWalk(page, "ArrowUp", 1);
  await expect(page.locator("#game")).toHaveAttribute("data-map", "route3");
  await expect(page.locator("#game")).toHaveAttribute("data-pos", "11,28,up");
});

test("region: all 108 character frames and nine portraits meet the art rules", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.locator("#game")).toHaveAttribute("data-ready", "");
  await loadGameModules(page);
  await page.evaluate(() => {
    const { Screen, initFont, REGION_SPRITES, drawSprite, trainerPortrait }
      = globalThis.__codelings;
    initFont();
    const canvas = document.createElement("canvas");
    canvas.width = 192;
    canvas.height = 240;
    const screen = new Screen(canvas);
    screen.canvas.width = 192;
    screen.canvas.height = 240;
    screen.context.imageSmoothingEnabled = false;
    const designs = new Set<string>();
    for (const id of REGION_SPRITES) {
      for (const dir of ["up", "down", "left", "right"] as const) {
        const poses = new Set<string>();
        for (let frame = 0; frame < 3; frame++) {
          screen.context.clearRect(0, 0, 192, 240);
          drawSprite(screen, id, dir, frame, 0, 0);
          const data = screen.context.getImageData(0, 0, 16, 16).data;
          const colours = new Set<string>();
          for (let offset = 0; offset < data.length; offset += 4) {
            if (data[offset + 3]) {
              colours.add(`${data[offset]},${data[offset + 1]},${data[offset + 2]}`);
            }
          }
          if (!colours.size || colours.size > 4 || !data[(15 * 16 + 5) * 4 + 3]) {
            throw new Error(`${id}:${dir}:${frame} violates the sprite palette or shadow`);
          }
          const signature = [...data].join(",");
          poses.add(signature);
          if (dir === "down" && frame === 0) {
            designs.add(signature);
          }
        }
        if (poses.size !== 3) {
          throw new Error(`${id}:${dir} needs three distinct walk frames`);
        }
      }
      const portrait = trainerPortrait(id)!;
      if (portrait.width !== 32 || portrait.height !== 40) {
        throw new Error(`${id} portrait has the wrong dimensions`);
      }
    }
    if (designs.size !== REGION_SPRITES.length) {
      throw new Error("Region character designs must be distinct");
    }
  });
});



test("region: deploy maze takes five tagged pads and an untagged pad returns to the entrance", async ({ page }) => {
  test.setTimeout(60_000);
  await seedRegion(page, "releaseGym", 2, 14);
  const game = page.locator("#game");
  await regionWalk(page, "ArrowLeft", 1);
  await regionWalk(page, "ArrowUp", 2);
  await expect(game).toHaveAttribute("data-pos", "2,14,up");
  await regionWalk(page, "ArrowUp", 1);
  await regionWalk(page, "ArrowRight", 1);
  await regionWalk(page, "ArrowUp", 1);
  await expect(game).toHaveAttribute("data-pos", "8,13,up");
  for (const destination of ["2,9,up", "8,9,up", "2,5,up", "8,5,up"]) {
    await regionWalk(page, "ArrowRight", 1);
    await regionWalk(page, "ArrowUp", 1);
    await expect(game).toHaveAttribute("data-pos", destination);
  }
  await regionWalk(page, "ArrowRight", 1);
  await regionWalk(page, "ArrowUp", 2);
  await regionWalk(page, "ArrowLeft", 1);
  await press(page, "ArrowUp", { delay: 35 });
  await press(page, "z", { delay: 35 });
  for (let tick = 0; tick < 80 && await game.getAttribute("data-scene") !== "battle"; tick++) {
    await press(page, "z", { delay: 35 });
    await page.waitForTimeout(50);
  }
  await expect(game).toHaveAttribute("data-scene", "battle");
});


test("post-game: sealed cave door blocks before Champion", async ({ page }) => {
  await seedRegion(page, "cave", 1, 6, "left", []);
  const game = page.locator("#game");
  await page.keyboard.down("ArrowLeft");
  await page.waitForTimeout(300);
  await page.keyboard.up("ArrowLeft");
  await expect(game).toHaveAttribute("data-map", "cave");
  await expect(game).toHaveAttribute("data-pos", "1,6,left");
  await press(page, "z", { delay: 35 });
  await expect(game.locator("canvas")).toHaveAttribute("aria-label", /The door is sealed/);
});

test("post-game: enter vault through cave door and start ORIGIN battle", async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await seedRegion(page, "cave", 1, 6, "left", [...REGION_BADGES, "champion"], 12, 2);
  // Step off the resume position before approaching a warp, as in the existing world flow.
  await regionWalk(page, "ArrowRight", 1);
  await regionWalk(page, "ArrowLeft", 2);
  const game = page.locator("#game");
  await expect(game).toHaveAttribute("data-map", "vault");
  await regionWalk(page, "ArrowLeft", 4);
  await regionWalk(page, "ArrowUp", 3);
  await press(page, "z", { delay: 35 });
  await clearRegionDialogue(page);
  await expect(game).toHaveAttribute("data-scene", "battle");
  await expect(game.locator("canvas")).toHaveAttribute("aria-label", /ORIGIN/);
  expect(errors).toEqual([]);
});
