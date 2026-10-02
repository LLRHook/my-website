import { EMAIL_HREF, GITHUB_HREF, SITE_NAME, SITE_URL, SKILLS, SOCIAL_BY_ICON } from "./constants";
import { esc, PAGES, personMicrodata } from "./html";
import { presentProject } from "./projectPresentation";
import type { RepoSummary } from "./types";

const external = 'target="_blank" rel="noopener noreferrer"';
const profile = 'target="_blank" rel="me noopener noreferrer"';
const paragraph = (text: string) => `<p>${esc(text)}</p>`;
const portrait = '<img class="portrait" src="/victor-profile.jpg" width="120" height="120" alt="Victor\'s illustrated GitHub profile portrait">';

export function homeBody(): string {
  const lines = ["who I am and what I work on", "everything public on my GitHub, updated hourly", "experience, projects and education (PDF too)", "climbing, cards, books and travel", "email, GitHub and LinkedIn"];
  return `<h1>Welcome to Victor Ivanov's Home Page!</h1>${portrait}${paragraph("Hi, I'm Victor, a Senior Full-Stack Engineer in Sterling, Virginia. I build web products and developer tools, work across the stack, and climb rocks.")}
<div class="construction"><p><b>This page is always under construction.</b></p></div><h2>What's New</h2><ul><li><span class="new">NEW!</span> October 2026: the site is now a hand-written HTML and CSS home page. No JavaScript.</li><li>September 2026: resume updated.</li></ul><h2>Start here</h2><ul>${PAGES.slice(1).map((item, index) => `<li><a href="${esc(item.path)}">${esc(item.label)}</a>: ${esc(lines[index])}</li>`).join("")}</ul>
<div itemscope itemtype="https://schema.org/WebSite"><meta itemprop="name" content="${esc(SITE_NAME)}"><link itemprop="url" href="${esc(SITE_URL)}/"></div>${personMicrodata()}`;
}

export function aboutBody(): string {
  return `<h1>About Me</h1>${portrait}${paragraph("Hi, I'm Victor. A Senior Full-Stack Engineer with a habit of building useful things.")}
${paragraph("Based in Sterling, Virginia · DoD Secret eligibility (DCSA 2026)")}
${paragraph("I work on certification software at Paradigm Testing. That means APIs, multi-tenant systems, real-time exam workflows, and getting the details right before they reach production.")}
${paragraph("Most days, I work with Java, Spring Boot, React, and PostgreSQL. Outside of that, I build tools in Go and TypeScript and spend a lot of time exploring agentic development workflows.")}
${paragraph("I studied computer science at UMBC and I'm pursuing an M.S. in Computer Science at Georgia Tech, expected December 2027. Away from the desk, you'll usually find me climbing or thinking about the next project.")}
<blockquote>Build fast. Always test.<br><small>A good test suite is part of the work.</small></blockquote><h2>Tools I use</h2><ul class="columns">${[...SKILLS, "Go"].map((skill) => `<li>${esc(skill)}</li>`).join("")}</ul>
<figure><img src="/conference-photo.jpg" alt="A moment at the conference podium" width="320" height="320"><figcaption>At the podium.</figcaption></figure><p><a href="/projects">See what I'm building &raquo;</a></p>
<div itemscope itemtype="https://schema.org/ProfilePage">${personMicrodata('itemprop="mainEntity"')}</div>`;
}

export function projectsBody(repos: RepoSummary[]): string {
  const projects = repos.filter((repo) => repo.name.toLowerCase() !== repo.owner.toLowerCase()).map(presentProject).filter((repo) => repo.description).sort((a, b) => b.pushedAt.localeCompare(a.pushedAt));
  const rows = projects.map((repo) => {
    const demo = repo.homepage && /^https?:\/\//i.test(repo.homepage) ? ` &middot; <a href="${esc(repo.homepage)}" ${external}>demo</a>` : "";
    const date = repo.pushedAt.slice(0, 10);
    return `<tr><td><a href="${esc(repo.htmlUrl)}" ${external}>${esc(repo.name)}</a>${demo}</td><td>${esc(repo.description!)}</td><td>${repo.language ? esc(repo.language) : "&mdash;"}</td><td>${esc(String(repo.stars))}</td><td><time datetime="${esc(repo.pushedAt)}">${esc(date)}</time></td></tr>`;
  }).join("");
  return `<h1>Projects</h1><p>Products, developer tools, and the engineering behind them. This list comes straight from my GitHub and refreshes every hour.</p>${projects.length ? `<div class="table-wrap"><table class="projects"><caption>Public repositories</caption><thead><tr><th scope="col">Project</th><th scope="col">What it is</th><th scope="col">Language</th><th scope="col">Stars</th><th scope="col">Updated</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="notice">The project list did not load. See all my work on <a href="${esc(GITHUB_HREF)}" ${external}>GitHub</a>.</p>`}<p>More on <a href="${esc(GITHUB_HREF)}" ${external}>github.com/LLRHook</a>.</p>`;
}

export function offTheClockBody(): string {
  const interests = [
    ["01 / MOVE", "One more attempt.", "Rock climbing is my regular break from the screen. Different holds, the same satisfaction of working through a problem."],
    ["02 / COLLECT", "A place for the cards.", "Hunting for Pokémon cards and opening packs with friends are part of the fun. Magic: The Gathering has a place on the shelf, too."],
    ["03 / RECHARGE", "Wings after a long week.", "A small nod to Buffalo Wild Wings."],
    ["04 / GET OUTSIDE", "A postcard from Peru.", "The mountain-and-river photo below comes from my September 2026 Peru trip."],
    ["05 / TINKER", "Probably building a tool for that.", "Agentic workflows, deployment automation, and little utilities that make the next development cycle easier."],
    ["06 / READ", "Red Rising trilogy", "Currently reading Pierce Brown’s Red Rising trilogy."],
  ];
  return `<h1>Off the clock</h1>${paragraph("There's usually another problem to solve. Some of them involve climbing shoes.")}<dl class="interests">${interests.map(([number, heading, text], index) => `<dt>${esc(number)}: ${esc(heading)}</dt><dd>${esc(text)}${index === 3 ? '<p><img src="/peru-travel.webp" alt="Mountains and a river in Peru" width="320" height="240"></p>' : ""}</dd>`).join("")}</dl>`;
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
      <p>${esc("\n        Sterling, Virginia · DoD Secret eligibility (DCSA 2026) · ")}<a href="${esc(EMAIL_HREF)}">${esc("victor.n.ivanov@gmail.com")}</a><br />
        <a href="https://victorivanov.engineer" target="_blank" rel="noopener noreferrer">${esc("victorivanov.engineer")}</a>${esc(" · ")}<a href="${esc(GITHUB_HREF)}" rel="me">${esc("github.com/LLRHook")}</a>${esc(" · ")}<a href="${esc(SOCIAL_BY_ICON.linkedin.href)}" rel="me">${esc("LinkedIn")}</a>
      </p>
      <p>${esc("Secret-eligible, backend-leaning full-stack engineer with 4+ years shipping high-stakes certification SaaS. Owned a React/Spring Boot scheduling workflow end to end, carried a billing hotfix through live production validation, and built Next.js analytics and quiz experiences with explicit async, accessibility, and security controls. Open to on-site and hybrid roles and customer travel.")}</p>
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
      <p>${esc("Updated September 2026.")}</p>
`;
}
