"use client";

import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeRaw];

interface RepoReadmePanelProps {
  owner: string;
  repo: string;
  description: string | null;
}

export default function RepoReadmePanel({
  owner,
  repo,
  description,
}: RepoReadmePanelProps) {
  const [readme, setReadme] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadReadme() {
      setLoading(true);

      try {
        const response = await fetch(`/api/readme/${owner}/${repo}`);
        const text = await response.text();

        if (!cancelled) {
          setReadme(text.trim() ? text : null);
        }
      } catch {
        if (!cancelled) {
          setReadme(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReadme();

    return () => {
      cancelled = true;
    };
  }, [owner, repo]);

  return (
    <section className="readme-section">
      <div className="readme-header">
        <span className="panel-eyebrow mono">Repository notes</span>
        <h3 className="readme-title">README</h3>
      </div>

      {loading ? (
        <div className="readme-loading" aria-live="polite">
          <span className="shell-spinner" aria-hidden="true" />
          <span>Loading README…</span>
        </div>
      ) : readme ? (
        <div className="markdown-content">
          <Markdown
            remarkPlugins={remarkPlugins}
            rehypePlugins={rehypePlugins}
          >
            {readme}
          </Markdown>
        </div>
      ) : (
        <p className="readme-fallback">
          {description ??
            "This repository does not expose a README, but the source is available on GitHub."}
        </p>
      )}
    </section>
  );
}
