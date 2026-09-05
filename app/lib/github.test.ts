import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildTimelineData, shikiLang, fetchAllRepos, fetchReadme } from "./github";
import type { RepoCardData } from "./types";

beforeEach(() => {
  delete process.env.GITHUB_TOKEN;
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GITHUB_TOKEN;
});

function card(overrides: Partial<RepoCardData> = {}): RepoCardData {
  return {
    id: 1,
    name: "demo",
    description: null,
    htmlUrl: "https://x/demo",
    homepage: null,
    language: "TypeScript",
    stars: 0,
    pushedAt: "2026-02-10T00:00:00Z",
    createdAt: "2025-01-01T00:00:00Z",
    owner: "o",
    languages: [],
    commitActivity: [],
    topics: [],
    recentCommits: [],
    ...overrides,
  };
}

describe("shikiLang", () => {
  it("maps known languages and falls back to text", () => {
    expect(shikiLang("TypeScript")).toBe("typescript");
    expect(shikiLang("Python")).toBe("python");
    expect(shikiLang("Go")).toBe("go");
    expect(shikiLang(null)).toBe("text");
    expect(shikiLang("Brainfuck")).toBe("text");
  });
});

describe("buildTimelineData", () => {
  it("groups repos by year, newest first", () => {
    const tl = buildTimelineData([
      card({ id: 1, pushedAt: "2024-05-01T00:00:00Z" }),
      card({ id: 2, pushedAt: "2026-03-01T00:00:00Z" }),
    ]);
    expect(tl.map((y) => y.year)).toEqual(["2026", "2024"]);
  });

  it("returns an empty timeline for no repos", () => {
    expect(buildTimelineData([])).toEqual([]);
  });
});

describe("fetchAllRepos", () => {
  const ghRepo = {
    id: 7,
    name: "proj",
    full_name: "o/proj",
    description: "d",
    html_url: "https://github.com/o/proj",
    homepage: null,
    language: "Go",
    stargazers_count: 5,
    fork: false,
    private: false,
    pushed_at: "2026-01-01T00:00:00Z",
    created_at: "2025-01-01T00:00:00Z",
    topics: ["cli"],
    owner: { login: "o" },
  };

  function stubFetch(route: (url: string) => { ok: boolean; body: unknown }) {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const { ok, body } = route(String(input));
        return Promise.resolve({
          ok,
          status: ok ? 200 : 404,
          json: () => Promise.resolve(body),
          text: () =>
            Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
        } as Response);
      })
    );
  }

  it("maps repos from the public endpoint when no token is set", async () => {
    stubFetch((url) => {
      if (url.includes("/users/") && url.includes("/repos")) return { ok: true, body: [ghRepo] };
      if (url.includes("/languages")) return { ok: true, body: { Go: 100 } };
      if (url.includes("/stats/commit_activity")) return { ok: true, body: [{ total: 2 }] };
      if (url.includes("/commits")) return { ok: true, body: [] };
      return { ok: false, body: null };
    });

    const repos = await fetchAllRepos();
    expect(repos).toHaveLength(1);
    expect(repos[0]).toMatchObject({ name: "proj", language: "Go", stars: 5, topics: ["cli"] });
  });

  it("falls back to the public endpoint when the authenticated list is empty (BUG-1781501120)", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    let authHit = false;
    let publicHit = false;
    stubFetch((url) => {
      if (url.includes("/user/repos")) {
        authHit = true;
        return { ok: true, body: [] };
      }
      if (url.includes("/users/") && url.includes("/repos")) {
        publicHit = true;
        return { ok: true, body: [ghRepo] };
      }
      if (url.includes("/languages") || url.includes("/commit_activity") || url.includes("/commits"))
        return { ok: true, body: [] };
      return { ok: false, body: null };
    });

    const repos = await fetchAllRepos();
    expect(authHit).toBe(true);
    expect(publicHit).toBe(true);
    expect(repos).toHaveLength(1);
  });

  it("degrades to [] when the repos-list request is not ok", async () => {
    stubFetch(() => ({ ok: false, body: null }));
    expect(await fetchAllRepos()).toEqual([]);
  });
});

describe("fetchReadme", () => {
  afterEach(() => vi.useRealTimers());

  it("returns the public API's Markdown without using the configured token", async () => {
    process.env.GITHUB_TOKEN = "test-token-not-for-public-readmes";
    const request = vi.fn().mockResolvedValue(new Response("# Public README"));
    vi.stubGlobal("fetch", request);
    expect(await fetchReadme("LLRHook", "my-website")).toBe("# Public README");
    expect(request).toHaveBeenCalledTimes(1);
    expect(new Headers(request.mock.calls[0][1].headers).has("Authorization")).toBe(false);
  });

  it.each([403, 429, 500])("uses public raw README.md after API status %s without forwarding authorization", async (status) => {
    process.env.GITHUB_TOKEN = "test-token-not-for-raw-host";
    const request = vi.fn()
      .mockResolvedValueOnce(new Response("API unavailable", { status }))
      .mockResolvedValueOnce(new Response("# Raw README"));
    vi.stubGlobal("fetch", request);
    expect(await fetchReadme("LLRHook", "my-website")).toBe("# Raw README");
    expect(request.mock.calls.map(([url]) => url)).toEqual([
      "https://api.github.com/repos/LLRHook/my-website/readme",
      "https://raw.githubusercontent.com/LLRHook/my-website/HEAD/README.md",
    ]);
    for (const [, options] of request.mock.calls) {
      expect(new Headers(options.headers).has("Authorization")).toBe(false);
    }
  });

  it("continues to the lowercase public README after a timeout and another failed attempt", async () => {
    vi.useFakeTimers();
    const request = vi.fn((url: string, options: RequestInit) => {
      if (url.startsWith("https://api.github.com/")) {
        return new Promise<Response>((_resolve, reject) => {
          options.signal?.addEventListener("abort", () => reject(new DOMException("Timed out", "AbortError")), { once: true });
        });
      }
      if (url.endsWith("/README.md")) return Promise.reject(new TypeError("Network unavailable"));
      return Promise.resolve(new Response("# Lowercase README"));
    });
    vi.stubGlobal("fetch", request);
    const result = fetchReadme("LLRHook", "my-website");
    await vi.advanceTimersByTimeAsync(4000);
    expect(await result).toBe("# Lowercase README");
    expect(request).toHaveBeenCalledTimes(3);
    expect(request.mock.calls[2][0]).toBe("https://raw.githubusercontent.com/LLRHook/my-website/HEAD/readme.md");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("tries lowercase README when the API body is empty and uppercase file is missing", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(new Response(""))
      .mockResolvedValueOnce(new Response("Not found", { status: 404 }))
      .mockResolvedValueOnce(new Response("# Lowercase README"));
    vi.stubGlobal("fetch", request);
    expect(await fetchReadme("LLRHook", "my-website")).toBe("# Lowercase README");
    expect(request).toHaveBeenCalledTimes(3);
  });

  it("keeps the exact existing fallback when all public sources are missing", async () => {
    const request = vi.fn().mockImplementation(() => Promise.resolve(new Response("Not found", { status: 404 })));
    vi.stubGlobal("fetch", request);
    expect(await fetchReadme("LLRHook", "no-such-repository")).toBe("*No README available.*");
    expect(request).toHaveBeenCalledTimes(3);
  });

  it.each([
    ["../LLRHook", "my-website"],
    ["LLRHook", "../my-website"],
    ["LLRHook", ".."],
    ["LLRHook", "%2e%2e"],
    ["LLRHook", "repo?token=value"],
    ["LLRHook", "repo\\file"],
    ["", "my-website"],
  ])("rejects path components %j / %j before making a request", async (owner, repo) => {
    const request = vi.fn();
    vi.stubGlobal("fetch", request);
    expect(await fetchReadme(owner, repo)).toBe("*No README available.*");
    expect(request).not.toHaveBeenCalled();
  });
});
