"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { RepoCardData } from "@/app/lib/types";
import { Icon, type IconName } from "./RoomIcons";
import WindowCat from "./WindowCat";
import DesktopWindow from "./DesktopWindow";
import ComputerFocus from "./ComputerFocus";
import ObjectDetail, { type ObjectId } from "./ObjectDetail";
import RoomBreeze from "./RoomBreeze";
import RoomAtmosphere from "./RoomAtmosphere";
import useRoomMotion from "./useRoomMotion";
import RoomAudio from "./RoomAudio";
import "./room-details.css";
import "./room-mobile.css";

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
  const [computerFocused, setComputerFocused] = useState(false);
  const [detail, setDetail] = useState<ObjectId | null>(null);
  const pendingApp = useRef<AppId | null>(null);
  const powerButton = useRef<HTMLButtonElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);
  const computerTrigger = useRef<HTMLElement | null>(null);
  const detailTrigger = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLElement | null>(null);
  const ambientMotion = !paused && !reducedMotion && visible;
  const moving = ambientMotion && !app && !detail && !computerFocused;
  useRoomMotion(stageRef, moving);

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
        setComputerFocused(false);
        setDetail(null);
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

  function interactionSource(trigger?: HTMLElement | null) {
    // WebKit does not focus buttons on pointer clicks, so keep the actual launcher.
    return trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
  }

  function openApp(id: AppId, trigger?: HTMLElement | null) {
    lastTrigger.current = interactionSource(trigger);
    setDetail(null);
    setComputerFocused(false);
    if (power === "on") setApp(id);
    else {
      pendingApp.current = id;
      if (power === "off") setBootStep(0);
      setPower("booting");
    }
  }

  function focusComputer(trigger?: HTMLElement | null) {
    computerTrigger.current = interactionSource(trigger);
    setComputerFocused(true);
  }

  function inspectObject(id: ObjectId, trigger?: HTMLElement | null) {
    detailTrigger.current = interactionSource(trigger);
    setDetail(id);
  }

  function finishBoot() {
    setPower("on");
    setApp(pendingApp.current);
    pendingApp.current = null;
  }

  function togglePower(trigger?: HTMLElement | null) {
    lastTrigger.current = interactionSource(trigger);
    if (power === "off") {
      focusComputer(trigger);
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
          <button onClick={(event) => openApp("projects", event.currentTarget)}>Projects</button>
          <button onClick={(event) => openApp("resume", event.currentTarget)}>Resume</button>
          <button className="header-contact" onClick={(event) => openApp("contact", event.currentTarget)}>Let&apos;s talk <Icon name="arrow" /></button>
        </nav>
      </header>

      <section className="room-intro" aria-labelledby="room-title">
        <p className="eyebrow"><span /> A SMALL SPACE FOR BIG IDEAS</p>
        <h1 id="room-title">Make yourself <em>at home.</em></h1>
        <p>I&apos;m Victor. I build software, climb rocks, and make tools for the way I work.</p>
      </section>

      <section className="room-stage" ref={stageRef} aria-label="Victor's interactive workspace">
        <div className="room-photo-strip">
        <button className="photo-note note-profile" onClick={(event) => inspectObject("profile", event.currentTarget)} aria-label="Hello, I'm Victor. Open profile note">
          <span className="note-tape" />
          <Image src="/victor-profile.jpg" width={160} height={160} alt="Victor's illustrated GitHub profile portrait" sizes="100px" />
          <span>hello, I&apos;m Victor ↗</span>
        </button>
        <button className="photo-note note-work" onClick={(event) => inspectObject("conference", event.currentTarget)} aria-label="Away from the desk. Open experience note">
          <span className="note-tape" /><Image src="/conference-photo.jpg" width={160} height={160} alt="A moment at the conference podium" sizes="100px" /><span>away from the desk.</span>
        </button>
        <button className="photo-note note-travel" onClick={(event) => inspectObject("peru", event.currentTarget)} aria-label="Peru, September 2026. Open travel photo">
          <span className="note-tape" /><Image src="/peru-travel.webp" width={180} height={135} alt="A river through a mountain town in Peru" sizes="(max-width: 700px) 28vw, 9.4vw" /><span>Peru, September 2026 ↗</span>
        </button>
        </div>
        <div className="room-scene">
        <Image className="room-art" src="/room-studio.svg" width={1440} height={850} loading="eager" fetchPriority="high" unoptimized alt="" aria-hidden="true" />
        <RoomAtmosphere />
        <RoomBreeze />
        <div className="room-night-wash" aria-hidden="true" />
        <div className="room-caption"><span className="tiny-dot" /> TYSONS, VIRGINIA<small>A good place to build things.</small></div>
        <button className="sticky-reminder" aria-label="one more commit. Explore projects" onClick={(event) => openApp("projects", event.currentTarget)}>one more<br />commit.</button>

        <ComputerFocus active={computerFocused} onClose={() => setComputerFocused(false)} returnFocus={computerTrigger} fallbackFocus={powerButton}>
        <div className={`computer computer-${power}`} data-testid="computer" data-power={power}>
          <div className="monitor-body">
            <div className="camera-dot" aria-hidden="true" />
            <div className="monitor-screen">
              {power === "off" && <button className="screen-off" onClick={(event) => togglePower(event.currentTarget)}><span className="screen-reflection" /><Icon name="power" /><span>A little curiosity goes a long way.</span><strong>Turn on Victor&apos;s computer <span>↗</span></strong></button>}
              {power === "booting" && <div className="boot-screen" data-testid="boot-screen"><div className="bios-logo">VI<span>OS</span></div><div className="boot-lines" aria-hidden="true">{BOOT_LINES.slice(0, bootStep + 1).map((line) => {
                const [label, dots, status] = line.split(/(\.{2,})/);
                return <p className={dots ? "boot-line-check" : undefined} key={line}>{dots ? <><span>{label}</span><span className="boot-leader">{dots}</span><span>{status}</span></> : line}</p>;
              })}<span className="boot-cursor">▌</span></div><div className="boot-progress" role="progressbar" aria-label="Starting computer" aria-valuenow={Math.round(((bootStep + 1) / BOOT_LINES.length) * 100)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${((bootStep + 1) / BOOT_LINES.length) * 100}%` }} /></div><button className="skip-boot" onClick={finishBoot}>Skip startup <Icon name="arrow" /></button></div>}
              {power === "on" && <div className="mini-desktop" data-testid="desktop"><div className="desktop-menubar"><strong>viOS</strong><span>Personal space · v2.0</span><Icon name="sun" /></div><div className="desktop-welcome"><span>WELCOME TO MY DESK</span><h2>Hello, I&apos;m Victor<span>.</span></h2><p>Engineer by trade. Curious by default.</p></div><div className="desktop-folders">{APPS.map((item) => <button key={item.id} onClick={(event) => openApp(item.id, event.currentTarget)} aria-label={`Open ${item.label}`}><span className={`app-icon icon-${item.id}`}><Icon name={item.icon} /></span><span>{item.label}</span></button>)}</div><div className="desktop-status"><span><i /> All systems cozy</span><button onClick={(event) => focusComputer(event.currentTarget)} disabled={computerFocused} aria-label="viOS. Open computer. Expand computer screen"><Icon name="expand" /></button></div></div>}
            </div>
            <div className="monitor-chin"><button className="monitor-inspect" onClick={(event) => focusComputer(event.currentTarget)} disabled={computerFocused} aria-label="VI / PERSONAL COMPUTER. Take a closer look">VI / PERSONAL COMPUTER <Icon name="expand" /></button><button ref={powerButton} onClick={(event) => togglePower(event.currentTarget)} aria-label={power === "off" ? "Power on computer" : "Shut down computer"} className="power-button"><span className="power-led" /><Icon name="power" /></button></div>
          </div>
          <div className="monitor-neck" aria-hidden="true" /><div className="monitor-base" aria-hidden="true" />
        </div>
        </ComputerFocus>

        <div className="keyboard" aria-hidden="true">{Array.from({ length: 46 }, (_, index) => <i key={index} />)}<b /></div>
        <div className="desk-mouse" aria-hidden="true"><span /></div>
        <WindowCat moving={moving} onInspect={(trigger) => inspectObject("cat", trigger)} />
        <button className="object-target hobby-hotspot" onClick={(event) => inspectObject("games", event.currentTarget)} aria-label="Explore Magic, Pokémon, and other interests" />
        <button className="object-target climb-hotspot" onClick={(event) => inspectObject("climbing", event.currentTarget)} aria-label="Read about rock climbing" />
        <button className="object-target target-poker" onClick={(event) => inspectObject("poker", event.currentTarget)} aria-label="Take a closer look at the poker cards and chips" />
        <button className="object-target target-wings" onClick={(event) => inspectObject("wings", event.currentTarget)} aria-label="Take a closer look at the Buffalo Wild Wings carton" />
        <button className="object-target target-window" onClick={(event) => inspectObject("window", event.currentTarget)} aria-label="Take a closer look out the window" />
        <button className="object-target target-lamp" onClick={(event) => inspectObject("lamp", event.currentTarget)} aria-label="Take a closer look at the desk lamp" />
        <button className="object-target target-plants" onClick={(event) => inspectObject("plants", event.currentTarget)} aria-label="Take a closer look at the plants" />
        </div>
      </section>

      <div className="room-toolbar">
        <div className="room-controls"><button onClick={() => setNight((value) => !value)} aria-label={night ? "Evening. Switch to daylight" : "Daylight. Switch to evening"} aria-pressed={night}><Icon name={night ? "moon" : "sun"} /><span>{night ? "Evening" : "Daylight"}</span></button><span className="control-divider" /><button onClick={() => setPaused((value) => !value)} aria-label={paused ? "Motion off. Resume ambient motion" : "Pause motion"} aria-pressed={paused}><Icon name={paused ? "play" : "pause"} /><span>{paused ? "Motion off" : "Pause motion"}</span></button><RoomAudio /></div>
      </div>
      <nav className="quick-access" aria-label="Open a desktop app">{APPS.map((item) => <button key={item.id} onClick={(event) => openApp(item.id, event.currentTarget)}><Icon name={item.icon} /><span>{item.label}</span><span className="quick-arrow" aria-hidden="true">↗</span></button>)}</nav>
      <footer className="room-footer"><span>© {new Date().getFullYear()} Victor Ivanov</span></footer>
      <span className="sr-only" role="status" aria-live="polite">{power === "booting" ? "Computer is starting. You can skip startup." : power === "on" ? "Computer ready. Choose a desktop app." : "Computer is off."}</span>
      <DesktopWindow app={app} onNavigate={setApp} onClose={closeApp} repos={repos} />
      <ObjectDetail selected={detail} onClose={() => setDetail(null)} onOpenApp={(id) => openApp(id, detailTrigger.current)} returnFocus={detailTrigger} moving={ambientMotion} />
    </div>
  );
}
