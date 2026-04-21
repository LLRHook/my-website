import { fetchAllRepos, buildTimelineData } from "@/app/lib/github";
import ClientPage from "@/app/components/ClientPage";
import Footer from "@/app/components/Footer";

export const revalidate = 3600;

export default async function Home() {
  const repos = await fetchAllRepos();
  const timelineData = buildTimelineData(repos);

  return (
    <>
      <ClientPage timelineData={timelineData} />
      <Footer />
    </>
  );
}
