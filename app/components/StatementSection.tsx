"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

interface StatementSectionProps {
  text: string;
}

export default function StatementSection({ text }: StatementSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <section ref={ref} data-testid="statement" className="py-40 sm:py-52">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          className="text-4xl sm:text-5xl lg:text-6xl display-heading text-center text-text-primary max-w-4xl mx-auto"
          style={{ opacity }}
        >
          {text}
        </motion.p>
      </div>
    </section>
  );
}
