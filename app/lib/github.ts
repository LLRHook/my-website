import {
  GitHubRepo,
  LanguageSlice,
  RepoCardData,
  TimelineData,
  TimelineYear,
  TimelineMonth,
  TimelineDay,
} from "./types";

const GITHUB_API = "https://api.github.com";
const GITHUB_USERNAME = "LLRHook";

function monthName(index: number): string {
  return new Date(2000, index).toLocaleString("en-US", { month: "long" });
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function fetchPaginatedRepos(url: string): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let page = 1;

  while (true) {
    const separator = url.includes("?") ? "&" : "?";
    const res = await fetch(
      `${url}${separator}per_page=100&page=${page}&sort=pushed`,
      {
        headers: getHeaders(),
        next: { revalidate: 3600 },
      }
    );

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
    const res = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/languages`,
      { headers: getHeaders(), next: { revalidate: 3600 } }
    );
    if (!res.ok) return {};
    return (await res.json()) as Record<string, number>;
  } catch {
    return {};
  }
}

// The /stats/commit_activity endpoint returns 202 on first hit while GitHub
// computes stats in the background, and for many inactive repos the compute
// never produces data within a reasonable ISR window. Use /commits directly —
// no async compute, no 202 — and bucket the dates into weekly totals.
const WEEKS = 26;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function fetchCommitActivity(
  owner: string,
  repo: string
): Promise<number[]> {
  const since = new Date(Date.now() - WEEKS * WEEK_MS).toISOString();
  const dates: string[] = [];
  const MAX_PAGES = 4;

  for (let page = 1; page <= MAX_PAGES; page++) {
    try {
      const res = await fetch(
        `${GITHUB_API}/repos/${owner}/${repo}/commits?since=${since}&per_page=100&page=${page}`,
        { headers: getHeaders(), next: { revalidate: 3600 } }
      );
      if (!res.ok) break;
      const batch = await res.json();
      if (!Array.isArray(batch) || batch.length === 0) break;
      for (const c of batch) {
        const d = c?.commit?.author?.date ?? c?.commit?.committer?.date;
        if (d) dates.push(d);
      }
      if (batch.length < 100) break;
    } catch {
      break;
    }
  }

  if (dates.length === 0) return [];

  const now = Date.now();
  const weeks: number[] = new Array(WEEKS).fill(0);
  for (const d of dates) {
    const diff = now - new Date(d).getTime();
    const idx = WEEKS - 1 - Math.floor(diff / WEEK_MS);
    if (idx >= 0 && idx < WEEKS) weeks[idx]++;
  }
  return weeks;
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
  let repos: GitHubRepo[];

  if (process.env.GITHUB_TOKEN) {
    // Authenticated: can list all owned repos including private
    repos = await fetchPaginatedRepos(
      `${GITHUB_API}/user/repos?affiliation=owner`
    );
  } else {
    // Fallback: list public repos for the known username
    console.warn(
      "[github] GITHUB_TOKEN is not set — falling back to public repos for",
      GITHUB_USERNAME
    );
    repos = await fetchPaginatedRepos(
      `${GITHUB_API}/users/${GITHUB_USERNAME}/repos?type=owner`
    );
  }

  if (repos.length === 0) {
    console.warn("[github] No repos returned from GitHub API");
  }

  const filtered = repos.filter((r) => !r.fork && !r.private);

  return Promise.all(
    filtered.map(async (r): Promise<RepoCardData> => {
      const [langs, commits] = await Promise.all([
        fetchLanguages(r.owner.login, r.name),
        fetchCommitActivity(r.owner.login, r.name),
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
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/readme`,
    {
      headers: {
        ...getHeaders(),
        Accept: "application/vnd.github.v3.raw",
      },
    }
  );

  if (!res.ok) return "*No README available.*";
  return res.text();
}
