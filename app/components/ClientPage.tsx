"use client";

import { TimelineData } from "@/app/lib/types";
import Navbar from "./Navbar";
import HeroSection from "./HeroSection";
import StatementSection from "./StatementSection";
import TimelineSection from "./work/TimelineSection";
import AboutSection from "./AboutSection";
import ContactSection from "./ContactSection";
import Footer from "./Footer";
import ScrollProgress from "./ui/ScrollProgress";

export default function ClientPage({
  timelineData,
}: {
  timelineData: TimelineData;
}) {
  return (
    <>
      <Navbar />
      <ScrollProgress />
      <HeroSection />
      <StatementSection text="Building the Future, One Commit at a Time" />
      <TimelineSection data={timelineData} />
      <StatementSection text="Beyond Code — Crafting Digital Experiences" />
      <AboutSection />
      <ContactSection />
      <Footer />
    </>
  );
}
