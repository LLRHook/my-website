import { CARDTRADER_SHOP_URL, EMAIL_HREF, GITHUB_HREF, SITE_NAME, SITE_URL, SOCIAL_BY_ICON, TCGPLAYER_SHOP_URL } from "./constants";
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
  const lines = ["who I am, what I work on, and my work and project history", "everything public on my GitHub, updated hourly", "experience, projects and education (PDF too)", "GoStopTCG singles on TCGplayer and CardTrader", "email, GitHub and LinkedIn"];
  const updates = [
    `<span class="new">NEW!</span> November 2026: added a dedicated <a href="/shop">TCG Shop</a> page for GoStopTCG, ported hot-path cores in personal tools to Rust, and added a full <a href="/about#history">work and project history</a>.`,
    `October 2026: joined SCCI as a Software Developer in Virginia, rebuilt this site as a hand-written HTML and CSS home page (no JavaScript), and added the <a href="/projects#burner">Token burner</a>.`,
    `July to August 2026: completed the Revature Full-Stack Engineering Practicum, shipping Next.js analytics and FastAPI quiz workflows.`,
    `Early to mid 2026: built ${extLink("Linky", "https://github.com/LLRHook/linky")}, ${extLink("Citybase", "https://github.com/LLRHook/citybase")}, ${extLink("Appshot", "https://github.com/LLRHook/appshot")}, ${extLink("Retrocast", "https://github.com/LLRHook/retrocast")}, ${extLink("Fix YouTube", "https://github.com/LLRHook/fix-youtube")}, and coding-agent tooling while continuing graduate CS coursework at Georgia Tech.`,
    `2022 to October 2026: built and led multi-tenant certification SaaS platforms at Paradigm Testing.`,
  ];
  return `<h1>Welcome to Victor Ivanov's Home Page!</h1>${portrait}${paragraph("Hi, I'm Victor, a Senior Full-Stack Engineer in Virginia. I build certification software, web products, developer tools, and Rust utilities across the stack.")}
<div class="construction"><p><b>This page is always under construction.</b></p></div><h2>What's New</h2><ul>${updates.map((item) => `<li>${item}</li>`).join("")}</ul><h2>Start here</h2><ul>${PAGES.slice(1).map((item, index) => `<li><a href="${esc(item.path)}">${esc(item.label)}</a>: ${esc(lines[index])}</li>`).join("")}</ul>
<div itemscope itemtype="https://schema.org/WebSite"><meta itemprop="name" content="${esc(SITE_NAME)}"><link itemprop="url" href="${esc(SITE_URL)}/"></div>${personMicrodata()}`;
}

const WORK_HISTORY: readonly [string, readonly string[]][] = [
  [
    "October to November 2026",
    [
      "Joined SCCI (Southeastern Computer Consultants, Inc.) as a Software Developer in Virginia.",
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
    "May 2024 to October 2026",
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
${paragraph("Professionally, I work as a Software Developer at SCCI in Virginia. Previously, I spent over four years at Paradigm Testing building and leading multi-tenant certification software, APIs, and real-time exam workflows.")}
${paragraph("Most days, I work with Java, Spring Boot, React, TypeScript, and PostgreSQL. Outside of work, I build products and developer tools in Go, Rust, Python, and TypeScript, with a focus on agentic development workflows.")}
${paragraph("I earned a B.S. in Computer Science at UMBC (2019 to May 2024) and I am pursuing an online M.S. in Computer Science (Artificial Intelligence track) at Georgia Tech.")}
<blockquote>Build fast. Always test.<br><small>A good test suite is part of the work.</small></blockquote><section aria-labelledby="history"><h2 id="history">Work and project history</h2><dl class="history">${history}</dl></section><p><a href="/projects">See what I'm building &raquo;</a></p>
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

export function shopBody(): string {
  const shops = [
    [
      "tcg-tcgplayer",
      TCGPLAYER_SHOP_URL,
      "TCGplayer",
      "gostoptcg · browse live US singles on tcgplayer.com",
    ],
    [
      "tcg-cardtrader",
      CARDTRADER_SHOP_URL,
      "CardTrader",
      "Gostop TCG · US and international listings on cardtrader.com",
    ],
  ] as const;
  const shopLinks = shops.map(([modifier, href, name, meta]) =>
    `<li><a class="tcg-link ${modifier}" href="${esc(href)}" ${external}><span class="tcg-name">${esc(name)} &raquo;</span><span class="tcg-meta">${esc(meta)}</span></a></li>`).join("");
  const games = [
    ["Pokémon TCG", "Modern and collector singles, ex/illustration pulls, reverse holos, and playable staples."],
    ["Magic: The Gathering", "Commander and constructed singles, foils, tokens, and set staples."],
    ["One Piece Card Game", "Foil and non-foil singles across current sets."],
    ["Riftbound", "Origins, Spiritforged, and Unleashed rares, foils, and deck staples."],
    ["Other TCGs", "Additional singles listed as new lots and collections are processed."],
  ];
  const gameRows = games.map(([game, notes]) => `<tr><td><b>${esc(game)}</b></td><td>${esc(notes)}</td></tr>`).join("");
  return `<h1>GoStopTCG Shop</h1>`
    + `${paragraph("Outside of day-job engineering, I help run GoStopTCG, an online trading-card shop listing thousands of singles across TCGplayer and CardTrader.")}`
    + `<section class="tcg-shop" aria-labelledby="storefronts"><h2 id="storefronts">Shop Storefronts</h2>`
    + `${paragraph("Browse live inventory, current market prices, shipping options, and checkout directly on either marketplace:")}`
    + `<ul class="tcg-links">${shopLinks}</ul></section>`
    + `<h2>Games &amp; Catalog</h2><div class="table-wrap" role="region" aria-labelledby="games-caption" tabindex="0"><table class="projects"><caption id="games-caption">Games stocked at GoStopTCG</caption><thead><tr><th scope="col">Game</th><th scope="col">What you'll find</th></tr></thead><tbody>${gameRows}</tbody></table></div>`
    + `<h2>How Orders Work</h2><ul>`
    + `<li><b>Direct marketplace checkout:</b> Live quantities, pricing, buyer protection, and order messaging all run directly through TCGplayer and CardTrader.</li>`
    + `<li><b>Synchronized stock and pricing:</b> Automated multi-channel checks run every few minutes to keep inventory counts and market pricing aligned across marketplaces.</li>`
    + `<li><b>Packed for collectors:</b> Singles are inspected, sleeved, and protected for standard letter or tracked package shipment.</li></ul>`
    + `<h2>Shop Tooling</h2><p>Running an online card shop has also inspired open-source fulfillment tools, including ${extLink("tcg-order-printer", "https://github.com/LLRHook/tcg-order-printer")} (a Chrome extension for one-click TCGplayer packing slips and 4x6 thermal labels). See more on <a href="/projects">Projects &raquo;</a></p>`;
}

export function contactBody(): string {
  return `<h1>Contact</h1><p class="big">Let's make something <em>good.</em></p>${paragraph("Have a project in mind, a question about my work, or a question about the card shop?")}<p>&#9993; <a href="${esc(EMAIL_HREF)}">victor.n.ivanov@gmail.com</a></p><ul><li><a href="${esc(GITHUB_HREF)}" ${profile}>GitHub</a></li><li><a href="${esc(SOCIAL_BY_ICON.linkedin.href)}" ${profile}>LinkedIn</a></li></ul><p>Virginia &middot; Eastern time</p><p>Or <a href="mailto:victor.n.ivanov@gmail.com?subject=Guestbook">sign my guestbook</a> by email.</p>`;
}

export function notFoundBody(): string {
  return '<h1>404: Page Not Found</h1><p>This page has moved, or it never existed.</p><p><a href="/">Back to the home page</a></p>';
}

// Mirrors public/Victor_Ivanov_Resume.pdf, the public copy of the owner's resume
// (VI_Resume_Public from the owner's build_resume.py): same sections, header lines
// and bullets. The public copy omits the phone number and internal product names.
const RESUME_SKILLS: readonly (readonly [string, string])[] = [
  ["Frontend", "TypeScript/JavaScript, React, Next.js 16, Vite, HTML/CSS, React Query, Playwright, Vitest"],
  ["Backend", "Java 21, Spring Boot 3, Spring Security, JPA/Hibernate, Python, FastAPI, Go, REST, WebSockets/STOMP"],
  ["Data & cloud", "PostgreSQL, MariaDB, Redis/Valkey, AWS (EC2, S3, RDS), Docker, Kubernetes/Helm"],
  ["Delivery & security", "Bitbucket Pipelines, GitHub Actions, CI/CD, OAuth2/JWT, JUnit/Mockito, Testcontainers, Pytest"],
];

const RESUME_JOBS: readonly (readonly [string, readonly string[]])[] = [
  ["Software Developer | Southeastern Computer Consultants, Inc. (SCCI) | Dahlgren, VA | Oct 2026–Present", [
    "Design, develop, integrate, test, and deploy software for a DoD program on a Secret-cleared Agile engineering team.",
    "Contribute to system design; write and run test cases, analyze test data, debug anomalies, and document results.",
  ]],
  ["Senior Backend Engineer | Paradigm Testing | Remote | May 2024–Oct 2026", [
    "Led architecture, priorities, and production readiness for three engineers across four certification SaaS products.",
    "Owned a React/Spring Boot written-exam scheduling workflow end to end: create/edit wizards, dirty state, an ADA accommodation picker, structured 409 conflict handling, tenant-scoped CRUD, and 10 dedicated test files/classes.",
    "Owned a billing hotfix from root cause through protected production deployment; live reconciliation corrected an undercharge and restored accurate invoicing across a large document batch.",
    "Diagnosed a three-month multithreaded AWS file-lock failure; cut errors from 80% to near-zero for 10 organizations.",
    "Led a monolith-to-microservices rewrite into five Spring Boot 3 services for oral/written exams, plagiarism detection, AI proctoring, and results review; the MVP serves production traffic.",
    "Architected secure real-time exam video delivery with WebSockets/STOMP, direct-to-S3 uploads, JWT role controls, audit logs, and Valkey-backed refresh tokens.",
    "Built merge-gated CI/CD and 550+ automated tests from zero; containerized Playwright auth, admin CRUD, and impersonation flows in Bitbucket Pipelines, supporting six releases without covered-workflow regressions.",
    "Turned live V&V and demo findings into a fail-closed, 10-stage pilot gate spanning tenant onboarding, candidate disconnect/resume, scoring, and audit reconstruction; exposed an answer-key leak before go-live.",
  ]],
  ["Software Developer | Paradigm Testing | Maryland | Jun 2022–May 2024", [
    "Built a high-stakes oral-exam platform serving 4,800+ candidates annually; led JPA adoption across 73 entities and eliminated peak-load waiting-room errors at 200+ concurrent sessions.",
  ]],
];

const RESUME_PRACTICUM: readonly [string, readonly string[]] = ["Revature | Full-Stack Engineering Practicum | Jul–Aug 2026", [
  "Delivered 63 merged pull requests in 22 days, including a Next.js trainer analytics dashboard with server-driven filters/paging, an accessible table equivalent for SVG analytics, independent async states, retry UX, and 27 Vitest cases.",
  "Rebuilt the quiz flow as a server-rendered Next.js route backed by FastAPI sessions: one request per question, zero-request history navigation, ownership-checked resume, token redaction, and Playwright E2E through nginx.",
]];

const RESUME_PROJECTS: readonly (readonly [string, string, string, string])[] = [
  ["Linky", "https://github.com/LLRHook/linky", "TypeScript, Rust, Discord API", "Hosted Discord bot (linkybot.dev) fixing social link previews across X, Instagram, TikTok, Bluesky, Reddit, and articles, with tweet and caption translation and native Rust tooling."],
  ["Billington", "https://github.com/LLRHook/checksinmyhead", "Flutter, Next.js, Go, PostgreSQL", "Group expense-splitting platform with shared tabs, receipt scanning, multi-currency support, and settlement tracking across mobile, web, and Go services."],
  ["Citybase", "https://github.com/LLRHook/citybase", "Electron, React, Node.js, Git, Vitest", "Desktop IDE mapping repositories into an isometric city and dispatching Claude/Codex through typed IPC; streamed, cancellable runs, persisted history, guarded Git operations, and 393 tests."],
  ["Fix YouTube", "https://github.com/LLRHook/fix-youtube", "JavaScript, Manifest V3, Chrome/Firefox", "Zero-dependency extension for SPA-aware Shorts redirects, feed filters, focus timers, watch history, and settings import/export; validated settings, cross-browser CI, and 15 tests."],
];

const RESUME_EDUCATION: readonly (readonly [string, string])[] = [
  ["Georgia Institute of Technology", "M.S. Computer Science, Artificial Intelligence (online; in progress)"],
  ["University of Maryland, Baltimore County", "B.S. Computer Science"],
];

export function resumeBody(): string {
  const bar = "&nbsp;&nbsp;|&nbsp; "; // lines wrap only after a bar, never before one
  const place = (text: string) => esc(text).replace(/, VA\b/g, ",&nbsp;VA"); // never split "Sterling, VA"
  const job = ([header, bullets]: readonly [string, readonly string[]]) => {
    const split = header.lastIndexOf(" | ");
    return `<h4 class="job">${place(header.slice(0, split + 3))}<span class="dates">${esc(header.slice(split + 3))}</span></h4><ul>${bullets.map((bullet) => `<li>${esc(bullet)}</li>`).join("")}</ul>`;
  };
  const contact = [
    `<a href="${esc(EMAIL_HREF)}">victor.n.ivanov@gmail.com</a>`,
    `<a href="${esc(SOCIAL_BY_ICON.linkedin.href)}" rel="me">LinkedIn</a>`,
    `<a href="${esc(GITHUB_HREF)}" rel="me">GitHub</a>`,
    `<a href="${esc(SITE_URL)}/">victorivanov.engineer</a>`,
  ].join(bar);
  return `<h1>Resume</h1><p class="pdf-link"><a href="/Victor_Ivanov_Resume.pdf" download>Download resume (PDF)</a> &middot; Updated November 2026.</p>`
    + `<article class="sheet" aria-label="Resume of Victor Ivanov">`
    + `<h2 class="name">VICTOR IVANOV</h2>`
    + `<p class="contact">${contact}</p>`
    + `<p class="contact">${["U.S. Citizen", "Active DoD Secret Clearance", "Sterling, VA", "Open to on-site/hybrid work and customer travel"].map(place).join(bar)}</p>`
    + `<p class="summary">${esc("Secret-cleared, backend-leaning full-stack engineer with 4+ years shipping high-stakes certification SaaS. Owned a React/Spring Boot scheduling workflow end to end, carried a billing hotfix through live production validation, and built Next.js analytics and quiz experiences with explicit async, accessibility, and security controls.")}</p>`
    + `<h3>TECHNICAL SKILLS</h3>${RESUME_SKILLS.map(([label, value]) => `<p class="skill"><b>${esc(label)}:</b> ${esc(value)}</p>`).join("")}`
    + `<h3>EXPERIENCE</h3>${RESUME_JOBS.map(job).join("")}`
    + `<h3>FULL-STACK ENGINEERING PRACTICUM</h3>${job(RESUME_PRACTICUM)}`
    + `<h3>SELECTED PROJECTS</h3>${RESUME_PROJECTS.map(([name, href, stack, text]) => `<p class="proj"><a href="${esc(href)}">${esc(name)}</a><b> | ${esc(stack)}:</b> ${esc(text)}</p>`).join("")}`
    + `<h3>EDUCATION</h3>${RESUME_EDUCATION.map(([school, degree]) => `<p class="edu"><b>${esc(school)}</b> | ${esc(degree)}</p>`).join("")}`
    + `</article>`;
}
