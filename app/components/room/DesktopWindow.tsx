"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { RepoCardData } from "@/app/lib/types";
import { GITHUB_HREF, EMAIL_HREF, SKILLS, SOCIAL_BY_ICON } from "@/app/lib/constants";
import FeaturedProjects from "./FeaturedProjects";
import { presentProject } from "@/app/lib/projectPresentation";
import { APPS, type AppId } from "@/app/lib/apps";
import { Icon } from "./RoomIcons";

const ProjectReadme = dynamic(() => import("./ProjectReadme"), { loading: () => <p role="status">Opening project notes…</p> });

function Projects({ repos }: { repos: RepoCardData[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<RepoCardData | null>(null);
  const projectTitle = useRef<HTMLHeadingElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const wasViewingProject = useRef(false);
  useEffect(() => {
    if (selected) projectTitle.current?.focus();
    else if (wasViewingProject.current) searchInput.current?.focus();
    wasViewingProject.current = selected !== null;
  }, [selected]);
  const matching = repos.filter((repo) => {
    const display = presentProject(repo);
    if (!display.description || repo.name.toLowerCase() === repo.owner.toLowerCase()) return false;
    return `${repo.name} ${display.name} ${display.description ?? ""} ${repo.language ?? ""} ${repo.topics.join(" ")}`.toLowerCase().includes(query.toLowerCase());
  });
  if (selected) return <section className="project-detail"><button className="text-button back-button" onClick={() => setSelected(null)}>← All projects</button><p className="eyebrow">PROJECT NOTES</p><h2 ref={projectTitle} tabIndex={-1}>{presentProject(selected).name}</h2><p className="app-lead">{presentProject(selected).description}</p><a className="primary-link" href={selected.htmlUrl} target="_blank" rel="noopener noreferrer">Open repository <Icon name="arrow" /></a><ProjectReadme key={selected.id} repo={selected} /></section>;
  return <section><p className="eyebrow">THE THINGS I BUILD</p><h2>Selected work<span>.</span></h2><p className="app-lead">Products, developer tools, and the engineering behind them.</p>{!query.trim() && <FeaturedProjects />}<h3 className="section-label">The project shelf</h3><label className="project-search"><Icon name="folder" /><input ref={searchInput} type="search" aria-label="Search projects" placeholder="Find a project, language, or idea…" value={query} onChange={(event) => setQuery(event.target.value)} /><span>{matching.length}</span></label><div className="project-grid">{matching.map((sourceRepo, index) => { const repo = presentProject(sourceRepo); return <button className="project-tile" key={repo.id} onClick={() => setSelected(sourceRepo)}><div className="project-tile-top"><span className={`project-folder folder-${index % 4}`}><Icon name="folder" /></span><span>↗</span></div><h3>{repo.name}</h3><p>{repo.description}</p><div className="project-meta"><span><i />{repo.language || "Code & ideas"}</span><span>View project</span></div></button>; })}</div>{matching.length === 0 && <div className="empty-projects"><h3>{repos.length ? "No matching projects." : "The project shelf is taking a moment."}</h3><p>{repos.length ? "Try a different name or language." : "You can explore all of my public work directly on GitHub."}</p><a href={GITHUB_HREF} target="_blank" rel="noopener noreferrer">Visit GitHub ↗</a></div>}</section>;
}

function About({ navigate }: { navigate: (id: AppId) => void }) {
  return <section><p className="eyebrow">HELLO.TXT</p><div className="about-heading"><div><h2>Hi, I&apos;m Victor<span>.</span></h2><p className="app-lead">A Senior Full-Stack Engineer with a habit of building useful things.</p></div><Image className="about-portrait" src="/victor-profile.jpg" width={120} height={120} alt="Victor's illustrated GitHub profile portrait" /></div><div className="location-chip"><span /> Based in Sterling, Virginia · DoD Secret eligibility (DCSA 2026)</div><div className="prose"><p>I work on certification software at Paradigm Testing. That means APIs, multi-tenant systems, real-time exam workflows, and getting the details right before they reach production.</p><p>Most days, I work with Java, Spring Boot, React, and PostgreSQL. Outside of that, I build tools in Go and TypeScript and spend a lot of time exploring agentic development workflows.</p><p>I studied computer science at UMBC and I&apos;m pursuing an M.S. in Computer Science at Georgia Tech, expected December 2027. Away from the desk, you&apos;ll usually find me climbing or thinking about the next project.</p></div><div className="about-note"><Icon name="code" /><p>Build fast. Always test.<small>A good test suite is part of the work.</small></p></div><h3 className="section-label">Tools on my desk</h3><div className="skill-list">{SKILLS.map((skill) => <span key={skill}>{skill}</span>)}<span>Go</span></div><button className="primary-link" onClick={() => navigate("projects")}>See what I&apos;m building <Icon name="arrow" /></button></section>;
}

function Resume() {
  return (
    <section className="resume-content">
      <div className="resume-topline">
        <p className="eyebrow">RESUME.MD</p>
        <button className="text-button print-button" onClick={() => window.print()}><Icon name="resume" /> Print / save PDF</button>
        <a className="text-button print-button" href="/Victor_Ivanov_Resume.pdf" download="Victor_Ivanov_Resume.pdf">Download PDF</a>
      </div>
      <h2>Victor Ivanov<span>.</span></h2>
      <p className="resume-title">Senior Full-Stack Engineer</p>
      <p className="resume-contact">
        Sterling, Virginia · DoD Secret eligibility (DCSA 2026) · <a href={EMAIL_HREF}>victor.n.ivanov@gmail.com</a><br />
        <a href="https://victorivanov.engineer">victorivanov.engineer</a> · <a href={GITHUB_HREF}>github.com/LLRHook</a> · <a href={SOCIAL_BY_ICON.linkedin.href}>LinkedIn</a>
      </p>
      <p className="prose resume-summary">Secret-eligible, backend-leaning full-stack engineer with 4+ years shipping high-stakes certification SaaS. Owned a React/Spring Boot scheduling workflow end to end, carried a billing hotfix through live production validation, and built Next.js analytics and quiz experiences with explicit async, accessibility, and security controls. Open to on-site and hybrid roles and customer travel.</p>
      <h3 className="resume-section-title">Experience</h3>
      <article className="resume-role">
        <div><h4>Senior Backend Engineer</h4><span>May 2024 – present</span></div>
        <p>Paradigm Testing · Remote</p>
        <ul>
          <li>Lead architecture, priorities, and production readiness for three engineers across four certification SaaS products.</li>
          <li>Owned a React/Spring Boot written-exam scheduling workflow end to end: create/edit wizards, dirty state, an ADA accommodation picker, structured 409 conflict handling, tenant-scoped CRUD, and 10 dedicated test files/classes.</li>
          <li>Owned a billing hotfix from root cause through protected production deployment; live reconciliation corrected an undercharge and restored accurate invoicing across a large document batch.</li>
          <li>Diagnosed a three-month multithreaded AWS file-lock failure; cut errors from 80% to near-zero for 10 organizations.</li>
          <li>Led a monolith-to-microservices rewrite into five Spring Boot 3 services for oral/written exams, plagiarism detection, AI proctoring, and results review; the MVP serves production traffic.</li>
          <li>Architected secure real-time exam video delivery with WebSockets/STOMP, direct-to-S3 uploads, JWT role controls, audit logs, and Valkey-backed refresh tokens.</li>
          <li>Partnered with a proctoring vendor and InfoSec to integrate proctoring across oral and written exam flows; authored cross-role acceptance steps and completed validation.</li>
          <li>Built merge-gated CI/CD and 550+ automated tests from zero; containerized Playwright auth, admin CRUD, and impersonation flows in Bitbucket Pipelines, supporting six releases without covered-workflow regressions.</li>
          <li>Turned live V&amp;V and demo findings into a fail-closed, 10-stage pilot gate spanning tenant onboarding, candidate disconnect/resume, scoring, and audit reconstruction; exposed an answer-key leak before go-live.</li>
        </ul>
      </article>
      <article className="resume-role">
        <div><h4>Software Developer</h4><span>June 2022 – May 2024</span></div>
        <p>Paradigm Testing · Maryland</p>
        <ul><li>Built a high-stakes oral-exam platform serving 4,800+ candidates annually; led JPA adoption across 73 entities and eliminated peak-load waiting-room errors at 200+ concurrent sessions.</li></ul>
      </article>
      <article className="resume-role">
        <div><h4>Full-Stack Engineering Practicum</h4><span>July – August 2026</span></div>
        <p>Revature</p>
        <ul>
          <li>Delivered 63 merged pull requests in 22 days, including a Next.js trainer analytics dashboard with server-driven filters/paging, an accessible table equivalent for SVG analytics, independent async states, retry UX, and 27 Vitest cases.</li>
          <li>Rebuilt the quiz flow as a server-rendered Next.js route backed by FastAPI sessions: one request per question, zero-request history navigation, ownership-checked resume, token redaction, and Playwright E2E through nginx.</li>
        </ul>
      </article>
      <h3 className="resume-section-title">Selected projects</h3>
      <article className="resume-role">
        <h4><a href="https://github.com/LLRHook/mailit">MailIt</a></h4>
        <p>Go, Next.js 16, PostgreSQL, Redis, Docker/Kubernetes</p>
        <ul><li>REST APIs, async workers, inbound SMTP, and a Next.js dashboard; direct MX delivery, DKIM, replay-safe sends, signed webhooks, multi-arch releases, and 523 tests.</li></ul>
      </article>
      <article className="resume-role">
        <h4><a href="https://github.com/LLRHook/citybase">Citybase</a></h4>
        <p>Electron, React, Node.js</p>
        <ul><li>Desktop IDE mapping repositories into an isometric city and dispatching Claude/Codex through typed IPC; streamed, cancellable runs, persisted history, guarded Git operations, and 393 tests.</li></ul>
      </article>
      <article className="resume-role">
        <h4><a href="https://github.com/LLRHook/fix-youtube">Fix YouTube</a></h4>
        <p>JavaScript, Manifest V3</p>
        <ul><li>Zero-dependency extension for SPA-aware Shorts redirects, feed filters, focus timers, watch history, and settings import/export; cross-browser CI and 15 tests.</li></ul>
      </article>
      <h3 className="resume-section-title">Education</h3>
      <div className="education-row"><div><h4>Georgia Institute of Technology</h4><p>M.S. Computer Science, Systems &amp; Architecture (online)</p></div><span>Expected December 2027</span></div>
      <div className="education-row"><div><h4>University of Maryland, Baltimore County</h4><p>B.S. Computer Science</p></div></div>
      <h3 className="resume-section-title">Technical skills</h3>
      <p className="resume-skills"><strong>Frontend:</strong> TypeScript/JavaScript, React, Next.js 16, Vite, HTML/CSS, React Query, Playwright, Vitest</p>
      <p className="resume-skills"><strong>Backend:</strong> Java 21, Spring Boot 3, Spring Security, JPA/Hibernate, Python, FastAPI, Go, REST, WebSockets/STOMP</p>
      <p className="resume-skills"><strong>Data &amp; cloud:</strong> PostgreSQL, MariaDB, Redis/Valkey, AWS (EC2, S3, RDS), Docker, Kubernetes/Helm</p>
      <p className="resume-skills"><strong>Delivery &amp; security:</strong> Bitbucket Pipelines, GitHub Actions, CI/CD, OAuth2/JWT, JUnit/Mockito, Testcontainers, Pytest</p>
      <p className="resume-footnote">Updated September 2026.</p>
    </section>
  );
}

function Interests() {
  return <section><p className="eyebrow">A FEW THINGS AROUND THE ROOM</p><h2>Off the clock<span>.</span></h2><p className="app-lead">There&apos;s usually another problem to solve. Some of them involve climbing shoes.</p><div className="interest-list">
    <article><span className="interest-illustration climbing-mark">⌁</span><div><span className="interest-number">01 / MOVE</span><h3>One more attempt.</h3><p>Rock climbing is my regular break from the screen. Different holds, the same satisfaction of working through a problem.</p></div></article>
    <article><span className="interest-illustration mana-mark"><i /><i /><i /><i /><i /></span><div><span className="interest-number">02 / COLLECT</span><h3>A place for the cards.</h3><p>Hunting for Pokémon cards and opening packs with friends are part of the fun. Magic: The Gathering has a place on the shelf, too.</p></div></article>
    <article><span className="interest-illustration roulette-mark" aria-hidden="true">◉</span><div><span className="interest-number">03 / PLAY</span><h3>A little spin.</h3><p>A little roulette wheel on the desk, just for fun.</p></div></article>
    <article><span className="interest-illustration wings-mark"><Image src="/bww-logo.svg" width={48} height={48} alt="Buffalo Wild Wings" unoptimized /></span><div><span className="interest-number">04 / RECHARGE</span><h3>Wings after a long week.</h3><p>A small nod to Buffalo Wild Wings. Good food belongs in the room, too.</p></div></article>
    <article><span className="interest-illustration travel-mark" aria-hidden="true">↗</span><div><span className="interest-number">05 / GET OUTSIDE</span><h3>A postcard from Peru.</h3><p>The mountain-and-river photo in the room comes from my September 2026 Peru trip. Open the postcard to see the full view.</p></div></article>
    <article><span className="interest-illustration"><Icon name="code" /></span><div><span className="interest-number">06 / TINKER</span><h3>Probably building a tool for that.</h3><p>Agentic workflows, deployment automation, and little utilities that make the next development cycle easier.</p></div></article>
    <article>  <svg className="interest-illustration" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect x="4" y="5" width="5" height="15" rx=".8" fill="#B0674F"/>
    <rect x="10" y="7" width="4.5" height="13" rx=".8" fill="#C9A45C"/>
    <rect x="15.5" y="4" width="5" height="16" rx=".8" fill="#5F7A7C"/>
    <path d="M5 8h3M11 10h2.5M16.5 7h3" stroke="#F4EBDD" strokeOpacity=".8" strokeWidth=".8"/>
  </svg><div><span className="interest-number">07 / READ</span><h3>Red Rising trilogy</h3><p>Currently reading Pierce Brown’s Red Rising trilogy.</p></div></article>
  </div></section>;
}

function Contact() {
  return <section className="contact-app"><span className="contact-stamp"><Icon name="mail" /></span><p className="eyebrow">A NOTE FROM YOUR DESK TO MINE</p><h2>Let&apos;s make<br />something <em>good.</em></h2><p className="app-lead">Have a project in mind, a question about my work, or a particularly good climbing route?</p><a className="contact-email" href={EMAIL_HREF}>victor.n.ivanov@gmail.com <Icon name="arrow" /></a><div className="contact-links"><a href={GITHUB_HREF} target="_blank" rel="noopener noreferrer">GitHub ↗</a><a href={SOCIAL_BY_ICON.linkedin.href} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a></div><p className="contact-location"><span /> Virginia · Eastern time</p></section>;
}

export default function DesktopWindow({ app, onNavigate, onClose, repos }: { app: AppId | null; onNavigate: (id: AppId) => void; onClose: () => void; repos: RepoCardData[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const current = APPS.find((item) => item.id === app);
  const isOpen = app !== null;

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (isOpen) {
      element.showModal();
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      closeButton.current?.focus();
      return () => {
        element.close();
        document.body.style.overflow = previous;
      };
    }
  }, [isOpen]);
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
    if (isOpen && document.activeElement === document.body) closeButton.current?.focus();
  }, [app, isOpen]);

  function closeWindow() {
    // Release the native modal's inert background before Workspace restores
    // focus to a note or launcher (the startup button may no longer exist).
    dialog.current?.close();
    onClose();
  }

  function containTabFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )).filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return <dialog className="desktop-window" ref={dialog} aria-labelledby="window-title" onKeyDown={containTabFocus} onCancel={(event) => { event.preventDefault(); closeWindow(); }} onClick={(event) => { if (event.target === event.currentTarget) closeWindow(); }}><div className="window-shell"><header className="window-titlebar"><span className="window-brand"><span className="window-dots"><i /><i /><i /></span><strong>viOS</strong><span className="window-path">/home/victor/{current?.file}</span></span><h2 id="window-title" className="sr-only">{current?.label ?? "Personal computer"}</h2><button ref={closeButton} className="close-window" onClick={closeWindow} aria-label="Close window and return to room"><Icon name="close" /></button></header><div className="window-layout"><nav className="window-sidebar" aria-label="Computer applications"><span className="sidebar-label">PERSONAL SPACE</span>{APPS.map((item) => <button key={item.id} onClick={() => onNavigate(item.id)} aria-current={app === item.id ? "page" : undefined}><Icon name={item.icon} /><span>{item.label}</span></button>)}</nav><div className="window-content" ref={body} key={app} tabIndex={0}>{app === "about" && <About navigate={onNavigate} />}{app === "projects" && <Projects repos={repos} />}{app === "resume" && <Resume />}{app === "interests" && <Interests />}{app === "contact" && <Contact />}</div></div><footer className="window-status"><span><i /> {current?.label} <span className="window-status-detail">· Victor&apos;s personal workspace</span></span><span>ESC to return to room</span></footer></div></dialog>;
}
