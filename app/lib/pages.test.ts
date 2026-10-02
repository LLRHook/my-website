import { describe, it, expect } from "vitest";
import { homeBody, aboutBody, projectsBody, resumeBody, offTheClockBody, contactBody, notFoundBody } from "./pages";
import type { RepoSummary } from "./types";

const repo = (overrides: Partial<RepoSummary> = {}): RepoSummary => ({ id: 1, name: "demo-project", owner: "owner", description: "A project", htmlUrl: "https://github.com/owner/demo-project", homepage: null, language: "Go", stars: 3, pushedAt: "2026-01-01T00:00:00Z", ...overrides });

describe("page bodies", () => {
  it("escapes malicious project descriptions", () => {
    const html = projectsBody([repo({ description: "<img src=x onerror=alert(1)>" })]);
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).not.toContain("<img");
  });
  it("filters missing descriptions and profile repos case-insensitively", () => {
    const html = projectsBody([repo({ name: "hidden", description: null }), repo({ name: "OWNER" }), repo()]);
    expect(html).not.toContain(">hidden<");
    expect(html).not.toContain(">OWNER<");
    expect(html).toContain(">demo-project<");
  });
  it("sorts newest projects first", () => {
    const html = projectsBody([repo({ name: "older" }), repo({ name: "newer", pushedAt: "2026-10-01T00:00:00Z" })]);
    expect(html.indexOf(">newer<")).toBeLessThan(html.indexOf(">older<"));
  });
  it.each(["https://example.com", "http://example.com", "javascript:alert(1)", "/relative", ""])("limits demo links to HTTP(S): %s", (homepage) => {
    expect(projectsBody([repo({ homepage })]).includes(">demo</a>")).toBe(/^https?:\/\//.test(homepage));
  });
  it("renders the empty notice and GitHub links", () => {
    expect(projectsBody([])).toContain('class="notice"');
    expect(projectsBody([])).toContain("github.com/LLRHook");
  });
  it.each([homeBody, aboutBody, () => projectsBody([repo()]), resumeBody, offTheClockBody, contactBody, notFoundBody])("contains no script tags: %s", (body) => {
    expect(body()).not.toContain("<script");
  });
  it("links the downloadable resume PDF", () => {
    expect(resumeBody()).toContain('<a href="/Victor_Ivanov_Resume.pdf" download>');
  });
});
