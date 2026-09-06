import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { drawPocketIndex, landingRotation, POCKET_ANGLE, ROULETTE_POCKETS, SPIN_DURATION_MS } from "@/app/lib/roulette";
import RouletteToy, { RESULT_VISIBLE_MS } from "./RouletteToy";

beforeEach(() => vi.useFakeTimers());
afterEach(() => { cleanup(); vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function samples(...values: number[]) {
  let index = 0;
  const random = vi.fn((array: Uint32Array) => { array[0] = values[Math.min(index++, values.length - 1)]; return array; });
  vi.stubGlobal("crypto", { getRandomValues: random });
  return random;
}
const spin = () => fireEvent.click(screen.getByRole("button", { name: "Spin roulette wheel" }));
const status = () => screen.getByRole("status", { name: "Roulette result" });

describe("roulette desk toy", () => {
  it.each([[0, "0 · green"], [1, "32 · red"], [2, "15 · black"]])("announces the numbered pocket at index %i", (index, outcome) => {
    samples(Number(index));
    render(<RouletteToy moving={false} />);
    spin();
    expect(status()).toHaveTextContent(String(outcome));
    expect(status()).toHaveAttribute("data-visible", "true");
    expect(screen.getByRole("button")).toHaveAttribute("aria-disabled", "false");
    expect(vi.getTimerCount()).toBe(1);
  });
  it("starts hidden on a fresh page", () => {
    render(<RouletteToy moving={false} />);
    expect(status()).toHaveAttribute("data-visible", "false");
    expect(status()).toHaveTextContent("");
    expect(vi.getTimerCount()).toBe(0);
  });
  it("draws once while spinning, keeps keyboard focus, then accepts another independent spin", () => {
    const random = samples(1, 1);
    render(<RouletteToy moving />);
    const wheel = screen.getByRole("button");
    wheel.focus();
    spin(); spin();
    expect(wheel).toHaveFocus();
    expect(wheel).toHaveAttribute("aria-disabled", "true");
    expect(random).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(SPIN_DURATION_MS - 1));
    expect(status()).toHaveTextContent("Spinning…");
    act(() => vi.advanceTimersByTime(1));
    expect(status()).toHaveTextContent("32 · red");
    spin();
    expect(random).toHaveBeenCalledTimes(2);
    act(() => vi.advanceTimersByTime(SPIN_DURATION_MS));
    expect(status()).toHaveTextContent("32 · red");
  });
  it("visually hides the settled result after the display window but keeps the announcement text", () => {
    samples(0, 2);
    render(<RouletteToy moving={false} />);
    spin();
    act(() => vi.advanceTimersByTime(RESULT_VISIBLE_MS - 1));
    expect(status()).toHaveAttribute("data-visible", "true");
    act(() => vi.advanceTimersByTime(1));
    expect(status()).toHaveAttribute("data-visible", "false");
    expect(status()).toHaveTextContent("0 · green");
    expect(status()).toHaveAttribute("aria-live", "polite");
    expect(vi.getTimerCount()).toBe(0);
    spin();
    expect(status()).toHaveAttribute("data-visible", "true");
    expect(status()).toHaveTextContent("15 · black");
  });
  it("only starts the hide timer once the spin settles", () => {
    samples(1);
    render(<RouletteToy moving />);
    spin();
    act(() => vi.advanceTimersByTime(SPIN_DURATION_MS - 1));
    expect(vi.getTimerCount()).toBe(1);
    expect(status()).toHaveAttribute("data-visible", "true");
    act(() => vi.advanceTimersByTime(1));
    act(() => vi.advanceTimersByTime(RESULT_VISIBLE_MS - 1));
    expect(status()).toHaveTextContent("32 · red");
    expect(status()).toHaveAttribute("data-visible", "true");
    act(() => vi.advanceTimersByTime(1));
    expect(status()).toHaveAttribute("data-visible", "false");
  });
  it("does not let the previous round's hide timer hide a newer result", () => {
    samples(0, 1);
    render(<RouletteToy moving={false} />);
    spin();
    act(() => vi.advanceTimersByTime(RESULT_VISIBLE_MS - 100));
    spin();
    expect(status()).toHaveTextContent("32 · red");
    expect(status()).toHaveAttribute("data-visible", "true");
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(100));
    expect(status()).toHaveAttribute("data-visible", "true");
    act(() => vi.advanceTimersByTime(RESULT_VISIBLE_MS - 101));
    expect(status()).toHaveAttribute("data-visible", "true");
    act(() => vi.advanceTimersByTime(1));
    expect(status()).toHaveAttribute("data-visible", "false");
    expect(status()).toHaveTextContent("32 · red");
  });
  it("settles immediately when motion stops mid-spin, without later replaying confetti", () => {
    samples(1);
    const view = render(<RouletteToy moving />);
    spin();
    act(() => vi.advanceTimersByTime(500));
    view.rerender(<RouletteToy moving={false} />);
    expect(status()).toHaveTextContent("32 · red");
    expect(vi.getTimerCount()).toBe(1);
    expect(view.container.querySelector(".roulette-confetti")).toBeNull();
    view.rerender(<RouletteToy moving />);
    expect(view.container.querySelector(".roulette-confetti")).toBeNull();
  });
  it("skips the fade while paused but still hides on schedule", () => {
    samples(1);
    const view = render(<RouletteToy moving={false} />);
    spin();
    expect(status()).toHaveAttribute("data-still", "true");
    expect(status()).toHaveAttribute("data-visible", "true");
    act(() => vi.advanceTimersByTime(RESULT_VISIBLE_MS - 1));
    expect(status()).toHaveAttribute("data-visible", "true");
    act(() => vi.advanceTimersByTime(1));
    expect(status()).toHaveAttribute("data-visible", "false");
    expect(status()).toHaveTextContent("32 · red");
    expect(vi.getTimerCount()).toBe(0);
    view.rerender(<RouletteToy moving />);
    expect(status()).toHaveAttribute("data-still", "false");
    expect(status()).toHaveAttribute("data-visible", "false");
  });
  it("removes the unfinished spin timer and the later hide timer on unmount", () => {
    samples(1);
    const first = render(<RouletteToy moving />);
    spin();
    expect(vi.getTimerCount()).toBe(1);
    first.unmount();
    expect(vi.getTimerCount()).toBe(0);
    const second = render(<RouletteToy moving />);
    spin();
    act(() => vi.advanceTimersByTime(SPIN_DURATION_MS));
    expect(status()).toHaveTextContent("32 · red");
    expect(vi.getTimerCount()).toBe(1);
    second.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("allows retry after a failed secure RNG without inventing a result", () => {
    vi.stubGlobal("crypto", { getRandomValues: () => { throw new Error("unavailable"); } });
    render(<RouletteToy moving={false} />);
    spin();
    expect(status()).toHaveTextContent("Couldn’t spin. Try again.");
    expect(status()).toHaveAttribute("data-visible", "true");
    expect(vi.getTimerCount()).toBe(0);
    samples(0);
    spin();
    expect(status()).toHaveTextContent("0 · green");
    expect(vi.getTimerCount()).toBe(1);
  });
  it("uses a balanced numbered layout and lands every pocket under the pointer", () => {
    expect(ROULETTE_POCKETS.map(p => p.number).sort((a,b) => a-b)).toEqual(Array.from({length:37},(_,i)=>i));
    const red = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    expect(ROULETTE_POCKETS.filter(p => p.color === "red").map(p => p.number).sort((a,b)=>a-b)).toEqual(red);
    expect(ROULETTE_POCKETS.filter(p => p.color === "green").map(p => p.number)).toEqual([0]);
    let rotation = 0;
    for (let index=0; index<37; index++) {
      const next = landingRotation(rotation,index);
      expect(next-rotation).toBeGreaterThanOrEqual(1080-.000001);
      const angle=(index*POCKET_ANGLE+next)%360;
      expect(Math.min(angle,360-angle)).toBeLessThan(.000001);
      rotation=next;
    }
  });
  it("maps each accepted integer residue to one pocket", () => {
    for (let raw=0; raw<74; raw++) { samples(raw); expect(drawPocketIndex()).toBe(raw%37); }
    samples(4_294_967_288);
    expect(drawPocketIndex()).toBe(36);
  });
  it("rejects the incomplete uint32 tail rather than biasing the first pockets", () => {
    for (let raw=4_294_967_289; raw<=4_294_967_295; raw++) {
      const random=samples(raw,0);
      expect(drawPocketIndex()).toBe(0);
      expect(random).toHaveBeenCalledTimes(2);
    }
    const random=samples(4_294_967_295,4_294_967_294,36);
    expect(drawPocketIndex()).toBe(36);
    expect(random).toHaveBeenCalledTimes(3);
  });
});
