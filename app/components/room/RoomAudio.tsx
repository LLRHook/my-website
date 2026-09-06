"use client";

import { useEffect, useId, useRef, useState } from "react";
import { RoomSoundscape, type RoomSoundSettings } from "@/app/lib/room-audio";
import "./room-audio.css";

/**
 * Quiet first-visit ambience: nature only, well under the engine's own default level.
 * Kept here rather than in the engine so the engine and its tests stay untouched.
 */
export const ROOM_AUDIO_DEFAULT_SETTINGS: RoomSoundSettings = { volume: 18, music: false, nature: true };
/** Scoped to this feature; bump the suffix if the stored shape changes. */
export const ROOM_AUDIO_STORAGE_KEY = "professional-presence:room-audio:v1";

type Preference = { enabled: boolean; settings: RoomSoundSettings };
type Playback = "on" | "waiting" | "off";
type Session = { context: AudioContext; engine: RoomSoundscape; dispose: () => void };

const GESTURE_EVENTS = ["pointerdown", "pointerup", "keydown"] as const;
const START_FAILED = "Sound could not start. Tap anywhere outside the sound button or press a key to try again.";
const PAUSE_FAILED = "Sound paused. When you return, tap anywhere outside the sound button or press a key to try again.";
const UNSUPPORTED = "Sound is unavailable in this browser.";

function sanitizeSettings(input: unknown, fallback: RoomSoundSettings): RoomSoundSettings {
  const record = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const volume = typeof record.volume === "number" && Number.isFinite(record.volume) ? Math.round(Math.min(100, Math.max(0, record.volume))) : fallback.volume;
  return {
    volume,
    music: typeof record.music === "boolean" ? record.music : fallback.music,
    nature: typeof record.nature === "boolean" ? record.nature : fallback.nature,
  };
}

/** Only validated fields are honoured; anything else falls back to the quiet defaults. */
function readPreference(): Preference {
  const fallback: Preference = { enabled: true, settings: { ...ROOM_AUDIO_DEFAULT_SETTINGS } };
  try {
    const raw = window.localStorage.getItem(ROOM_AUDIO_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return fallback;
    const record = parsed as Record<string, unknown>;
    return {
      enabled: typeof record.enabled === "boolean" ? record.enabled : fallback.enabled,
      settings: sanitizeSettings(record.settings, fallback.settings),
    };
  } catch {
    // Blocked or corrupt storage: use the defaults and simply do not remember this visit.
    return fallback;
  }
}

function writePreference(preference: Preference) {
  try {
    window.localStorage.setItem(ROOM_AUDIO_STORAGE_KEY, JSON.stringify(preference));
  } catch {
    // Storage may be blocked (private mode, disabled site data). Sound still works for this visit.
  }
}

export default function RoomAudio() {
  // Server and first client render are deterministic: ambience requested, nothing audible yet. Storage is read on mount.
  const [settings, setSettings] = useState<RoomSoundSettings>({ ...ROOM_AUDIO_DEFAULT_SETTINGS });
  const [enabled, setEnabled] = useState(true);
  const [supported, setSupported] = useState(true);
  const [contextState, setContextState] = useState<string | null>(null);
  const [error, setError] = useState("");
  const preference = useRef<Preference>({ enabled: true, settings: { ...ROOM_AUDIO_DEFAULT_SETTINGS } });
  const session = useRef<Session | null>(null);
  const gesture = useRef<(() => void) | null>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const mounted = useRef(false);
  const id = useId();

  function apply(next: Preference, remember: boolean) {
    preference.current = next;
    setEnabled(next.enabled);
    setSettings(next.settings);
    if (remember) writePreference(next);
  }

  function detachGesture() {
    gesture.current?.();
    gesture.current = null;
  }

  /** First-gesture fallback for browsers that refuse to start audio on load. Removed on success, mute or unmount. */
  function attachGesture() {
    if (gesture.current) return;
    const handler = (event: Event) => {
      // The toggle has its own click handler; reacting here as well would resume and then mute in one tap.
      if (toggle.current && event.target instanceof Node && toggle.current.contains(event.target)) return;
      resume();
    };
    for (const name of GESTURE_EVENTS) document.addEventListener(name, handler, { capture: true, passive: true });
    gesture.current = () => {
      for (const name of GESTURE_EVENTS) document.removeEventListener(name, handler, { capture: true });
    };
  }

  function dropSession() {
    const current = session.current;
    session.current = null;
    current?.dispose();
  }

  function fail(failed: Session, message: string) {
    if (session.current !== failed) return;
    dropSession();
    if (!mounted.current) return;
    setContextState(null);
    setError(message);
    // The visitor's choice stands; the next gesture builds a fresh context.
    if (preference.current.enabled && !document.hidden) attachGesture();
  }

  function start(): Session | null {
    const AudioContextClass = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    let context: AudioContext | null = null;
    try {
      if (!AudioContextClass) throw new Error("Web Audio unavailable");
      const created = new AudioContextClass({ latencyHint: "playback" });
      context = created;
      const engine = new RoomSoundscape(created, preference.current.settings);
      const next: Session = { context: created, engine, dispose: () => {} };
      // The context, not our request, decides what the visitor actually hears.
      const onStateChange = () => {
        if (session.current !== next) return;
        if (created.state === "running") detachGesture();
        else if (created.state !== "closed" && preference.current.enabled && !document.hidden) attachGesture();
        if (mounted.current) setContextState(created.state);
      };
      next.dispose = () => {
        created.removeEventListener("statechange", onStateChange);
        void engine.close().catch(() => {});
      };
      created.addEventListener("statechange", onStateChange);
      session.current = next;
      setSupported(true);
      setError("");
      setContextState(created.state);
      return next;
    } catch {
      if (context) void context.close().catch(() => {});
      setSupported(false);
      setContextState(null);
      return null;
    }
  }

  /**
   * Ask for playback. Where the browser refuses without a gesture the context stays suspended, the UI
   * reads "waiting" and the first gesture retries. Returns false only when Web Audio is unavailable.
   */
  function resume(): boolean {
    if (!preference.current.enabled || document.hidden) return true;
    const current = session.current ?? start();
    if (!current) return false;
    // A context that is already running never fires the statechange that would remove the fallback, so do not add one.
    if (current.context.state === "running") detachGesture();
    else attachGesture();
    void current.engine.setVisible(true).catch(() => fail(current, START_FAILED));
    return true;
  }

  function mute() {
    detachGesture();
    dropSession();
    setContextState(null);
    setError("");
    apply({ ...preference.current, enabled: false }, true);
  }

  function toggleSound() {
    if (preference.current.enabled && supported) {
      mute();
      return;
    }
    setError("");
    apply({ ...preference.current, enabled: true }, true);
    if (!resume()) setError(UNSUPPORTED);
  }

  function updateSettings(next: RoomSoundSettings) {
    apply({ ...preference.current, settings: next }, true);
    session.current?.engine.setSettings(next);
  }

  useEffect(() => {
    mounted.current = true;
    // Hydrate browser-only preferences after matching server/client renders,
    // before starting audio so a remembered mute never briefly plays sound.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    apply(readPreference(), false);
    resume();
    const visibility = () => {
      if (!document.hidden) {
        resume();
        return;
      }
      // Background tabs go quiet through the engine; returning resumes only where the browser allows it.
      detachGesture();
      const current = session.current;
      if (current) void current.engine.setVisible(false).catch(() => fail(current, PAUSE_FAILED));
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      mounted.current = false;
      document.removeEventListener("visibilitychange", visibility);
      detachGesture();
      dropSession();
    };
    // Mount-only: every helper reads refs, so nothing captured here goes stale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playback: Playback = !supported || !enabled ? "off" : contextState === "running" ? "on" : "waiting";
  // Valid settings can still produce nothing audible; say so instead of claiming playback.
  const silent = settings.volume === 0 || (!settings.music && !settings.nature);
  const label = playback === "on" ? (silent ? "Sound silent" : "Sound on") : playback === "waiting" ? "Sound waiting" : "Sound off";
  const note = !supported
    ? UNSUPPORTED
    : playback === "waiting"
      ? "Waiting for your first tap or key press. Browsers only start sound after you interact with the page."
      : playback === "on"
        ? silent
          ? "Sound is on but silent at these settings. Raise the volume or turn on a layer to hear it."
          : "Playing quietly. Your choice is remembered on this device."
        : "Sound is off. Turn it on any time; your choice is remembered on this device.";

  return (
    <div className="room-audio" data-sound={playback}>
      {/* aria-pressed mirrors the visitor's choice, which is what the button toggles; the label reports what is actually audible. */}
      <button ref={toggle} className="room-sound-toggle" type="button" aria-pressed={supported && enabled} onClick={toggleSound}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m11 4-6 5H2v6h3l6 5Z" />
          {playback === "on" && <path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" />}
          {playback === "waiting" && <path d="M15 9a4.5 4.5 0 0 1 0 6" strokeDasharray="2 2" />}
          {playback === "off" && <path d="m16 9 6 6m0-6-6 6" />}
        </svg>
        {label}
      </button>
      <details className="room-sound-settings">
        <summary>Sound settings</summary>
        <div className="room-sound-panel">
          <p>A little life outside the window. Add soft music if you like.</p>
          <label htmlFor={`${id}-volume`}>Volume <output htmlFor={`${id}-volume`}>{settings.volume}%</output></label>
          <input id={`${id}-volume`} type="range" min="0" max="100" step="1" value={settings.volume} onChange={(event) => updateSettings({ ...settings, volume: Number(event.target.value) })} />
          <label><input type="checkbox" checked={settings.music} onChange={(event) => updateSettings({ ...settings, music: event.target.checked })} /> Calm music</label>
          <label><input type="checkbox" checked={settings.nature} onChange={(event) => updateSettings({ ...settings, nature: event.target.checked })} /> Birds, insects &amp; breeze</label>
          <small>{note}</small>
        </div>
      </details>
      {error && <p className="room-sound-error" role="status" aria-label="Sound status">{error}</p>}
    </div>
  );
}
