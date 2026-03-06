import { fetchAllRepos, groupReposByYear } from "@/app/lib/github";
import ClientPage from "@/app/components/ClientPage";

export const revalidate = 3600;

export default async function Home() {
  const repos = await fetchAllRepos();
  const grouped = groupReposByYear(repos);

  return <ClientPage grouped={grouped} />;
}
