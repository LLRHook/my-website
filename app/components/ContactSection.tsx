"use client";

import FadeInOnScroll from "@/app/components/ui/FadeInOnScroll";
import Container from "@/app/components/ui/Container";
import { SOCIAL_LINKS, EMAIL_HREF, GITHUB_HREF } from "@/app/lib/constants";
import { SocialIconSvg } from "@/app/components/ui/icons";

export default function ContactSection() {
  return (
    <Container as="section" id="contact" className="py-32 sm:py-40" innerClassName="text-center" data-testid="contact">
      <FadeInOnScroll>
        <h2 className="text-5xl sm:text-6xl lg:text-7xl display-heading text-text-primary">
          Have a Project in Mind?
        </h2>
        <p className="text-5xl sm:text-6xl lg:text-7xl display-heading text-text-primary mt-4">
          Let&apos;s Build Something Together.
        </p>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.2}>
        <div className="flex flex-wrap justify-center gap-6 mt-16">
          <a href={EMAIL_HREF} className="btn-outline">
            Get in Touch
          </a>
          <a
            href={GITHUB_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
          >
            View GitHub
          </a>
        </div>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.3}>
        <div className="flex justify-center gap-5 mt-10">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              aria-label={link.label}
              className="w-10 h-10 inline-flex items-center justify-center rounded-full border border-border text-text-muted hover:text-text-primary hover:border-text-muted transition-colors"
            >
              <SocialIconSvg icon={link.icon} className="w-4 h-4" />
            </a>
          ))}
        </div>
      </FadeInOnScroll>
    </Container>
  );
}
