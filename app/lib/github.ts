import type { GitHubRepo, RepoSummary } from "./types";

const GITHUB_API = "https://api.github.com";
const GITHUB_USERNAME = "LLRHook";
const FETCH_TIMEOUT_MS = 8000;

function getHeaders(authenticate: boolean): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };
  if (authenticate && process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function fetchRepoPage(
  input: string,
  init: RequestInit = {},
  timeoutMs = FETCH_TIMEOUT_MS
): Promise<GitHubRepo[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`GitHub responded ${response.status} ${response.statusText}`);
    }
    const batch: unknown = await response.json();
    if (!Array.isArray(batch)) {
      throw new Error("GitHub repository response is not an array");
    }
    return batch;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPaginatedRepos(url: string, authenticate: boolean): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let page = 1;

  while (true) {
    const separator = url.includes("?") ? "&" : "?";
    let batch: GitHubRepo[];
    try {
      batch = await fetchRepoPage(
        `${url}${separator}per_page=100&page=${page}&sort=pushed`,
        {
          headers: getHeaders(authenticate),
          next: { revalidate: 3600 },
        }
      );
    } catch (err) {
      // A timeout, network error or invalid body must not discard earlier pages.
      // Return whatever was collected so far and degrade to the empty state.
      console.error(`[github] ${url} request failed (page ${page}):`, err);
      return repos;
    }

    if (batch.length === 0) break;

    repos.push(...batch);
    if (batch.length < 100) break;
    page++;
  }

  return repos;
}

export async function fetchRepoList(): Promise<RepoSummary[]> {
  const publicReposUrl = `${GITHUB_API}/users/${GITHUB_USERNAME}/repos?type=owner`;
  // The token supplies rate-limit headroom, never the identity being listed.
  let repos = await fetchPaginatedRepos(publicReposUrl, !!process.env.GITHUB_TOKEN);

  if (process.env.GITHUB_TOKEN && repos.length === 0) {
    // The token may be expired, missing scopes, or the request was rate
    // limited. Retry without credentials so the portfolio still
    // renders its public repos instead of an empty "No projects" state.
    console.warn(
      "[github] Authenticated repo fetch returned nothing — falling back to public repos for",
      GITHUB_USERNAME
    );
    repos = await fetchPaginatedRepos(publicReposUrl, false);
  }

  if (repos.length === 0) {
    console.warn("[github] No repos returned from GitHub API");
  }

  const filtered = repos.filter((r) => !r.fork && !r.private);

  return filtered.map((r) => ({
    id: r.id, name: r.name, owner: r.owner.login, description: r.description,
    htmlUrl: r.html_url, homepage: r.homepage, language: r.language,
    stars: r.stargazers_count, pushedAt: r.pushed_at,
  }));
}
