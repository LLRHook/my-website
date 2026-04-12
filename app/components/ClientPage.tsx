"use client";

import { TimelineData } from "@/app/lib/types";
import Navbar from "./Navbar";
import HeroSection from "./HeroSection";
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
      <TimelineSection data={timelineData} />
      <AboutSection />
      <ContactSection />
      <Footer />
    </>
  );
}
