import { useRef } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useRoomMotion from "./useRoomMotion";

let callbacks: Map<number, FrameRequestCallback>;
let nextFrame: number;
let time: number;
let reduced: boolean;
let hidden: boolean;
let preference: MediaQueryList;

function Harness({ active = true }: { active?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useRoomMotion(ref, active);
  return <div ref={ref} data-testid="room-stage" />;
}

function stage() { return screen.getByTestId("room-stage"); }
function value(axis: "x" | "y") { return Number(stage().style.getPropertyValue(`--room-look-${axis}`)); }
function point(type: string, pointerType = "mouse", clientX = 500, clientY = 250) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, { pointerType, clientX, clientY });
  fireEvent(stage(), event);
  return event;
}
function frame() {
  const current = [...callbacks.values()];
  callbacks.clear();
  time += 16;
  act(() => current.forEach((callback) => callback(time)));
}
function settle() {
  for (let count = 0; callbacks.size && count < 150; count++) frame();
  expect(callbacks.size).toBe(0);
}

beforeEach(() => {
  vi.useFakeTimers();
  callbacks = new Map();
  nextFrame = 0;
  time = 0;
  reduced = false;
  hidden = false;
  const events = new EventTarget();
  preference = {
    get matches() { return reduced; }, media: "(prefers-reduced-motion: reduce)", onchange: null,
    addEventListener: vi.fn(events.addEventListener.bind(events)), removeEventListener: vi.fn(events.removeEventListener.bind(events)),
    dispatchEvent: events.dispatchEvent.bind(events), addListener: vi.fn(), removeListener: vi.fn(),
  } as MediaQueryList;
  vi.spyOn(window, "matchMedia").mockReturnValue(preference);
  vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ left: 100, top: 50, width: 400, height: 200, right: 500, bottom: 250, x: 100, y: 50, toJSON() { return {}; } });
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => { const id = ++nextFrame; callbacks.set(id, callback); return id; }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => callbacks.delete(id)));
});

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("room pointer motion lifecycle", () => {
  it("has no idle frame loop, shares one pending frame, and clamps distant pointers", () => {
    render(<Harness />);
    expect(callbacks.size).toBe(0);
    expect(value("x")).toBe(0);
    for (let count = 0; count < 200; count++) point("pointermove", "mouse", 5000, -5000);
    expect(callbacks.size).toBe(1);
    expect(requestAnimationFrame).toHaveBeenCalledOnce();
    frame();
    expect(value("x")).toBeGreaterThan(0);
    expect(value("x")).toBeLessThan(1);
    expect(value("y")).toBeLessThan(0);
    settle();
    expect(value("x")).toBe(1);
    expect(value("y")).toBe(-1);
    const frames = vi.mocked(requestAnimationFrame).mock.calls.length;
    act(() => vi.advanceTimersByTime(60_000));
    expect(requestAnimationFrame).toHaveBeenCalledTimes(frames);
    point("pointerleave");
    settle();
    expect(value("x")).toBe(0);
    expect(value("y")).toBe(0);
  });

  it("responds to a touch once, ignores touch scrolling, and returns to rest", () => {
    render(<Harness />);
    const down = point("pointerdown", "touch");
    expect(down.defaultPrevented).toBe(false);
    expect(vi.getTimerCount()).toBe(1);
    frame();
    expect(value("x")).toBeGreaterThan(0);
    point("pointermove", "touch", -5000, -5000);
    point("pointerleave", "touch");
    settle();
    expect(value("x")).toBe(1);
    expect(value("y")).toBe(1);
    act(() => vi.advanceTimersByTime(1000));
    settle();
    expect(value("x")).toBe(0);
    expect(value("y")).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cancels touch response on pointer cancellation without blocking the event", () => {
    render(<Harness />);
    point("pointerdown", "touch");
    frame();
    const cancel = point("pointercancel", "touch");
    expect(cancel.defaultPrevented).toBe(false);
    settle();
    expect(value("x")).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("stops immediately when the room is paused or covered by a modal", () => {
    const view = render(<Harness />);
    point("pointerdown", "touch");
    frame();
    expect(callbacks.size).toBe(1);
    view.rerender(<Harness active={false} />);
    expect(value("x")).toBe(0);
    expect(callbacks.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    expect(stage()).toHaveAttribute("data-room-motion", "still");
    point("pointermove");
    expect(callbacks.size).toBe(0);
    view.rerender(<Harness />);
    expect(callbacks.size).toBe(0);
    point("pointermove");
    expect(callbacks.size).toBe(1);
  });

  it("honors reduced motion and hidden pages before and during interaction", () => {
    reduced = true;
    render(<Harness />);
    point("pointerdown", "touch");
    expect(callbacks.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    reduced = false;
    act(() => preference.dispatchEvent(new Event("change")));
    point("pointermove");
    frame();
    expect(value("x")).toBeGreaterThan(0);
    hidden = true;
    fireEvent(document, new Event("visibilitychange"));
    expect(value("x")).toBe(0);
    expect(callbacks.size).toBe(0);
    hidden = false;
    fireEvent(document, new Event("visibilitychange"));
    expect(callbacks.size).toBe(0);
    point("pointermove");
    reduced = true;
    act(() => preference.dispatchEvent(new Event("change")));
    expect(callbacks.size).toBe(0);
    expect(stage()).toHaveAttribute("data-room-motion", "still");
  });

  it("removes listeners, queued frames, and touch timers on repeated unmounts", () => {
    const add = vi.spyOn(document, "addEventListener");
    const remove = vi.spyOn(document, "removeEventListener");
    for (let count = 0; count < 20; count++) {
      const view = render(<Harness />);
      const node = stage();
      const removePointer = vi.spyOn(node, "removeEventListener");
      point("pointerdown", "touch");
      expect(callbacks.size).toBe(1);
      view.unmount();
      expect(callbacks.size).toBe(0);
      expect(vi.getTimerCount()).toBe(0);
      expect(removePointer.mock.calls.map(([type]) => type)).toEqual(["pointermove", "pointerdown", "pointerleave", "pointercancel"]);
    }
    const listeners = add.mock.calls.filter(([type]) => type === "visibilitychange");
    expect(listeners).toHaveLength(20);
    for (const [, listener] of listeners) expect(remove).toHaveBeenCalledWith("visibilitychange", listener);
    expect(preference.addEventListener).toHaveBeenCalledTimes(20);
    expect(preference.removeEventListener).toHaveBeenCalledTimes(20);
  });
});
