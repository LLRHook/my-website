"use client";

import { motion } from "motion/react";

export default function SkillBadge({ skill }: { skill: string }) {
  return (
    <motion.span
      className="border border-border rounded-full px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors cursor-default"
      whileHover={{ scale: 1.05, y: -2 }}
      transition={{ duration: 0.15 }}
    >
      {skill}
    </motion.span>
  );
}
