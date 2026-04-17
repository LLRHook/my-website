"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Chevron from "./Chevron";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          href="#top"
          aria-label="Back to top"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 right-6 z-40 glass w-11 h-11 inline-flex items-center justify-center text-text-muted hover:text-text-primary"
        >
          <Chevron direction="up" className="w-5 h-5" />
        </motion.a>
      )}
    </AnimatePresence>
  );
}
