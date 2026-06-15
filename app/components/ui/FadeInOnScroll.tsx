"use client";

import { motion } from "motion/react";
import {
  REVEAL_OFFSET,
  REVEAL_VIEWPORT_MARGIN,
  REVEAL_DURATION,
} from "@/app/lib/animationConfig";

interface FadeInOnScrollProps {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  className?: string;
}

const offsets = {
  up: { y: REVEAL_OFFSET },
  down: { y: -REVEAL_OFFSET },
  left: { x: REVEAL_OFFSET },
  right: { x: -REVEAL_OFFSET },
};

export default function FadeInOnScroll({
  children,
  direction = "up",
  delay = 0,
  className = "",
}: FadeInOnScrollProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offsets[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: REVEAL_VIEWPORT_MARGIN }}
      transition={{ duration: REVEAL_DURATION, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
