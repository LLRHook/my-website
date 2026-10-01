"use client";

import { APPS, type AppId } from "@/app/lib/apps";
import { Icon } from "./RoomIcons";
import "./computer.css";

export const BOOT_LINES = [
  "VI BIOS 3.0 · Workstation",
  "Memory check.......................... OK",
  "Mounting /home/victor.................. OK",
  "Loading projects and experience........ OK",
  "Network............................... OK",
  "Ready.",
];

export default function Computer({ power, bootStep, focused, onPower, onSkip, onOpenApp, onFocus }: {
  power: "off" | "booting" | "on";
  bootStep: number;
  focused: boolean;
  onPower: (trigger: HTMLButtonElement) => void;
  onSkip: () => void;
  onOpenApp: (id: AppId, trigger: HTMLButtonElement) => void;
  onFocus: (trigger: HTMLButtonElement) => void;
}) {
  return (
    <div className={`computer computer-${power}`} data-testid="computer" data-power={power}>
      {power === "off" && (
        <button className="screen-off" aria-label="Turn on Victor's computer" onClick={(event) => onPower(event.currentTarget)}>
          <Icon name="power" />
          <span>Power on</span>
        </button>
      )}
      {power === "booting" && (
        <div className="boot-screen" data-testid="boot-screen">
          <div className="bios-logo">VI<span>OS</span></div>
          <div className="boot-lines" aria-hidden="true">
            {BOOT_LINES.slice(0, bootStep + 1).map((line) => {
              const [label, dots, status] = line.split(/(\.{2,})/);
              return (
                <p className={dots ? "boot-line-check" : undefined} key={line}>
                  {dots ? (
                    <>
                      <span>{label}</span>
                      <span className="boot-leader">{dots}</span>
                      <span>{status}</span>
                    </>
                  ) : line}
                </p>
              );
            })}
            <span className="boot-cursor">▌</span>
          </div>
          <div
            className="boot-progress"
            role="progressbar"
            aria-label="Starting computer"
            aria-valuenow={Math.round(((bootStep + 1) / BOOT_LINES.length) * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${((bootStep + 1) / BOOT_LINES.length) * 100}%` }} />
          </div>
          <button className="skip-boot" onClick={onSkip}>
            Skip startup
            <Icon name="arrow" />
          </button>
        </div>
      )}
      {power === "on" && (
        <div className="mini-desktop" data-testid="desktop">
          <div className="desktop-menubar">
            <strong>viOS</strong>
            <span>Victor Ivanov · Workstation</span>
            <button aria-label="Shut down computer" onClick={(event) => onPower(event.currentTarget)}>
              <Icon name="power" />
            </button>
          </div>
          <div className="desktop-welcome">
            <span>VICTOR IVANOV</span>
            <h2>Senior Full-Stack Engineer</h2>
            <p>Choose a folder.</p>
          </div>
          <div className="desktop-folders">
            {APPS.map((item) => (
              <button key={item.id} onClick={(event) => onOpenApp(item.id, event.currentTarget)} aria-label={`Open ${item.label}`}>
                <span className={`app-icon icon-${item.id}`}>
                  <Icon name={item.icon} />
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          <div className="desktop-status">
            <span>Online</span>
            <button aria-label="Expand computer screen" disabled={focused} onClick={(event) => onFocus(event.currentTarget)}>
              <Icon name="expand" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
