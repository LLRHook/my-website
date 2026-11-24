import { EMAIL_HREF, GITHUB_HREF, SITE_NAME, SITE_URL, SKILLS, SOCIAL_BY_ICON } from "./constants";
import { esc, PAGES, personMicrodata } from "./html";
import { presentProject } from "./projectPresentation";
import type { TokenStats } from "./tokenStats";
import type { RepoSummary } from "./types";

const external = 'target="_blank" rel="noopener noreferrer"';
const profile = 'target="_blank" rel="me noopener noreferrer"';
const paragraph = (text: string) => `<p>${esc(text)}</p>`;
const extLink = (label: string, href: string) => `<a href="${esc(href)}" ${external}>${esc(label)}</a>`;
const portrait = '<img class="portrait" decoding="async" fetchpriority="high" src="/victor-profile.jpg" width="120" height="120" alt="Victor\'s illustrated GitHub profile portrait">';

export function homeBody(): string {
  const lines = ["who I am, what I work on, and my work and project history", "everything public on my GitHub, updated hourly", "experience, projects and education (PDF too)", "climbing, cards, books and travel", "email, GitHub and LinkedIn"];
  const updates = [
    `<span class="new">NEW!</span> November 2026: porting hot-path cores across personal tools and apps to Rust, expanding TCG fulfillment and marketplace automation, and adding a full <a href="/about#history">work and project history</a>.`,
    `October 2026: joined SCCI as a Software Developer in Virginia alongside remote backend work at Paradigm Testing, rebuilt this site as a hand-written HTML and CSS home page (no JavaScript), and added the <a href="/projects#burner">Token burner</a>.`,
    `July to August 2026: completed the Revature Full-Stack Engineering Practicum, shipping Next.js analytics and FastAPI quiz workflows.`,
    `Early to mid 2026: built ${extLink("Linky", "https://github.com/LLRHook/linky")}, ${extLink("Citybase", "https://github.com/LLRHook/citybase")}, ${extLink("Appshot", "https://github.com/LLRHook/appshot")}, ${extLink("Retrocast", "https://github.com/LLRHook/retrocast")}, ${extLink("Fix YouTube", "https://github.com/LLRHook/fix-youtube")}, and coding-agent tooling while continuing graduate CS coursework at Georgia Tech.`,
    `2022 to present: building and leading multi-tenant certification SaaS platforms at Paradigm Testing.`,
  ];
  return `<h1>Welcome to Victor Ivanov's Home Page!</h1>${portrait}${paragraph("Hi, I'm Victor, a Senior Full-Stack Engineer in Virginia. I build certification software, web products, developer tools, and Rust utilities across the stack.")}
<div class="construction"><p><b>This page is always under construction.</b></p></div><h2>What's New</h2><ul>${updates.map((item) => `<li>${item}</li>`).join("")}</ul><h2>Start here</h2><ul>${PAGES.slice(1).map((item, index) => `<li><a href="${esc(item.path)}">${esc(item.label)}</a>: ${esc(lines[index])}</li>`).join("")}</ul>
<div itemscope itemtype="https://schema.org/WebSite"><meta itemprop="name" content="${esc(SITE_NAME)}"><link itemprop="url" href="${esc(SITE_URL)}/"></div>${personMicrodata()}`;
}

const WORK_HISTORY: readonly [string, readonly string[]][] = [
  [
    "October to November 2026",
    [
      "Started as a Software Developer at SCCI (Southeastern Computer Consultants, Inc.) in Virginia while continuing remote architecture and backend engineering at Paradigm Testing.",
      `Focused on porting performance-sensitive cores in personal tools and apps to Rust, including native modules for ${extLink("Linky", "https://github.com/LLRHook/linky")}, ${extLink("Citybase", "https://github.com/LLRHook/citybase")}, ${extLink("Retrocast", "https://github.com/LLRHook/retrocast")}, and local coding-agent utilities, alongside ongoing work on ${extLink("Billington", "https://github.com/LLRHook/checksinmyhead")} and ${extLink("Appshot", "https://github.com/LLRHook/appshot")}.`,
      `Built trading-card fulfillment and marketplace automation tooling, including a Chrome extension and print helpers for packing slips and 4x6 thermal labels (${extLink("tcg-order-printer", "https://github.com/LLRHook/tcg-order-printer")}), catalog software, and automated inventory and price synchronization.`,
      `Rebuilt this site as a zero-JavaScript HTML and CSS home page and added the <a href="/projects#burner">Token burner</a> panel.`,
    ],
  ],
  [
    "July to August 2026",
    [
      "Completed the Revature Full-Stack Engineering Practicum, shipping 63 merged pull requests in 22 days across a server-driven Next.js trainer analytics dashboard and a Next.js/FastAPI quiz flow with Playwright E2E coverage.",
    ],
  ],
  [
    "Early to mid 2026",
    [
      `Built a wave of web products, browser extensions, and coding-agent developer tools in TypeScript, Go, Python, and Swift: ${extLink("Linky", "https://github.com/LLRHook/linky")} (hosted Discord social link-preview and translation bot at ${extLink("linkybot.dev", "https://linkybot.dev")}), ${extLink("Citybase", "https://github.com/LLRHook/citybase")} (isometric repo IDE that dispatches coding agents), ${extLink("Appshot", "https://github.com/LLRHook/appshot")} (local-first App Store screenshot studio), ${extLink("Retrocast", "https://github.com/LLRHook/retrocast")} (Go and WebSockets real-time chat), ${extLink("Fix YouTube", "https://github.com/LLRHook/fix-youtube")} (Manifest V3 browser extension), and agent usage utilities (${extLink("usage-widget", "https://github.com/LLRHook/usage-widget")}, ${extLink("claude-statusline", "https://github.com/LLRHook/claude-statusline")}, ${extLink("claude-usage-visualizer", "https://github.com/LLRHook/claude-usage-visualizer")}).`,
      "Began graduate coursework in Georgia Tech's online M.S. in Computer Science (Artificial Intelligence track).",
    ],
  ],
  [
    "2025",
    [
      `Started building ${extLink("Billington", "https://github.com/LLRHook/checksinmyhead")}, a group expense-splitting platform with shared tabs, receipt scanning, and settlement tracking across Flutter, Next.js, Go, and PostgreSQL, along with smaller browser utilities including a client-side image-to-PDF Chrome extension.`,
    ],
  ],
  [
    "May 2024 to present",
    [
      "Senior Backend Engineer at Paradigm Testing (remote), leading architecture, priorities, and production readiness for three engineers across four certification SaaS products: monolith-to-microservices rewrite into five Spring Boot 3 services, real-time WebSocket/STOMP exam video delivery, React and Spring Boot scheduling workflows, and merge-gated CI/CD with 550+ automated tests.",
    ],
  ],
  [
    "June 2022 to May 2024",
    [
      "Software Developer at Paradigm Testing (Maryland), building a high-stakes oral-exam platform serving 4,800+ candidates annually, leading JPA adoption across 73 entities, and eliminating waiting-room errors at 200+ concurrent sessions.",
    ],
  ],
  [
    "2019 to May 2024",
    [
      "Earned a B.S. in Computer Science at the University of Maryland, Baltimore County (UMBC).",
    ],
  ],
];

export function aboutBody(): string {
  const history = WORK_HISTORY.map(([period, items]) => `<dt>${esc(period)}</dt><dd><ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul></dd>`).join("");
  return `<h1>About Me</h1>${portrait}${paragraph("Hi, I'm Victor. A Senior Full-Stack Engineer with a habit of building useful things.")}
${paragraph("Based in Virginia · Active DoD Secret clearance")}
${paragraph("Professionally, I work as a Software Developer at SCCI in Virginia and as a Senior Backend Engineer at Paradigm Testing (remote), building multi-tenant certification software, APIs, and real-time exam workflows.")}
${paragraph("Most days, I work with Java, Spring Boot, React, TypeScript, and PostgreSQL. Outside of work, I build products and developer tools in Go, Rust, Python, and TypeScript, with a focus on agentic development workflows.")}
${paragraph("I earned a B.S. in Computer Science at UMBC (2019 to May 2024) and I am pursuing an online M.S. in Computer Science (Artificial Intelligence track) at Georgia Tech.")}
<blockquote>Build fast. Always test.<br><small>A good test suite is part of the work.</small></blockquote><section aria-labelledby="history"><h2 id="history">Work and project history</h2><dl class="history">${history}</dl></section><h2>Tools I use</h2><ul class="columns">${SKILLS.map((skill) => `<li>${esc(skill)}</li>`).join("")}</ul>
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
    + `<details><summary>Daily numbers as a table</summary><div class="table-wrap" role="region" aria-labelledby="daily-caption" tabindex="0"><table class="projects"><caption id="daily-caption">Tokens per day</caption><thead><tr><th scope="col">Day</th><th scope="col">Tokens</th><th scope="col">API-equivalent cost</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
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
    + `<p>How many tokens AI coding agents (Claude Code and Codex) have burned on my machine, counted from my local logs. Costs are what the same usage would cost at API list prices (${esc(formatDay(stats.pricesAsOf))}); most tokens are cheap cache reads.</p>`
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
  return `<h1>Projects</h1><p>Products, developer tools, and the engineering behind them.</p>${tokenBurner(stats)}<h2>Repositories</h2><p>This list comes straight from my GitHub and refreshes every hour.</p>${projects.length ? `<div class="table-wrap" role="region" aria-labelledby="repositories-caption" tabindex="0"><table class="projects"><caption id="repositories-caption">Public repositories</caption><thead><tr><th scope="col">Project</th><th scope="col">What it is</th><th scope="col">Language</th><th scope="col">Stars</th><th scope="col">Updated</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="notice">The project list did not load. See all my work on <a href="${esc(GITHUB_HREF)}" ${external}>GitHub</a>.</p>`}<p>More on <a href="${esc(GITHUB_HREF)}" ${external}>github.com/LLRHook</a>.</p>`;
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
  return `<h1>Resume</h1><p class="pdf-link"><a href="/Victor_Ivanov_Resume.pdf" download>Download resume (PDF)</a></p>      <h2>${esc("Victor Ivanov")}</h2>
      <p>${esc("Senior Full-Stack Engineer")}</p>
      <p>${esc("\n        Virginia · U.S. Citizen · Active DoD Secret clearance · ")}<a href="${esc(EMAIL_HREF)}">${esc("victor.n.ivanov@gmail.com")}</a><br />
        <a href="https://victorivanov.engineer" target="_blank" rel="noopener noreferrer">${esc("victorivanov.engineer")}</a>${esc(" · ")}<a href="${esc(GITHUB_HREF)}" rel="me">${esc("github.com/LLRHook")}</a>${esc(" · ")}<a href="${esc(SOCIAL_BY_ICON.linkedin.href)}" rel="me">${esc("LinkedIn")}</a>
      </p>
      <p>${esc("Secret-cleared, backend-leaning full-stack engineer with 4+ years shipping high-stakes certification SaaS. Owned a React/Spring Boot scheduling workflow end to end, carried a billing hotfix through live production validation, and built Next.js analytics and quiz experiences with explicit async, accessibility, and security controls. Open to on-site and hybrid roles and customer travel.")}</p>
      <h2>${esc("Experience")}</h2>
      <article>
        <h3>${esc("Software Developer")}</h3><p class="when">${esc("October 2026 – present")}<br>${esc("SCCI (Southeastern Computer Consultants, Inc.) · Virginia")}</p>
        <ul>
          <li>${esc("Software development and engineering delivery in Virginia.")}</li>
        </ul>
      </article>
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
        <h3><a href="https://github.com/LLRHook/linky" target="_blank" rel="noopener noreferrer">${esc("Linky")}</a></h3>
        <p>${esc("TypeScript, Rust, Discord API")}</p>
        <ul><li>${esc("Hosted Discord bot (linkybot.dev) fixing social link previews across X, Instagram, TikTok, Bluesky, Reddit, and articles, with tweet and caption translation and native Rust tooling.")}</li></ul>
      </article>
      <article>
        <h3><a href="https://github.com/LLRHook/checksinmyhead" target="_blank" rel="noopener noreferrer">${esc("Billington")}</a></h3>
        <p>${esc("Flutter, Next.js, Go, PostgreSQL")}</p>
        <ul><li>${esc("Group expense-splitting platform with shared tabs, receipt scanning, multi-currency support, and settlement tracking across mobile, web, and Go services.")}</li></ul>
      </article>
      <article>
        <h3><a href="https://github.com/LLRHook/citybase" target="_blank" rel="noopener noreferrer">${esc("Citybase")}</a></h3>
        <p>${esc("Electron, React, Node.js, Rust")}</p>
        <ul><li>${esc("Desktop IDE mapping repositories into an isometric city and dispatching Claude/Codex through typed IPC; streamed, cancellable runs, persisted history, guarded Git operations, and native snapshot processing.")}</li></ul>
      </article>
      <article>
        <h3><a href="https://github.com/LLRHook/fix-youtube" target="_blank" rel="noopener noreferrer">${esc("Fix YouTube")}</a></h3>
        <p>${esc("JavaScript, Manifest V3")}</p>
        <ul><li>${esc("Zero-dependency extension for SPA-aware Shorts redirects, feed filters, focus timers, watch history, and settings import/export with cross-browser CI.")}</li></ul>
      </article>
      <h2>${esc("Education")}</h2>
      <div><div><h3>${esc("Georgia Institute of Technology")}</h3><p>${esc("M.S. Computer Science, Artificial Intelligence (online)")}</p></div><span>${esc("In progress")}</span></div>
      <div><div><h3>${esc("University of Maryland, Baltimore County")}</h3><p>${esc("B.S. Computer Science")}</p></div><span>${esc("2019 – 2024")}</span></div>
      <h2>${esc("Technical skills")}</h2>
      <p><strong>${esc("Frontend:")}</strong>${esc(" TypeScript/JavaScript, React, Next.js 16, Vite, HTML/CSS, React Query, Playwright, Vitest")}</p>
      <p><strong>${esc("Backend:")}</strong>${esc(" Java 21, Spring Boot 3, Spring Security, JPA/Hibernate, Python, FastAPI, Go, Rust, REST, WebSockets/STOMP")}</p>
      <p><strong>${esc("Data & cloud:")}</strong>${esc(" PostgreSQL, MariaDB, Redis/Valkey, AWS (EC2, S3, RDS), Docker, Kubernetes/Helm")}</p>
      <p><strong>${esc("Delivery & security:")}</strong>${esc(" Bitbucket Pipelines, GitHub Actions, CI/CD, OAuth2/JWT, JUnit/Mockito, Testcontainers, Pytest")}</p>
      <p>${esc("Updated November 2026.")}</p>
`;
}
