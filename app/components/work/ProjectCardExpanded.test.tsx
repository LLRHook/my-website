import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RepoCardData } from "@/app/lib/types";
import ProjectCardExpanded from "./ProjectCardExpanded";

const repo: RepoCardData = {
  id: 1,
  name: "demo",
  description: "A demo project",
  htmlUrl: "https://github.com/owner/demo",
  homepage: null,
  language: "TypeScript",
  stars: 0,
  pushedAt: "2026-09-01T00:00:00Z",
  createdAt: "2026-01-01T00:00:00Z",
  owner: "owner",
  languages: [],
  commitActivity: [],
  topics: [],
  recentCommits: [],
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ProjectCardExpanded lazy tabs", () => {
  it("loads each tab on demand and reuses completed README and source requests", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(new Response("# Project guide"))
      .mockResolvedValueOnce(Response.json({ html: "<pre>export const ready = true;</pre>", path: "app.ts" }));
    vi.stubGlobal("fetch", request);

    render(<ProjectCardExpanded repo={repo} />);
    expect(screen.getByRole("tabpanel")).toHaveTextContent(/^$/);
    expect(await screen.findByRole("heading", { name: "Project guide" })).toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("tab", { name: "Code" }));
    expect(await screen.findByText("export const ready = true;")).toBeInTheDocument();
    expect(screen.getByText("app.ts")).toBeInTheDocument();
    expect(request).toHaveBeenLastCalledWith("/api/source/owner/demo?lang=TypeScript", expect.objectContaining({ signal: expect.any(AbortSignal) }));

    fireEvent.click(screen.getByRole("tab", { name: "README" }));
    expect(screen.getByRole("heading", { name: "Project guide" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Code" }));
    expect(screen.getByText("export const ready = true;")).toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("aborts unfinished requests on tab changes and retries when returning", async () => {
    const pending: { signal: AbortSignal; resolve: (response: Response) => void }[] = [];
    const request = vi.fn((_url: string, options: RequestInit) => new Promise<Response>((resolve, reject) => {
      const signal = options.signal!;
      pending.push({ signal, resolve });
      signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    }));
    vi.stubGlobal("fetch", request);

    const view = render(<ProjectCardExpanded repo={repo} />);
    fireEvent.click(screen.getByRole("tab", { name: "Code" }));
    expect(pending[0].signal.aborted).toBe(true);
    fireEvent.click(screen.getByRole("tab", { name: "README" }));
    expect(pending[1].signal.aborted).toBe(true);
    expect(request).toHaveBeenCalledTimes(3);

    await act(async () => pending[2].resolve(new Response("# Retried guide")));
    expect(screen.getByRole("heading", { name: "Retried guide" })).toBeInTheDocument();
    expect(screen.queryByText("Failed to load README.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Code" }));
    expect(request).toHaveBeenCalledTimes(4);
    view.unmount();
    expect(pending[3].signal.aborted).toBe(true);
  });

  it("replaces pending content with fallbacks when requests fail", async () => {
    const request = vi.fn().mockRejectedValue(new Error("Network unavailable"));
    vi.stubGlobal("fetch", request);

    render(<ProjectCardExpanded repo={repo} />);
    expect(await screen.findByText("Failed to load README.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Code" }));
    expect(await screen.findByText("No source preview available.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "README" }));
    expect(screen.getByText("Failed to load README.")).toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(2);
  });
});
