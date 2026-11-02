import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchRepoList } from "./github";


beforeEach(() => {
  delete process.env.GITHUB_TOKEN;
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  delete process.env.GITHUB_TOKEN;
});

describe("fetchRepoList", () => {
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

  function stubFetch(route: (url: string, init?: RequestInit) => { ok: boolean; body: unknown; status?: number }) {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const { ok, body, status } = route(String(input), init);
        return Promise.resolve({
          ok,
          status: status ?? (ok ? 200 : 404),
          json: () => Promise.resolve(body),
          text: () =>
            Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
        } as Response);
      })
    );
  }


  it("lists the portfolio owner's public repositories even when a token is configured", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    stubFetch((url) => { expect(url).toContain("/users/LLRHook/repos?type=owner"); return { ok: true, body: [ghRepo] }; });
    expect(await fetchRepoList()).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ headers: { Accept: "application/vnd.github.v3+json", Authorization: "Bearer test-token" }, next: { revalidate: 3600 } }));
  });
  it("falls back to public when authenticated listing is empty", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    stubFetch((_url, init) => ({ ok: true, body: new Headers(init?.headers).has("Authorization") ? [] : [ghRepo] }));
    expect(await fetchRepoList()).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining("/users/LLRHook/repos?type=owner"), expect.any(Object));
  });
  it("uses public listing without a token", async () => {
    stubFetch((url) => { expect(url).toContain("/users/LLRHook/repos?type=owner"); return { ok: true, body: [ghRepo] }; });
    await fetchRepoList();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ headers: { Accept: "application/vnd.github.v3+json" } }));
  });
  it("filters forks and private repos", async () => {
    stubFetch(() => ({ ok: true, body: [ghRepo, { ...ghRepo, id: 8, fork: true }, { ...ghRepo, id: 9, private: true }] }));
    expect((await fetchRepoList()).map((repo) => repo.id)).toEqual([7]);
  });
  it("maps all summary fields without fetching per-repo data", async () => {
    stubFetch(() => ({ ok: true, body: [ghRepo] }));
    expect(await fetchRepoList()).toEqual([{ id: 7, name: "proj", owner: "o", description: "d", htmlUrl: "https://github.com/o/proj", homepage: null, language: "Go", stars: 5, pushedAt: "2026-01-01T00:00:00Z" }]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("paginates full batches", async () => {
    stubFetch((url) => ({ ok: true, body: url.includes("page=1&") ? Array.from({length: 100}, (_, id) => ({...ghRepo, id})) : [ghRepo] }));
    expect(await fetchRepoList()).toHaveLength(101);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("degrades to an empty list on a failed listing", async () => {
    stubFetch(() => ({ ok: false, body: null }));
    expect(await fetchRepoList()).toEqual([]);
  });

  it.each([401, 403])("recovers from HTTP %i without reusing rejected credentials", async (status) => {
    process.env.GITHUB_TOKEN = "rejected-token";
    stubFetch((_url, init) => new Headers(init?.headers).has("Authorization")
      ? { ok: false, status, body: { message: "Bad credentials" } }
      : { ok: true, body: [ghRepo] });

    expect(await fetchRepoList()).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining("/users/LLRHook/repos?type=owner"),
      expect.objectContaining({ headers: { Accept: "application/vnd.github.v3+json" } })
    );
  });

  it("preserves already fetched repositories when a later response has invalid JSON", async () => {
    const firstPage = Array.from({ length: 100 }, (_, id) => ({ ...ghRepo, id }));
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => firstPage })
      .mockResolvedValueOnce({ ok: true, json: async () => { throw new SyntaxError("Truncated JSON"); } }));

    expect(await fetchRepoList()).toHaveLength(100);
  });

  it("degrades to an empty list when a successful response is not an array", async () => {
    stubFetch(() => ({ ok: true, body: { message: "Unexpected response" } }));
    expect(await fetchRepoList()).toEqual([]);
  });

  it("keeps the timeout active while reading the response body", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal;
    let finishBody!: (value: unknown) => void;
    vi.stubGlobal("fetch", vi.fn((_url: string, init: RequestInit) => {
      signal = init.signal!;
      return Promise.resolve({ ok: true, json: () => new Promise((resolve) => { finishBody = resolve; }) });
    }));

    const result = fetchRepoList();
    await vi.advanceTimersByTimeAsync(8000);
    const bodyAborted = signal!.aborted;
    finishBody([]);
    await result;
    expect(bodyAborted).toBe(true);
  });
});
