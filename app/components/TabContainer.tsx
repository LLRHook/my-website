"use client";

import { AnimatePresence, motion } from "motion/react";
import { ActiveTab, GroupedRepos } from "@/app/lib/types";
import Timeline from "./work/Timeline";
import AboutTab from "./about/AboutTab";

interface TabContainerProps {
  activeTab: ActiveTab;
  grouped: GroupedRepos;
}

export default function TabContainer({
  activeTab,
  grouped,
}: TabContainerProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.25 }}
      >
        {activeTab === "work" ? (
          <Timeline grouped={grouped} />
        ) : (
          <AboutTab />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
