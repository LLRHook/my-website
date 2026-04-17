"use client";

import { TimelineData } from "@/app/lib/types";
import Navbar from "./Navbar";
import HeroSection from "./HeroSection";
import TimelineSection from "./work/TimelineSection";
import AboutSection from "./AboutSection";
import ContactSection from "./ContactSection";
import ScrollProgress from "./ui/ScrollProgress";
import BackToTop from "./ui/BackToTop";

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
      <TimelineSection data={timelineData} />
      <AboutSection />
      <ContactSection />
      <BackToTop />
    </>
  );
}
