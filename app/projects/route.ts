import { fetchRepoList } from "../lib/github";
import { render } from "../lib/html";
import { projectsBody } from "../lib/pages";
import type { RepoSummary } from "../lib/types";

export const revalidate = 3600;
export async function GET() {
  let repos: RepoSummary[];
  try { repos = await fetchRepoList(); }
  catch (error) { console.error("[projects] Repo list failed:", error); repos = []; }
  return render("/projects", projectsBody(repos), 200, ["/game/main.js"]);
}
