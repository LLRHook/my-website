"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { ISourceOptions } from "@tsparticles/engine";

const Particles = dynamic(() => import("@tsparticles/react").then((m) => m.default), {
  ssr: false,
});

const PARTICLE_OPTIONS: ISourceOptions = {
  fullScreen: false,
  fpsLimit: 60,
  particles: {
    number: {
      value: 50,
      density: { enable: true, width: 800, height: 800 },
    },
    color: { value: "#ffffff" },
    opacity: { value: 0.2 },
    size: { value: { min: 1, max: 3 } },
    links: {
      enable: true,
      distance: 150,
      color: "#ffffff",
      opacity: 0.05,
      width: 1,
    },
    move: {
      enable: true,
      speed: 0.8,
      direction: "none",
      outModes: { default: "out" },
    },
  },
  interactivity: {
    events: {
      onHover: { enable: true, mode: "grab" },
    },
    modes: {
      grab: {
        distance: 200,
        links: { opacity: 0.15 },
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
