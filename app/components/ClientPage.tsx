"use client";

import { useActiveTab } from "@/app/hooks/useActiveTab";
import { GroupedRepos } from "@/app/lib/types";
import Navbar from "./Navbar";
import TabContainer from "./TabContainer";

export default function ClientPage({ grouped }: { grouped: GroupedRepos }) {
  const [activeTab, setActiveTab] = useActiveTab();

  return (
    <>
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="pt-24 pb-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <TabContainer activeTab={activeTab} grouped={grouped} />
      </main>
    </>
  );
}
