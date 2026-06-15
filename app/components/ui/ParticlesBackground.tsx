"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { ISourceOptions } from "@tsparticles/engine";
import {
  PARTICLE_COUNT,
  PARTICLE_LINK_DISTANCE,
  PARTICLE_GRAB_DISTANCE,
  PARTICLE_SPEED,
} from "@/app/lib/animationConfig";

const Particles = dynamic(() => import("@tsparticles/react").then((m) => m.default), {
  ssr: false,
});

const PARTICLE_OPTIONS: ISourceOptions = {
  fullScreen: false,
  fpsLimit: 60,
  particles: {
    number: {
      value: PARTICLE_COUNT,
      density: { enable: true, width: 800, height: 800 },
    },
    color: { value: "#ffffff" },
    // Twinkling stars: each particle drifts between a min/max opacity.
    opacity: {
      value: { min: 0.2, max: 0.6 },
      animation: { enable: true, speed: 0.6, sync: false },
    },
    size: { value: { min: 1, max: 2.5 } },
    links: {
      enable: true,
      distance: PARTICLE_LINK_DISTANCE,
      color: "#ffffff",
      opacity: 0.18,
      width: 1,
    },
    move: {
      enable: true,
      speed: PARTICLE_SPEED,
      direction: "none",
      outModes: { default: "out" },
    },
  },
  interactivity: {
    // Detect hover on the window so the canvas can stay pointer-events:none.
    detectsOn: "window",
    events: {
      onHover: { enable: true, mode: "grab" },
    },
    modes: {
      grab: {
        distance: PARTICLE_GRAB_DISTANCE,
        links: { opacity: 0.5 },
      },
    },
  },
  detectRetina: true,
  pauseOnBlur: true,
};

export default function ParticlesBackground() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth < 768) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    (async () => {
      const [{ initParticlesEngine }, { loadSlim }] = await Promise.all([
        import("@tsparticles/react"),
        import("@tsparticles/slim"),
      ]);
      await initParticlesEngine(async (engine) => {
        await loadSlim(engine);
      });
      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;

  return (
    <div className="fixed inset-0 z-[2] pointer-events-none" aria-hidden="true">
      <Particles id="tsparticles" options={PARTICLE_OPTIONS} />
    </div>
  );
}
