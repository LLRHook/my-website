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
  owner: {
    login: string;
  };
}

export interface RepoCardData {
  id: number;
  name: string;
  description: string | null;
  htmlUrl: string;
  homepage: string | null;
  language: string | null;
  stars: number;
  fork: boolean;
  isPrivate: boolean;
  pushedAt: string;
  createdAt: string;
  owner: string;
}

export interface GroupedRepos {
  [year: string]: RepoCardData[];
}

export type ActiveTab = "work" | "about";
