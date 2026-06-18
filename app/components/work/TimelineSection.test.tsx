import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TimelineSection from "./TimelineSection";
import type { TimelineData } from "@/app/lib/types";

describe("TimelineSection", () => {
  it("shows the empty state when there is no data", () => {
    render(<TimelineSection data={[]} />);
    expect(screen.getByText(/No projects to display/i)).toBeInTheDocument();
  });

  it("renders a project name when data is present", () => {
    const data: TimelineData = [
      {
        year: "2026",
        months: [
          {
            month: "January",
            monthIndex: 0,
            repos: [
              {
                id: 1,
                name: "my-cool-repo",
                description: "a demo",
                htmlUrl: "https://github.com/o/my-cool-repo",
                homepage: null,
                language: "TypeScript",
                stars: 0,
                pushedAt: "2026-01-02T00:00:00Z",
                createdAt: "2025-01-01T00:00:00Z",
                owner: "o",
                languages: [],
                commitActivity: [],
                topics: [],
                recentCommits: [],
              },
            ],
          },
        ],
      },
    ];
    render(<TimelineSection data={data} />);
    expect(screen.getByText("my-cool-repo")).toBeInTheDocument();
  });
});
