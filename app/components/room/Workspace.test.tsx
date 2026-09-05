import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Workspace, { BOOT_LINES } from "./Workspace";

vi.mock("./DesktopWindow", () => ({
  default: ({ app }: { app: string | null }) => <div data-testid="selected-app">{app}</div>,
}));

let motionQuery: MediaQueryList;

beforeEach(() => {
  vi.useFakeTimers();
  motionQuery = {
    matches: false,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  } as unknown as MediaQueryList;
  vi.stubGlobal("matchMedia", vi.fn(() => motionQuery));
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Workspace power lifecycle", () => {
  it("shows every boot stage before exposing the desktop", () => {
    render(<Workspace repos={[]} />);
    expect(screen.getByTestId("computer")).toHaveAttribute("data-power", "off");
    expect(screen.queryByTestId("desktop")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Power on computer" }));
    expect(screen.getByText(BOOT_LINES[0])).toBeInTheDocument();
    for (let step = 1; step < BOOT_LINES.length; step++) {
      act(() => vi.advanceTimersByTime(step === 1 ? 700 : 540));
      expect(screen.getByText(BOOT_LINES[step])).toBeInTheDocument();
      expect(screen.queryByTestId("desktop")).not.toBeInTheDocument();
    }
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    act(() => vi.advanceTimersByTime(540));
    expect(screen.getByTestId("desktop")).toBeInTheDocument();
    expect(screen.queryByTestId("boot-screen")).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps the requested app when startup is skipped and cancels the boot timer", () => {
    render(<Workspace repos={[]} />);
    const quick = within(screen.getByRole("navigation", { name: "Open a desktop app" }));
    fireEvent.click(quick.getByRole("button", { name: /^Resume(?:\s*↗)?$/ }));
    expect(screen.getByTestId("computer")).toHaveAttribute("data-power", "booting");
    fireEvent.click(screen.getByRole("button", { name: "Skip startup" }));
    expect(screen.getByTestId("selected-app")).toHaveTextContent("resume");
    expect(screen.getByTestId("computer")).toHaveAttribute("data-power", "on");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not restart itself after being shut down mid-boot", () => {
    render(<Workspace repos={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Power on computer" }));
    act(() => vi.advanceTimersByTime(700));
    fireEvent.click(screen.getByRole("button", { name: "Shut down computer" }));
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByTestId("computer")).toHaveAttribute("data-power", "off");
    expect(screen.getByTestId("selected-app")).toBeEmptyDOMElement();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("uses no staged delay when reduced motion is preferred", () => {
    Object.defineProperty(motionQuery, "matches", { value: true });
    render(<Workspace repos={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Power on computer" }));
    act(() => vi.advanceTimersByTime(0));
    expect(screen.getByTestId("desktop")).toBeInTheDocument();
    expect(screen.getByTestId("computer").closest(".workspace")).toHaveAttribute("data-moving", "false");
  });

  it("removes motion/visibility listeners and boot timers on unmount", () => {
    const add = vi.spyOn(document, "addEventListener");
    const remove = vi.spyOn(document, "removeEventListener");
    const addWindow = vi.spyOn(window, "addEventListener");
    const removeWindow = vi.spyOn(window, "removeEventListener");
    const view = render(<Workspace repos={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Power on computer" }));
    const visibility = add.mock.calls.find(([event]) => event === "visibilitychange")?.[1];
    const motion = vi.mocked(motionQuery.addEventListener).mock.calls[0][1];
    const hash = addWindow.mock.calls.find(([event]) => event === "hashchange")?.[1];
    view.unmount();
    expect(remove).toHaveBeenCalledWith("visibilitychange", visibility);
    expect(motionQuery.removeEventListener).toHaveBeenCalledWith("change", motion);
    expect(removeWindow).toHaveBeenCalledWith("hashchange", hash);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("pauses ambient work while the page is hidden and resumes when visible", () => {
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(false);
    render(<Workspace repos={[]} />);
    const room = screen.getByTestId("computer").closest(".workspace");
    expect(room).toHaveAttribute("data-moving", "true");
    hidden.mockReturnValue(true);
    fireEvent(document, new Event("visibilitychange"));
    expect(room).toHaveAttribute("data-moving", "false");
    hidden.mockReturnValue(false);
    fireEvent(document, new Event("visibilitychange"));
    expect(room).toHaveAttribute("data-moving", "true");
  });
});
