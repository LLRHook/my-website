"use client";

import { useState, useMemo } from "react";
import type { TimelineData, TimelineMonth, TimelineDay, RepoCardData } from "@/app/lib/types";
import TimelineCard from "./TimelineCard";
import Container from "@/app/components/ui/Container";

const PAGE_SIZE = 6;

interface TimelineSectionProps {
  data: TimelineData;
}

function renderCard(repo: RepoCardData, globalIndex: number) {
  return (
    <TimelineCard
      key={repo.id}
      repo={repo}
      side={globalIndex % 2 === 0 ? "left" : "right"}
      index={globalIndex}
    />
  );
}

export default function TimelineSection({ data }: TimelineSectionProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const totalRepos = useMemo(() => {
    let count = 0;
    for (const year of data) {
      for (const month of year.months) {
        if (month.days) {
          for (const day of month.days) count += day.repos.length;
        }
        count += (month.repos?.length ?? 0);
      }
    }
    return count;
  }, [data]);

  const visibleData = useMemo(() => {
    let remaining = visibleCount;
    const result: TimelineData = [];

    for (const yearGroup of data) {
      if (remaining <= 0) break;
      const months: TimelineMonth[] = [];

      for (const month of yearGroup.months) {
        if (remaining <= 0) break;

        if (month.days) {
          const days: TimelineDay[] = [];
          for (const day of month.days) {
            if (remaining <= 0) break;
            const repos = day.repos.slice(0, remaining);
            remaining -= repos.length;
            days.push({ ...day, repos });
          }
          if (days.length > 0) {
            months.push({ ...month, days });
          }
        }

        if (month.repos) {
          const repos = month.repos.slice(0, remaining);
          remaining -= repos.length;
          if (repos.length > 0) {
            months.push({ ...month, repos, days: undefined });
          }
        }
      }

      if (months.length > 0) {
        result.push({ ...yearGroup, months });
      }
    }

    return result;
  }, [data, visibleCount]);

  if (!data || data.length === 0) {
    return (
      <Container as="section" id="work" className="py-24" innerClassName="text-center" data-testid="work">
        <h2 className="sr-only">Work</h2>
        <p className="text-text-muted text-lg">No projects to display.</p>
      </Container>
    );
  }

  let globalIndex = 0;

  return (
    <Container as="section" id="work" className="py-24" data-testid="work">
      <h2 className="sr-only">Work</h2>
      <div className="relative">
        {/* Vertical stem */}
        <div className="timeline-stem" />

        {visibleData.map((yearGroup) => (
          <div key={yearGroup.year} className="relative">
            {/* Year marker */}
            <div className="flex justify-center mb-16 relative z-10">
              <span className="text-6xl sm:text-7xl font-bold text-text-muted/20 select-none">
                {yearGroup.year}
              </span>
            </div>

            {yearGroup.months.map((month: TimelineMonth) => (
              <div key={`${yearGroup.year}-${month.monthIndex}`} className="relative mb-16">
                {/* Month label */}
                <div className="flex justify-center mb-10 relative z-10">
                  <span className="text-xs uppercase tracking-widest text-text-muted bg-bg px-4 py-1">
                    {month.month}
                  </span>
                </div>

                {/* Day-grouped repos (current month) */}
                {month.days?.map((day: TimelineDay) => (
                  <div key={day.date} className="relative">
                    <div className="flex justify-center mb-6 relative z-10">
                      <span className="text-[10px] uppercase tracking-wider text-text-muted/60 bg-bg px-3 py-0.5">
                        {day.day}
                      </span>
                    </div>
                    {day.repos.map((repo) => renderCard(repo, globalIndex++))}
                  </div>
                ))}

                {/* Flat repos (non-current months) */}
                {month.repos?.map((repo) => renderCard(repo, globalIndex++))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {visibleCount < totalRepos && (
        <div className="flex justify-center mt-16">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="btn-outline"
          >
            Show More Projects
          </button>
        </div>
      )}
    </Container>
  );
}
