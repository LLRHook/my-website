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

// Build options adapted to the environment so the background renders everywhere:
// - reduced motion → a STATIC star-field (no drift, no twinkle, no hover) that
//   still shows the constellation but respects prefers-reduced-motion.
// - mobile → fewer particles for performance, animation kept.
// - desktop + motion → full animated, interactive field.
function buildOptions(reduced: boolean, mobile: boolean): ISourceOptions {
  const count = mobile ? Math.round(PARTICLE_COUNT / 2) : PARTICLE_COUNT;
  return {
    fullScreen: false,
    fpsLimit: 60,
    particles: {
      number: {
        value: count,
        density: { enable: true, width: 800, height: 800 },
      },
      color: { value: "#ffffff" },
      opacity: reduced
        ? { value: 0.45 }
        : {
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
        enable: !reduced,
        speed: PARTICLE_SPEED,
        direction: "none",
        outModes: { default: "out" },
      },
    },
    interactivity: {
      detectsOn: "window",
      events: {
        onHover: { enable: !reduced, mode: "grab" },
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

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.innerWidth < 768;

    let cancelled = false;
    (async () => {
      const [{ initParticlesEngine }, { loadSlim }] = await Promise.all([
        import("@tsparticles/react"),
        import("@tsparticles/slim"),
      ]);
      await initParticlesEngine(async (engine) => {
        await loadSlim(engine);
      });
      if (!cancelled) setOptions(buildOptions(reduced, mobile));
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!options) return null;

  return (
    <div className="fixed inset-0 z-[2] pointer-events-none" aria-hidden="true">
      <Particles id="tsparticles" options={options} />
    </div>
  );
}
