"use client";

import { useActiveTab } from "@/app/hooks/useActiveTab";
import { GroupedRepos } from "@/app/lib/types";
import Navbar from "./Navbar";
import HeroSection from "./HeroSection";
import TabContainer from "./TabContainer";
import Footer from "./Footer";

export default function ClientPage({ grouped }: { grouped: GroupedRepos }) {
  const [activeTab, setActiveTab] = useActiveTab();

  return (
    <>
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <HeroSection />
      <main className="min-h-[calc(100vh-12rem)] pt-8 pb-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <TabContainer activeTab={activeTab} grouped={grouped} />
      </main>
      <Footer />
    </>
  );
}
