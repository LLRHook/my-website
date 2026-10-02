import type { GitHubRepo, RepoSummary } from "./types";

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

export async function fetchRepoList(): Promise<RepoSummary[]> {
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

  return filtered.map((r) => ({
    id: r.id, name: r.name, owner: r.owner.login, description: r.description,
    htmlUrl: r.html_url, homepage: r.homepage, language: r.language,
    stars: r.stargazers_count, pushedAt: r.pushed_at,
  }));
}
