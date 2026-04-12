import {
  GitHubRepo,
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

  return repos
    .filter((r) => !r.fork && !r.private)
    .map((r): RepoCardData => ({
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
    }));
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
