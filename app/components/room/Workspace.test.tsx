import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Workspace, { BOOT_LINES } from "./Workspace";

vi.mock("./DesktopWindow", () => ({
  default: ({ app, onNavigate, onClose }: { app: string | null; onNavigate: (id: "contact") => void; onClose: () => void }) => <div><div data-testid="selected-app">{app}</div><button onClick={() => onNavigate("contact")}>Test sidebar Contact</button><button onClick={onClose}>Test close app</button></div>,
}));

let motionQuery: MediaQueryList;

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute("open"); } });
});

beforeEach(() => {
  window.history.replaceState(null, "", "/");
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
  document.body.style.overflow = "";
});

describe("Workspace power lifecycle", () => {
  it("spins roulette in the room without opening a dialog", () => {
    render(<Workspace repos={[]} />);
    const wheel = screen.getByRole("button", { name: "Spin roulette wheel" });
    fireEvent.click(wheel);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Roulette result" })).toHaveTextContent("Spinning…");
    act(() => vi.advanceTimersByTime(2600));
    expect(wheel).toHaveAttribute("aria-disabled", "false");
    expect(screen.getByRole("status", { name: "Roulette result" })).toHaveTextContent(/\d+ · (red|black|green)/);
  });

  it.each(["pause", "reduced motion"])("settles roulette without delay or confetti for %s", preference => {
    if (preference === "reduced motion") Object.defineProperty(motionQuery, "matches", { value: true });
    const view = render(<Workspace repos={[]} />);
    if (preference === "pause") fireEvent.click(screen.getByRole("button", { name: "Pause motion" }));
    fireEvent.click(screen.getByRole("button", { name: "Spin roulette wheel" }));
    expect(screen.getByRole("button", { name: "Spin roulette wheel" })).toHaveAttribute("aria-disabled", "false");
    expect(screen.getByRole("status", { name: "Roulette result" })).toHaveTextContent(/\d+ · (red|black|green)/);
    expect(view.container.querySelector(".roulette-confetti")).toBeNull();
  });

  it("toggles evening from the window and keeps the toolbar control in sync", () => {
    render(<Workspace repos={[]} />);
    const room = screen.getByTestId("computer").closest(".workspace");
    const windowSeat = screen.getByRole("button", { name: "Look out the window. Bring in the evening" });
    expect(windowSeat).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(windowSeat);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(room).toHaveAttribute("data-night", "true");
    expect(windowSeat).toHaveAccessibleName("Look out the window. Bring back daylight");
    expect(windowSeat).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Evening. Switch to daylight" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Evening. Switch to daylight" }));
    expect(room).toHaveAttribute("data-night", "false");
    expect(windowSeat).toHaveAccessibleName("Look out the window. Bring in the evening");
    expect(windowSeat).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles the desk lamp glow in the room independently of daylight", () => {
    render(<Workspace repos={[]} />);
    const room = screen.getByTestId("computer").closest(".workspace");
    expect(room).toHaveAttribute("data-lamp", "true");
    const lamp = screen.getByRole("button", { name: "Desk lamp is on. Switch it off" });
    expect(lamp).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(lamp);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(room).toHaveAttribute("data-lamp", "false");
    expect(room).toHaveAttribute("data-night", "false");
    expect(lamp).toHaveAccessibleName("Desk lamp is off. Switch it on");
    expect(lamp).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(lamp);
    expect(room).toHaveAttribute("data-lamp", "true");
    expect(lamp).toHaveAttribute("aria-pressed", "true");
  });

  it("wakes the window cat in the room instead of opening a close-up", () => {
    render(<Workspace repos={[]} />);
    expect(screen.queryByRole("button", { name: "Meet the window cat up close" })).not.toBeInTheDocument();
    const cat = screen.getByRole("button", { name: "Say hello to the cat" });
    fireEvent.click(cat);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(cat).toHaveAccessibleName("Let the cat sleep");
    expect(cat).toHaveAttribute("aria-pressed", "true");
    act(() => vi.advanceTimersByTime(6500));
    expect(cat).toHaveAccessibleName("Say hello to the cat");
    expect(cat).toHaveAttribute("aria-pressed", "false");
  });

  it("shows a concise diploma close-up and restores the room trigger", () => {
    render(<Workspace repos={[]} />);
    const trigger = screen.getByRole("button", { name: "Take a closer look at the diploma" });
    fireEvent.click(trigger);
    const detail = screen.getByRole("dialog", { name: "B.S. Computer Science · UMBC" });
    expect(within(detail).getByRole("img", { name: "B.S. Computer Science · UMBC" })).toBeInTheDocument();
    expect(detail.querySelector("dl, .detail-description, .object-detail-story")).toBeNull();
    fireEvent.click(within(detail).getByRole("button", { name: "Back to room" }));
    expect(trigger).toHaveFocus();
  });

  it("shows every boot stage before exposing the desktop", () => {
    render(<Workspace repos={[]} />);
    expect(screen.getByTestId("computer")).toHaveAttribute("data-power", "off");
    expect(screen.queryByTestId("desktop")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Power on computer" }));
    expect(screen.getByText(BOOT_LINES[0])).toBeInTheDocument();
    for (let step = 1; step < BOOT_LINES.length; step++) {
      act(() => vi.advanceTimersByTime(step === 1 ? 700 : 540));
      expect(screen.getByText((_content, element) => element?.tagName === "P" && element.textContent === BOOT_LINES[step])).toBeInTheDocument();
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
    fireEvent.click(quick.getByRole("link", { name: /^Resume(?:\s*↗)?$/ }));
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
    // jsdom queues a zero-delay selectionchange when the focused computer opens.
    // Deliver that browser event while mounted; the 700 ms boot timer must remain.
    act(() => vi.advanceTimersByTime(0));
    expect(vi.getTimerCount()).toBe(1);
    expect(screen.getByText(BOOT_LINES[0])).toBeInTheDocument();
    const visibility = add.mock.calls.filter(([event]) => event === "visibilitychange").map(([, listener]) => listener);
    const motion = vi.mocked(motionQuery.addEventListener).mock.calls[0][1];
    const hash = addWindow.mock.calls.find(([event]) => event === "hashchange")?.[1];
    view.unmount();
    expect(visibility.length).toBeGreaterThan(0);
    for (const listener of visibility) expect(remove).toHaveBeenCalledWith("visibilitychange", listener);
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


describe("Workspace app URLs", () => {
  it("opens a direct app immediately without a boot timer", () => {
    window.history.replaceState(null, "", "/resume");
    render(<Workspace repos={[]} initialApp="resume" />);
    expect(screen.getByTestId("selected-app")).toHaveTextContent("resume");
    expect(screen.getByTestId("computer")).toHaveAttribute("data-power", "on");
    expect(screen.queryByTestId("boot-screen")).not.toBeInTheDocument();
    expect(document.title).toBe("Resume | Victor Ivanov");
  });

  it("pushes room app opens and close, replaces sidebar switches, and reopens on popstate", () => {
    const push = vi.spyOn(window.history, "pushState");
    const replace = vi.spyOn(window.history, "replaceState");
    render(<Workspace repos={[]} />);
    fireEvent.click(within(screen.getByRole("navigation", { name: "Open a desktop app" })).getByRole("link", { name: /^Resume/ }));
    expect(push).toHaveBeenLastCalledWith(null, "", "/resume");
    fireEvent.click(screen.getByRole("button", { name: "Skip startup" }));
    expect(screen.getByTestId("selected-app")).toHaveTextContent("resume");
    fireEvent.click(screen.getByRole("button", { name: "Test sidebar Contact" }));
    expect(replace).toHaveBeenLastCalledWith(null, "", "/contact");
    expect(document.title).toBe("Contact | Victor Ivanov");
    fireEvent.click(screen.getByRole("button", { name: "Test close app" }));
    expect(push).toHaveBeenLastCalledWith(null, "", "/");
    expect(screen.getByTestId("selected-app")).toBeEmptyDOMElement();
    expect(document.title).toBe("Victor Ivanov | Senior Full-Stack Engineer");
    window.history.replaceState(null, "", "/resume");
    const pushes = push.mock.calls.length;
    fireEvent(window, new PopStateEvent("popstate"));
    expect(screen.getByTestId("selected-app")).toHaveTextContent("resume");
    expect(screen.getByTestId("computer")).toHaveAttribute("data-power", "on");
    expect(push).toHaveBeenCalledTimes(pushes);
    window.history.replaceState(null, "", "/");
    fireEvent(window, new PopStateEvent("popstate"));
    expect(screen.getByTestId("selected-app")).toBeEmptyDOMElement();
  });

  it.each(["about", "projects", "work", "resume", "interests", "contact"])("migrates the legacy #%s hash", hash => {
    window.history.replaceState(null, "", `/#${hash}`);
    render(<Workspace repos={[]} />);
    const id = hash === "work" ? "projects" : hash;
    expect(screen.getByTestId("selected-app")).toHaveTextContent(id);
    expect(window.location.pathname).toBe(id === "interests" ? "/off-the-clock" : `/${id}`);
    expect(window.location.hash).toBe("");
  });

  it("leaves modified link clicks to the browser", () => {
    const push = vi.spyOn(window.history, "pushState");
    render(<Workspace repos={[]} />);
    const link = within(screen.getByRole("navigation", { name: "Portfolio navigation" })).getByRole("link", { name: "Resume" });
    expect(link).toHaveAttribute("href", "/resume");
    fireEvent.click(link, { ctrlKey: true });
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByTestId("selected-app")).toBeEmptyDOMElement();
  });
});
