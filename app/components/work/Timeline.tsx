"use client";

import { GroupedRepos } from "@/app/lib/types";
import YearSection from "./YearSection";

export default function Timeline({ grouped }: { grouped: GroupedRepos }) {
  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

  if (years.length === 0) {
    return (
      <div className="text-center py-20 text-text-muted">
        <p className="text-lg">No projects found.</p>
      </div>
    );
  }

  return (
    <div>
      {years.map((year) => (
        <YearSection key={year} year={year} repos={grouped[year]} />
      ))}
    </div>
  );
}
