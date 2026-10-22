import { describe, it, expect } from "vitest";
import { homeBody, aboutBody, projectsBody, resumeBody, offTheClockBody, contactBody, notFoundBody, tokenBurner, formatTokens, formatUsd, formatDay } from "./pages";
import type { TokenStats } from "./tokenStats";
import type { RepoSummary } from "./types";

const repo = (overrides: Partial<RepoSummary> = {}): RepoSummary => ({ id: 1, name: "demo-project", owner: "owner", description: "A project", htmlUrl: "https://github.com/owner/demo-project", homepage: null, language: "Go", stars: 3, pushedAt: "2026-01-01T00:00:00Z", ...overrides });

describe("page bodies", () => {
  it("renders the presented list as a table with no game markup", () => {
    const html = projectsBody([repo({ name: "my-website", owner: "LLRHook", homepage: "javascript:bad" }), repo({ id: 2, name: 'quote"&', description: "<tag>" })]);
    expect(html).toContain(">This home page</a>");
    expect(html).toContain("&lt;tag&gt;");
    expect(html).not.toContain(">demo</a>");
    expect(html).not.toMatch(/id="game"|data-button|<canvas|<button/);
  });
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
  it("makes the repository table a named keyboard scroll target", () => {
    expect(projectsBody([repo()])).toContain('<div class="table-wrap" role="region" aria-labelledby="repositories-caption" tabindex="0"><table class="projects"><caption id="repositories-caption">Public repositories</caption>');
  });
  it.each([homeBody, aboutBody, () => projectsBody([repo()]), resumeBody, offTheClockBody, contactBody, notFoundBody])("contains no script tags: %s", (body) => {
    expect(body()).not.toContain("<script");
  });
  it("marks up the home page as a WebSite and Victor as a Person", () => {
    const html = homeBody();
    expect(html).toContain('itemtype="https://schema.org/WebSite"');
    expect(html).toContain('itemtype="https://schema.org/Person"');
    expect(html).toContain('<meta itemprop="name" content="Victor Ivanov">');
    expect(html).toContain('<link itemprop="sameAs" href="https://github.com/LLRHook">');
    expect(html).toContain('<link itemprop="sameAs" href="https://www.linkedin.com/in/victorivanovofficial/">');
    expect(html).not.toContain('itemprop="sameAs" href="mailto:');
  });
  it("marks up About as a ProfilePage whose main entity is Victor", () => {
    expect(aboutBody()).toMatch(/itemtype="https:\/\/schema\.org\/ProfilePage"><div itemprop="mainEntity" itemscope itemtype="https:\/\/schema\.org\/Person"/);
  });
  it("links the downloadable resume PDF", () => {
    expect(resumeBody()).toContain('<a href="/Victor_Ivanov_Resume.pdf" download>');
  });
});

const usage = (input: number, output: number, cacheWrite: number, cacheRead: number, costUsd: number) =>
  ({ tokens: { input, output, cacheWrite, cacheRead, total: input + output + cacheWrite + cacheRead }, costUsd });
const stats = (): TokenStats => ({
  asOf: "2026-10-14", since: "2026-08-10", pricesAsOf: "2026-10-14",
  lifetime: usage(1_000_000, 500_000, 2_000_000, 6_946_966_483, 4086.16),
  last30: usage(900_000, 400_000, 1_000_000, 5_000_000_000, 2384.73),
  byTool: { claudeCode: usage(400_000, 300_000, 2_000_000, 4_929_768_469, 3289.01), codex: usage(600_000, 200_000, 0, 2_017_198_014, 797.15) },
  byModel: [{ model: "Claude Opus 5.5", tokens: 2_699_097_757, share: 0.3885 }, { model: "<b>x</b>", tokens: 5, share: 0.004 }],
  daily: Array.from({ length: 90 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 6, 17 + index)).toISOString().slice(0, 10);
    return { date, tokens: date === "2026-09-24" ? 595_038_554 : index % 2 ? 1000 : 0, costUsd: date === "2026-09-24" ? 412.5 : 0.01 };
  }),
});

describe("token burner", () => {
  it("formats tokens, money and days for people", () => {
    expect([6_950_384_905, 5_322_808_973, 2_700_000_000, 12_345, 999, 999_600, 1_000_000, 1_234_000_000_000].map(formatTokens))
      .toEqual(["6.95B", "5.32B", "2.70B", "12.3K", "999", "1.00M", "1.00M", "1,234B"]);
    expect([4086.16, 99.5, 0.004].map(formatUsd)).toEqual(["$4,086", "$99.50", "$0.00"]);
    expect(formatDay("2026-08-01")).toBe("Aug 1, 2026");
  });
  it("renders the four stat groups at the top of /projects", () => {
    const html = projectsBody([repo()], stats());
    expect(html.indexOf('id="burner"')).toBeLessThan(html.indexOf('class="projects"'));
    for (const text of ["Lifetime", "6.95B tokens", "since Aug 10, 2026", "Last 30 days", "5.00B tokens", "API-equivalent cost", "$4,086", "Oct 14, 2026",
      "Claude Code: 4.93B tokens (71%), $3,289", "Codex: 2.02B tokens (29%), $797", "Claude Opus 5.5", "2.70B &middot; 39%"]) expect(html).toContain(text);
  });
  it("draws bars and the daily chart as SVG attributes with titles, never inline styles", () => {
    const html = tokenBurner(stats());
    expect(html).not.toMatch(/style=/);
    expect(html).not.toContain("<script");
    expect(html).toContain('<rect class="model" x="0" y="0" width="38.85" height="10"><title>Claude Opus 5.5: 39% of all tokens</title></rect>');
    expect(html).toContain('<rect class="claude" x="0" y="0" width="70.97" height="10">');
    expect(html).toContain('<rect class="codex" x="70.97" y="0" width="29.03" height="10">');
    // The busiest day is full height; zero days draw nothing but stay in the table.
    expect(html).toContain('<rect x="276" y="0" width="3" height="120"><title>Sep 24, 2026: 595M tokens, $413</title></rect>');
    expect(html.match(/<rect x=/g)).toHaveLength(45);
    expect(html.match(/<tr><td><time/g)).toHaveLength(90);
    expect(html).toContain('aria-label="Daily tokens from Jul 17, 2026 to Oct 14, 2026; the busiest day was Sep 24, 2026 with 595M tokens."');
  });
  it("escapes model names", () => {
    const html = tokenBurner(stats());
    expect(html).toContain("&lt;b&gt;x&lt;/b&gt;");
    expect(html).not.toContain("<b>x</b>");
  });
  it("makes the daily table a named keyboard scroll target", () => {
    expect(tokenBurner(stats())).toContain('<div class="table-wrap" role="region" aria-labelledby="daily-caption" tabindex="0"><table class="projects"><caption id="daily-caption">Tokens per day</caption>');
  });
  it("omits the panel without a valid snapshot and keeps the table", () => {
    expect(tokenBurner(null)).toBe("");
    const html = projectsBody([repo()]);
    expect(html).not.toContain("Token burner");
    expect(html).toContain('class="projects"');
  });
});
