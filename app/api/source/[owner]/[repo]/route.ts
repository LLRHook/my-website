import { NextRequest, NextResponse } from "next/server";
import { codeToHtml } from "shiki";
import { fetchKeyFile, shikiLang } from "@/app/lib/github";

export const revalidate = 3600;

// Lazy source peek (FEAT-1781502132): picks a representative source file for the
// repo, highlights it with shiki on the server (zero client JS), and returns the
// HTML. Degrades to { html: null } when no suitable file is found or the grammar
// is unknown.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params;
  const language = request.nextUrl.searchParams.get("lang");

  const file = await fetchKeyFile(owner, repo, language);
  if (!file) {
    return NextResponse.json({ html: null, path: null });
  }

  try {
    const html = await codeToHtml(file.code, {
      lang: shikiLang(language),
      theme: "github-dark",
    });
    return NextResponse.json({ html, path: file.path });
  } catch {
    return NextResponse.json({ html: null, path: file.path });
  }
}
