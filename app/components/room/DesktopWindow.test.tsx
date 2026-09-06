import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { RepoCardData } from "@/app/lib/types";
import DesktopWindow from "./DesktopWindow";

const repos: RepoCardData[] = [
  {
    id: 1, name: "mail-demo", owner: "sample-owner", description: "A reliable email playground",
    htmlUrl: "https://github.com/sample-owner/mail-demo", homepage: null, language: "Go", stars: 0,
    createdAt: "2025-01-01T00:00:00Z", pushedAt: "2026-01-01T00:00:00Z",
    languages: [], commitActivity: [], topics: ["smtp"], recentCommits: [],
  },
  {
    id: 2, name: "city-demo", owner: "sample-owner", description: "Repositories in an isometric city",
    htmlUrl: "https://github.com/sample-owner/city-demo", homepage: null, language: "TypeScript", stars: 0,
    createdAt: "2025-01-01T00:00:00Z", pushedAt: "2026-01-01T00:00:00Z",
    languages: [], commitActivity: [], topics: ["desktop"], recentCommits: [],
  },
];

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute("open"); } });
  Object.defineProperty(HTMLElement.prototype, "scrollTo", { configurable: true, value: vi.fn() });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.style.overflow = "";
});

function openProjects(cards = repos) {
  return render(<DesktopWindow app="projects" onNavigate={vi.fn()} onClose={vi.fn()} repos={cards} />);
}

describe("DesktopWindow projects", () => {
  it("searches name, description, language, and topic without case sensitivity", () => {
    openProjects();
    const search = screen.getByRole("searchbox", { name: "Search projects" });
    for (const term of ["MAIL", "EMAIL", "GO", "SMTP"]) {
      fireEvent.change(search, { target: { value: term } });
      expect(screen.getByRole("heading", { name: "mail-demo" })).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "city-demo" })).not.toBeInTheDocument();
    }
    fireEvent.change(search, { target: { value: "no-such-project" } });
    expect(screen.getByText("No matching projects.")).toBeInTheDocument();
    fireEvent.change(search, { target: { value: "" } });
    expect(screen.getByRole("heading", { name: "city-demo" })).toBeInTheDocument();
  });

  it("provides the GitHub fallback when no repos are available", () => {
    openProjects([]);
    expect(screen.getByText("The project shelf is taking a moment.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Visit GitHub ↗" })).toHaveAttribute("href", "https://github.com/LLRHook");
  });

  it("keeps selected work available when the GitHub shelf is unavailable", () => {
    openProjects([]);
    expect(screen.getByRole("link", { name: "Merged contribution" })).toHaveAttribute("href", "https://github.com/Kilo-Org/kilocode/pull/8524");
    expect(screen.getByRole("link", { name: "Explore the source" })).toHaveAttribute("href", "https://github.com/LLRHook/checksinmyhead");
  });

  it("finds Billington by both names and loads notes from the original repository path", async () => {
    const fetchNotes = vi.fn().mockResolvedValue(new Response("# Billington notes", { headers: { "Content-Type": "text/plain; charset=utf-8" } }));
    vi.stubGlobal("fetch", fetchNotes);
    openProjects([{ ...repos[0], name: "checksinmyhead", owner: "LLRHook", htmlUrl: "https://github.com/LLRHook/checksinmyhead", description: null }]);
    const search = screen.getByRole("searchbox", { name: "Search projects" });
    for (const term of ["billington", "checksinmyhead"]) {
      fireEvent.change(search, { target: { value: term } });
      expect(screen.getByRole("button", { name: /Billington/ })).toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole("button", { name: /Billington/ }));
    expect(await screen.findByRole("heading", { name: "Billington notes" })).toBeInTheDocument();
    expect(fetchNotes).toHaveBeenCalledWith("/api/readme/LLRHook/checksinmyhead", expect.any(Object));
    expect(screen.getByRole("link", { name: "Open repository" })).toHaveAttribute("href", "https://github.com/LLRHook/checksinmyhead");
  });

  it("renders notes, removes remote images, and keeps unsafe links off the page", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("# Mail guide\n\n![tracker](https://example.com/pixel.png)\n\n[Guide](https://example.com/guide)\n\n[Bad](javascript:alert(1))\n\n<script>window.evil=true</script>", { headers: { "Content-Type": "text/plain; charset=utf-8" } })));
    openProjects();
    fireEvent.click(screen.getByRole("button", { name: /mail-demo/ }));
    expect(await screen.findByRole("heading", { name: "Mail guide" })).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Guide ↗" })).toHaveAttribute("href", "https://example.com/guide");
    expect(screen.getByRole("link", { name: "Bad ↗" })).toHaveAttribute("href", repos[0].htmlUrl);
    expect(document.querySelector(".project-readme script")).toBeNull();
  });

  it("shows a usable fallback after a failed README response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Not found", { status: 404 })));
    openProjects();
    fireEvent.click(screen.getByRole("button", { name: /mail-demo/ }));
    expect(screen.getByRole("heading", { name: "mail-demo" })).toHaveFocus();
    expect(await screen.findByText("Project notes could not load. You can still open the repository on GitHub.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open repository" })).toHaveAttribute("href", repos[0].htmlUrl);
    fireEvent.click(screen.getByRole("button", { name: "← All projects" }));
    expect(screen.getByRole("searchbox", { name: "Search projects" })).toHaveFocus();
  });

  it("handles an empty text response without leaving blank project notes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { headers: { "Content-Type": "text/plain; charset=utf-8" } })));
    openProjects();
    fireEvent.click(screen.getByRole("button", { name: /mail-demo/ }));
    expect(await screen.findByText("Project notes are available on GitHub.")).toBeInTheDocument();
  });

  it("aborts a pending README when the window closes and starts fresh when reopened", async () => {
    const signals: AbortSignal[] = [];
    vi.stubGlobal("fetch", vi.fn((_url: string, options: RequestInit) => new Promise((_resolve, reject) => {
      const signal = options.signal as AbortSignal;
      signals.push(signal);
      signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    })));
    const props = { onNavigate: vi.fn(), onClose: vi.fn(), repos };
    const view = render(<DesktopWindow {...props} app="projects" />);
    fireEvent.click(screen.getByRole("button", { name: /mail-demo/ }));
    await waitFor(() => expect(signals).toHaveLength(1));
    expect(signals[0].aborted).toBe(false);
    await act(async () => view.rerender(<DesktopWindow {...props} app={null} />));
    expect(signals[0].aborted).toBe(true);
    view.rerender(<DesktopWindow {...props} app="projects" />);
    fireEvent.click(screen.getByRole("button", { name: /city-demo/ }));
    await waitFor(() => expect(signals).toHaveLength(2));
    expect(signals[1].aborted).toBe(false);
    await act(async () => view.unmount());
    expect(signals[1].aborted).toBe(true);
  });

  it("restores the original body scroll setting after the modal closes", () => {
    document.body.style.overflow = "auto";
    const view = openProjects();
    expect(document.body.style.overflow).toBe("hidden");
    view.unmount();
    expect(document.body.style.overflow).toBe("auto");
  });

  it("releases the modal before asking the room to restore launcher focus", () => {
    const onClose = vi.fn(() => {
      expect(document.querySelector("dialog")).not.toHaveAttribute("open");
    });
    render(<DesktopWindow app="projects" onNavigate={vi.fn()} onClose={onClose} repos={repos} />);
    fireEvent.click(screen.getByRole("button", { name: "Close window and return to room" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders GitHub Markdown tables and resolves README links in the repository", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("# Notes\n\n| Check | Result |\n| --- | --- |\n| Tests | Passed |\n\n[Setup](./docs/setup.md)\n\n[Root docs](/docs/guide.md)\n\n[Section](#usage)", { headers: { "Content-Type": "text/plain; charset=utf-8" } })));
    openProjects();
    fireEvent.click(screen.getByRole("button", { name: /mail-demo/ }));
    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Passed" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Project documentation table" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("link", { name: "Setup ↗" })).toHaveAttribute("href", `${repos[0].htmlUrl}/blob/HEAD/docs/setup.md`);
    expect(screen.getByRole("link", { name: "Root docs ↗" })).toHaveAttribute("href", `${repos[0].htmlUrl}/blob/HEAD/docs/guide.md`);
    expect(screen.getByRole("link", { name: "Section ↗" })).toHaveAttribute("href", `${repos[0].htmlUrl}#usage`);
  });
});
