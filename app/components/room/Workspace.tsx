"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Progressive app links use viOS history without a Next route transition. */

import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { RepoCardData } from "@/app/lib/types";
import { Icon } from "./RoomIcons";
import RouletteToy from "./RouletteToy";
import DesktopWindow from "./DesktopWindow";
import ComputerFocus from "./ComputerFocus";
import ObjectDetail, { type ObjectId } from "./ObjectDetail";
import RoomAudio from "./RoomAudio";
import "./room-details.css";
import RoomScene from "./RoomScene";
import Computer, { BOOT_LINES } from "./Computer";
import useReducedMotion from "./useReducedMotion";
import { variantFor } from "@/app/lib/room-scene";
import type { Hotspot } from "./hotspots";

import { APPS, APP_METADATA, idFromPath, pathFor, type AppId } from "@/app/lib/apps";
import { SITE_TITLE } from "@/app/lib/constants";
export type { AppId } from "@/app/lib/apps";
export default function Workspace({ repos, initialApp }: { repos: RepoCardData[]; initialApp?: AppId }) {
  const [power, setPower] = useState<"off" | "booting" | "on">(initialApp ? "on" : "off");
  const [bootStep, setBootStep] = useState(0);
  const [app, setApp] = useState<AppId | null>(initialApp ?? null);
  const [night, setNight] = useState(false);
  const [lamp, setLamp] = useState(true);
  const [computerFocused, setComputerFocused] = useState(false);
  const [detail, setDetail] = useState<ObjectId | null>(null);
  const pendingApp = useRef<AppId | null>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);
  const computerTrigger = useRef<HTMLElement | null>(null);
  const detailTrigger = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const showLinkedApp = (id: AppId | null) => {
      pendingApp.current = null;
      setComputerFocused(false);
      setDetail(null);
      if (id) setPower("on");
      setApp(id);
    };
    const openLegacyHash = () => {
      const linkedApps: Record<string, AppId> = { work: "projects", projects: "projects", about: "about", resume: "resume", interests: "interests", contact: "contact" };
      const id = linkedApps[window.location.hash.slice(1)];
      if (!id) return false;
      window.history.replaceState(window.history.state, "", pathFor(id));
      showLinkedApp(id);
      return true;
    };
    const followHistory = () => {
      if (!openLegacyHash()) showLinkedApp(idFromPath(window.location.pathname));
    };
    openLegacyHash();
    window.addEventListener("hashchange", openLegacyHash);
    window.addEventListener("popstate", followHistory);
    return () => {
      window.removeEventListener("hashchange", openLegacyHash);
      window.removeEventListener("popstate", followHistory);
    };
  }, []);

  useEffect(() => {
    document.title = app ? APP_METADATA[app].title : SITE_TITLE;
  }, [app]);

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
    window.history.pushState(window.history.state, "", pathFor(id));
    setDetail(null);
    setComputerFocused(false);
    if (power === "on") setApp(id);
    else {
      pendingApp.current = id;
      if (power === "off") setBootStep(0);
      setPower("booting");
    }
  }

  function navigateApp(id: AppId) {
    window.history.replaceState(window.history.state, "", pathFor(id));
    setApp(id);
  }

  function followAppLink(event: MouseEvent<HTMLAnchorElement>, id: AppId) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openApp(id, event.currentTarget);
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
    pendingApp.current = null;
    window.history.pushState(window.history.state, "", "/");
    setApp(null);
    const trigger = lastTrigger.current;
    if (trigger?.isConnected) trigger.focus();
    else screenRef.current?.focus();
  }

  function onHotspot(hotspot: Hotspot, trigger: HTMLButtonElement) {
    const action = hotspot.action;
    if (action.kind === "inspect") inspectObject(action.object, trigger);
    else if (action.kind === "app") openApp(action.app, trigger);
    else if (action.target === "night") setNight((value) => !value);
    else setLamp((value) => !value);
  }

  return (
    <div className="workspace" data-night={night} data-lamp={lamp}>
      <header className="room-header">
        <Link className="wordmark" href="/">
          <span className="monogram">vi<span>.</span></span>
          <span>
            VICTOR IVANOV
            <small>Senior Full-Stack Engineer</small>
          </span>
        </Link>
        <nav aria-label="Portfolio navigation">
          <a href="/projects" onClick={(event) => followAppLink(event, "projects")}>Projects</a>
          <a href="/resume" onClick={(event) => followAppLink(event, "resume")}>Resume</a>
          <a href="/contact" className="header-contact" onClick={(event) => followAppLink(event, "contact")}>
            Let&apos;s talk
            <Icon name="arrow" />
          </a>
        </nav>
      </header>

      <section id="content" tabIndex={-1} className="room-intro" aria-labelledby="room-title">
        <p className="eyebrow"><span /> A SMALL SPACE FOR BIG IDEAS</p>
        <h1 id="room-title">Make yourself <em>at home.</em></h1>
        <p>I&apos;m Victor. I build web products and developer tools, work across the stack, and climb rocks.</p>
      </section>

      <section className="room-stage" aria-label="Victor's workspace">
        <RoomScene
          night={night}
          lamp={lamp}
          screenRef={screenRef}
          onHotspot={onHotspot}
          screen={
            <ComputerFocus
              active={computerFocused}
              onClose={() => setComputerFocused(false)}
              returnFocus={computerTrigger}
              fallbackFocus={screenRef}
            >
              <Computer
                power={power}
                bootStep={bootStep}
                focused={computerFocused}
                onPower={togglePower}
                onSkip={finishBoot}
                onOpenApp={openApp}
                onFocus={focusComputer}
              />
            </ComputerFocus>
          }
          roulette={<RouletteToy variant={variantFor(night, lamp)} reducedMotion={reducedMotion} />}
        />
      </section>

      <div className="room-toolbar">
        <div className="room-controls">
          <button onClick={() => setNight((value) => !value)} aria-label={night ? "Evening. Switch to daylight" : "Daylight. Switch to evening"} aria-pressed={night}>
            <Icon name={night ? "moon" : "sun"} />
            <span>{night ? "Evening" : "Daylight"}</span>
          </button>
          <span className="control-divider" />
          <button onClick={() => setLamp((value) => !value)} aria-label={lamp ? "Lamp on. Switch off" : "Lamp off. Switch on"} aria-pressed={lamp}>
            <Icon name="lamp" />
            <span>{lamp ? "Lamp on" : "Lamp off"}</span>
          </button>
          <RoomAudio />
        </div>
      </div>
      <nav className="quick-access" aria-label="Open a desktop app">
        {APPS.map((item) => (
          <a key={item.id} href={pathFor(item.id)} onClick={(event) => followAppLink(event, item.id)}>
            <Icon name={item.icon} />
            <span>{item.label}</span>
            <span className="quick-arrow" aria-hidden="true">↗</span>
          </a>
        ))}
      </nav>
      <footer className="room-footer">
        <span>© {new Date().getFullYear()} Victor Ivanov</span>
      </footer>
      <span className="sr-only" role="status" aria-live="polite">
        {power === "booting" ? "Computer is starting. You can skip startup." : power === "on" ? "Computer ready. Choose a desktop app." : "Computer is off."}
      </span>
      <DesktopWindow app={app} onNavigate={navigateApp} onClose={closeApp} repos={repos} />
      <ObjectDetail selected={detail} onClose={() => setDetail(null)} onOpenApp={(id) => openApp(id, detailTrigger.current)} returnFocus={detailTrigger} />
    </div>
  );
}
