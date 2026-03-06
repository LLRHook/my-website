"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import type { RepoCardData } from "@/app/lib/types";
import FadeInOnScroll from "@/app/components/ui/FadeInOnScroll";
import LanguageBadge from "./LanguageBadge";
import ProjectCardExpanded from "./ProjectCardExpanded";

interface TimelineCardProps {
  repo: RepoCardData;
  side: "left" | "right";
  index: number;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TimelineCard({ repo, side, index }: TimelineCardProps) {
  const [expanded, setExpanded] = useState(false);

  const isLeft = side === "left";

  return (
    <div
      className={`relative flex items-start w-full mb-10 ${
        isLeft ? "md:justify-start" : "md:justify-end"
      }`}
    >
      {/* Dot on the stem */}
      <div className="timeline-dot top-7" />

      {/* Branch connector - desktop only */}
      <div
        className="timeline-branch hidden md:block"
        style={{
          top: "2rem",
          ...(isLeft
            ? { right: "50%", left: "auto", width: "calc(5% + 6px)" }
            : { left: "50%", right: "auto", width: "calc(5% + 6px)" }),
        }}
      />

      {/* Mobile branch connector */}
      <div
        className="timeline-branch md:hidden"
        style={{
          left: "30px",
          width: "24px",
          top: "2rem",
        }}
      />

      {/* Card */}
      <div
        className={`w-[calc(100%-70px)] ml-[60px] md:ml-0 md:w-[43%] ${
          isLeft ? "md:pr-8" : "md:pl-8"
        }`}
      >
        <FadeInOnScroll
          direction={isLeft ? "left" : "right"}
          delay={index * 0.05}
        >
          <div
            className="glass glass-hover glass-shimmer p-6 sm:p-7 cursor-pointer transition-all duration-300"
            onClick={() => setExpanded(!expanded)}
          >
            {/* Meta row */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              {repo.language && <LanguageBadge language={repo.language} />}
              {repo.stars > 0 && (
                <span className="flex items-center gap-1 text-sm text-text-secondary">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  {repo.stars}
                </span>
              )}
            </div>

            {/* Project name */}
            <h3 className="display-heading text-lg text-text-primary mb-2">
              {repo.name}
            </h3>

            {/* Description */}
            {repo.description && (
              <p className="text-sm text-text-secondary line-clamp-2 mb-4 leading-relaxed">
                {repo.description}
              </p>
            )}

            {/* Pushed date */}
            <p className="text-xs text-text-muted">
              Updated {formatDate(repo.pushedAt)}
            </p>

            {/* Expanded content */}
            <AnimatePresence>
              {expanded && (
                <ProjectCardExpanded
                  owner={repo.owner}
                  repo={repo.name}
                  htmlUrl={repo.htmlUrl}
                />
              )}
            </AnimatePresence>
          </div>
        </FadeInOnScroll>
      </div>
    </div>
  );
}
