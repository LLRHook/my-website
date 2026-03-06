"use client";

import FadeInOnScroll from "@/app/components/ui/FadeInOnScroll";
import ProjectCard from "./ProjectCard";
import { RepoCardData } from "@/app/lib/types";

interface YearSectionProps {
  year: string;
  repos: RepoCardData[];
}

export default function YearSection({ year, repos }: YearSectionProps) {
  return (
    <section className="mb-12">
      <FadeInOnScroll>
        <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-3 scroll-mt-24">
          <span className="w-8 h-0.5 bg-accent" />
          {year}
        </h2>
      </FadeInOnScroll>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {repos.map((repo, i) => (
          <FadeInOnScroll key={repo.id} delay={i * 0.08}>
            <ProjectCard repo={repo} />
          </FadeInOnScroll>
        ))}
      </div>
    </section>
  );
}
