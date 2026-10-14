import { fetchRepoList } from "../lib/github";
import { render } from "../lib/html";
import { projectsBody } from "../lib/pages";
import { parseTokenStats } from "../lib/tokenStats";
import type { RepoSummary } from "../lib/types";
import snapshot from "../../data/token-stats.json";

// Committed by `npm run token-stats`; an invalid snapshot omits the panel.
const stats = parseTokenStats(snapshot);

export const revalidate = 3600;
export async function GET() {
  let repos: RepoSummary[];
  try { repos = await fetchRepoList(); }
  catch (error) { console.error("[projects] Repo list failed:", error); repos = []; }
  return render("/projects", projectsBody(repos, stats));
}
