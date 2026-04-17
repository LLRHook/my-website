"use client";

import { motion, useScroll, useTransform } from "motion/react";
import Chevron from "@/app/components/ui/Chevron";

export default function HeroSection() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, -150]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <section
      id="top"
      data-testid="hero"
      className="min-h-screen flex flex-col items-center justify-center relative px-4 sm:px-6 lg:px-8"
    >
      <motion.div
        className="max-w-5xl mx-auto text-center"
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
          Software Engineer · Lausanne, CH
        </motion.p>

        <motion.div
          className="flex flex-wrap justify-center gap-4 mt-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <a href="#work" className="btn-outline">
            View Work
          </a>
          <a href="#contact" className="btn-outline">
            Get in Touch
          </a>
        </motion.div>
      </motion.div>

      <motion.a
        href="#work"
        aria-label="Scroll to work"
        className="absolute bottom-12 flex flex-col items-center gap-3 text-text-muted hover:text-text-primary transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <span className="text-xs uppercase tracking-widest">Scroll to Explore</span>
        <span style={{ animation: "bounce-down 2s ease-in-out infinite" }}>
          <Chevron direction="down" className="w-5 h-5" />
        </span>
      </motion.a>
    </section>
  );
}
