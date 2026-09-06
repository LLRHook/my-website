import { expect, test, type Page } from "@playwright/test";

const STORAGE_KEY = "professional-presence:room-audio:v1";

type AudioProbe = {
  context: AudioContext;
  analyser: AnalyserNode;
  master: GainNode | null;
  oscillators: number;
  resumes: number;
};

declare global {
  interface Window { __roomAudioProbes: AudioProbe[] }
}

async function observeNativeAudio(page: Page) {
  await page.addInitScript(() => {
    window.__roomAudioProbes = [];
    const NativeAudioContext = window.AudioContext;
    window.AudioContext = class extends NativeAudioContext {
      constructor(options?: AudioContextOptions) {
        super(options);
        const probe: AudioProbe = { context: this, analyser: this.createAnalyser(), master: null, oscillators: 0, resumes: 0 };
        probe.analyser.fftSize = 2048;
        window.__roomAudioProbes.push(probe);
        const createGain = this.createGain.bind(this);
        this.createGain = () => {
          const gain = createGain();
          const connect = gain.connect.bind(gain);
          gain.connect = ((...args: unknown[]) => {
            if (args[0] === this.destination) {
              probe.master = gain;
              // A passive parallel tap observes real output; the normal destination stays connected.
              Reflect.apply(connect, gain, [probe.analyser]);
            }
            return Reflect.apply(connect, gain, args);
          }) as GainNode["connect"];
          return gain;
        };
        const createOscillator = this.createOscillator.bind(this);
        this.createOscillator = () => { probe.oscillators++; return createOscillator(); };
        const resume = this.resume.bind(this);
        this.resume = () => { probe.resumes++; return resume(); };
      }
    };
  });
}

/** Playwright's Chromium allows autoplay. Emulate the default policy: silence until the document's first real activation. */
async function blockAutoplayUntilActivation(page: Page) {
  await page.addInitScript(() => {
    const Wrapped = window.AudioContext;
    const activated = () => (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive === true;
    window.AudioContext = class extends Wrapped {
      constructor(options?: AudioContextOptions) {
        super(options);
        if (!activated()) void super.suspend();
      }
      resume() {
        return activated() ? super.resume() : new Promise<void>(() => {});
      }
    };
  });
}

function probeCount(page: Page) {
  return page.evaluate(() => window.__roomAudioProbes.length);
}

function probeState(page: Page, index = -1) {
  return page.evaluate((i) => window.__roomAudioProbes.at(i)?.context.state, index);
}

function storedPreference(page: Page) {
  return page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? "null"), STORAGE_KEY);
}

async function rms(page: Page) {
  return page.evaluate(() => {
    const probe = window.__roomAudioProbes.at(-1);
    if (!probe) return 0;
    const samples = new Float32Array(probe.analyser.fftSize);
    probe.analyser.getFloatTimeDomainData(samples);
    return Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
  });
}

/** Waits for the mount attempt; engines that need a gesture get a harmless key press. */
async function ensureStarted(page: Page, name = "Sound on") {
  await expect.poll(() => probeCount(page)).toBe(1);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name, exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => probeState(page, 0)).toBe("running");
}

test("sound settings stay within the screen at narrow mobile widths", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "AudioContext", { configurable: true, value: undefined });
    Object.defineProperty(window, "webkitAudioContext", { configurable: true, value: undefined });
  });
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Sound off", exact: true })).toHaveAttribute("aria-pressed", "false");
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.getByText("Sound settings", { exact: true }).click();
    const panel = page.locator(".room-sound-panel");
    await expect(panel).toBeVisible();
    const bounds = await panel.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(16);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width - 16);
    await expect(page.getByRole("slider", { name: /Volume/ })).toBeInViewport();
    await expect(page.getByRole("checkbox", { name: "Calm music" })).toBeInViewport();
    await expect(page.getByRole("checkbox", { name: "Birds, insects & breeze" })).toBeInViewport();
    await expect(panel.locator("small")).toHaveText("Sound is unavailable in this browser.");
    await page.getByText("Sound settings", { exact: true }).click();
    await expect(panel).not.toBeVisible();
    await page.getByRole("button", { name: "Sound off", exact: true }).click();
    const status = page.getByRole("status", { name: "Sound status" });
    await expect(status).toHaveText("Sound is unavailable in this browser.");
    const statusBounds = await status.boundingBox();
    expect(statusBounds).not.toBeNull();
    expect(statusBounds!.x).toBeGreaterThanOrEqual(16);
    expect(statusBounds!.x + statusBounds!.width).toBeLessThanOrEqual(width - 16);
  }
});

test("quiet ambience starts by default, real layers and volume shape the output, and choices persist", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await observeNativeAudio(page);
  await page.goto("/");
  await expect(page.getByRole("button", { name: /^Sound (on|waiting)$/ })).toHaveAttribute("aria-pressed", "true");
  await ensureStarted(page);

  await page.getByText("Sound settings", { exact: true }).click();
  await expect(page.getByRole("checkbox", { name: "Calm music" })).not.toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Birds, insects & breeze" })).toBeChecked();
  await expect(page.getByRole("slider", { name: /Volume/ })).toHaveValue("18");
  await expect(page.locator(".room-sound-panel small")).toHaveText(/Playing quietly/);
  // Nature alone produces real samples at the quiet default level.
  await expect.poll(() => rms(page), { timeout: 10_000 }).toBeGreaterThan(0.00002);

  // Music is opt-in; enabling it adds real oscillators and stays audible when nature is off.
  const natureOnlyOscillators = await page.evaluate(() => window.__roomAudioProbes[0].oscillators);
  await page.getByRole("checkbox", { name: "Calm music" }).check();
  await expect.poll(() => page.evaluate(() => window.__roomAudioProbes[0].oscillators)).toBeGreaterThan(natureOnlyOscillators);
  await page.getByRole("checkbox", { name: "Birds, insects & breeze" }).uncheck();
  await expect.poll(() => rms(page), { timeout: 10_000 }).toBeGreaterThan(0.0001);
  // Both layers off produces silence.
  await page.getByRole("checkbox", { name: "Calm music" }).uncheck();
  await expect.poll(() => rms(page)).toBeLessThan(0.000001);
  // Sound stays on and the context keeps running, but the label no longer claims playback.
  await expect(page.getByRole("button", { name: "Sound silent", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".room-sound-panel small")).toHaveText(/on but silent/);
  expect(await probeState(page, 0)).toBe("running");

  // Native keyboard input changes the range, exercising React's real input handler.
  await page.getByRole("slider", { name: /Volume/ }).focus();
  await page.keyboard.press("Home");
  await expect(page.getByRole("slider", { name: /Volume/ })).toHaveValue("0");
  await expect.poll(() => rms(page)).toBeLessThan(0.000001);
  expect(await probeCount(page)).toBe(1);
  expect(await storedPreference(page)).toEqual({ enabled: true, settings: { volume: 0, music: false, nature: false } });

  // Settings survive a reload while sound stays on.
  await page.reload();
  await ensureStarted(page, "Sound silent");
  await page.getByText("Sound settings", { exact: true }).click();
  await expect(page.getByRole("slider", { name: /Volume/ })).toHaveValue("0");
  await expect(page.getByRole("checkbox", { name: "Calm music" })).not.toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Birds, insects & breeze" })).not.toBeChecked();

  // Mute closes the context, is remembered, and a later visit creates no audio until asked.
  await page.getByRole("button", { name: "Sound silent", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sound off", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect.poll(() => probeState(page, 0)).toBe("closed");
  expect(await storedPreference(page)).toMatchObject({ enabled: false });
  await page.reload();
  await expect(page.getByRole("button", { name: "Sound off", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".room-sound-panel small")).toHaveText(/Sound is off/);
  await page.waitForTimeout(500);
  expect(await probeCount(page)).toBe(0);
  await page.getByRole("button", { name: "Sound off", exact: true }).click();
  // Settings are still zero volume with both layers off, so the running context is reported as silent.
  await expect(page.getByRole("button", { name: "Sound silent", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => probeState(page)).toBe("running");
  expect(await probeCount(page)).toBe(1);
  expect(await storedPreference(page)).toMatchObject({ enabled: true });
  expect(errors).toEqual([]);
});

test("blocked autoplay waits visibly, starts on the first gesture, and mute while waiting never resumes first", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await blockAutoplayUntilActivation(page);
  await observeNativeAudio(page);
  await page.goto("/");
  const waiting = page.getByRole("button", { name: "Sound waiting", exact: true });
  await expect(waiting).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => probeState(page, 0)).toBe("suspended");
  await expect(page.locator(".room-sound-panel small")).toHaveText(/Waiting for your first tap or key press/);
  const frozen = await page.evaluate(() => window.__roomAudioProbes[0].context.currentTime);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.__roomAudioProbes[0].context.currentTime)).toBe(frozen);
  await expect(page.getByRole("button", { name: "Sound on", exact: true })).toHaveCount(0);

  // The first real activation anywhere on the page starts sound, then the fallback is gone.
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Sound on", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => probeState(page, 0)).toBe("running");
  await expect.poll(() => rms(page), { timeout: 10_000 }).toBeGreaterThan(0.00002);
  expect(await probeCount(page)).toBe(1);

  // A fresh document has no activation; tapping the waiting toggle mutes without resuming first.
  await page.reload();
  await expect(waiting).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => probeState(page, 0)).toBe("suspended");
  await waiting.click();
  await expect(page.getByRole("button", { name: "Sound off", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect.poll(() => probeState(page, 0)).toBe("closed");
  expect(await page.evaluate(() => window.__roomAudioProbes[0].resumes)).toBe(1);
  expect(await storedPreference(page)).toMatchObject({ enabled: false });
  await page.keyboard.press("Tab");
  await page.waitForTimeout(300);
  expect(await probeCount(page)).toBe(1);

  await page.reload();
  await expect(page.getByRole("button", { name: "Sound off", exact: true })).toHaveAttribute("aria-pressed", "false");
  await page.waitForTimeout(300);
  expect(await probeCount(page)).toBe(0);
  expect(errors).toEqual([]);
});

test("native audio suspends while hidden, reports waiting truthfully, and every sound cycle closes its context", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await observeNativeAudio(page);
  await page.goto("/");
  await ensureStarted(page);
  // Deterministic visibility event, with native AudioContext suspend/resume unchanged.
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => probeState(page, 0)).toBe("suspended");
  await expect(page.getByRole("button", { name: "Sound waiting", exact: true })).toHaveAttribute("aria-pressed", "true");
  const suspended = await page.evaluate(() => ({ time: window.__roomAudioProbes[0].context.currentTime, sources: window.__roomAudioProbes[0].oscillators }));
  await page.waitForTimeout(1100);
  expect(await page.evaluate(() => ({ time: window.__roomAudioProbes[0].context.currentTime, sources: window.__roomAudioProbes[0].oscillators }))).toEqual(suspended);
  await page.evaluate(() => {
    Reflect.deleteProperty(document, "hidden");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => probeState(page, 0)).toBe("running");
  await expect(page.getByRole("button", { name: "Sound on", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => rms(page), { timeout: 10_000 }).toBeGreaterThan(0.00002);
  await page.getByRole("button", { name: "Sound on", exact: true }).click();
  await expect.poll(() => probeState(page, 0)).toBe("closed");

  for (let cycle = 1; cycle <= 8; cycle++) {
    await page.getByRole("button", { name: "Sound off", exact: true }).click();
    await expect.poll(() => probeState(page)).toBe("running");
    await expect(page.getByRole("button", { name: "Sound on", exact: true })).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => window.__roomAudioProbes.filter((probe) => probe.context.state !== "closed").length)).toBe(1);
    await page.getByRole("button", { name: "Sound on", exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.__roomAudioProbes.every((probe) => probe.context.state === "closed"))).toBe(true);
  }
  expect(await probeCount(page)).toBe(9);
  expect(errors).toEqual([]);
});
