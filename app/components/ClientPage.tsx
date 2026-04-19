"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import type { RepoCardData } from "@/app/lib/types";
import {
  EMAIL_HREF,
  GITHUB_HREF,
  SOCIAL_LINKS,
  type SocialLink,
} from "@/app/lib/constants";
import RepoReadmePanel from "./RepoReadmePanel";

type DemoTrackKey = "backend" | "fullstack" | "ai" | "lead";
type FunnelStage = "saved" | "applied" | "interview" | "offer";

interface DemoTrack {
  key: DemoTrackKey;
  label: string;
  thesis: string;
  bullets: string[];
}

interface DemoEntry {
  id: string;
  company: string;
  source: string;
  stage: FunnelStage;
  track: DemoTrackKey;
  note: string;
}

const FEATURED_PRIORITY = ["applybase", "mailit", "claude-guide", "my-website"];

const PRINCIPLES = [
  "Build fast, but keep the test surface real.",
  "Prefer systems that are observable and easy to maintain.",
  "Use AI to accelerate shipping, not to lower the quality bar.",
];

const CURRENT_FOCUS = [
  "Leading full-stack engineering at Paradigm Testing.",
  "Finishing a master's in AI at Georgia Tech.",
  "Building agentic workflows, deployment automation, and internal tools.",
];

const CONTACT_INTERESTS = [
  "Full-stack product engineering",
  "AI-enabled internal tooling",
  "Developer experience and automation",
  "System design and platform work",
];

const DEMO_TRACKS: DemoTrack[] = [
  {
    key: "backend",
    label: "Backend",
    thesis: "A resume lane for systems-heavy roles where reliability, APIs, and data design carry the weight.",
    bullets: ["Distributed systems", "PostgreSQL + Redis", "Observability"],
  },
  {
    key: "fullstack",
    label: "Full-stack",
    thesis: "Balanced product engineering with frontend polish, application depth, and shipping speed.",
    bullets: ["TypeScript + React", "API + UI ownership", "Fast iteration"],
  },
  {
    key: "ai",
    label: "AI systems",
    thesis: "Applied AI work where models are part of the product, but the surrounding system still has to be solid.",
    bullets: ["Agent workflows", "Evaluations", "Operational safeguards"],
  },
  {
    key: "lead",
    label: "Lead",
    thesis: "A lane for roles that need architecture, execution, and a teammate who can unblock the whole team.",
    bullets: ["Roadmapping", "Cross-functional delivery", "Quality bar"],
  },
];

const DEMO_STAGES: Array<{ key: FunnelStage; label: string }> = [
  { key: "saved", label: "Saved" },
  { key: "applied", label: "Applied" },
  { key: "interview", label: "Interview" },
  { key: "offer", label: "Offer" },
];

const DEMO_SOURCES = ["Referral", "Outbound", "Inbound", "Recruiter"];

const INITIAL_DEMO_ENTRIES: DemoEntry[] = [
  {
    id: "baseline-1",
    company: "Linear",
    source: "Referral",
    stage: "interview",
    track: "fullstack",
    note: "Product-minded engineering role with strong frontend ownership.",
  },
  {
    id: "baseline-2",
    company: "Anthropic",
    source: "Inbound",
    stage: "applied",
    track: "ai",
    note: "Agent tooling role anchored in applied AI systems work.",
  },
  {
    id: "baseline-3",
    company: "Vercel",
    source: "Outbound",
    stage: "saved",
    track: "backend",
    note: "Platform-leaning role queued for a backend resume pass.",
  },
  {
    id: "baseline-4",
    company: "Retool",
    source: "Recruiter",
    stage: "offer",
    track: "lead",
    note: "Leadership-tilted product engineering conversation.",
  },
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

function makeSocialLabel(link: SocialLink) {
  return link.label.toUpperCase();
}

function findFeaturedRepo(repos: RepoCardData[]) {
  for (const name of FEATURED_PRIORITY) {
    const match = repos.find((repo) => repo.name === name);
    if (match) return match;
  }

  return repos[0] ?? null;
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

  const featuredRepo = useMemo(() => findFeaturedRepo(sortedRepos), [sortedRepos]);
  const archivePool = useMemo(
    () =>
      sortedRepos.filter((repo) => repo.id !== featuredRepo?.id),
    [featuredRepo, sortedRepos]
  );

  const [selectedRepoName, setSelectedRepoName] = useState("");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const [demoTrack, setDemoTrack] = useState<DemoTrackKey>("fullstack");
  const [demoCompany, setDemoCompany] = useState("Cursor");
  const [demoSource, setDemoSource] = useState("Referral");
  const [demoStage, setDemoStage] = useState<FunnelStage>("applied");
  const [demoEntries, setDemoEntries] = useState<DemoEntry[]>(INITIAL_DEMO_ENTRIES);

  useEffect(() => {
    if (!archivePool.length && featuredRepo && selectedRepoName !== featuredRepo.name) {
      setSelectedRepoName(featuredRepo.name);
      return;
    }

    if (!archivePool.length) return;
    if (archivePool.some((repo) => repo.name === selectedRepoName)) return;
    setSelectedRepoName(archivePool[0].name);
  }, [archivePool, featuredRepo, selectedRepoName]);

  const filteredRepos = useMemo(() => {
    const pool = archivePool.length ? archivePool : featuredRepo ? [featuredRepo] : [];
    const normalized = deferredQuery.trim().toLowerCase();

    if (!normalized) return pool;

    return pool.filter((repo) => {
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
  }, [archivePool, deferredQuery, featuredRepo]);

  useEffect(() => {
    if (!filteredRepos.length) return;
    if (filteredRepos.some((repo) => repo.name === selectedRepoName)) return;
    setSelectedRepoName(filteredRepos[0].name);
  }, [filteredRepos, selectedRepoName]);

  const selectedRepo =
    filteredRepos.find((repo) => repo.name === selectedRepoName) ??
    filteredRepos[0] ??
    featuredRepo ??
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
  const featuredTrack = DEMO_TRACKS.find((track) => track.key === demoTrack) ?? DEMO_TRACKS[1];

  const stageCounts = useMemo(
    () =>
      DEMO_STAGES.map((stage) => ({
        ...stage,
        count: demoEntries.filter((entry) => entry.stage === stage.key).length,
      })),
    [demoEntries]
  );

  const totalTracked = demoEntries.length;
  const activeTracks = new Set(demoEntries.map((entry) => entry.track)).size;
  const featuredProjectName = featuredRepo?.name ?? "featured build";
  const featuredHeadline =
    featuredRepo?.name === "applybase"
      ? "A live slice of applybase's core loop."
      : "A live slice of a real workflow from the archive.";
  const featuredCopy =
    featuredRepo?.name === "applybase"
      ? "Pick a resume lane, log an application, and watch the funnel move. The point is the same as the real product: keep the workflow tight, local, and visible."
      : "This interactive area is how I want the portfolio to feel: less brochure, more product. Touch the workflow first, then inspect the code.";

  const selectRepo = (repoName: string) => {
    startTransition(() => setSelectedRepoName(repoName));
  };

  const submitDemoEntry = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedCompany = demoCompany.trim();
    if (!trimmedCompany) return;

    const note =
      demoTrack === "ai"
        ? "AI systems role routed to the applied workflows lane."
        : demoTrack === "lead"
          ? "Leadership-leaning opening logged with a broader systems resume."
          : demoTrack === "backend"
            ? "Backend-heavy role queued with systems and API emphasis."
            : "Product engineering role logged with the full-stack lane.";

    setDemoEntries((entries) => [
      {
        id: `${Date.now()}`,
        company: trimmedCompany,
        source: demoSource,
        stage: demoStage,
        track: demoTrack,
        note,
      },
      ...entries,
    ]);

    setDemoCompany("");
    startTransition(() => setDemoStage("saved"));
  };

  return (
    <div className="portfolio-page" data-testid="portfolio-page">
      <div className="portfolio-wallpaper" aria-hidden="true" />
      <div className="portfolio-grain" aria-hidden="true" />

      <header className="site-header">
        <a href="#top" className="site-brand">
          <span className="site-mark mono">VI</span>
          <span className="site-brand-copy">
            <span className="site-brand-name">Victor Ivanov</span>
            <span className="site-brand-role">Software Engineer</span>
          </span>
        </a>

        <nav className="site-nav" aria-label="Primary">
          <a href="#featured">Featured</a>
          <a href="#archive">Archive</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>

        <a href={EMAIL_HREF} className="header-link mono">
          EMAIL
        </a>
      </header>

      <main className="portfolio-main" id="top">
        <section className="section hero-section">
          <div className="hero-copy">
            <span className="section-eyebrow mono">
              Lead full-stack engineer · Georgia Tech MSAI · Lausanne, CH
            </span>
            <h1 className="hero-title">
              Build useful systems. Let people touch the work.
            </h1>
            <p className="hero-lede">
              I design and ship product engineering, AI-enabled internal tools,
              and platform work that still feels understandable after it ships.
            </p>

            <div className="action-row">
              <a href="#featured" className="shell-button">
                Try the featured workflow
              </a>
              <a href="#archive" className="shell-button shell-button--ghost">
                Browse the archive
              </a>
            </div>

            <div className="hero-rhythm" aria-label="Current snapshot">
              <div className="hero-rhythm-row">
                <span className="hero-rhythm-label mono">Current role</span>
                <span>Lead full-stack engineering at Paradigm Testing</span>
              </div>
              <div className="hero-rhythm-row">
                <span className="hero-rhythm-label mono">Current focus</span>
                <span>Agentic workflows, product systems, and internal tooling</span>
              </div>
              <div className="hero-rhythm-row">
                <span className="hero-rhythm-label mono">Archive</span>
                <span>
                  {sortedRepos.length} public repos · {totalStars} stars · last updated{" "}
                  {latestUpdate ? formatLongDate(latestUpdate) : "recently"}
                </span>
              </div>
            </div>
          </div>

          <aside className="hero-aside">
            <div className="aside-block">
              <span className="section-eyebrow mono">Why this shape</span>
              <p className="aside-copy">
                The portfolio should feel like a product surface, not a stack of
                cards. One featured build gets a real interaction model; the rest
                stay searchable and inspectable.
              </p>
            </div>

            <div className="aside-block">
              <span className="section-eyebrow mono">Current focus</span>
              <ul className="line-list">
                {CURRENT_FOCUS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </aside>
        </section>

        {featuredRepo ? (
          <section className="section feature-section" id="featured">
            <div className="section-heading">
              <span className="section-eyebrow mono">Featured work</span>
              <h2 className="section-title">{featuredHeadline}</h2>
              <p className="section-copy">{featuredCopy}</p>
            </div>

            <div className="feature-layout">
              <div className="feature-story">
                <span className="feature-kicker mono">{featuredProjectName}</span>
                <h3 className="feature-title">
                  A flagship project should be usable before it is explainable.
                </h3>
                <p className="feature-copy">
                  {featuredRepo.description ??
                    "A representative build from the archive, highlighted here with a live interaction model."}
                </p>

                <div className="feature-stats">
                  <div className="feature-stat">
                    <span className="feature-stat-label mono">Language</span>
                    <strong>{featuredRepo.language ?? "Mixed stack"}</strong>
                  </div>
                  <div className="feature-stat">
                    <span className="feature-stat-label mono">Updated</span>
                    <strong>{formatLongDate(featuredRepo.pushedAt)}</strong>
                  </div>
                  <div className="feature-stat">
                    <span className="feature-stat-label mono">Tracked entries</span>
                    <strong>{totalTracked}</strong>
                  </div>
                  <div className="feature-stat">
                    <span className="feature-stat-label mono">Resume lanes</span>
                    <strong>{activeTracks}</strong>
                  </div>
                </div>

                <div className="feature-notes">
                  <div className="feature-note">
                    <span className="feature-note-index mono">01</span>
                    <p>Choose the right category fast instead of tailoring from scratch every time.</p>
                  </div>
                  <div className="feature-note">
                    <span className="feature-note-index mono">02</span>
                    <p>Keep the application funnel visible so follow-ups and conversion quality are obvious.</p>
                  </div>
                  <div className="feature-note">
                    <span className="feature-note-index mono">03</span>
                    <p>Make the workflow local-first, practical, and clear enough that it keeps getting used.</p>
                  </div>
                </div>

                <div className="action-row">
                  <a
                    href={featuredRepo.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shell-button"
                  >
                    Open repository
                  </a>
                  <a href="#archive" className="shell-button shell-button--ghost">
                    Open the archive
                  </a>
                </div>
              </div>

              <section className="feature-demo" data-testid="featured-demo">
                <div className="demo-topline">
                  <span className="mono">interactive slice</span>
                  <span>Modeled on {featuredProjectName}</span>
                </div>

                <div className="demo-trackbar" role="tablist" aria-label="Resume lanes">
                  {DEMO_TRACKS.map((track) => {
                    const isActive = track.key === demoTrack;
                    return (
                      <button
                        key={track.key}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className={`track-button ${isActive ? "track-button--active" : ""}`}
                        onClick={() => startTransition(() => setDemoTrack(track.key))}
                      >
                        {track.label}
                      </button>
                    );
                  })}
                </div>

                <div className="demo-grid">
                  <div className="demo-panel">
                    <span className="section-eyebrow mono">Resume lane</span>
                    <h3 className="demo-title">{featuredTrack.label}</h3>
                    <p className="demo-copy">{featuredTrack.thesis}</p>

                    <ul className="line-list line-list--compact">
                      {featuredTrack.bullets.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <form className="demo-form" onSubmit={submitDemoEntry}>
                    <label className="form-field">
                      <span className="mono">company</span>
                      <input
                        aria-label="Company"
                        name="company"
                        value={demoCompany}
                        onChange={(event) => setDemoCompany(event.target.value)}
                        placeholder="Add a company"
                      />
                    </label>

                    <div className="form-row">
                      <label className="form-field">
                        <span className="mono">source</span>
                        <select
                          aria-label="Source"
                          name="source"
                          value={demoSource}
                          onChange={(event) => setDemoSource(event.target.value)}
                        >
                          {DEMO_SOURCES.map((source) => (
                            <option key={source} value={source}>
                              {source}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="form-field">
                        <span className="mono">stage</span>
                        <select
                          aria-label="Stage"
                          name="stage"
                          value={demoStage}
                          onChange={(event) => setDemoStage(event.target.value as FunnelStage)}
                        >
                          {DEMO_STAGES.map((stage) => (
                            <option key={stage.key} value={stage.key}>
                              {stage.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <button type="submit" className="shell-button">
                      Log to funnel
                    </button>
                  </form>
                </div>

                <div className="demo-stagebar">
                  {stageCounts.map((stage) => (
                    <div key={stage.key} className="stage-meter">
                      <span className="stage-meter-label mono">{stage.label}</span>
                      <strong
                        className="stage-meter-value"
                        data-testid={`stage-count-${stage.key}`}
                      >
                        {stage.count}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="demo-feed" data-testid="demo-feed">
                  {demoEntries.slice(0, 6).map((entry) => (
                    <div key={entry.id} className="demo-entry">
                      <div className="demo-entry-top">
                        <strong>{entry.company}</strong>
                        <span className="mono">
                          {
                            DEMO_STAGES.find((stage) => stage.key === entry.stage)?.label
                          }
                        </span>
                      </div>
                      <p>{entry.note}</p>
                      <div className="demo-entry-meta mono">
                        <span>
                          {DEMO_TRACKS.find((track) => track.key === entry.track)?.label}
                        </span>
                        <span>{entry.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </section>
        ) : null}

        <section className="section archive-section" id="archive">
          <div className="section-heading">
            <span className="section-eyebrow mono">Archive</span>
            <h2 className="section-title">
              Everything else stays searchable and inspectable.
            </h2>
            <p className="section-copy">
              Ordered by recent activity, filtered live, and opened as readable
              documentation instead of project cards.
            </p>
          </div>

          <div className="archive-layout">
            <div className="archive-browser">
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

              <div className="archive-list" role="list" data-testid="archive-list">
                {filteredRepos.length === 0 ? (
                  <div className="empty-state">No repos match that query yet.</div>
                ) : (
                  filteredRepos.map((repo) => {
                    const isSelected = repo.name === selectedRepo?.name;

                    return (
                      <button
                        key={repo.id}
                        type="button"
                        className={`archive-row ${isSelected ? "archive-row--selected" : ""}`}
                        onClick={() => selectRepo(repo.name)}
                      >
                        <div className="archive-row-top">
                          <span className="mono">{formatDayStamp(repo.pushedAt)}</span>
                          <span>{repo.language ?? "Mixed stack"}</span>
                          <span>{repo.stars} stars</span>
                        </div>
                        <div className="archive-row-title">{repo.name}</div>
                        <p className="archive-row-copy">
                          {repo.description ??
                            "Repository with shipped work, implementation notes, and source."}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="archive-reading">
              {selectedRepo ? (
                <>
                  <div className="archive-reading-head">
                    <span className="section-eyebrow mono">Selected repo</span>
                    <h3 className="archive-title" data-testid="archive-title">
                      {selectedRepo.name}
                    </h3>
                    <p className="archive-summary">
                      {selectedRepo.description ??
                        "A shipped engineering project with implementation details in the repository README."}
                    </p>

                    <div className="archive-meta">
                      <div className="archive-meta-item">
                        <span className="archive-meta-label mono">Language</span>
                        <span>{selectedRepo.language ?? "Mixed"}</span>
                      </div>
                      <div className="archive-meta-item">
                        <span className="archive-meta-label mono">Stars</span>
                        <span>{selectedRepo.stars}</span>
                      </div>
                      <div className="archive-meta-item">
                        <span className="archive-meta-label mono">Owner</span>
                        <span>{selectedRepo.owner}</span>
                      </div>
                      <div className="archive-meta-item">
                        <span className="archive-meta-label mono">Updated</span>
                        <span>{formatLongDate(selectedRepo.pushedAt)}</span>
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
                  Choose a repository from the archive to inspect its README and
                  implementation context.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="section about-section" id="about">
          <div className="section-heading">
            <span className="section-eyebrow mono">About</span>
            <h2 className="section-title">
              Product-minded engineering with a systems habit.
            </h2>
          </div>

          <div className="about-layout">
            <div className="about-copy">
              <p>
                I like work that has real edges to it: product decisions that need
                technical judgment, infrastructure that has to stay reliable, and
                interfaces that should feel deliberate instead of thrown together.
              </p>
              <p>
                Most of my work lives at the seam between shipping quickly and
                keeping the system easy to reason about. That usually means owning
                both the application layer and the underlying platform choices.
              </p>
            </div>

            <div className="about-rail">
              <div className="rail-block">
                <span className="section-eyebrow mono">Operating principles</span>
                <ul className="line-list">
                  {PRINCIPLES.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="rail-block">
                <span className="section-eyebrow mono">Stack signals</span>
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
            </div>
          </div>
        </section>

        <section className="section contact-section" id="contact">
          <div className="contact-copy">
            <span className="section-eyebrow mono">Contact</span>
            <h2 className="section-title">Let&apos;s build something useful.</h2>
            <p className="section-copy">
              I enjoy product engineering, AI-enabled internal tools, developer
              infrastructure, and systems work where technical quality is part of
              the outcome.
            </p>

            <div className="signal-grid">
              {CONTACT_INTERESTS.map((item) => (
                <span key={item} className="signal-pill">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="contact-rail">
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
        </section>
      </main>

      <footer className="site-footer">
        <span className="site-footer-status">
          Latest repo update {latestUpdate ? formatDayStamp(latestUpdate) : "unavailable"}
        </span>

        <div className="site-footer-links">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className="footer-link mono"
            >
              {makeSocialLabel(link)}
            </a>
          ))}
          <a
            href={GITHUB_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link mono"
          >
            GITHUB
          </a>
        </div>
      </footer>
    </div>
  );
}
