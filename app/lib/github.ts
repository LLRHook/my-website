import { GitHubRepo, RepoCardData, GroupedRepos } from "./types";

const GITHUB_API = "https://api.github.com";

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

export async function fetchAllRepos(): Promise<RepoCardData[]> {
  const repos: GitHubRepo[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `${GITHUB_API}/user/repos?per_page=100&page=${page}&sort=pushed&affiliation=owner`,
      {
        headers: getHeaders(),
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) break;

    const batch: GitHubRepo[] = await res.json();
    if (batch.length === 0) break;

    repos.push(...batch);
    if (batch.length < 100) break;
    page++;
  }

  return repos
    .filter((r) => !r.fork)
    .map((r): RepoCardData => ({
      id: r.id,
      name: r.name,
      description: r.private ? null : r.description,
      htmlUrl: r.html_url,
      homepage: r.private ? null : r.homepage,
      language: r.language,
      stars: r.stargazers_count,
      fork: r.fork,
      isPrivate: r.private,
      pushedAt: r.pushed_at,
      createdAt: r.created_at,
      owner: r.owner.login,
    }));
}

export function groupReposByYear(repos: RepoCardData[]): GroupedRepos {
  const grouped: GroupedRepos = {};

  for (const repo of repos) {
    const year = new Date(repo.pushedAt).getFullYear().toString();
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(repo);
  }

  // Sort repos within each year by most recently pushed
  for (const year of Object.keys(grouped)) {
    grouped[year].sort(
      (a, b) => new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime()
    );
  }

  return grouped;
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
