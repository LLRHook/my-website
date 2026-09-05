import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_ROOM_SOUND, RoomSoundscape } from "./room-audio";

function fakeContext() {
  const parameter = () => ({ value: 0, setValueAtTime: vi.fn(), setTargetAtTime: vi.fn(), cancelAndHoldAtTime: vi.fn(), cancelScheduledValues: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() });
  const node = () => ({ connect: vi.fn(), disconnect: vi.fn() });
  type MockGain = ReturnType<typeof node> & { gain: ReturnType<typeof parameter> };
  type MockSource = ReturnType<typeof node> & { type: string; frequency: ReturnType<typeof parameter>; onended: (() => void) | null; start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; buffer: unknown; loop: boolean };
  const gains: MockGain[] = [];
  const sources: MockSource[] = [];
  function gain() { const result = { ...node(), gain: parameter() }; gains.push(result); return result; }
  function source() {
    const result = { ...node(), type: "sine", frequency: parameter(), onended: null as (() => void) | null, start: vi.fn(), stop: vi.fn(), buffer: null as unknown, loop: false };
    sources.push(result);
    return result;
  }
  const context = {
    state: "suspended", currentTime: 0, sampleRate: 8000, destination: node(),
    createGain: vi.fn(gain), createOscillator: vi.fn(source), createBufferSource: vi.fn(source),
    createBiquadFilter: vi.fn(() => ({ ...node(), type: "lowpass", frequency: parameter() })),
    createBuffer: vi.fn(() => ({ getChannelData: () => new Float32Array(16000) })),
    resume: vi.fn(async () => { context.state = "running"; }),
    suspend: vi.fn(async () => { context.state = "suspended"; }),
    close: vi.fn(async () => { context.state = "closed"; }),
  };
  return { context, sources, gains, engine: new RoomSoundscape(context as unknown as AudioContext) };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });

describe("RoomSoundscape lifecycle", () => {
  it("creates no sources or scheduler before the explicit start", () => {
    const { context, sources } = fakeContext();
    expect(sources).toHaveLength(0);
    expect(context.resume).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("starts one scheduler and limits the default output gain", async () => {
    const { engine, context, gains } = fakeContext();
    await engine.setVisible(true);
    await engine.setVisible(true);
    expect(context.resume).toHaveBeenCalledTimes(1);
    expect(context.createOscillator).toHaveBeenCalledTimes(5);
    expect(context.createBufferSource).toHaveBeenCalledTimes(1);
    expect(gains[0].gain.setTargetAtTime).toHaveBeenCalledWith(0.28 * 0.28, 0, 0.2);
    expect(vi.getTimerCount()).toBe(1);
    await engine.close();
  });

  it("suspends the context and releases all voices and scheduling while hidden", async () => {
    const { engine, context, sources } = fakeContext();
    await engine.setVisible(true);
    await engine.setVisible(false);
    expect(context.suspend).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
    for (const source of sources) {
      expect(source.stop).toHaveBeenCalled();
      expect(source.disconnect).toHaveBeenCalled();
      expect(source.onended).toBeNull();
    }
    expect(sources.find((source) => source.loop)?.buffer).toBeNull();
    await engine.setVisible(true);
    expect(vi.getTimerCount()).toBe(1);
    await engine.close();
  });

  it("does not restart after a pending resume resolves following hide or close", async () => {
    const { engine, context } = fakeContext();
    let resumed: () => void = () => {};
    context.resume.mockImplementation(() => new Promise<void>((resolve) => { resumed = resolve; }));
    const pending = engine.setVisible(true);
    await engine.setVisible(false);
    await engine.close();
    resumed();
    await pending;
    expect(vi.getTimerCount()).toBe(0);
    expect(context.createOscillator).not.toHaveBeenCalled();
  });

  it("closes exactly once and disconnects the graph even during repeated disposal", async () => {
    const { engine, context, gains } = fakeContext();
    await engine.setVisible(true);
    await engine.close();
    await engine.close();
    await engine.setVisible(true);
    engine.setSettings({ music: true, nature: true, volume: 90 });
    expect(context.close).toHaveBeenCalledOnce();
    expect(context.resume).toHaveBeenCalledTimes(1);
    expect(gains.every((gain) => gain.disconnect.mock.calls.length > 0)).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("disconnects completed voices without keeping their ended handlers", async () => {
    const { engine, sources } = fakeContext();
    await engine.setVisible(true);
    const oscillator = sources[0];
    oscillator.onended?.();
    expect(oscillator.disconnect).toHaveBeenCalledOnce();
    expect(oscillator.onended).toBeNull();
    await engine.close();
    expect(oscillator.disconnect).toHaveBeenCalledOnce();
  });

  it("stops disabled layers and stops the scheduler when both are disabled", async () => {
    const { engine, context, sources } = fakeContext();
    await engine.setVisible(true);
    const breeze = sources.find((source) => source.loop)!;
    engine.setSettings({ ...DEFAULT_ROOM_SOUND, nature: false });
    expect(breeze.disconnect).toHaveBeenCalledOnce();
    expect(sources[0].disconnect).not.toHaveBeenCalled();
    engine.setSettings({ ...DEFAULT_ROOM_SOUND, music: false, nature: false });
    expect(sources[0].disconnect).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
    const previousCount = context.createOscillator.mock.calls.length;
    context.currentTime = 120;
    vi.advanceTimersByTime(120_000);
    expect(context.createOscillator).toHaveBeenCalledTimes(previousCount);
    engine.setSettings({ ...DEFAULT_ROOM_SOUND, nature: false });
    expect(vi.getTimerCount()).toBe(1);
    await engine.close();
  });

  it("caps retained sources even if a browser delays every ended event", async () => {
    const { engine, context, sources } = fakeContext();
    await engine.setVisible(true);
    for (let index = 1; index <= 100; index++) {
      context.currentTime = index * 15;
      vi.advanceTimersByTime(500);
    }
    expect(sources.length).toBeLessThanOrEqual(24);
    expect(vi.getTimerCount()).toBe(1);
    await engine.close();
  });

  it("clamps volume inputs and rejects non-finite levels without recreating sources", async () => {
    const { engine, gains, context } = fakeContext();
    await engine.setVisible(true);
    engine.setSettings({ ...DEFAULT_ROOM_SOUND, volume: 500 });
    expect(gains[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(0.28, 0, 0.2);
    engine.setSettings({ ...DEFAULT_ROOM_SOUND, volume: Number.NaN });
    expect(gains[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 0, 0.2);
    expect(context.createOscillator).toHaveBeenCalledTimes(5);
    await engine.close();
  });
});
