import { expect, test, type Page } from "@playwright/test";

type AudioProbe = {
  context: AudioContext;
  analyser: AnalyserNode;
  master: GainNode | null;
  oscillators: number;
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
        const probe: AudioProbe = { context: this, analyser: this.createAnalyser(), master: null, oscillators: 0 };
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
      }
    };
  });
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

test("sound settings stay within the screen at narrow mobile widths", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "AudioContext", { configurable: true, value: undefined });
    Object.defineProperty(window, "webkitAudioContext", { configurable: true, value: undefined });
  });
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/");
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

test("room audio is opt-in and real music, nature and volume controls affect the output", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await observeNativeAudio(page);
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Sound off", exact: true })).toBeVisible();
  await page.getByText("Sound settings", { exact: true }).click();
  await expect(page.getByRole("checkbox", { name: "Calm music" })).toBeChecked();
  expect(await page.evaluate(() => window.__roomAudioProbes.length)).toBe(0);

  await page.getByRole("button", { name: "Sound off", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sound on", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => page.evaluate(() => window.__roomAudioProbes[0]?.context.currentTime), { timeout: 10_000 }).toBeGreaterThanOrEqual(6);
  expect(await page.evaluate(() => window.__roomAudioProbes.length)).toBe(1);
  await expect.poll(() => rms(page)).toBeGreaterThan(0.0001);
  expect(await page.evaluate(() => window.__roomAudioProbes[0].oscillators)).toBeGreaterThan(5);

  // Music remains audible when nature is off; turning both layers off produces silence.
  await page.getByRole("checkbox", { name: "Birds, insects & breeze" }).uncheck();
  await expect.poll(() => rms(page)).toBeGreaterThan(0.0001);
  await page.getByRole("checkbox", { name: "Calm music" }).uncheck();
  await expect.poll(() => rms(page)).toBeLessThan(0.000001);
  const mutedOscillators = await page.evaluate(() => window.__roomAudioProbes[0].oscillators);

  // Nature alone also produces real samples.
  await page.getByRole("checkbox", { name: "Birds, insects & breeze" }).check();
  await expect.poll(() => rms(page)).toBeGreaterThan(0.00002);
  await page.getByRole("checkbox", { name: "Calm music" }).check();
  await expect.poll(() => page.evaluate(() => window.__roomAudioProbes[0].oscillators)).toBeGreaterThan(mutedOscillators);

  // Native keyboard input changes the range, exercising React's real input handler.
  await page.getByRole("slider", { name: /Volume/ }).focus();
  await page.keyboard.press("Home");
  await expect(page.getByRole("slider", { name: /Volume/ })).toHaveValue("0");
  await expect.poll(() => rms(page)).toBeLessThan(0.000001);
  expect(await page.evaluate(() => window.__roomAudioProbes.length)).toBe(1);
  await page.getByRole("button", { name: "Sound on", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__roomAudioProbes[0].context.state)).toBe("closed");
  expect(errors).toEqual([]);
});

test("native audio suspends while hidden and every repeated sound cycle closes its context", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await observeNativeAudio(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Sound off", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__roomAudioProbes[0]?.context.state)).toBe("running");
  // Deterministic visibility event, with native AudioContext suspend/resume unchanged.
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => page.evaluate(() => window.__roomAudioProbes[0].context.state)).toBe("suspended");
  const suspended = await page.evaluate(() => ({ time: window.__roomAudioProbes[0].context.currentTime, sources: window.__roomAudioProbes[0].oscillators }));
  await page.waitForTimeout(1100);
  expect(await page.evaluate(() => ({ time: window.__roomAudioProbes[0].context.currentTime, sources: window.__roomAudioProbes[0].oscillators }))).toEqual(suspended);
  await page.evaluate(() => {
    Reflect.deleteProperty(document, "hidden");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => page.evaluate(() => window.__roomAudioProbes[0].context.state)).toBe("running");
  await expect.poll(() => rms(page)).toBeGreaterThan(0.0001);
  await page.getByRole("button", { name: "Sound on", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__roomAudioProbes[0].context.state)).toBe("closed");

  for (let cycle = 1; cycle <= 8; cycle++) {
    await page.getByRole("button", { name: "Sound off", exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.__roomAudioProbes.at(-1)?.context.state)).toBe("running");
    expect(await page.evaluate(() => window.__roomAudioProbes.filter((probe) => probe.context.state !== "closed").length)).toBe(1);
    await page.getByRole("button", { name: "Sound on", exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.__roomAudioProbes.every((probe) => probe.context.state === "closed"))).toBe(true);
  }
  expect(await page.evaluate(() => window.__roomAudioProbes.length)).toBe(9);
  expect(errors).toEqual([]);
});
