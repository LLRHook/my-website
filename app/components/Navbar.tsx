"use client";

import { motion } from "motion/react";
import { NAV_LINKS } from "@/app/lib/constants";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-t-0 rounded-none border-l-0 border-r-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        <motion.span
          className="font-bold text-text-primary"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          Victor Ivanov
        </motion.span>

        <div className="flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="uppercase text-xs tracking-widest text-text-muted hover:text-text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
