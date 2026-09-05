import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RoomAudio from "./RoomAudio";

const sound = vi.hoisted(() => ({ setVisible: vi.fn(async () => {}), setSettings: vi.fn(), close: vi.fn(async () => {}) }));
vi.mock("@/app/lib/room-audio", () => ({
  DEFAULT_ROOM_SOUND: { volume: 28, music: true, nature: true },
  RoomSoundscape: class { setVisible = sound.setVisible; setSettings = sound.setSettings; close = sound.close; },
}));
const contexts = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  sound.setVisible.mockResolvedValue(undefined);
  vi.stubGlobal("AudioContext", class { constructor() { contexts(); } close = vi.fn(async () => {}); });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("RoomAudio controls", () => {
  it("allocates no audio context or sound on initial render or settings changes", () => {
    render(<RoomAudio />);
    expect(contexts).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("slider", { hidden: true }), { target: { value: "15" } });
    expect(contexts).not.toHaveBeenCalled();
    expect(sound.setSettings).not.toHaveBeenCalled();
  });

  it("starts only on the sound button and disposes when switched off", async () => {
    render(<RoomAudio />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Sound off" })));
    expect(contexts).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Sound on" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Sound on" }));
    expect(sound.close).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Sound off" })).toHaveAttribute("aria-pressed", "false");
  });

  it("updates volume and independent layers without recreating the context", async () => {
    render(<RoomAudio />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Sound off" })));
    fireEvent.change(screen.getByRole("slider", { hidden: true }), { target: { value: "12" } });
    fireEvent.click(screen.getByLabelText("Calm music"));
    expect(sound.setSettings).toHaveBeenLastCalledWith({ volume: 12, music: false, nature: true });
    fireEvent.click(screen.getByLabelText("Birds, insects & breeze"));
    expect(sound.setSettings).toHaveBeenLastCalledWith({ volume: 12, music: false, nature: false });
    expect(contexts).toHaveBeenCalledOnce();
  });

  it("forwards page visibility changes and removes the listener on unmount", async () => {
    const add = vi.spyOn(document, "addEventListener");
    const remove = vi.spyOn(document, "removeEventListener");
    const view = render(<RoomAudio />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Sound off" })));
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    await act(async () => document.dispatchEvent(new Event("visibilitychange")));
    expect(sound.setVisible).toHaveBeenLastCalledWith(false);
    const listener = add.mock.calls.find(([name]) => name === "visibilitychange")?.[1];
    view.unmount();
    expect(sound.close).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledWith("visibilitychange", listener);
  });

  it("reports unsupported audio without hiding the room or throwing", () => {
    vi.stubGlobal("AudioContext", undefined);
    render(<RoomAudio />);
    fireEvent.click(screen.getByRole("button", { name: "Sound off" }));
    expect(screen.getByRole("status", { name: "Sound status" })).toHaveTextContent("Sound is unavailable in this browser.");
    expect(screen.getByRole("button", { name: "Sound off" })).toBeEnabled();
  });

  it("closes a context whose start is rejected and permits a later retry", async () => {
    sound.setVisible.mockRejectedValueOnce(new Error("Blocked"));
    render(<RoomAudio />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Sound off" })));
    expect(sound.close).toHaveBeenCalledOnce();
    expect(screen.getByRole("status", { name: "Sound status" })).toHaveTextContent("Sound could not start");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Sound off" })));
    expect(contexts).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("status", { name: "Sound status" })).not.toBeInTheDocument();
  });
});
