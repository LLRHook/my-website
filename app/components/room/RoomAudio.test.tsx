import { StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RoomAudio, { ROOM_AUDIO_STORAGE_KEY } from "./RoomAudio";

type ContextLike = { resume(): Promise<void>; suspend(): Promise<void>; close(): Promise<void> };

const sound = vi.hoisted(() => ({
  created: vi.fn(),
  setVisible: vi.fn(),
  transition: vi.fn(async (context: ContextLike, visible: boolean) => {
    if (visible) await context.resume();
    else await context.suspend();
  }),
  setSettings: vi.fn(),
  close: vi.fn(),
}));

vi.mock("@/app/lib/room-audio", () => ({
  RoomSoundscape: class {
    constructor(private readonly context: ContextLike, settings: unknown) { sound.created(settings); }
    setVisible(visible: boolean) { sound.setVisible(visible); return sound.transition(this.context, visible); }
    setSettings(settings: unknown) { sound.setSettings(settings); }
    close() { sound.close(); return this.context.close(); }
  },
}));

const DEFAULTS = { volume: 18, music: false, nature: true };
const autoplay = { blocked: false };
/** Initial state of new fake contexts; browsers that allow autoplay create them already running. */
const initial = { state: "suspended" };
let contexts: FakeAudioContext[] = [];

/** Mirrors the real state machine: resume/suspend/close change `state` and fire `statechange`; blocked resume stays pending. */
class FakeAudioContext extends EventTarget {
  state = initial.state;
  constructor() { super(); contexts.push(this); }
  transition(state: string) {
    if (this.state === state) return;
    this.state = state;
    this.dispatchEvent(new Event("statechange"));
  }
  resume = vi.fn(() => {
    if (autoplay.blocked) return new Promise<void>(() => {});
    this.transition("running");
    return Promise.resolve();
  });
  suspend = vi.fn(async () => this.transition("suspended"));
  close = vi.fn(async () => this.transition("closed"));
}

const button = (name: string) => screen.getByRole("button", { name });
const stored = () => JSON.parse(window.localStorage.getItem(ROOM_AUDIO_STORAGE_KEY) ?? "null");
const flush = () => act(async () => {});
const GESTURES = ["pointerdown", "pointerup", "keydown"];

/** Node 25 ships a partial `localStorage` (no `clear`) that leaks into jsdom; each test gets a fresh in-memory Storage instead. */
class MemoryStorage implements Storage {
  private readonly items = new Map<string, string>();
  get length() { return this.items.size; }
  key(index: number) { return Array.from(this.items.keys())[index] ?? null; }
  getItem(key: string) { return this.items.get(String(key)) ?? null; }
  setItem(key: string, value: string) { this.items.set(String(key), String(value)); }
  removeItem(key: string) { this.items.delete(String(key)); }
  clear() { this.items.clear(); }
}

beforeEach(() => {
  contexts = [];
  autoplay.blocked = false;
  vi.stubGlobal("localStorage", new MemoryStorage());
  vi.stubGlobal("AudioContext", FakeAudioContext);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.clearAllMocks(); });

describe("RoomAudio default ambience", () => {
  it("attempts quiet playback on first mount with nature only and no music", () => {
    const add = vi.spyOn(document, "addEventListener");
    const remove = vi.spyOn(document, "removeEventListener");
    render(<RoomAudio />);
    expect(contexts).toHaveLength(1);
    expect(sound.created).toHaveBeenCalledWith(DEFAULTS);
    expect(sound.setVisible).toHaveBeenCalledTimes(1);
    expect(sound.setVisible).toHaveBeenCalledWith(true);
    expect(contexts[0].state).toBe("running");
    expect(button("Sound on")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("slider", { hidden: true })).toHaveValue("18");
    expect(screen.getByLabelText("Calm music")).not.toBeChecked();
    expect(screen.getByLabelText("Birds, insects & breeze")).toBeChecked();
    expect(screen.getByText(/Playing quietly/)).toBeInTheDocument();
    expect(screen.queryByText(/Waiting for your first/)).not.toBeInTheDocument();
    // Playback started, so the first-gesture fallback is gone again.
    const added = add.mock.calls.filter(([name]) => GESTURES.includes(name as string));
    expect(added.length).toBeGreaterThan(0);
    for (const [name, listener] of added) expect(remove).toHaveBeenCalledWith(name, listener, { capture: true });
  });

  it("shows waiting while autoplay is blocked and starts on the first gesture elsewhere", async () => {
    autoplay.blocked = true;
    render(<RoomAudio />);
    expect(button("Sound waiting")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Waiting for your first tap or key press/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sound on" })).not.toBeInTheDocument();
    expect(contexts[0].state).toBe("suspended");
    autoplay.blocked = false;
    await act(async () => { fireEvent.pointerDown(document.body); });
    expect(sound.setVisible).toHaveBeenCalledTimes(2);
    expect(contexts).toHaveLength(1);
    expect(button("Sound on")).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText(/Waiting for your first/)).not.toBeInTheDocument();
    await act(async () => { fireEvent.pointerDown(document.body); fireEvent.keyDown(document.body, { key: "a" }); });
    expect(sound.setVisible).toHaveBeenCalledTimes(2);
  });

  it("ignores gestures on the toggle itself, and muting while waiting persists and removes the fallback", async () => {
    autoplay.blocked = true;
    const add = vi.spyOn(document, "addEventListener");
    const remove = vi.spyOn(document, "removeEventListener");
    render(<RoomAudio />);
    const waiting = button("Sound waiting");
    autoplay.blocked = false;
    await act(async () => { fireEvent.pointerDown(waiting); fireEvent.keyDown(waiting, { key: "Enter" }); });
    expect(sound.setVisible).toHaveBeenCalledTimes(1);
    expect(contexts[0].state).toBe("suspended");
    await act(async () => { fireEvent.click(waiting); });
    expect(sound.close).toHaveBeenCalledOnce();
    expect(contexts[0].state).toBe("closed");
    expect(button("Sound off")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText(/Sound is off/)).toBeInTheDocument();
    expect(stored()).toEqual({ enabled: false, settings: DEFAULTS });
    await act(async () => { fireEvent.pointerDown(document.body); fireEvent.keyDown(document.body, { key: "a" }); });
    expect(contexts).toHaveLength(1);
    expect(sound.setVisible).toHaveBeenCalledTimes(1);
    const added = add.mock.calls.filter(([name]) => GESTURES.includes(name as string));
    expect(added.length).toBeGreaterThan(0);
    for (const [name, listener] of added) expect(remove).toHaveBeenCalledWith(name, listener, { capture: true });
  });

  it("does not re-enable when a pending resume settles after mute", async () => {
    let settle: () => void = () => {};
    sound.transition.mockImplementationOnce(() => new Promise<void>((resolve) => { settle = resolve; }));
    render(<RoomAudio />);
    expect(button("Sound waiting")).toBeInTheDocument();
    await act(async () => { fireEvent.click(button("Sound waiting")); });
    expect(sound.close).toHaveBeenCalledOnce();
    expect(contexts[0].state).toBe("closed");
    await act(async () => { settle(); contexts[0].dispatchEvent(new Event("statechange")); });
    expect(button("Sound off")).toHaveAttribute("aria-pressed", "false");
    expect(sound.setVisible).toHaveBeenCalledTimes(1);
    expect(contexts).toHaveLength(1);
    expect(stored()).toMatchObject({ enabled: false });
  });
});

describe("RoomAudio remembered preference", () => {
  it("keeps a remembered mute across remounts and turns back on only by request", async () => {
    const view = render(<RoomAudio />);
    await act(async () => { fireEvent.click(button("Sound on")); });
    expect(stored()).toEqual({ enabled: false, settings: DEFAULTS });
    view.unmount();
    render(<RoomAudio />);
    expect(contexts).toHaveLength(1);
    expect(sound.setVisible).toHaveBeenCalledTimes(1);
    expect(button("Sound off")).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText(/Waiting for your first/)).not.toBeInTheDocument();
    await act(async () => { fireEvent.click(button("Sound off")); });
    expect(contexts).toHaveLength(2);
    expect(button("Sound on")).toHaveAttribute("aria-pressed", "true");
    expect(stored()).toEqual({ enabled: true, settings: DEFAULTS });
  });

  it("honours only validated stored fields", async () => {
    window.localStorage.setItem(ROOM_AUDIO_STORAGE_KEY, JSON.stringify({ enabled: false, settings: { volume: 250, music: "yes", nature: false }, extra: 1 }));
    render(<RoomAudio />);
    expect(contexts).toHaveLength(0);
    expect(button("Sound off")).toBeInTheDocument();
    expect(screen.getByRole("slider", { hidden: true })).toHaveValue("100");
    expect(screen.getByLabelText("Calm music")).not.toBeChecked();
    expect(screen.getByLabelText("Birds, insects & breeze")).not.toBeChecked();
    await act(async () => { fireEvent.click(button("Sound off")); });
    expect(sound.created).toHaveBeenCalledWith({ volume: 100, music: false, nature: false });
    expect(stored()).toEqual({ enabled: true, settings: { volume: 100, music: false, nature: false } });
  });

  it("works when storage is blocked or corrupt", async () => {
    vi.spyOn(MemoryStorage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    const setItem = vi.spyOn(MemoryStorage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    render(<RoomAudio />);
    expect(button("Sound on")).toBeInTheDocument();
    await act(async () => { fireEvent.click(button("Sound on")); });
    expect(button("Sound off")).toBeInTheDocument();
    expect(setItem).toHaveBeenCalled();
    expect(screen.queryByRole("status", { name: "Sound status" })).not.toBeInTheDocument();
    vi.restoreAllMocks();
    cleanup();
    window.localStorage.setItem(ROOM_AUDIO_STORAGE_KEY, "{not json");
    render(<RoomAudio />);
    expect(contexts).toHaveLength(2);
    expect(sound.created).toHaveBeenLastCalledWith(DEFAULTS);
    expect(button("Sound on")).toBeInTheDocument();
  });

  it("updates volume and layers without recreating the context and remembers them", () => {
    render(<RoomAudio />);
    fireEvent.change(screen.getByRole("slider", { hidden: true }), { target: { value: "12" } });
    expect(sound.setSettings).toHaveBeenLastCalledWith({ volume: 12, music: false, nature: true });
    fireEvent.click(screen.getByLabelText("Calm music"));
    expect(sound.setSettings).toHaveBeenLastCalledWith({ volume: 12, music: true, nature: true });
    fireEvent.click(screen.getByLabelText("Birds, insects & breeze"));
    expect(sound.setSettings).toHaveBeenLastCalledWith({ volume: 12, music: true, nature: false });
    expect(contexts).toHaveLength(1);
    expect(stored()).toEqual({ enabled: true, settings: { volume: 12, music: true, nature: false } });
  });

  it("reports silent while on at zero volume or with both layers off, and on again once settings allow sound", () => {
    render(<RoomAudio />);
    const slider = screen.getByRole("slider", { hidden: true });
    fireEvent.change(slider, { target: { value: "0" } });
    expect(button("Sound silent")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/on but silent/)).toBeInTheDocument();
    expect(screen.queryByText(/Playing quietly/)).not.toBeInTheDocument();
    expect(stored()).toEqual({ enabled: true, settings: { ...DEFAULTS, volume: 0 } });
    fireEvent.change(slider, { target: { value: "5" } });
    expect(button("Sound on")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Playing quietly/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Birds, insects & breeze"));
    expect(button("Sound silent")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Calm music"));
    expect(button("Sound on")).toBeInTheDocument();
    expect(contexts).toHaveLength(1);
    expect(contexts[0].state).toBe("running");
  });

  it("remembers settings changed while muted and applies them when sound is turned on", async () => {
    window.localStorage.setItem(ROOM_AUDIO_STORAGE_KEY, JSON.stringify({ enabled: false, settings: DEFAULTS }));
    render(<RoomAudio />);
    fireEvent.change(screen.getByRole("slider", { hidden: true }), { target: { value: "40" } });
    expect(sound.setSettings).not.toHaveBeenCalled();
    expect(stored()).toEqual({ enabled: false, settings: { ...DEFAULTS, volume: 40 } });
    await act(async () => { fireEvent.click(button("Sound off")); });
    expect(sound.created).toHaveBeenCalledWith({ ...DEFAULTS, volume: 40 });
  });
});

describe("RoomAudio actual playback state", () => {
  it("follows the context's own state changes and retries on the next gesture after an interruption", async () => {
    render(<RoomAudio />);
    expect(button("Sound on")).toBeInTheDocument();
    await act(async () => { contexts[0].transition("interrupted"); });
    expect(button("Sound waiting")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Waiting for your first tap or key press/)).toBeInTheDocument();
    await act(async () => { fireEvent.keyDown(document.body, { key: "k" }); });
    expect(sound.setVisible).toHaveBeenCalledTimes(2);
    expect(contexts[0].state).toBe("running");
    expect(button("Sound on")).toBeInTheDocument();
    expect(contexts).toHaveLength(1);
  });

  it("suspends through the engine while hidden, reports waiting, and resumes on return", async () => {
    render(<RoomAudio />);
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    await act(async () => { document.dispatchEvent(new Event("visibilitychange")); });
    expect(sound.setVisible).toHaveBeenLastCalledWith(false);
    expect(contexts[0].state).toBe("suspended");
    expect(button("Sound waiting")).toBeInTheDocument();
    hidden.mockReturnValue(false);
    await act(async () => { document.dispatchEvent(new Event("visibilitychange")); });
    expect(sound.setVisible).toHaveBeenLastCalledWith(true);
    expect(contexts[0].state).toBe("running");
    expect(button("Sound on")).toBeInTheDocument();
    expect(contexts).toHaveLength(1);
  });

  it("closes a context whose start is rejected, stays waiting, and retries with a fresh context on a gesture", async () => {
    sound.transition.mockRejectedValueOnce(new Error("Blocked"));
    render(<RoomAudio />);
    await flush();
    expect(sound.close).toHaveBeenCalledOnce();
    expect(contexts[0].state).toBe("closed");
    expect(screen.getByRole("status", { name: "Sound status" })).toHaveTextContent("Sound could not start");
    expect(button("Sound waiting")).toHaveAttribute("aria-pressed", "true");
    await act(async () => { fireEvent.pointerDown(document.body); });
    expect(contexts).toHaveLength(2);
    expect(contexts[1].state).toBe("running");
    expect(button("Sound on")).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Sound status" })).not.toBeInTheDocument();
  });

  it("adds no gesture fallback when the context is already running, so nothing is retained", async () => {
    initial.state = "running";
    try {
      const add = vi.spyOn(document, "addEventListener");
      render(<RoomAudio />);
      await flush();
      expect(contexts).toHaveLength(1);
      expect(contexts[0].state).toBe("running");
      expect(button("Sound on")).toHaveAttribute("aria-pressed", "true");
      expect(add.mock.calls.filter(([name]) => GESTURES.includes(name as string))).toHaveLength(0);
      await act(async () => { fireEvent.pointerDown(document.body); fireEvent.keyDown(document.body, { key: "a" }); });
      expect(sound.setVisible).toHaveBeenCalledTimes(1);
      expect(contexts).toHaveLength(1);
    } finally {
      initial.state = "suspended";
    }
  });

  it("reports unsupported audio quietly and only shows the status after a tap", () => {
    vi.stubGlobal("AudioContext", undefined);
    render(<RoomAudio />);
    expect(contexts).toHaveLength(0);
    expect(button("Sound off")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Sound is unavailable in this browser.")).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Sound status" })).not.toBeInTheDocument();
    fireEvent.click(button("Sound off"));
    expect(screen.getByRole("status", { name: "Sound status" })).toHaveTextContent("Sound is unavailable in this browser.");
    expect(button("Sound off")).toBeEnabled();
  });

  it("closes every context under strict-mode double effects and unmount, removing all listeners", async () => {
    const add = vi.spyOn(document, "addEventListener");
    const remove = vi.spyOn(document, "removeEventListener");
    const view = render(<StrictMode><RoomAudio /></StrictMode>);
    await flush();
    expect(contexts).toHaveLength(2);
    expect(contexts[0].state).toBe("closed");
    expect(contexts[1].state).toBe("running");
    expect(sound.close).toHaveBeenCalledTimes(1);
    expect(button("Sound on")).toBeInTheDocument();
    view.unmount();
    await flush();
    expect(sound.close).toHaveBeenCalledTimes(2);
    expect(contexts[1].state).toBe("closed");
    await act(async () => { fireEvent.pointerDown(document.body); document.dispatchEvent(new Event("visibilitychange")); });
    expect(contexts).toHaveLength(2);
    const tracked = add.mock.calls.filter(([name]) => name === "visibilitychange" || GESTURES.includes(name as string));
    expect(tracked.length).toBeGreaterThan(0);
    for (const [name, listener] of tracked) expect(remove.mock.calls.some(([n, l]) => n === name && l === listener)).toBe(true);
  });
});
