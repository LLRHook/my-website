import { NextRequest, NextResponse } from "next/server";
import { fetchReadme } from "@/app/lib/github";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params;
  const readme = await fetchReadme(owner, repo);
  return new NextResponse(readme, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
