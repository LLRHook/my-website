"use client";

import { ReactLenis } from "lenis/react";
import { MotionConfig } from "motion/react";
import { useEffect, useState } from "react";

// Momentum smooth scrolling (FEAT-1781502129) + global reduced-motion respect
// for motion-driven animations (FEAT-1781502130 / NFR-1).
//
// Default ON so SSR and the first client render agree (no remount in the common
// case). Users with `prefers-reduced-motion: reduce` fall back to native scroll
// after mount — Lenis is never initialized for them — and MotionConfig
// `reducedMotion="user"` disables transform/layout animations site-wide.
const LENIS_OPTIONS = {
  lerp: 0.1,
  smoothWheel: true,
  anchors: true, // smooth in-page anchor navigation (#work / #about / #contact)
};

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const [smooth, setSmooth] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSmooth(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const content = <MotionConfig reducedMotion="user">{children}</MotionConfig>;

  if (!smooth) return content;

  return (
    <ReactLenis root options={LENIS_OPTIONS}>
      {content}
    </ReactLenis>
  );
}
