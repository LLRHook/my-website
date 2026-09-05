import {
  GitHubRepo,
  LanguageSlice,
  CommitInfo,
  RepoCardData,
  TimelineData,
  TimelineYear,
  TimelineMonth,
  TimelineDay,
} from "./types";
import { monthName } from "./dateUtils";

const GITHUB_API = "https://api.github.com";
const GITHUB_USERNAME = "LLRHook";
const FETCH_TIMEOUT_MS = 8000;

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMs = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPaginatedRepos(url: string): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let page = 1;

  while (true) {
    const separator = url.includes("?") ? "&" : "?";
    let res: Response;
    try {
      res = await fetchWithTimeout(
        `${url}${separator}per_page=100&page=${page}&sort=pushed`,
        {
          headers: getHeaders(),
          next: { revalidate: 3600 },
        }
      );
    } catch (err) {
      // A timeout/abort or network error must not crash the page render.
      // Return whatever was collected so far and degrade to the empty state.
      console.error(`[github] ${url} request failed (page ${page}):`, err);
      return repos;
    }

    if (!res.ok) {
      console.error(
        `[github] ${url} responded ${res.status} ${res.statusText} (page ${page})`
      );
      return repos; // return whatever was collected so far
    }

    const batch: GitHubRepo[] = await res.json();
    if (batch.length === 0) break;

    repos.push(...batch);
    if (batch.length < 100) break;
    page++;
  }

  return repos;
}

async function fetchLanguages(
  owner: string,
  repo: string
): Promise<Record<string, number>> {
  try {
    const res = await fetchWithTimeout(
      `${GITHUB_API}/repos/${owner}/${repo}/languages`,
      { headers: getHeaders(), next: { revalidate: 3600 } }
    );
    if (!res.ok) return {};
    return (await res.json()) as Record<string, number>;
  } catch {
    return {};
  }
}

async function fetchCommitActivity(
  owner: string,
  repo: string
): Promise<number[]> {
  try {
    const res = await fetchWithTimeout(
      `${GITHUB_API}/repos/${owner}/${repo}/stats/commit_activity`,
      {
        headers: getHeaders(),
        next: { revalidate: 3600 },
      },
      1500
    );

    if (!res.ok || res.status === 202) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((w: { total: number }) => w.total);
  } catch {
    return [];
  }
}

async function fetchRecentCommits(
  owner: string,
  repo: string
): Promise<CommitInfo[]> {
  try {
    const res = await fetchWithTimeout(
      `${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=5`,
      { headers: getHeaders(), next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map(
      (c: {
        commit: { message: string; author: { date: string } | null };
        html_url: string;
      }) => ({
        message: c.commit.message.split("\n")[0],
        date: c.commit.author?.date ?? "",
        url: c.html_url,
      })
    );
  } catch {
    return [];
  }
}

function toLanguageSlices(
  langs: Record<string, number>
): LanguageSlice[] {
  const total = Object.values(langs).reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  return Object.entries(langs)
    .map(([name, bytes]) => ({
      name,
      bytes,
      percent: (bytes / total) * 100,
    }))
    .sort((a, b) => b.bytes - a.bytes);
}

export async function fetchAllRepos(): Promise<RepoCardData[]> {
  const publicReposUrl = `${GITHUB_API}/users/${GITHUB_USERNAME}/repos?type=owner`;
  let repos: GitHubRepo[];

  if (process.env.GITHUB_TOKEN) {
    // Authenticated: can list all owned repos including private
    repos = await fetchPaginatedRepos(
      `${GITHUB_API}/user/repos?affiliation=owner`
    );

    if (repos.length === 0) {
      // The token may be expired, missing scopes, or the request was rate
      // limited. Fall back to the public endpoint so the portfolio still
      // renders its public repos instead of an empty "No projects" state.
      console.warn(
        "[github] Authenticated repo fetch returned nothing — falling back to public repos for",
        GITHUB_USERNAME
      );
      repos = await fetchPaginatedRepos(publicReposUrl);
    }
  } else {
    // Fallback: list public repos for the known username
    console.warn(
      "[github] GITHUB_TOKEN is not set — falling back to public repos for",
      GITHUB_USERNAME
    );
    repos = await fetchPaginatedRepos(publicReposUrl);
  }

  if (repos.length === 0) {
    console.warn("[github] No repos returned from GitHub API");
  }

  const filtered = repos.filter((r) => !r.fork && !r.private);

  return Promise.all(
    filtered.map(async (r): Promise<RepoCardData> => {
      const [langs, commits, recentCommits] = await Promise.all([
        fetchLanguages(r.owner.login, r.name),
        fetchCommitActivity(r.owner.login, r.name),
        fetchRecentCommits(r.owner.login, r.name),
      ]);
      return {
        id: r.id,
        name: r.name,
        description: r.description,
        htmlUrl: r.html_url,
        homepage: r.homepage,
        language: r.language,
        stars: r.stargazers_count,
        pushedAt: r.pushed_at,
        createdAt: r.created_at,
        owner: r.owner.login,
        languages: toLanguageSlices(langs),
        commitActivity: commits,
        topics: r.topics ?? [],
        recentCommits,
      };
    })
  );
}

export function buildTimelineData(repos: RepoCardData[]): TimelineData {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Group by year → month → (day if current month)
  const yearMap = new Map<number, Map<number, RepoCardData[]>>();

  for (const repo of repos) {
    const d = new Date(repo.pushedAt);
    const y = d.getFullYear();
    const m = d.getMonth();

    if (!yearMap.has(y)) yearMap.set(y, new Map());
    const monthMap = yearMap.get(y)!;
    if (!monthMap.has(m)) monthMap.set(m, []);
    monthMap.get(m)!.push(repo);
  }

  // Sort years descending
  const sortedYears = [...yearMap.keys()].sort((a, b) => b - a);

  const timeline: TimelineData = sortedYears.map((y): TimelineYear => {
    const monthMap = yearMap.get(y)!;
    // Sort months descending
    const sortedMonths = [...monthMap.keys()].sort((a, b) => b - a);

    const months: TimelineMonth[] = sortedMonths.map((m): TimelineMonth => {
      const monthRepos = monthMap.get(m)!;
      // Sort repos within month by pushed date descending
      monthRepos.sort(
        (a, b) => new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime()
      );

      const isCurrentMonth = y === currentYear && m === currentMonth;

      if (isCurrentMonth) {
        // Group by day
        const dayMap = new Map<number, RepoCardData[]>();
        for (const repo of monthRepos) {
          const day = new Date(repo.pushedAt).getDate();
          if (!dayMap.has(day)) dayMap.set(day, []);
          dayMap.get(day)!.push(repo);
        }

        const days: TimelineDay[] = [...dayMap.keys()]
          .sort((a, b) => b - a)
          .map((day): TimelineDay => ({
            day: day.toString(),
            date: new Date(y, m, day).toISOString(),
            repos: dayMap.get(day)!,
          }));

        return {
          month: monthName(m),
          monthIndex: m,
          days,
        };
      }

      return {
        month: monthName(m),
        monthIndex: m,
        repos: monthRepos,
      };
    });

    return { year: y.toString(), months };
  });

  return timeline;
}

export async function fetchReadme(
  owner: string,
  repo: string
): Promise<string> {
  const unavailable = "*No README available.*";
  // Each value must remain a single path component, including after URL parsing.
  if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(owner)
    || !/^[a-z\d._-]{1,100}$/i.test(repo)
    || repo === "." || repo === "..") return unavailable;

  const sources = [
    { url: `${GITHUB_API}/repos/${owner}/${repo}/readme`, accept: "application/vnd.github.v3.raw" },
    { url: `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/README.md`, accept: "text/plain" },
    { url: `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/readme.md`, accept: "text/plain" },
  ];

  for (const source of sources) {
    const controller = new AbortController();
    // Three public attempts at most; the deadline also covers reading the body.
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      const response = await fetch(source.url, {
        headers: { Accept: source.accept },
        signal: controller.signal,
        next: { revalidate: 3600 },
      });
      if (!response.ok) continue;
      const markdown = await response.text();
      if (markdown.trim()) return markdown;
    } catch {
      // A rate limit, network failure, or timeout must still try the next public
      // source. Never use getHeaders here: this endpoint may expose only public
      // content and must not forward the site's GitHub token to the raw host.
    } finally {
      clearTimeout(timeout);
    }
  }
  return unavailable;
}

// --- Source peek (key-file selection) ---------------------------------------

// GitHub primary language -> shiki language id.
const SHIKI_LANG: Record<string, string> = {
  JavaScript: "javascript",
  TypeScript: "typescript",
  Python: "python",
  Go: "go",
  Rust: "rust",
  Java: "java",
  "C#": "csharp",
  Swift: "swift",
  Dart: "dart",
  Shell: "bash",
  HTML: "html",
  CSS: "css",
  Astro: "astro",
  Ruby: "ruby",
  PHP: "php",
  Kotlin: "kotlin",
  "C++": "cpp",
  C: "c",
};

export function shikiLang(language: string | null): string {
  return (language && SHIKI_LANG[language]) || "text";
}

// Preferred root-level entry file names per language.
const ENTRYPOINTS: Record<string, string[]> = {
  Python: ["main.py", "app.py", "__main__.py", "cli.py"],
  JavaScript: ["index.js", "main.js", "app.js", "server.js"],
  TypeScript: ["index.ts", "main.ts"],
  Go: ["main.go"],
  Swift: ["main.swift", "Package.swift"],
  "C#": ["Program.cs"],
  Astro: ["astro.config.mjs"],
};

const EXT_FOR_LANG: Record<string, string> = {
  JavaScript: ".js",
  TypeScript: ".ts",
  Python: ".py",
  Go: ".go",
  Rust: ".rs",
  Java: ".java",
  "C#": ".cs",
  Swift: ".swift",
  Dart: ".dart",
  Shell: ".sh",
  Ruby: ".rb",
  PHP: ".php",
  Kotlin: ".kt",
  "C++": ".cpp",
  C: ".c",
  Astro: ".astro",
};

const MAX_PEEK_BYTES = 50_000;
const MAX_PEEK_LINES = 80;

interface ContentEntry {
  type: string;
  name: string;
  path: string;
  size: number;
  download_url: string | null;
}

async function listDir(
  owner: string,
  repo: string,
  path = ""
): Promise<ContentEntry[]> {
  const url = path
    ? `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`
    : `${GITHUB_API}/repos/${owner}/${repo}/contents`;
  const res = await fetchWithTimeout(url, {
    headers: getHeaders(),
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? (data as ContentEntry[]) : [];
}

function pickCandidate(
  files: ContentEntry[],
  language: string | null
): ContentEntry | null {
  const names = (language && ENTRYPOINTS[language]) || [];
  const byName = files.find((f) => names.includes(f.name));
  if (byName) return byName;
  const ext = language ? EXT_FOR_LANG[language] : undefined;
  if (ext) return files.find((f) => f.name.endsWith(ext)) ?? null;
  return null;
}

// Best-effort: find a representative source file in the repo root (or src/) and
// return a capped snippet. Returns null when nothing suitable is found.
export async function fetchKeyFile(
  owner: string,
  repo: string,
  language: string | null
): Promise<{ path: string; code: string } | null> {
  try {
    const root = await listDir(owner, repo);
    if (root.length === 0) return null;

    let chosen = pickCandidate(
      root.filter((e) => e.type === "file"),
      language
    );

    if (!chosen && root.some((e) => e.type === "dir" && e.name === "src")) {
      const src = await listDir(owner, repo, "src");
      chosen = pickCandidate(
        src.filter((e) => e.type === "file"),
        language
      );
    }

    if (!chosen || !chosen.download_url || chosen.size > MAX_PEEK_BYTES) {
      return null;
    }

    const fileRes = await fetchWithTimeout(chosen.download_url, {
      next: { revalidate: 3600 },
    });
    if (!fileRes.ok) return null;
    const text = await fileRes.text();
    const code = text.split("\n").slice(0, MAX_PEEK_LINES).join("\n");
    return { path: chosen.path, code };
  } catch {
    return null;
  }
}
