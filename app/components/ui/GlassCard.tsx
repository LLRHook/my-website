"use client";

import { motion } from "motion/react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export default function GlassCard({
  children,
  className = "",
  onClick,
  hoverable = true,
}: GlassCardProps) {
  return (
    <motion.div
      className={`glass ${hoverable ? "glass-hover" : ""} ${className}`}
      onClick={onClick}
      whileHover={hoverable ? { y: -4, transition: { duration: 0.2 } } : undefined}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      {children}
    </motion.div>
  );
}
