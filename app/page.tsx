import { fetchAllRepos } from "@/app/lib/github";
import Workspace from "@/app/components/room/Workspace";

export const revalidate = 3600;

export default async function Home() {
  const repos = await fetchAllRepos();

  return (
    <>
      <Workspace repos={repos} />
      <noscript><section className="noscript-profile"><h2>Victor Ivanov · Senior Full-Stack Engineer</h2><p>Full-stack engineer at Paradigm Testing, based in Virginia. I build certification software with Java, Spring Boot, React, and PostgreSQL. Previously a Software Developer at Paradigm Testing, June 2022 to May 2024. B.S. Computer Science, UMBC; M.S. Computer Science at Georgia Tech, expected December 2027.</p><p>Enable JavaScript to explore the interactive room and full resume.</p><a href="https://github.com/LLRHook">Explore my projects on GitHub</a> · <a href="mailto:victor.n.ivanov@gmail.com">Contact me</a></section></noscript>
    </>
  );
}
