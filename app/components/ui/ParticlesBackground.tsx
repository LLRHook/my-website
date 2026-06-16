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

// The full animated, hover-interactive star-field — as the original early
// implementation did it (no reduced-motion gate, no static fallback). Mobile
// gets a lighter field for performance, but it is still animated + live.
function buildOptions(count: number): ISourceOptions {
  return {
    fullScreen: false,
    fpsLimit: 60,
    particles: {
      number: {
        value: count,
        density: { enable: true, width: 800, height: 800 },
      },
      color: { value: "#ffffff" },
      // Drifting stars that gently twinkle.
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
      // Detect on the window so hover-grab works through the pointer-events:none
      // canvas (this is what makes it "interactable").
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
}

export default function ParticlesBackground() {
  const [options, setOptions] = useState<ISourceOptions | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Lighter field on small screens; otherwise the full count. No other gates —
    // the interactive field renders for everyone (matching the early version).
    const count = window.innerWidth < 768 ? Math.round(PARTICLE_COUNT / 2) : PARTICLE_COUNT;

    let cancelled = false;
    const init = async () => {
      const [{ initParticlesEngine }, { loadSlim }] = await Promise.all([
        import("@tsparticles/react"),
        import("@tsparticles/slim"),
      ]);
      await initParticlesEngine(async (engine) => {
        await loadSlim(engine);
      });
      if (!cancelled) setOptions(buildOptions(count));
    };

    // Defer engine init to idle time so it doesn't compete with first paint.
    const hasRIC = typeof window.requestIdleCallback === "function";
    const handle = hasRIC
      ? window.requestIdleCallback(() => init(), { timeout: 2500 })
      : window.setTimeout(() => init(), 200);

    return () => {
      cancelled = true;
      if (hasRIC) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, []);

  if (!options) return null;

  return (
    <div className="fixed inset-0 z-[2] pointer-events-none" aria-hidden="true">
      <Particles id="tsparticles" options={options} />
    </div>
  );
}
