import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { frameIndex, pocketAngle, ringPoint, SPIN_MS, spinPlan } from "@/app/lib/roulette";
import { SCENE } from "@/app/lib/room-scene";
import RouletteToy, { RESULT_VISIBLE_MS } from "./RouletteToy";

let callbacks: Map<number, FrameRequestCallback>;
let images: { src: string; onload: (() => void) | null }[];
let frameId: number;

beforeEach(() => {
  vi.useFakeTimers();
  callbacks = new Map();
  images = [];
  frameId = 0;
  vi.spyOn(performance, "now").mockReturnValue(0);
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
    callbacks.set(++frameId, callback);
    return frameId;
  }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => callbacks.delete(id)));
  vi.stubGlobal("Image", class {
    src = "";
    onload = null;
    constructor() { images.push(this); }
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function samples(...values: number[]) {
  let index = 0;
  const random = vi.fn((array: Uint32Array) => {
    array[0] = values[Math.min(index++, values.length - 1)];
    return array;
  });
  vi.stubGlobal("crypto", { getRandomValues: random });
  return random;
}

function frame(time: number) {
  act(() => {
    const pending = [...callbacks.values()];
    callbacks.clear();
    pending.forEach((callback) => callback(time));
  });
}

const spin = () => fireEvent.click(screen.getByRole("button", { name: "Spin roulette wheel" }));
const status = () => screen.getByRole("status", { name: "Roulette result" });

describe("sprite roulette toy", () => {
  it.each([[0, "0 · green"], [1, "32 · red"], [2, "15 · black"]])("lands immediately at index %i for reduced motion", (index, outcome) => {
    samples(Number(index));
    render(<RouletteToy variant="day_lamp_on" reducedMotion />);
    spin();
    expect(status()).toHaveTextContent(String(outcome));
    expect(status()).toHaveAttribute("data-visible", "true");
    expect(screen.getByRole("button")).toHaveAttribute("aria-disabled", "false");
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "false");
    expect(callbacks.size).toBe(0);
    expect(vi.getTimerCount()).toBe(1);
  });

  it("starts hidden with no scheduled work", () => {
    render(<RouletteToy variant="day_lamp_on" reducedMotion={false} />);
    expect(status()).toHaveAttribute("data-visible", "false");
    expect(status()).toBeEmptyDOMElement();
    expect(images).toHaveLength(0);
    expect(callbacks.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("guards duplicate spins synchronously and keeps keyboard focus and aria state", () => {
    const random = samples(1, 2);
    render(<RouletteToy variant="day_lamp_on" reducedMotion={false} />);
    const button = screen.getByRole("button");
    button.focus();
    spin();
    spin();
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(status()).toHaveTextContent("Spinning…");
    expect(random).toHaveBeenCalledTimes(1);
    frame(SPIN_MS - 1);
    expect(status()).toHaveTextContent("Spinning…");
    frame(SPIN_MS);
    expect(status()).toHaveTextContent("32 · red");
    expect(button).toHaveAttribute("aria-disabled", "false");
    spin();
    expect(random).toHaveBeenCalledTimes(2);
    frame(SPIN_MS);
    expect(status()).toHaveTextContent("15 · black");
  });

  it("preloads each lighting sprite on pointer or focus and reveals it only after load and spin", () => {
    samples(0);
    const view = render(<RouletteToy variant="day_lamp_on" reducedMotion />);
    const button = screen.getByRole("button");
    const rotor = view.container.querySelector(".roulette-rotor")!;
    fireEvent.pointerEnter(button);
    fireEvent.focus(button);
    expect(images).toHaveLength(1);
    expect(images[0].src).toBe("/room/roulette-day_lamp_on.webp");
    act(() => images[0].onload!());
    expect(rotor).toHaveAttribute("data-ready", "false");
    spin();
    expect(rotor).toHaveAttribute("data-ready", "true");
    view.rerender(<RouletteToy variant="night_lamp_on" reducedMotion />);
    expect(rotor).toHaveAttribute("data-ready", "false");
    fireEvent.focus(button);
    expect(images[1].src).toBe("/room/roulette-night_lamp_on.webp");
    act(() => images[1].onload!());
    expect(rotor).toHaveAttribute("data-ready", "true");
  });

  it("writes projected ball positions and sprite frames without resetting cumulative rotor travel", () => {
    samples(1, 2);
    const view = render(<RouletteToy variant="day_lamp_on" reducedMotion={false} />);
    const rotor = view.container.querySelector<HTMLElement>(".roulette-rotor")!;
    const ball = view.container.querySelector<HTMLElement>(".roulette-ball")!;
    spin();
    const start = rotor.style.backgroundPosition;
    frame(SPIN_MS / 2);
    expect(rotor.style.backgroundPosition).not.toBe(start);
    frame(SPIN_MS);
    spin();
    frame(SPIN_MS);
    const total = spinPlan(1).rotorEnd + spinPlan(2).rotorEnd;
    const point = ringPoint(pocketAngle(2, total), 1);
    const { crop, columns, frames } = SCENE.roulette;
    expect(parseFloat(ball.style.left)).toBeCloseTo((point[0] - crop.x) / crop.w * 100);
    expect(parseFloat(ball.style.top)).toBeCloseTo((point[1] - crop.y) / crop.h * 100);
    const index = frameIndex(total);
    expect(parseFloat(rotor.style.backgroundPositionX)).toBeCloseTo(index % columns / (columns - 1) * 100);
    expect(parseFloat(rotor.style.backgroundPositionY)).toBeCloseTo(Math.floor(index / columns) / (Math.ceil(frames / columns) - 1) * 100);
  });

  it("keeps the result visible for 2500 ms and retains its polite atomic announcement after expiry", () => {
    samples(0);
    render(<RouletteToy variant="day_lamp_on" reducedMotion />);
    spin();
    act(() => vi.advanceTimersByTime(RESULT_VISIBLE_MS - 1));
    expect(status()).toHaveAttribute("data-visible", "true");
    act(() => vi.advanceTimersByTime(1));
    expect(status()).toHaveAttribute("data-visible", "false");
    expect(status()).toHaveTextContent("0 · green");
    expect(status()).toHaveAttribute("aria-live", "polite");
    expect(status()).toHaveAttribute("aria-atomic", "true");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("starts expiry after landing and cancels the previous result's expiry on a new spin", () => {
    samples(0, 1);
    render(<RouletteToy variant="day_lamp_on" reducedMotion={false} />);
    spin();
    expect(vi.getTimerCount()).toBe(0);
    frame(SPIN_MS);
    act(() => vi.advanceTimersByTime(RESULT_VISIBLE_MS - 100));
    spin();
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(100));
    expect(status()).toHaveTextContent("Spinning…");
    expect(status()).toHaveAttribute("data-visible", "true");
    frame(SPIN_MS);
    act(() => vi.advanceTimersByTime(RESULT_VISIBLE_MS - 1));
    expect(status()).toHaveAttribute("data-visible", "true");
    act(() => vi.advanceTimersByTime(1));
    expect(status()).toHaveAttribute("data-visible", "false");
  });

  it("cleans up animation, expiry, and image callbacks on unmount", () => {
    samples(1);
    const first = render(<RouletteToy variant="day_lamp_on" reducedMotion={false} />);
    spin();
    expect(callbacks.size).toBe(1);
    first.unmount();
    expect(callbacks.size).toBe(0);
    expect(images[0].onload).toBeNull();
    const second = render(<RouletteToy variant="day_lamp_on" reducedMotion />);
    spin();
    expect(vi.getTimerCount()).toBe(1);
    second.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("reports RNG failure and allows retry without inventing a result", () => {
    vi.stubGlobal("crypto", { getRandomValues: () => { throw new Error("unavailable"); } });
    render(<RouletteToy variant="day_lamp_on" reducedMotion />);
    spin();
    expect(status()).toHaveTextContent("Couldn’t spin. Try again.");
    expect(status()).toHaveAttribute("data-visible", "true");
    expect(screen.getByRole("button")).toHaveAttribute("aria-disabled", "false");
    expect(callbacks.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    samples(0);
    spin();
    expect(status()).toHaveTextContent("0 · green");
  });
});
