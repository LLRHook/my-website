import { NextResponse } from "next/server";
import { fetchAllRepos, buildTimelineData } from "@/app/lib/github";

export const revalidate = 3600;

export async function GET() {
  const repos = await fetchAllRepos();
  const timelineData = buildTimelineData(repos);
  return NextResponse.json(timelineData);
}
