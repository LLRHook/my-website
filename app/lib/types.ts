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
  pushedAt: string;
  createdAt: string;
  owner: string;
}

export interface TimelineDay {
  day: string;
  date: string;
  repos: RepoCardData[];
}

export interface TimelineMonth {
  month: string;
  monthIndex: number;
  days?: TimelineDay[];
  repos?: RepoCardData[];
}

export interface TimelineYear {
  year: string;
  months: TimelineMonth[];
}

export type TimelineData = TimelineYear[];
