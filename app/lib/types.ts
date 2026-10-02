export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
  private: boolean;
  pushed_at: string;
  created_at: string;
  topics: string[];
  owner: {
    login: string;
  };
}

export interface RepoSummary { id: number; name: string; owner: string; description: string | null; htmlUrl: string; homepage: string | null; language: string | null; stars: number; pushedAt: string; }
