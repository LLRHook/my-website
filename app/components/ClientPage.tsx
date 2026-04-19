"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import type { RepoCardData } from "@/app/lib/types";
import {
  EMAIL_HREF,
  GITHUB_HREF,
  SOCIAL_LINKS,
  type SocialLink,
} from "@/app/lib/constants";
import RepoReadmePanel from "./RepoReadmePanel";

type AppKey = "about" | "work" | "contact";

const APP_TABS: Array<{
  key: AppKey;
  id: string;
  label: string;
  path: string;
  summary: string;
}> = [
  {
    key: "about",
    id: "app-tab-about",
    label: "About",
    path: "~/profile/about",
    summary: "Bio, working style, and current focus.",
  },
  {
    key: "work",
    id: "app-tab-work",
    label: "Projects",
    path: "~/workspace/projects",
    summary: "Repo archive with live README inspection.",
  },
  {
    key: "contact",
    id: "app-tab-contact",
    label: "Contact",
    path: "~/network/contact",
    summary: "How to reach me and what I like building.",
  },
];

const PRINCIPLES = [
  "Build fast, but keep the test surface real.",
  "Prefer systems that are observable and easy to maintain.",
  "Use AI to accelerate shipping, not to lower the quality bar.",
];

const CURRENT_FOCUS = [
  "Lead full-stack engineering at Paradigm Testing.",
  "Finishing a master's in AI at Georgia Tech.",
  "Building agentic workflows, deployment automation, and internal tools.",
];

const CONTACT_INTERESTS = [
  "Full-stack product engineering",
  "AI-enabled internal tooling",
  "Developer experience and automation",
  "System design and platform work",
];

function formatDayStamp(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatLongDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(now: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(now);
}

function makeSocialLabel(link: SocialLink) {
  return link.label.toUpperCase();
}

interface WindowFrameProps {
  label: string;
  path: string;
  meta?: string;
  children: React.ReactNode;
  className?: string;
}

function WindowFrame({
  label,
  path,
  meta,
  children,
  className = "",
}: WindowFrameProps) {
  return (
    <section className={`window-frame ${className}`}>
      <div className="window-titlebar">
        <div className="window-controls" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="window-copy">
          <span className="window-label mono">{label}</span>
          <span className="window-path mono">{path}</span>
        </div>
        {meta ? <span className="window-meta mono">{meta}</span> : null}
      </div>
      <div className="window-body">{children}</div>
    </section>
  );
}

export default function ClientPage({ repos }: { repos: RepoCardData[] }) {
  const sortedRepos = useMemo(
    () =>
      [...repos].sort(
        (a, b) =>
          new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime()
      ),
    [repos]
  );
  const [activeApp, setActiveApp] = useState<AppKey>("work");
  const [selectedRepoName, setSelectedRepoName] = useState(
    sortedRepos[0]?.name ?? ""
  );
  const [query, setQuery] = useState("");
  const [now, setNow] = useState(() => new Date());
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (APP_TABS.some((app) => app.key === hash)) {
      setActiveApp(hash as AppKey);
    }
  }, []);

  useEffect(() => {
    window.history.replaceState({}, "", `#${activeApp}`);
  }, [activeApp]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!sortedRepos.length || selectedRepoName) return;
    setSelectedRepoName(sortedRepos[0].name);
  }, [selectedRepoName, sortedRepos]);

  const filteredRepos = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();
    if (!normalized) return sortedRepos;

    return sortedRepos.filter((repo) => {
      const haystack = [
        repo.name,
        repo.description ?? "",
        repo.language ?? "",
        repo.owner,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [deferredQuery, sortedRepos]);

  useEffect(() => {
    if (!filteredRepos.length) return;
    if (filteredRepos.some((repo) => repo.name === selectedRepoName)) return;
    setSelectedRepoName(filteredRepos[0].name);
  }, [filteredRepos, selectedRepoName]);

  const selectedRepo =
    filteredRepos.find((repo) => repo.name === selectedRepoName) ??
    filteredRepos[0] ??
    null;

  const languageSummary = useMemo(() => {
    const counts = new Map<string, number>();

    for (const repo of sortedRepos) {
      if (!repo.language) continue;
      counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [sortedRepos]);

  const totalStars = useMemo(
    () => sortedRepos.reduce((sum, repo) => sum + repo.stars, 0),
    [sortedRepos]
  );

  const latestUpdate = sortedRepos[0]?.pushedAt;
  const activeTab = APP_TABS.find((tab) => tab.key === activeApp) ?? APP_TABS[1];

  const openApp = (nextApp: AppKey) => {
    startTransition(() => setActiveApp(nextApp));
  };

  const selectRepo = (nextRepo: string) => {
    startTransition(() => setSelectedRepoName(nextRepo));
  };

  return (
    <div className="shell-page" data-testid="shell-page">
      <div className="shell-wallpaper" aria-hidden="true" />

      <div className="shell-frame">
        <header className="shell-statusbar">
          <div className="shell-statusgroup">
            <span className="status-pill">Victor Ivanov</span>
            <span className="status-pill status-pill--muted">
              Software Engineer
            </span>
          </div>

          <div className="shell-statusgroup shell-statusgroup--right">
            <span className="status-readout">Lausanne, CH</span>
            <span className="status-readout mono">{formatTime(now)}</span>
          </div>
        </header>

        <div className="shell-main">
          <nav
            aria-label="Portfolio views"
            className="shell-launchpad"
            role="tablist"
          >
            {APP_TABS.map((tab, index) => {
              const selected = activeApp === tab.key;
              return (
                <button
                  key={tab.key}
                  id={tab.id}
                  type="button"
                  role="tab"
                  aria-controls={`panel-${tab.key}`}
                  aria-selected={selected}
                  className={`launcher-button ${
                    selected ? "launcher-button--active" : ""
                  }`}
                  onClick={() => openApp(tab.key)}
                >
                  <span className="launcher-index mono">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="launcher-label">{tab.label}</span>
                </button>
              );
            })}

            <a
              className="launcher-button launcher-button--link"
              href={GITHUB_HREF}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="launcher-index mono">GH</span>
              <span className="launcher-label">GitHub</span>
            </a>
          </nav>

          <div className="shell-stage">
            <WindowFrame
              label={activeTab.label}
              path={activeTab.path}
              meta={activeApp === "work" ? `${filteredRepos.length} repos` : "live"}
              className="window-frame--primary"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeApp}
                  id={`panel-${activeApp}`}
                  role="tabpanel"
                  aria-labelledby={activeTab.id}
                  className="app-screen"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  {activeApp === "work" ? (
                    <div className="workspace workspace--repos">
                      <section className="panel panel--browser">
                        <div className="panel-head">
                          <span className="panel-eyebrow mono">Project index</span>
                          <h1 className="panel-title">Selected work</h1>
                          <p className="panel-copy">
                            A running archive of public repos, ordered by recent
                            activity and opened as documents instead of cards.
                          </p>
                        </div>

                        <label className="search-field">
                          <span className="mono">query</span>
                          <input
                            type="search"
                            name="project-search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search by repo, language, or keyword"
                          />
                        </label>

                        <div className="repo-list" role="list">
                          {filteredRepos.length === 0 ? (
                            <div className="empty-state">
                              No repos match that query yet.
                            </div>
                          ) : (
                            filteredRepos.map((repo) => {
                              const isSelected = repo.name === selectedRepo?.name;
                              return (
                                <button
                                  key={repo.id}
                                  type="button"
                                  className={`repo-row ${
                                    isSelected ? "repo-row--selected" : ""
                                  }`}
                                  onClick={() => selectRepo(repo.name)}
                                >
                                  <div className="repo-row-top">
                                    <span className="mono">
                                      {formatDayStamp(repo.pushedAt)}
                                    </span>
                                    <span>{repo.language ?? "Mixed stack"}</span>
                                  </div>
                                  <div className="repo-row-title">{repo.name}</div>
                                  <p className="repo-row-copy">
                                    {repo.description ??
                                      "Repository with shipped work, implementation notes, and source."}
                                  </p>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </section>

                      <section className="panel panel--document">
                        {selectedRepo ? (
                          <>
                            <div className="project-hero">
                              <span className="panel-eyebrow mono">
                                {formatLongDate(selectedRepo.pushedAt)}
                              </span>
                              <h2 className="project-title">{selectedRepo.name}</h2>
                              <p className="project-copy">
                                {selectedRepo.description ??
                                  "A shipped engineering project with implementation details in the repository README."}
                              </p>

                              <div className="project-meta">
                                <div className="meta-item">
                                  <span className="meta-label mono">Language</span>
                                  <span>{selectedRepo.language ?? "Mixed"}</span>
                                </div>
                                <div className="meta-item">
                                  <span className="meta-label mono">Stars</span>
                                  <span>{selectedRepo.stars}</span>
                                </div>
                                <div className="meta-item">
                                  <span className="meta-label mono">Owner</span>
                                  <span>{selectedRepo.owner}</span>
                                </div>
                                <div className="meta-item">
                                  <span className="meta-label mono">Updated</span>
                                  <span>{formatDayStamp(selectedRepo.pushedAt)}</span>
                                </div>
                              </div>

                              <div className="action-row">
                                <a
                                  href={selectedRepo.htmlUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shell-button"
                                >
                                  Open repository
                                </a>
                                {selectedRepo.homepage ? (
                                  <a
                                    href={selectedRepo.homepage}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shell-button shell-button--ghost"
                                  >
                                    Open live site
                                  </a>
                                ) : null}
                              </div>
                            </div>

                            <RepoReadmePanel
                              owner={selectedRepo.owner}
                              repo={selectedRepo.name}
                              description={selectedRepo.description}
                            />
                          </>
                        ) : (
                          <div className="empty-state empty-state--large">
                            Choose a project from the archive to inspect its
                            README and shipping context.
                          </div>
                        )}
                      </section>
                    </div>
                  ) : null}

                  {activeApp === "about" ? (
                    <div className="workspace workspace--split">
                      <section className="panel panel--narrative">
                        <span className="panel-eyebrow mono">Overview</span>
                        <h1 className="panel-title panel-title--xl">
                          Software engineer building reliable systems, sharp
                          tooling, and product work that ships.
                        </h1>
                        <p className="panel-copy panel-copy--large">
                          I lead full-stack engineering at Paradigm Testing,
                          build across Java, TypeScript, PostgreSQL, and Redis,
                          and keep one foot in applied AI through my master&apos;s
                          work at Georgia Tech.
                        </p>
                        <p className="panel-copy">
                          The common thread in my work is simple: move fast, keep
                          the standards high, and make the system easier to
                          understand after you touch it.
                        </p>

                        <div className="action-row">
                          <button
                            type="button"
                            className="shell-button"
                            onClick={() => openApp("work")}
                          >
                            Browse projects
                          </button>
                          <button
                            type="button"
                            className="shell-button shell-button--ghost"
                            onClick={() => openApp("contact")}
                          >
                            Start a conversation
                          </button>
                        </div>
                      </section>

                      <section className="panel panel--notes">
                        <div className="note-block">
                          <span className="panel-eyebrow mono">Operating principles</span>
                          <ul className="note-list">
                            {PRINCIPLES.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="note-block">
                          <span className="panel-eyebrow mono">Current focus</span>
                          <ul className="note-list">
                            {CURRENT_FOCUS.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </section>
                    </div>
                  ) : null}

                  {activeApp === "contact" ? (
                    <div className="workspace workspace--split">
                      <section className="panel panel--narrative">
                        <span className="panel-eyebrow mono">Contact</span>
                        <h1 className="panel-title panel-title--xl">
                          Let&apos;s build something useful.
                        </h1>
                        <p className="panel-copy panel-copy--large">
                          I enjoy product engineering, AI-enabled internal tools,
                          automation, and systems work where technical quality is
                          part of the outcome.
                        </p>

                        <div className="contact-interest-grid">
                          {CONTACT_INTERESTS.map((item) => (
                            <span key={item} className="signal-pill">
                              {item}
                            </span>
                          ))}
                        </div>

                        <div className="action-row">
                          <a href={EMAIL_HREF} className="shell-button">
                            Send an email
                          </a>
                          <a
                            href={GITHUB_HREF}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shell-button shell-button--ghost"
                          >
                            View GitHub
                          </a>
                        </div>
                      </section>

                      <section className="panel panel--notes">
                        <div className="note-block">
                          <span className="panel-eyebrow mono">Best channels</span>
                          <div className="contact-links">
                            {SOCIAL_LINKS.map((link) => (
                              <a
                                key={link.label}
                                href={link.href}
                                target={link.external ? "_blank" : undefined}
                                rel={link.external ? "noopener noreferrer" : undefined}
                                className="contact-link"
                              >
                                <span>{link.label}</span>
                                <span className="mono">
                                  {link.external ? "open" : "direct"}
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      </section>
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </WindowFrame>

            <WindowFrame
              label="Console"
              path="~/system/summary"
              meta={activeApp === "work" ? "selected repo" : "snapshot"}
              className="window-frame--secondary"
            >
              {activeApp === "work" ? (
                <div className="inspector-stack">
                  <div className="inspector-block">
                    <span className="panel-eyebrow mono">Archive stats</span>
                    <div className="stat-grid">
                      <div className="stat-card">
                        <span className="stat-value">{sortedRepos.length}</span>
                        <span className="stat-label mono">public repos</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-value">{totalStars}</span>
                        <span className="stat-label mono">stars</span>
                      </div>
                    </div>
                  </div>

                  <div className="inspector-block">
                    <span className="panel-eyebrow mono">Top languages</span>
                    <div className="language-stack">
                      {languageSummary.map(([language, count]) => (
                        <div key={language} className="language-row">
                          <span>{language}</span>
                          <span className="mono">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedRepo ? (
                    <div className="inspector-block">
                      <span className="panel-eyebrow mono">Selection</span>
                      <div className="selection-card">
                        <h2>{selectedRepo.name}</h2>
                        <p>
                          {selectedRepo.description ??
                            "Repository selected for inspection."}
                        </p>
                        <div className="selection-meta mono">
                          <span>{selectedRepo.language ?? "Mixed"}</span>
                          <span>{formatDayStamp(selectedRepo.pushedAt)}</span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {activeApp === "about" ? (
                <div className="inspector-stack">
                  <div className="inspector-block">
                    <span className="panel-eyebrow mono">Profile</span>
                    <div className="stat-grid">
                      <div className="stat-card">
                        <span className="stat-value">Lead</span>
                        <span className="stat-label mono">role</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-value">MSAI</span>
                        <span className="stat-label mono">in progress</span>
                      </div>
                    </div>
                  </div>

                  <div className="inspector-block">
                    <span className="panel-eyebrow mono">Stack</span>
                    <div className="signal-grid">
                      {languageSummary.map(([language]) => (
                        <span key={language} className="signal-pill">
                          {language}
                        </span>
                      ))}
                      <span className="signal-pill">PostgreSQL</span>
                      <span className="signal-pill">Redis</span>
                      <span className="signal-pill">Automation</span>
                    </div>
                  </div>

                  <div className="inspector-block">
                    <span className="panel-eyebrow mono">Latest update</span>
                    <p className="inspector-copy">
                      {latestUpdate
                        ? `GitHub archive refreshed through ${formatLongDate(
                            latestUpdate
                          )}.`
                        : "GitHub archive not available."}
                    </p>
                  </div>
                </div>
              ) : null}

              {activeApp === "contact" ? (
                <div className="inspector-stack">
                  <div className="inspector-block">
                    <span className="panel-eyebrow mono">Contact posture</span>
                    <div className="signal-grid">
                      <span className="signal-pill">Open to interesting builds</span>
                      <span className="signal-pill">Product + systems</span>
                      <span className="signal-pill">Automation friendly</span>
                    </div>
                  </div>

                  <div className="inspector-block">
                    <span className="panel-eyebrow mono">Social routes</span>
                    <div className="contact-links">
                      {SOCIAL_LINKS.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
                          target={link.external ? "_blank" : undefined}
                          rel={link.external ? "noopener noreferrer" : undefined}
                          className="contact-link"
                        >
                          <span>{link.label}</span>
                          <span className="mono">{makeSocialLabel(link)}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </WindowFrame>
          </div>
        </div>

        <footer className="shell-dock" aria-label="Quick links">
          <div className="dock-cluster">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className="dock-link mono"
              >
                {makeSocialLabel(link)}
              </a>
            ))}
          </div>

          <div className="dock-cluster dock-cluster--right">
            <span className="dock-status">
              Latest repo update{" "}
              {latestUpdate ? formatDayStamp(latestUpdate) : "unavailable"}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
