"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DEFAULT_ROOM_SOUND, RoomSoundscape, type RoomSoundSettings } from "@/app/lib/room-audio";
import "./room-audio.css";

export default function RoomAudio() {
  const [settings, setSettings] = useState<RoomSoundSettings>({ ...DEFAULT_ROOM_SOUND });
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState("");
  const engine = useRef<RoomSoundscape | null>(null);
  const mounted = useRef(false);
  const id = useId();

  useEffect(() => {
    mounted.current = true;
    const visibility = () => {
      const current = engine.current;
      if (!current) return;
      void current.setVisible(!document.hidden).catch(() => {
        if (engine.current !== current) return;
        engine.current = null;
        void current.close().catch(() => {});
        if (mounted.current) {
          setEnabled(false);
          setError("Sound paused. Tap the sound button to try again.");
        }
      });
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      mounted.current = false;
      document.removeEventListener("visibilitychange", visibility);
      const current = engine.current;
      engine.current = null;
      if (current) void current.close().catch(() => {});
    };
  }, []);

  function updateSettings(next: RoomSoundSettings) {
    setSettings(next);
    engine.current?.setSettings(next);
  }

  function toggleSound() {
    const current = engine.current;
    if (current) {
      engine.current = null;
      setEnabled(false);
      void current.close().catch(() => {});
      return;
    }
    let context: AudioContext | null = null;
    try {
      const AudioContextClass = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) throw new Error("Web Audio unavailable");
      // Keep construction and resume in this user gesture: no audio resources on page load.
      context = new AudioContextClass({ latencyHint: "playback" });
      const next = new RoomSoundscape(context, settings);
      engine.current = next;
      setEnabled(true);
      setError("");
      void next.setVisible(!document.hidden).catch(() => {
        if (engine.current !== next) return;
        engine.current = null;
        void next.close().catch(() => {});
        if (mounted.current) {
          setEnabled(false);
          setError("Sound could not start. Tap the sound button to try again.");
        }
      });
    } catch {
      if (context) void context.close().catch(() => {});
      setEnabled(false);
      setError("Sound is unavailable in this browser.");
    }
  }

  return (
    <div className="room-audio" data-sound={enabled ? "on" : "off"}>
      <button className="room-sound-toggle" type="button" aria-pressed={enabled} onClick={toggleSound}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m11 4-6 5H2v6h3l6 5Z" />
          {enabled ? <><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" /></> : <path d="m16 9 6 6m0-6-6 6" />}
        </svg>
        Sound {enabled ? "on" : "off"}
      </button>
      <details className="room-sound-settings">
        <summary>Sound settings</summary>
        <div className="room-sound-panel">
          <p>Soft music. A little life outside the window.</p>
          <label htmlFor={`${id}-volume`}>Volume <output htmlFor={`${id}-volume`}>{settings.volume}%</output></label>
          <input id={`${id}-volume`} type="range" min="0" max="100" step="1" value={settings.volume} onChange={(event) => updateSettings({ ...settings, volume: Number(event.target.value) })} />
          <label><input type="checkbox" checked={settings.music} onChange={(event) => updateSettings({ ...settings, music: event.target.checked })} /> Calm music</label>
          <label><input type="checkbox" checked={settings.nature} onChange={(event) => updateSettings({ ...settings, nature: event.target.checked })} /> Birds, insects &amp; breeze</label>
          <small>Starts only when you turn sound on.</small>
        </div>
      </details>
      {error && <p className="room-sound-error" role="status" aria-label="Sound status">{error}</p>}
    </div>
  );
}
