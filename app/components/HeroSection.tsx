"use client";

import { motion } from "motion/react";

export default function HeroSection() {
  return (
    <section className="min-h-[40vh] pt-24 pb-8 flex flex-col items-center justify-center text-center px-4">
      <motion.h1
        className="text-5xl sm:text-6xl font-bold text-text-primary"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Victor Ivanov
      </motion.h1>

      <motion.p
        className="text-xl text-text-secondary mt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        Software Engineer
      </motion.p>

      <motion.p
        className="text-base text-text-muted max-w-md mt-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        Building clean, performant applications across the full stack.
      </motion.p>

      <motion.div
        className="mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <svg
          className="w-6 h-6 text-text-muted"
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
