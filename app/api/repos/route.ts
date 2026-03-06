import { NextResponse } from "next/server";
import { fetchAllRepos, groupReposByYear } from "@/app/lib/github";

export const revalidate = 3600;

export async function GET() {
  const repos = await fetchAllRepos();
  const grouped = groupReposByYear(repos);
  return NextResponse.json(grouped);
}
