"use client";

import { motion, useScroll } from "motion/react";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className="fixed top-20 left-0 right-0 z-50 h-0.5 bg-accent"
      style={{ scaleX: scrollYProgress, transformOrigin: "left" }}
    />
  );
}
