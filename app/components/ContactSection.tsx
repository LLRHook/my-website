"use client";

import FadeInOnScroll from "@/app/components/ui/FadeInOnScroll";
import Container from "@/app/components/ui/Container";
import { SOCIAL_LINKS, EMAIL_HREF, GITHUB_HREF, type SocialIcon } from "@/app/lib/constants";

const ICON_PATHS: Record<SocialIcon, string> = {
  github:
    "M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.92.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.35.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.93 10.93 0 0 1 5.73 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.7 5.36-5.27 5.65.41.36.78 1.07.78 2.16 0 1.56-.01 2.81-.01 3.19 0 .31.21.67.8.55 4.57-1.53 7.85-5.84 7.85-10.92C23.5 5.65 18.35.5 12 .5z",
  linkedin:
    "M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.95v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.59 0 4.26 2.36 4.26 5.43v6.31zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.72C24 .77 23.2 0 22.22 0z",
  x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  email:
    "M2 4h20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm10 7L2.4 6h19.2L12 11zm0 2L2 7v11h20V7l-10 6z",
};

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
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d={ICON_PATHS[link.icon]} />
              </svg>
            </a>
          ))}
        </div>
      </FadeInOnScroll>
    </Container>
  );
}
