"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { RepoCardData } from "@/app/lib/types";
import { GITHUB_HREF, EMAIL_HREF, SKILLS, SOCIAL_BY_ICON } from "@/app/lib/constants";
import { APPS, type AppId } from "./Workspace";
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
  const matching = repos.filter((repo) => `${repo.name} ${repo.description ?? ""} ${repo.language ?? ""} ${repo.topics.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  if (selected) return <section className="project-detail"><button className="text-button back-button" onClick={() => setSelected(null)}>← All projects</button><p className="eyebrow">PROJECT NOTES</p><h2 ref={projectTitle} tabIndex={-1}>{selected.name}</h2><p className="app-lead">{selected.description || "An experiment from my public GitHub workspace."}</p><a className="primary-link" href={selected.htmlUrl} target="_blank" rel="noopener noreferrer">Open repository <Icon name="arrow" /></a><ProjectReadme key={selected.id} repo={selected} /></section>;
  return <section><p className="eyebrow">THE THINGS I BUILD</p><h2>Projects & experiments<span>.</span></h2><p className="app-lead">Tools I wanted to exist, ideas I wanted to try, and the occasional rabbit hole.</p><label className="project-search"><Icon name="folder" /><input ref={searchInput} type="search" aria-label="Search projects" placeholder="Find a project, language, or idea…" value={query} onChange={(event) => setQuery(event.target.value)} /><span>{matching.length}</span></label><div className="project-grid">{matching.map((repo, index) => <button className="project-tile" key={repo.id} onClick={() => setSelected(repo)}><div className="project-tile-top"><span className={`project-folder folder-${index % 4}`}><Icon name="folder" /></span><span>↗</span></div><h3>{repo.name}</h3><p>{repo.description || "An experiment from my public GitHub workspace."}</p><div className="project-meta"><span><i />{repo.language || "Code & ideas"}</span><span>View project</span></div></button>)}</div>{matching.length === 0 && <div className="empty-projects"><h3>{repos.length ? "No matching projects." : "The project shelf is taking a moment."}</h3><p>{repos.length ? "Try a different name or language." : "You can explore all of my public work directly on GitHub."}</p><a href={GITHUB_HREF} target="_blank" rel="noopener noreferrer">Visit GitHub ↗</a></div>}</section>;
}

function About({ navigate }: { navigate: (id: AppId) => void }) {
  return <section><p className="eyebrow">HELLO.TXT</p><div className="about-heading"><div><h2>Hi, I&apos;m Victor<span>.</span></h2><p className="app-lead">A backend-leaning full-stack engineer with a habit of building things.</p></div><Image className="about-portrait" src="/victor-profile.jpg" width={120} height={120} alt="Victor's illustrated GitHub profile portrait" /></div><div className="location-chip"><span /> Based in Tysons, Virginia</div><div className="prose"><p>I work on certification software at Paradigm Testing. That means APIs, multi-tenant systems, real-time exam workflows, and getting the details right before they reach production.</p><p>Most days, I work with Java, Spring Boot, React, and PostgreSQL. Outside of that, I build tools in Go and TypeScript and spend a lot of time exploring agentic development workflows.</p><p>I studied computer science at UMBC and I&apos;m working toward a master&apos;s at Georgia Tech. Away from the desk, you&apos;ll usually find me climbing or thinking about the next project.</p></div><div className="about-note"><Icon name="code" /><p>Build fast. Always test.<small>A good test suite is part of the work.</small></p></div><h3 className="section-label">Tools on my desk</h3><div className="skill-list">{SKILLS.map((skill) => <span key={skill}>{skill}</span>)}<span>Go</span></div><button className="primary-link" onClick={() => navigate("projects")}>See what I&apos;m building <Icon name="arrow" /></button></section>;
}

function Resume() {
  return <section className="resume-content"><div className="resume-topline"><p className="eyebrow">RESUME.MD</p><button className="text-button print-button" onClick={() => window.print()}><Icon name="resume" /> Print / save PDF</button></div><h2>Victor Ivanov<span>.</span></h2><p className="resume-title">Senior backend engineer · Full-stack development</p><p className="resume-contact">Tysons, Virginia · <a href={EMAIL_HREF}>victor.n.ivanov@gmail.com</a><br /><a href="https://victorivanov.engineer">victorivanov.engineer</a> · <a href={GITHUB_HREF}>github.com/LLRHook</a></p><p className="prose resume-summary">Backend-leaning full-stack engineer building certification software, multi-tenant platforms, and tested APIs. Experience with Java, Spring Boot, React, PostgreSQL, Go, and production delivery.</p><h3 className="resume-section-title">Experience</h3><article className="resume-role"><div><h4>Senior Backend Engineer</h4><span>May 2024 – present</span></div><p>Paradigm Testing</p><ul><li>Lead architecture and production readiness across certification software products.</li><li>Build React and Spring Boot exam workflows, including scheduling, accommodations, and tenant-scoped APIs.</li><li>Led the transition from a monolith to five Spring Boot services for exam delivery and review.</li><li>Develop real-time exam video systems, role-based access, automated tests, and merge-gated delivery pipelines.</li></ul></article><article className="resume-role"><div><h4>Software Developer</h4><span>June 2022 – May 2024</span></div><p>Paradigm Testing</p><ul><li>Built and maintained an oral-exam platform for high-stakes certification.</li><li>Led JPA adoption and resolved waiting-room failures under concurrent exam load.</li></ul></article><article className="resume-role"><div><h4>Full-Stack Engineering Practicum</h4><span>July – August 2026</span></div><p>Revature</p><ul><li>Built a Next.js trainer analytics dashboard with server-driven filtering, accessible tables, and automated tests.</li><li>Rebuilt a quiz flow using server-rendered Next.js, FastAPI sessions, and end-to-end browser tests.</li></ul></article><h3 className="resume-section-title">Education</h3><div className="education-row"><div><h4>Georgia Institute of Technology</h4><p>M.S. Computer Science</p></div><span>Expected December 2027</span></div><div className="education-row"><div><h4>University of Maryland, Baltimore County</h4><p>B.S. Computer Science</p></div></div><h3 className="resume-section-title">Technical skills</h3><p className="resume-skills">Java · Spring Boot · Go · TypeScript · React · Next.js · Python · PostgreSQL · Redis / Valkey · Docker · AWS · REST APIs · CI/CD · Automated testing</p><p className="resume-footnote">Screen edition, adapted from my August 2026 resume.</p></section>;
}

function Interests() {
  return <section><p className="eyebrow">A FEW THINGS AROUND THE ROOM</p><h2>Off the clock<span>.</span></h2><p className="app-lead">There&apos;s usually another problem to solve. Some of them involve climbing shoes.</p><div className="interest-list">
    <article><span className="interest-illustration climbing-mark">⌁</span><div><span className="interest-number">01 / MOVE</span><h3>One more attempt.</h3><p>Rock climbing is my regular break from the screen. Different holds, the same satisfaction of working through a problem.</p></div></article>
    <article><span className="interest-illustration mana-mark"><i /><i /><i /><i /><i /></span><div><span className="interest-number">02 / COLLECT</span><h3>A place for the cards.</h3><p>Hunting for Pokémon cards and opening packs with friends are part of the fun. Magic: The Gathering has a place on the shelf, too.</p></div></article>
    <article><span className="interest-illustration poker-mark" aria-hidden="true">♠</span><div><span className="interest-number">03 / PLAY</span><h3>A seat at the table.</h3><p>Poker gets its own corner of the desk, with a few chips and playing cards. Click them in the room for a closer look.</p></div></article>
    <article><span className="interest-illustration wings-mark"><Image src="/bww-logo.svg" width={48} height={48} alt="Buffalo Wild Wings" unoptimized /></span><div><span className="interest-number">04 / RECHARGE</span><h3>Wings after a long week.</h3><p>A small nod to Buffalo Wild Wings. Good food belongs in the room, too.</p></div></article>
    <article><span className="interest-illustration travel-mark" aria-hidden="true">↗</span><div><span className="interest-number">05 / GET OUTSIDE</span><h3>A postcard from Peru.</h3><p>The mountain-and-river photo in the room comes from my September 2026 Peru trip. Open the postcard to see the full view.</p></div></article>
    <article><span className="interest-illustration"><Icon name="code" /></span><div><span className="interest-number">06 / TINKER</span><h3>Probably building a tool for that.</h3><p>Agentic workflows, deployment automation, and little utilities that make the next development cycle easier.</p></div></article>
  </div></section>;
}

function Contact() {
  return <section className="contact-app"><span className="contact-stamp"><Icon name="mail" /></span><p className="eyebrow">A NOTE FROM YOUR DESK TO MINE</p><h2>Let&apos;s make<br />something <em>good.</em></h2><p className="app-lead">Have a project in mind, a question about my work, or a particularly good climbing route?</p><a className="contact-email" href={EMAIL_HREF}>victor.n.ivanov@gmail.com <Icon name="arrow" /></a><div className="contact-links"><a href={GITHUB_HREF} target="_blank" rel="noopener noreferrer">GitHub ↗</a><a href={SOCIAL_BY_ICON.linkedin.href} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a></div><p className="contact-location"><span /> Tysons, Virginia · Eastern time</p></section>;
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
