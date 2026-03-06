"use client";

import { motion, useScroll, useTransform } from "motion/react";

export default function HeroSection() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, -150]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative px-6 sm:px-10 lg:px-16">
      <motion.div
        className="text-center"
        style={{ y, opacity }}
      >
        <motion.h1
          className="text-7xl sm:text-8xl lg:text-9xl display-heading text-text-primary"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Victor Ivanov
        </motion.h1>

        <motion.p
          className="text-lg sm:text-xl text-text-muted mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Software Engineer
        </motion.p>
      </motion.div>

      <motion.div
        className="absolute bottom-12 flex flex-col items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <span className="text-xs uppercase tracking-widest text-text-muted">
          Scroll to Explore
        </span>
        <svg
          className="w-5 h-5 text-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          style={{ animation: "bounce-down 2s ease-in-out infinite" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </motion.div>
    </section>
  );
}
