"use client";

import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { RepoCardData } from "@/app/lib/types";

const MAX_DISPLAY_CHARACTERS = 100_000;
const remarkPlugins = [remarkGfm];

function readmeHref(href: string | undefined, repositoryUrl: string): string {
  const value = href?.trim();
  if (!value) return repositoryUrl;
  if (value.startsWith("#")) return `${repositoryUrl}${value}`;

  try {
    if (/^(?:https?:)?\/\//i.test(value)) {
      const url = new URL(value, "https://github.com");
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : repositoryUrl;
    }
    if (/^[a-z][a-z\d+.-]*:/i.test(value)) return repositoryUrl;

    // README paths are relative to the repository, including root-leading paths.
    // HEAD resolves GitHub's current default branch without assuming its name.
    const url = new URL(value.replace(/^\/+/, ""), `${repositoryUrl}/blob/HEAD/`);
    return url.protocol === "https:" ? url.href : repositoryUrl;
  } catch {
    return repositoryUrl;
  }
}

export default function ProjectReadme({ repo }: { repo: RepoCardData }) {
  const [readme, setReadme] = useState<{ text: string; truncated: boolean } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/readme/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("README unavailable");
        return response.text();
      })
      .then((text) => {
        if (controller.signal.aborted) return;
        setReadme({
          text: text.slice(0, MAX_DISPLAY_CHARACTERS) || "Project notes are available on GitHub.",
          truncated: text.length > MAX_DISPLAY_CHARACTERS,
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setReadme({ text: "Project notes could not load. You can still open the repository on GitHub.", truncated: false });
        }
      });
    return () => controller.abort();
  }, [repo.owner, repo.name]);

  return (
    <div className="project-readme">
      {readme === null ? <p role="status">Opening project notes…</p> : (
        <>
          <Markdown
            remarkPlugins={remarkPlugins}
            skipHtml
            components={{
              img: () => null,
              a: ({ href, children }) => <a href={readmeHref(href, repo.htmlUrl)} target="_blank" rel="noopener noreferrer">{children} ↗</a>,
              table: ({ children }) => <div className="readme-table-scroll" role="region" aria-label="Project documentation table" tabIndex={0}><table>{children}</table></div>,
            }}
          >{readme.text}</Markdown>
          {readme.truncated && <p>These notes are an excerpt. <a href={`${repo.htmlUrl}#readme`} target="_blank" rel="noopener noreferrer">Read the full README on GitHub ↗</a></p>}
        </>
      )}
    </div>
  );
}
