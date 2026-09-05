import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WindowCat from "./WindowCat";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe("WindowCat", () => {
  it("starts asleep, wakes on interaction, and returns to sleep", () => {
    render(<WindowCat moving />);
    const sleeping = screen.getByRole("button", { name: "Say hello to the cat" });
    expect(sleeping).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(sleeping);
    expect(screen.getByRole("button", { name: "Let the cat sleep" })).toHaveAttribute("aria-pressed", "true");
    act(() => vi.advanceTimersByTime(6500));
    expect(screen.getByRole("button", { name: "Say hello to the cat" })).toHaveAttribute("aria-pressed", "false");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("can return to sleep early without leaving a wake timer", () => {
    render(<WindowCat moving={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Say hello to the cat" }));
    fireEvent.click(screen.getByRole("button", { name: "Let the cat sleep" }));
    expect(screen.getByRole("button")).toHaveAttribute("data-moving", "false");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("clears its pending return-to-sleep timer on unmount", () => {
    const view = render(<WindowCat moving />);
    fireEvent.click(screen.getByRole("button", { name: "Say hello to the cat" }));
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
