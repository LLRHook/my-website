"use client";

import { motion, useScroll } from "motion/react";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      aria-hidden="true"
      className="absolute left-0 right-0 bottom-0 h-px bg-accent/80 pointer-events-none"
      style={{ scaleX: scrollYProgress, transformOrigin: "left" }}
    />
  );
}
