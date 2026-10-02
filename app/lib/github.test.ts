import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchRepoList } from "./github";


beforeEach(() => {
  delete process.env.GITHUB_TOKEN;
});
afterEach(() => {
  vi.unstubAllGlobals();
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


  it("uses authenticated listing with authorization and hourly cache", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    stubFetch((url) => { expect(url).toContain("/user/repos?affiliation=owner"); return { ok: true, body: [ghRepo] }; });
    expect(await fetchRepoList()).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ headers: { Accept: "application/vnd.github.v3+json", Authorization: "Bearer test-token" }, next: { revalidate: 3600 } }));
  });
  it("falls back to public when authenticated listing is empty", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    stubFetch((url) => ({ ok: true, body: url.includes("/user/repos") ? [] : [ghRepo] }));
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
});
