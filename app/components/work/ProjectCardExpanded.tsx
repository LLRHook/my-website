"use client";

import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { motion } from "motion/react";
import type { RepoCardData } from "@/app/lib/types";
import { ExternalLinkIcon } from "@/app/components/ui/icons";
import { formatDate } from "@/app/lib/dateUtils";
import ActivitySparkline from "./ActivitySparkline";
import LanguageBar from "./LanguageBar";

const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeRaw];

// Primary languages whose repos can boot live in StackBlitz (WebContainers).
const RUNNABLE_LANGS = new Set([
  "JavaScript",
  "TypeScript",
  "Astro",
  "Vue",
  "Svelte",
  "HTML",
]);

type Tab = "readme" | "run" | "code" | "activity";

interface SourcePeek {
  html: string | null;
  path: string | null;
}

function SkeletonLines() {
  return (
    <div className="space-y-2.5 py-2 animate-pulse" aria-hidden="true">
      <div className="h-3 bg-white/10 rounded w-3/4" />
      <div className="h-3 bg-white/10 rounded w-full" />
      <div className="h-3 bg-white/10 rounded w-5/6" />
      <div className="h-3 bg-white/10 rounded w-2/3" />
    </div>
  );
}

export default function ProjectCardExpanded({ repo }: { repo: RepoCardData }) {
  const [tab, setTab] = useState<Tab>("readme");

  const [readme, setReadme] = useState<string | null>(null);
  const [source, setSource] = useState<SourcePeek | null>(null);

  // Lazy-load the README the first time its tab is shown.
  useEffect(() => {
    if (tab !== "readme" || readme !== null) return;
    const ctrl = new AbortController();
    fetch(`/api/readme/${repo.owner}/${repo.name}`, { signal: ctrl.signal })
      .then((r) => r.text())
      .then((t) => setReadme(t))
      .catch((e) => {
        if (e?.name !== "AbortError") setReadme("*Failed to load README.*");
      });
    return () => ctrl.abort();
  }, [tab, readme, repo.owner, repo.name]);

  // Lazy-load the highlighted source peek the first time its tab is shown.
  useEffect(() => {
    if (tab !== "code" || source !== null) return;
    const ctrl = new AbortController();
    const q = repo.language ? `?lang=${encodeURIComponent(repo.language)}` : "";
    fetch(`/api/source/${repo.owner}/${repo.name}${q}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: SourcePeek) => setSource(d))
      .catch((e) => {
        if (e?.name !== "AbortError") setSource({ html: null, path: null });
      });
    return () => ctrl.abort();
  }, [tab, source, repo.owner, repo.name, repo.language]);

  const isRunnable = !!repo.language && RUNNABLE_LANGS.has(repo.language);
  // ctl=1 = click-to-load: StackBlitz shows a Run button and does NOT boot a
  // WebContainer until the user clicks it (keeps the page light + leak-safe).
  const stackblitzUrl =
    `https://stackblitz.com/github/${repo.owner}/${repo.name}` +
    `?embed=1&ctl=1&hideNavigation=1&view=preview`;

  const tabs: { id: Tab; label: string }[] = [
    { id: "readme", label: "README" },
    ...(isRunnable ? [{ id: "run" as Tab, label: "Run" }] : []),
    { id: "code", label: "Code" },
    { id: "activity", label: "Activity" },
  ];

  const hasActivity =
    repo.languages.length > 0 ||
    repo.commitActivity.length > 0 ||
    repo.recentCommits.length > 0 ||
    repo.topics.length > 0;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="overflow-hidden"
    >
      <div className="px-6 sm:px-7 pb-6 sm:pb-7 pt-4 border-t border-border">
        <div
          role="tablist"
          aria-label="Project details"
          className="flex gap-1 mb-4 border-b border-border"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-xs uppercase tracking-wider transition-colors -mb-px border-b-2 ${
                tab === t.id
                  ? "border-accent text-text-primary"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "readme" && (
          <div role="tabpanel" aria-live="polite">
            {readme === null ? (
              <SkeletonLines />
            ) : (
              <div className="markdown-content text-sm">
                <Markdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
                  {readme}
                </Markdown>
              </div>
            )}
          </div>
        )}

        {tab === "run" && isRunnable && (
          <div role="tabpanel">
            <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2">
              Live in StackBlitz — press ▶ Run inside the editor to boot it
            </p>
            {/* Mounted only while this tab is active: switching tabs or closing
                the card unmounts the iframe and tears down the WebContainer. */}
            <iframe
              key={`stackblitz-${repo.id}`}
              title={`${repo.name} live demo`}
              src={stackblitzUrl}
              loading="lazy"
              className="w-full h-[28rem] rounded-lg border border-border bg-black/20"
              allow="cross-origin-isolated"
            />
          </div>
        )}

        {tab === "code" && (
          <div role="tabpanel" aria-live="polite">
            {source === null ? (
              <SkeletonLines />
            ) : source.html ? (
              <>
                {source.path && (
                  <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2">
                    {source.path}
                  </p>
                )}
                <div
                  className="source-peek text-xs"
                  dangerouslySetInnerHTML={{ __html: source.html }}
                />
              </>
            ) : (
              <p className="text-sm text-text-muted py-4">
                No source preview available.
              </p>
            )}
          </div>
        )}

        {tab === "activity" && (
          <div role="tabpanel" className="space-y-5 py-1">
            {repo.languages.length > 0 && <LanguageBar languages={repo.languages} />}

            {repo.commitActivity.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2">
                  Commit activity
                </p>
                <ActivitySparkline weeks={repo.commitActivity} weeksToShow={52} />
              </div>
            )}

            {repo.recentCommits.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2">
                  Recent commits
                </p>
                <ul className="space-y-1.5">
                  {repo.recentCommits.map((c) => (
                    <li
                      key={c.url}
                      className="text-sm text-text-secondary flex items-baseline gap-2"
                    >
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-text-primary line-clamp-1"
                      >
                        {c.message}
                      </a>
                      {c.date && (
                        <span className="text-[10px] text-text-muted shrink-0">
                          {formatDate(c.date)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {repo.topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {repo.topics.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-border text-text-muted"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {!hasActivity && (
              <p className="text-sm text-text-muted">No activity data.</p>
            )}
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-border">
          <a
            href={repo.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            View on GitHub
            <ExternalLinkIcon className="w-4 h-4" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
