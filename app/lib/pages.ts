import { EMAIL_HREF, GITHUB_HREF, SITE_NAME, SITE_URL, SKILLS, SOCIAL_BY_ICON } from "./constants";
import { esc, PAGES, personMicrodata } from "./html";
import { presentProject } from "./projectPresentation";
import type { TokenStats } from "./tokenStats";
import type { RepoSummary } from "./types";

const external = 'target="_blank" rel="noopener noreferrer"';
const profile = 'target="_blank" rel="me noopener noreferrer"';
const paragraph = (text: string) => `<p>${esc(text)}</p>`;
const portrait = '<img class="portrait" decoding="async" fetchpriority="high" src="/victor-profile.jpg" width="120" height="120" alt="Victor\'s illustrated GitHub profile portrait">';

export function homeBody(): string {
  const lines = ["who I am and what I work on", "everything public on my GitHub, updated hourly", "experience, projects and education (PDF too)", "climbing, cards, books and travel", "email, GitHub and LinkedIn"];
  return `<h1>Welcome to Victor Ivanov's Home Page!</h1>${portrait}${paragraph("Hi, I'm Victor, a Senior Full-Stack Engineer in Sterling, Virginia. I build web products and developer tools, work across the stack, and climb rocks.")}
<div class="construction"><p><b>This page is always under construction.</b></p></div><h2>What's New</h2><ul><li><span class="new">NEW!</span> October 2026: the site is now a hand-written HTML and CSS home page. No JavaScript.</li><li>September 2026: resume updated.</li></ul><h2>Start here</h2><ul>${PAGES.slice(1).map((item, index) => `<li><a href="${esc(item.path)}">${esc(item.label)}</a>: ${esc(lines[index])}</li>`).join("")}</ul>
<div itemscope itemtype="https://schema.org/WebSite"><meta itemprop="name" content="${esc(SITE_NAME)}"><link itemprop="url" href="${esc(SITE_URL)}/"></div>${personMicrodata()}`;
}

export function aboutBody(): string {
  return `<h1>About Me</h1>${portrait}${paragraph("Hi, I'm Victor. A Senior Full-Stack Engineer with a habit of building useful things.")}
${paragraph("Based in Sterling, Virginia · Active DoD Secret clearance")}
${paragraph("I work on certification software at Paradigm Testing. That means APIs, multi-tenant systems, real-time exam workflows, and getting the details right before they reach production.")}
${paragraph("Most days, I work with Java, Spring Boot, React, and PostgreSQL. Outside of that, I build tools in Go and TypeScript and spend a lot of time exploring agentic development workflows.")}
${paragraph("I studied computer science at UMBC and I'm pursuing an M.S. in Computer Science at Georgia Tech, expected December 2027. Away from the desk, you'll usually find me climbing or thinking about the next project.")}
<blockquote>Build fast. Always test.<br><small>A good test suite is part of the work.</small></blockquote><h2>Tools I use</h2><ul class="columns">${[...SKILLS, "Go"].map((skill) => `<li>${esc(skill)}</li>`).join("")}</ul>
<figure><img loading="lazy" decoding="async" src="/conference-photo.jpg" alt="A moment at the conference podium" width="320" height="320"><figcaption>At the podium.</figcaption></figure><p><a href="/projects">See what I'm building &raquo;</a></p>
<div itemscope itemtype="https://schema.org/ProfilePage">${personMicrodata('itemprop="mainEntity"')}</div>`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-10-14" -> "Oct 14, 2026", read as a calendar day (no time zone shift). */
export function formatDay(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  return `${MONTHS[month - 1]} ${date}, ${year}`;
}
/** Three significant digits with a K/M/B suffix: 6950384905 -> "6.95B", 2700000000 -> "2.70B". */
export function formatTokens(tokens: number): string {
  if (tokens < 1000) return String(tokens);
  for (const [size, suffix] of [[1e3, "K"], [1e6, "M"], [1e9, "B"]] as const) {
    const value = tokens / size;
    // 999,600 rounds to "1.00M", not "1.00e+3K".
    if (Number(value.toPrecision(3)) < 1000) return `${value.toPrecision(3)}${suffix}`;
    if (suffix === "B") return `${Math.round(value).toLocaleString("en-US")}B`;
  }
  return String(tokens);
}
/** Whole dollars from $100 up ("$4,086"), cents below ("$12.34"). */
export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString("en-US", amount >= 100 ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
const percent = (share: number) => `${share >= 0.1 ? Math.round(share * 100) : Number((share * 100).toFixed(1))}%`;

// A horizontal bar: SVG attributes only, because the CSP's style-src allows nothing
// but the stylesheet hash. The text beside it carries the same number.
const bar = (segments: { share: number; className: string; title: string }[]) => {
  let x = 0;
  const rects = segments.map(({ share, className, title }) => {
    const width = Number((share * 100).toFixed(2));
    const rect = `<rect class="${className}" x="${x}" y="0" width="${width}" height="10"><title>${esc(title)}</title></rect>`;
    x = Number((x + width).toFixed(2));
    return rect;
  }).join("");
  return `<svg class="burner-bar" viewBox="0 0 100 10" width="100" height="10" preserveAspectRatio="none" aria-hidden="true" focusable="false">${rects}</svg>`;
};

const CHART_WIDTH = 360;
const CHART_HEIGHT = 120;

function dailyChart(stats: TokenStats): string {
  const peak = stats.daily.reduce((best, day) => (day.tokens > best.tokens ? day : best), stats.daily[0]);
  const step = CHART_WIDTH / stats.daily.length;
  const rects = stats.daily.map((day, index) => {
    if (!day.tokens) return "";
    const height = Math.max(1, Number(((day.tokens / peak.tokens) * CHART_HEIGHT).toFixed(1)));
    return `<rect x="${Number((index * step).toFixed(1))}" y="${Number((CHART_HEIGHT - height).toFixed(1))}" width="${Number((step * 0.75).toFixed(2))}" height="${height}"><title>${esc(`${formatDay(day.date)}: ${formatTokens(day.tokens)} tokens, ${formatUsd(day.costUsd)}`)}</title></rect>`;
  }).join("");
  const first = stats.daily[0].date;
  const summary = peak.tokens
    ? `Daily tokens from ${formatDay(first)} to ${formatDay(stats.asOf)}; the busiest day was ${formatDay(peak.date)} with ${formatTokens(peak.tokens)} tokens.`
    : `No tokens from ${formatDay(first)} to ${formatDay(stats.asOf)}.`;
  const rows = stats.daily.map((day) => `<tr><td><time datetime="${day.date}">${formatDay(day.date)}</time></td><td>${formatTokens(day.tokens)}</td><td>${formatUsd(day.costUsd)}</td></tr>`).join("");
  return `<h3>Last ${stats.daily.length} days</h3><figure class="burner-chart"><svg viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT}" width="${CHART_WIDTH}" height="${CHART_HEIGHT}" preserveAspectRatio="none" role="img" aria-label="${esc(summary)}">${rects}</svg>`
    + `<figcaption><span>${formatDay(first)}</span> <span>${formatDay(stats.asOf)}</span></figcaption></figure><p>${esc(summary)}</p>`
    + `<details><summary>Daily numbers as a table</summary><div class="table-wrap"><table class="projects"><caption>Tokens per day</caption><thead><tr><th scope="col">Day</th><th scope="col">Tokens</th><th scope="col">API-equivalent cost</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
}

/** The "Token burner" panel on /projects; empty when there is no valid snapshot. */
export function tokenBurner(stats: TokenStats | null): string {
  if (!stats) return "";
  const { lifetime, last30, byTool } = stats;
  const total = lifetime.tokens.total;
  const share = (tokens: number) => (total ? tokens / total : 0);
  const tile = (label: string, value: string, note: string) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd><dd class="note">${esc(note)}</dd></div>`;
  const tools = [["Claude Code", byTool.claudeCode, "claude"], ["Codex", byTool.codex, "codex"]] as const;
  const toolList = tools.map(([name, usage, className]) => `<li><span class="key ${className}" aria-hidden="true"></span>${esc(name)}: ${formatTokens(usage.tokens.total)} tokens (${percent(share(usage.tokens.total))}), ${formatUsd(usage.costUsd)}</li>`).join("");
  const models = stats.byModel.map((item) => `<li><span class="label">${esc(item.model)}</span> <span class="value">${formatTokens(item.tokens)} &middot; ${percent(item.share)}</span>${bar([{ share: item.share, className: "model", title: `${item.model}: ${percent(item.share)} of all tokens` }])}</li>`).join("");
  return `<section class="burner" aria-labelledby="burner"><h2 id="burner">Token burner</h2>`
    + `<p>How many tokens AI coding agents (Claude Code and Codex) have burned building my projects, counted from my local logs. Costs are what the same usage would cost at API list prices (${esc(formatDay(stats.pricesAsOf))}); most tokens are cheap cache reads.</p>`
    + `<dl class="burner-stats">${tile("Lifetime", `${formatTokens(total)} tokens`, `since ${formatDay(stats.since)}`)}${tile("Last 30 days", `${formatTokens(last30.tokens.total)} tokens`, `${formatUsd(last30.costUsd)} API-equivalent`)}`
    + `${tile("API-equivalent cost", formatUsd(lifetime.costUsd), "lifetime, at list prices")}${tile("As of", formatDay(stats.asOf), "refreshed from local logs")}</dl>`
    + `<h3>Claude Code vs Codex</h3>${bar(tools.map(([name, usage, className]) => ({ share: share(usage.tokens.total), className, title: `${name}: ${percent(share(usage.tokens.total))}` })))}<ul class="burner-tools">${toolList}</ul>`
    + `<h3>By model</h3><ul class="burner-models">${models}</ul>${dailyChart(stats)}</section>`;
}

export function projectsBody(repos: RepoSummary[], stats: TokenStats | null = null): string {
  const projects = repos.filter((repo) => repo.name.toLowerCase() !== repo.owner.toLowerCase()).map(presentProject).filter((repo) => repo.description).sort((a, b) => b.pushedAt.localeCompare(a.pushedAt));
  const rows = projects.map((repo) => {
    const demo = repo.homepage && /^https?:\/\//i.test(repo.homepage) ? ` &middot; <a href="${esc(repo.homepage)}" ${external}>demo</a>` : "";
    const date = repo.pushedAt.slice(0, 10);
    return `<tr><td><a href="${esc(repo.htmlUrl)}" ${external}>${esc(repo.name)}</a>${demo}</td><td>${esc(repo.description!)}</td><td>${repo.language ? esc(repo.language) : "&mdash;"}</td><td>${esc(String(repo.stars))}</td><td><time datetime="${esc(repo.pushedAt)}">${esc(date)}</time></td></tr>`;
  }).join("");
  return `<h1>Projects</h1><p>Products, developer tools, and the engineering behind them.</p>${tokenBurner(stats)}<h2>Repositories</h2><p>This list comes straight from my GitHub and refreshes every hour.</p>${projects.length ? `<div class="table-wrap"><table class="projects"><caption>Public repositories</caption><thead><tr><th scope="col">Project</th><th scope="col">What it is</th><th scope="col">Language</th><th scope="col">Stars</th><th scope="col">Updated</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="notice">The project list did not load. See all my work on <a href="${esc(GITHUB_HREF)}" ${external}>GitHub</a>.</p>`}<p>More on <a href="${esc(GITHUB_HREF)}" ${external}>github.com/LLRHook</a>.</p>`;
}

export function offTheClockBody(): string {
  const interests = [
    ["Climbing", "Rock climbing is my regular break from the screen."],
    ["Cards", "I collect Pokémon cards and open packs with friends. Some Magic: The Gathering too."],
    ["Wings", "Buffalo Wild Wings after a long week."],
    ["Travel", "Most recently Peru, in September 2026."],
    ["Side projects", "Agentic workflows, deployment automation, and small developer tools."],
    ["Reading", "Pierce Brown’s Red Rising trilogy."],
  ];
  return `<h1>Off the clock</h1>${paragraph("What I do when I'm not working.")}<dl class="interests">${interests.map(([heading, text], index) => `<dt>${esc(heading)}</dt><dd>${esc(text)}${index === 3 ? '<p><img loading="lazy" decoding="async" src="/peru-travel.webp" alt="Mountains and a river in Peru" width="320" height="240"></p>' : ""}</dd>`).join("")}</dl>`;
}

export function contactBody(): string {
  return `<h1>Contact</h1><p class="big">Let's make something <em>good.</em></p>${paragraph("Have a project in mind, a question about my work, or a particularly good climbing route?")}<p>&#9993; <a href="${esc(EMAIL_HREF)}">victor.n.ivanov@gmail.com</a></p><ul><li><a href="${esc(GITHUB_HREF)}" ${profile}>GitHub</a></li><li><a href="${esc(SOCIAL_BY_ICON.linkedin.href)}" ${profile}>LinkedIn</a></li></ul><p>Virginia &middot; Eastern time</p><p>Or <a href="mailto:victor.n.ivanov@gmail.com?subject=Guestbook">sign my guestbook</a> by email.</p>`;
}

export function notFoundBody(): string {
  return '<h1>404: Page Not Found</h1><p>This page has moved, or it never existed.</p><p><a href="/">Back to the home page</a></p>';
}

export function resumeBody(): string {
  return `<h1>Resume</h1><p><a href="/Victor_Ivanov_Resume.pdf" download>Download resume (PDF)</a></p>      <h2>${esc("Victor Ivanov")}</h2>
      <p>${esc("Senior Full-Stack Engineer")}</p>
      <p>${esc("\n        Sterling, Virginia · U.S. Citizen · Active DoD Secret clearance · ")}<a href="${esc(EMAIL_HREF)}">${esc("victor.n.ivanov@gmail.com")}</a><br />
        <a href="https://victorivanov.engineer" target="_blank" rel="noopener noreferrer">${esc("victorivanov.engineer")}</a>${esc(" · ")}<a href="${esc(GITHUB_HREF)}" rel="me">${esc("github.com/LLRHook")}</a>${esc(" · ")}<a href="${esc(SOCIAL_BY_ICON.linkedin.href)}" rel="me">${esc("LinkedIn")}</a>
      </p>
      <p>${esc("Secret-cleared, backend-leaning full-stack engineer with 4+ years shipping high-stakes certification SaaS. Owned a React/Spring Boot scheduling workflow end to end, carried a billing hotfix through live production validation, and built Next.js analytics and quiz experiences with explicit async, accessibility, and security controls. Open to on-site and hybrid roles and customer travel.")}</p>
      <h2>${esc("Experience")}</h2>
      <article>
        <h3>${esc("Senior Backend Engineer")}</h3><p class="when">${esc("May 2024 – present")}<br>${esc("Paradigm Testing · Remote")}</p>
        <ul>
          <li>${esc("Lead architecture, priorities, and production readiness for three engineers across four certification SaaS products.")}</li>
          <li>${esc("Owned a React/Spring Boot written-exam scheduling workflow end to end: create/edit wizards, dirty state, an ADA accommodation picker, structured 409 conflict handling, tenant-scoped CRUD, and 10 dedicated test files/classes.")}</li>
          <li>${esc("Owned a billing hotfix from root cause through protected production deployment; live reconciliation corrected an undercharge and restored accurate invoicing across a large document batch.")}</li>
          <li>${esc("Diagnosed a three-month multithreaded AWS file-lock failure; cut errors from 80% to near-zero for 10 organizations.")}</li>
          <li>${esc("Led a monolith-to-microservices rewrite into five Spring Boot 3 services for oral/written exams, plagiarism detection, AI proctoring, and results review; the MVP serves production traffic.")}</li>
          <li>${esc("Architected secure real-time exam video delivery with WebSockets/STOMP, direct-to-S3 uploads, JWT role controls, audit logs, and Valkey-backed refresh tokens.")}</li>
          <li>${esc("Partnered with a proctoring vendor and InfoSec to integrate proctoring across oral and written exam flows; authored cross-role acceptance steps and completed validation.")}</li>
          <li>${esc("Built merge-gated CI/CD and 550+ automated tests from zero; containerized Playwright auth, admin CRUD, and impersonation flows in Bitbucket Pipelines, supporting six releases without covered-workflow regressions.")}</li>
          <li>${esc("Turned live V&V and demo findings into a fail-closed, 10-stage pilot gate spanning tenant onboarding, candidate disconnect/resume, scoring, and audit reconstruction; exposed an answer-key leak before go-live.")}</li>
        </ul>
      </article>
      <article>
        <h3>${esc("Software Developer")}</h3><p class="when">${esc("June 2022 – May 2024")}<br>${esc("Paradigm Testing · Maryland")}</p>
        <ul><li>${esc("Built a high-stakes oral-exam platform serving 4,800+ candidates annually; led JPA adoption across 73 entities and eliminated peak-load waiting-room errors at 200+ concurrent sessions.")}</li></ul>
      </article>
      <article>
        <h3>${esc("Full-Stack Engineering Practicum")}</h3><p class="when">${esc("July – August 2026")}<br>${esc("Revature")}</p>
        <ul>
          <li>${esc("Delivered 63 merged pull requests in 22 days, including a Next.js trainer analytics dashboard with server-driven filters/paging, an accessible table equivalent for SVG analytics, independent async states, retry UX, and 27 Vitest cases.")}</li>
          <li>${esc("Rebuilt the quiz flow as a server-rendered Next.js route backed by FastAPI sessions: one request per question, zero-request history navigation, ownership-checked resume, token redaction, and Playwright E2E through nginx.")}</li>
        </ul>
      </article>
      <h2>${esc("Selected projects")}</h2>
      <article>
        <h3><a href="https://github.com/LLRHook/mailit" target="_blank" rel="noopener noreferrer">${esc("MailIt")}</a></h3>
        <p>${esc("Go, Next.js 16, PostgreSQL, Redis, Docker/Kubernetes")}</p>
        <ul><li>${esc("REST APIs, async workers, inbound SMTP, and a Next.js dashboard; direct MX delivery, DKIM, replay-safe sends, signed webhooks, multi-arch releases, and 523 tests.")}</li></ul>
      </article>
      <article>
        <h3><a href="https://github.com/LLRHook/citybase" target="_blank" rel="noopener noreferrer">${esc("Citybase")}</a></h3>
        <p>${esc("Electron, React, Node.js")}</p>
        <ul><li>${esc("Desktop IDE mapping repositories into an isometric city and dispatching Claude/Codex through typed IPC; streamed, cancellable runs, persisted history, guarded Git operations, and 393 tests.")}</li></ul>
      </article>
      <article>
        <h3><a href="https://github.com/LLRHook/fix-youtube" target="_blank" rel="noopener noreferrer">${esc("Fix YouTube")}</a></h3>
        <p>${esc("JavaScript, Manifest V3")}</p>
        <ul><li>${esc("Zero-dependency extension for SPA-aware Shorts redirects, feed filters, focus timers, watch history, and settings import/export; cross-browser CI and 15 tests.")}</li></ul>
      </article>
      <h2>${esc("Education")}</h2>
      <div><div><h3>${esc("Georgia Institute of Technology")}</h3><p>${esc("M.S. Computer Science, Systems & Architecture (online)")}</p></div><span>${esc("Expected December 2027")}</span></div>
      <div><div><h3>${esc("University of Maryland, Baltimore County")}</h3><p>${esc("B.S. Computer Science")}</p></div></div>
      <h2>${esc("Technical skills")}</h2>
      <p><strong>${esc("Frontend:")}</strong>${esc(" TypeScript/JavaScript, React, Next.js 16, Vite, HTML/CSS, React Query, Playwright, Vitest")}</p>
      <p><strong>${esc("Backend:")}</strong>${esc(" Java 21, Spring Boot 3, Spring Security, JPA/Hibernate, Python, FastAPI, Go, REST, WebSockets/STOMP")}</p>
      <p><strong>${esc("Data & cloud:")}</strong>${esc(" PostgreSQL, MariaDB, Redis/Valkey, AWS (EC2, S3, RDS), Docker, Kubernetes/Helm")}</p>
      <p><strong>${esc("Delivery & security:")}</strong>${esc(" Bitbucket Pipelines, GitHub Actions, CI/CD, OAuth2/JWT, JUnit/Mockito, Testcontainers, Pytest")}</p>
      <p>${esc("Updated October 2026.")}</p>
`;
}
