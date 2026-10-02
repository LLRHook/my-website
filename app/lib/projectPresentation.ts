import type { RepoSummary } from "./types";

// Presentation only: keep repository IDs and source URLs intact.
const PRESENTATION: Record<string, { name: string; description: string }> = {
  "LLRHook/my-website": {
    name: "This home page",
    description: "Hand-written HTML and CSS, served by Next.js. No JavaScript reaches your browser.",
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

export function presentProject(repo: RepoSummary): RepoSummary {
  const presentation = PRESENTATION[`${repo.owner}/${repo.name}`];
  return presentation ? { ...repo, ...presentation } : repo;
}
