"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import GlassCard from "@/app/components/ui/GlassCard";
import LanguageBadge from "./LanguageBadge";
import ProjectCardExpanded from "./ProjectCardExpanded";
import { RepoCardData } from "@/app/lib/types";

export default function ProjectCard({ repo }: { repo: RepoCardData }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <GlassCard
      className="p-5"
      onClick={() => setExpanded(!expanded)}
      hoverable={!expanded}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-text-primary truncate">
              {repo.name}
            </h3>
            {repo.isPrivate && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-accent-subtle text-accent font-medium shrink-0">
                Private
              </span>
            )}
          </div>

          {repo.description && (
            <p className="mt-1 text-sm text-text-secondary line-clamp-2">
              {repo.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3 flex-wrap">
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
            {repo.homepage && !repo.isPrivate && (
              <a
                href={repo.homepage}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-sm text-accent hover:underline"
              >
                Live Demo
              </a>
            )}
          </div>
        </div>

        <button
          className="mt-1 p-1 text-text-muted hover:text-text-primary transition-colors shrink-0"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <ProjectCardExpanded
            owner={repo.owner}
            repo={repo.name}
            htmlUrl={repo.htmlUrl}
          />
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
