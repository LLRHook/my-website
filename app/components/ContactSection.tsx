"use client";

import FadeInOnScroll from "@/app/components/ui/FadeInOnScroll";
import Container from "@/app/components/ui/Container";

export default function ContactSection() {
  return (
    <Container as="section" id="contact" className="py-32 sm:py-40 text-center">
      <FadeInOnScroll>
        <h2 className="text-5xl sm:text-6xl lg:text-7xl display-heading text-text-primary">
          Have a Project in Mind?
        </h2>
        <h2 className="text-5xl sm:text-6xl lg:text-7xl display-heading text-text-primary mt-4">
          Let&apos;s Build Something Together.
        </h2>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.2}>
        <div className="flex flex-wrap justify-center gap-6 mt-16">
          <a
            href="mailto:victor.n.ivanov@gmail.com"
            className="btn-outline"
          >
            Get in Touch
          </a>
          <a
            href="https://github.com/LLRHook"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
          >
            View GitHub
          </a>
        </div>
      </FadeInOnScroll>
    </Container>
  );
}
