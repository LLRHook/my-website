import type { RepoCardData } from "./types";

// Presentation only: keep repository IDs and source URLs intact.
const PRESENTATION: Record<string, { name: string; description: string }> = {
  "LLRHook/my-website": {
    name: "Personal website",
    description: "An interactive room for exploring my projects, experience, and interests. Next.js and TypeScript.",
  },
  "LLRHook/checksinmyhead": {
    name: "Billington",
    description: "Split group expenses with shared tabs, receipt scanning, and settlement tracking. Flutter, Next.js, Go, and PostgreSQL.",
  },
  "LLRHook/citybase": {
    name: "Citybase",
    description: "An experimental desktop IDE that turns a Git repository into an isometric city and shows coding-agent runs as they happen.",
  },
};

export function presentProject(repo: RepoCardData): RepoCardData {
  const presentation = PRESENTATION[`${repo.owner}/${repo.name}`];
  return presentation ? { ...repo, ...presentation } : repo;
}
