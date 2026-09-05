"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { RepoCardData } from "@/app/lib/types";
import { Icon, type IconName } from "./RoomIcons";
import WindowCat from "./WindowCat";
import DesktopWindow from "./DesktopWindow";

export type AppId = "about" | "projects" | "resume" | "interests" | "contact";
export const APPS: { id: AppId; label: string; icon: IconName; file: string }[] = [
  { id: "about", label: "About me", icon: "person", file: "hello.txt" },
  { id: "projects", label: "Projects", icon: "folder", file: "projects/" },
  { id: "resume", label: "Resume", icon: "resume", file: "resume.md" },
  { id: "interests", label: "Off the clock", icon: "heart", file: "interests.txt" },
  { id: "contact", label: "Contact", icon: "mail", file: "say-hello" },
];
export const BOOT_LINES = [
  "VI BIOS v2.0 · Personal workstation",
  "Checking memory........................ OK",
  "Mounting /home/victor................... OK",
  "Loading projects & experience.......... OK",
  "Checking window cat................ ASLEEP",
  "Starting a good day. Welcome in.",
];

export default function Workspace({ repos }: { repos: RepoCardData[] }) {
  const [power, setPower] = useState<"off" | "booting" | "on">("off");
  const [bootStep, setBootStep] = useState(0);
  const [app, setApp] = useState<AppId | null>(null);
  const [night, setNight] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [visible, setVisible] = useState(true);
  const pendingApp = useRef<AppId | null>(null);
  const powerButton = useRef<HTMLButtonElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);
  const moving = !paused && !reducedMotion && visible && !app;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    const updateVisibility = () => setVisible(!document.hidden);
    updateMotion();
    updateVisibility();
    media.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      media.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    const openLinkedApp = () => {
      const linkedApps: Record<string, AppId> = { work: "projects", projects: "projects", about: "about", resume: "resume", interests: "interests", contact: "contact" };
      const linkedApp = linkedApps[window.location.hash.slice(1)];
      if (linkedApp) {
        pendingApp.current = null;
        setPower("on");
        setApp(linkedApp);
      }
    };
    openLinkedApp();
    window.addEventListener("hashchange", openLinkedApp);
    return () => window.removeEventListener("hashchange", openLinkedApp);
  }, []);

  useEffect(() => {
    if (power !== "booting") return;
    const timer = window.setTimeout(() => {
      if (reducedMotion || bootStep >= BOOT_LINES.length - 1) {
        setPower("on");
        setApp(pendingApp.current);
        pendingApp.current = null;
      } else setBootStep((step) => step + 1);
    }, reducedMotion ? 0 : bootStep === 0 ? 700 : 540);
    return () => window.clearTimeout(timer);
  }, [power, bootStep, reducedMotion]);

  function rememberTrigger() {
    if (document.activeElement instanceof HTMLElement) lastTrigger.current = document.activeElement;
  }

  function openApp(id: AppId) {
    rememberTrigger();
    if (power === "on") setApp(id);
    else {
      pendingApp.current = id;
      if (power === "off") setBootStep(0);
      setPower("booting");
    }
  }

  function finishBoot() {
    setPower("on");
    setApp(pendingApp.current);
    pendingApp.current = null;
  }

  function togglePower() {
    rememberTrigger();
    if (power === "off") {
      pendingApp.current = null;
      setBootStep(0);
      setPower("booting");
    } else {
      pendingApp.current = null;
      setApp(null);
      setPower("off");
    }
  }

  function closeApp() {
    setApp(null);
    const trigger = lastTrigger.current;
    if (trigger?.isConnected) trigger.focus();
    else powerButton.current?.focus();
  }

  return (
    <div className="workspace" data-night={night} data-moving={moving}>
      <header className="room-header">
        <Link className="wordmark" href="/"><span className="monogram">vi<span>.</span></span><span>VICTOR IVANOV<small>Software engineer</small></span></Link>
        <nav aria-label="Portfolio navigation">
          <button onClick={() => openApp("projects")}>Projects</button>
          <button onClick={() => openApp("resume")}>Resume</button>
          <button className="header-contact" onClick={() => openApp("contact")}>Let&apos;s talk <Icon name="arrow" /></button>
        </nav>
      </header>

      <section className="room-intro" aria-labelledby="room-title">
        <p className="eyebrow"><span /> A SMALL SPACE FOR BIG IDEAS</p>
        <h1 id="room-title">Make yourself <em>at home.</em></h1>
        <p>I&apos;m Victor. I build software, climb rocks, and make tools for the way I work.</p>
      </section>

      <section className="room-stage" aria-label="Victor's interactive workspace">
        <Image className="room-art" src="/room-studio.svg" width={1440} height={850} priority fetchPriority="high" unoptimized alt="" aria-hidden="true" />
        <div className="room-night-wash" aria-hidden="true" />
        <div className="window-sunbeam" aria-hidden="true" />
        <div className="room-caption"><span className="tiny-dot" /> TYSONS, VIRGINIA<small>A good place to build things.</small></div>

        <button className="photo-note note-profile" onClick={() => openApp("about")} aria-label="Hello, I'm Victor. Open profile note">
          <span className="note-tape" />
          <Image src="/victor-profile.jpg" width={160} height={160} alt="Victor's illustrated GitHub profile portrait" sizes="100px" />
          <span>hello, I&apos;m Victor ↗</span>
        </button>
        <button className="photo-note note-work" onClick={() => openApp("resume")} aria-label="Away from the desk. Open experience note">
          <span className="note-tape" /><Image src="/conference-photo.jpg" width={160} height={160} alt="A moment at the conference podium" sizes="100px" /><span>away from the desk.</span>
        </button>
        <button className="sticky-reminder" onClick={() => openApp("projects")}>one more<br />commit.<span>↗ explore projects</span></button>

        <div className={`computer computer-${power}`} data-testid="computer" data-power={power}>
          <div className="monitor-body">
            <div className="camera-dot" aria-hidden="true" />
            <div className="monitor-screen">
              {power === "off" && <button className="screen-off" onClick={togglePower}><span className="screen-reflection" /><Icon name="power" /><span>A little curiosity goes a long way.</span><strong>Turn on Victor&apos;s computer <span>↗</span></strong></button>}
              {power === "booting" && <div className="boot-screen" data-testid="boot-screen"><div className="bios-logo">VI<span>OS</span></div><div className="boot-lines" aria-hidden="true">{BOOT_LINES.slice(0, bootStep + 1).map((line) => <p key={line}>{line}</p>)}<span className="boot-cursor">▌</span></div><div className="boot-progress" role="progressbar" aria-label="Starting computer" aria-valuenow={Math.round(((bootStep + 1) / BOOT_LINES.length) * 100)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${((bootStep + 1) / BOOT_LINES.length) * 100}%` }} /></div><button className="skip-boot" onClick={finishBoot}>Skip startup <Icon name="arrow" /></button></div>}
              {power === "on" && <div className="mini-desktop" data-testid="desktop"><div className="desktop-menubar"><strong>viOS</strong><span>Personal space · v2.0</span><Icon name="sun" /></div><div className="desktop-welcome"><span>WELCOME TO MY DESK</span><h2>Hello, I&apos;m Victor<span>.</span></h2><p>Engineer by trade. Curious by default.</p></div><div className="desktop-folders">{APPS.map((item) => <button key={item.id} onClick={() => openApp(item.id)} aria-label={`Open ${item.label}`}><span className={`app-icon icon-${item.id}`}><Icon name={item.icon} /></span><span>{item.label}</span></button>)}</div><div className="desktop-status"><span><i /> All systems cozy</span><button onClick={() => openApp("about")} aria-label="Expand computer screen"><Icon name="expand" /></button></div></div>}
            </div>
            <div className="monitor-chin"><span>VI / PERSONAL COMPUTER</span><button ref={powerButton} onClick={togglePower} aria-label={power === "off" ? "Power on computer" : "Shut down computer"} className="power-button"><span className="power-led" /><Icon name="power" /></button></div>
          </div>
          <div className="monitor-neck" aria-hidden="true" /><div className="monitor-base" aria-hidden="true" />
        </div>

        <div className="keyboard" aria-hidden="true">{Array.from({ length: 46 }, (_, index) => <i key={index} />)}<b /></div>
        <div className="desk-mouse" aria-hidden="true"><span /></div>
        <WindowCat moving={moving} />
        <button className="room-hotspot hobby-hotspot" onClick={() => openApp("interests")} aria-label="Explore Magic, Pokémon, and other interests"><span>＋</span><span className="hotspot-label">Off the clock</span></button>
        <button className="room-hotspot climb-hotspot" onClick={() => openApp("interests")} aria-label="Read about rock climbing"><span>＋</span><span className="hotspot-label">A different kind of problem solving</span></button>
        <div className="power-hint" aria-hidden="true">{power === "off" ? "Start here. Make yourself comfortable." : power === "booting" ? "Waking up the workspace…" : "Pick a folder. Stay a while."}<svg viewBox="0 0 60 35"><path d="M2 25C30 37 52 24 48 5m-8 7 8-8 8 7" /></svg></div>
      </section>

      <div className="room-toolbar">
        <p><span className="toolbar-spark">✳</span> A room full of things I care about. <span className="desktop-only">Click around.</span></p>
        <div className="room-controls"><button onClick={() => setNight((value) => !value)} aria-label={night ? "Evening. Switch to daylight" : "Daylight. Switch to evening"} aria-pressed={night}><Icon name={night ? "moon" : "sun"} /><span>{night ? "Evening" : "Daylight"}</span></button><span className="control-divider" /><button onClick={() => setPaused((value) => !value)} aria-label={paused ? "Motion off. Resume ambient motion" : "Pause motion"} aria-pressed={paused}><Icon name={paused ? "play" : "pause"} /><span>{paused ? "Motion off" : "Pause motion"}</span></button></div>
      </div>
      <nav className="quick-access" aria-label="Open a desktop app">{APPS.map((item) => <button key={item.id} onClick={() => openApp(item.id)}><Icon name={item.icon} /><span>{item.label}</span><span className="quick-arrow" aria-hidden="true">↗</span></button>)}</nav>
      <footer className="room-footer"><span>Made with intention. And a sleeping cat.</span><span>© {new Date().getFullYear()} Victor Ivanov <span className="footer-dot">·</span> <a href="https://github.com/LLRHook/my-website" target="_blank" rel="noopener noreferrer">View source ↗</a></span></footer>
      <span className="sr-only" role="status" aria-live="polite">{power === "booting" ? "Computer is starting. You can skip startup." : power === "on" ? "Computer ready. Choose a desktop app." : "Computer is off."}</span>
      <DesktopWindow app={app} onNavigate={setApp} onClose={closeApp} repos={repos} />
    </div>
  );
}
