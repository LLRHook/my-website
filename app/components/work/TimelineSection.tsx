"use client";

import type { TimelineData, TimelineMonth, TimelineDay, RepoCardData } from "@/app/lib/types";
import TimelineCard from "./TimelineCard";
import Container from "@/app/components/ui/Container";

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
  if (!data || data.length === 0) {
    return (
      <Container as="section" id="work" className="py-24" innerClassName="text-center" data-testid="work">
        <p className="text-text-muted text-lg">No projects to display.</p>
      </Container>
    );
  }

  let globalIndex = 0;

  return (
    <Container as="section" id="work" className="py-24" data-testid="work">
      <div className="relative">
        {/* Vertical stem */}
        <div className="timeline-stem" />

        {data.map((yearGroup) => (
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
    </Container>
  );
}
